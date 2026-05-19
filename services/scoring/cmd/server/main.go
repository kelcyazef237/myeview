package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/myeview/myeview/libs/db"
	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/scoring/internal/config"
	"github.com/myeview/myeview/services/scoring/internal/consumer"
	"github.com/myeview/myeview/services/scoring/internal/domain"
	"github.com/myeview/myeview/services/scoring/internal/handler"
	"github.com/myeview/myeview/services/scoring/internal/repository"
	"github.com/myeview/myeview/services/scoring/internal/service"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize Database
	database, err := db.Connect(db.Config{
		Host:     cfg.DBHost,
		Port:     cfg.DBPort,
		User:     cfg.DBUser,
		Password: cfg.DBPassword,
		DBName:   cfg.DBName,
		SSLMode:  cfg.DBSSLMode,
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize Event Bus
	ebus, err := events.NewNATSEventBus(cfg.NatsURL)
	if err != nil {
		log.Fatalf("Failed to initialize event bus: %v", err)
	}
	defer ebus.Close()

	// Initialize Repositories
	assetRepo := repository.NewAssetRepository(database)

	// Auto-migrate Asset model
	if err := database.AutoMigrate(&domain.Asset{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Services
	scoringSvc := service.NewScoringService()

	// Initialize Consumers
	enrichedConsumer := consumer.NewEnrichedConsumer(ebus, scoringSvc, assetRepo)

	// Context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := enrichedConsumer.Start(ctx); err != nil {
		log.Fatalf("Failed to start enriched consumer: %v", err)
	}

	// Initialize Handler & Router
	scoringHandler := handler.NewScoringHandler(assetRepo)
	r := gin.Default()
	api := r.Group("/api/v1")
	{
		api.GET("/scoring/findings", scoringHandler.GetFindings)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "scoring"})
	})

	log.Printf("Scoring service starting on port %s", cfg.Port)
	go func() {
		if err := r.Run(":" + cfg.Port); err != nil {
			log.Fatalf("Failed to run server: %v", err)
		}
	}()

	log.Println("Scoring service is running...")

	// Wait for termination signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Shutting down scoring service...")
}
