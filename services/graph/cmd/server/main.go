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
	"github.com/myeview/myeview/services/graph/internal/config"
	"github.com/myeview/myeview/services/graph/internal/consumer"
	"github.com/myeview/myeview/services/graph/internal/domain"
	"github.com/myeview/myeview/services/graph/internal/handler"
	"github.com/myeview/myeview/services/graph/internal/repository"
	"github.com/myeview/myeview/services/graph/internal/service"
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

	// Auto-migrate Graph models
	if err := database.AutoMigrate(&domain.Node{}, &domain.Edge{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Ensure unique constraint exists for edges
	database.Exec(`
		DELETE FROM edges a USING edges b
		WHERE a.id > b.id
		  AND a.source_id = b.source_id
		  AND a.target_id = b.target_id
		  AND a.relationship = b.relationship;
	`)
	database.Exec("ALTER TABLE edges DROP CONSTRAINT IF EXISTS unique_source_target_rel;")
	if err := database.Exec("ALTER TABLE edges ADD CONSTRAINT unique_source_target_rel UNIQUE (source_id, target_id, relationship);").Error; err != nil {
		log.Printf("Warning: failed to add unique constraint to edges table: %v", err)
	}

	// Initialize Event Bus
	ebus, err := events.NewNATSEventBus(cfg.NatsURL)
	if err != nil {
		log.Fatalf("Failed to initialize event bus: %v", err)
	}
	defer ebus.Close()

	// Initialize Repository
	graphRepo := repository.NewGraphRepository(database)

	// Initialize Service
	graphSvc := service.NewGraphService(graphRepo)

	// Initialize Consumer
	intelConsumer := consumer.NewIntelligenceConsumer(ebus, graphSvc)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := intelConsumer.Start(ctx); err != nil {
		log.Fatalf("Failed to start intelligence consumer: %v", err)
	}

	// Initialize Handler & Router
	graphHandler := handler.NewGraphHandler(graphSvc)
	r := gin.Default()
	api := r.Group("/api/v1")
	{
		api.GET("/graph", graphHandler.GetGraph)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "graph"})
	})

	log.Printf("Graph service starting on port %s", cfg.Port)
	go func() {
		if err := r.Run(":" + cfg.Port); err != nil {
			log.Fatalf("Failed to run server: %v", err)
		}
	}()

	// Wait for termination signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Shutting down graph service...")
}
