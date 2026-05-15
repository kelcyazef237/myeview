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
	"github.com/myeview/myeview/services/compliance/internal/config"
	"github.com/myeview/myeview/services/compliance/internal/consumer"
	"github.com/myeview/myeview/services/compliance/internal/domain"
	"github.com/myeview/myeview/services/compliance/internal/handler"
	"github.com/myeview/myeview/services/compliance/internal/repository"
	"github.com/myeview/myeview/services/compliance/internal/service"
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

	// Auto-migrate Compliance models (assuming pgvector extension exists)
	if err := database.AutoMigrate(&domain.Regulation{}, &domain.RegulationChunk{}, &domain.ComplianceGap{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Event Bus
	ebus, err := events.NewNATSEventBus(cfg.NatsURL)
	if err != nil {
		log.Fatalf("Failed to initialize event bus: %v", err)
	}
	defer ebus.Close()

	// Initialize Repository
	compRepo := repository.NewComplianceRepository(database)

	// Initialize LLM Service (Qwen via DashScope, fallback to OpenAI, or noop)
	llmSvc := service.NewLLMService(cfg.LLMAPIKey, cfg.LLMProvider)
	log.Printf("[Compliance] LLM provider: %s", cfg.LLMProvider)

	ingestSvc := service.NewIngestionService(compRepo, llmSvc)
	gapSvc := service.NewGapAnalysisService(compRepo, llmSvc)

	// Initialize Consumer
	riskConsumer := consumer.NewRiskConsumer(ebus, gapSvc)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := riskConsumer.Start(ctx); err != nil {
		log.Fatalf("Failed to start risk consumer: %v", err)
	}

	// Initialize Handler & Router
	compHandler := handler.NewComplianceHandler(ingestSvc, compRepo)
	r := gin.Default()
	api := r.Group("/api/v1")
	{
		api.POST("/compliance/ingest", compHandler.Ingest)
		api.POST("/compliance/seed", compHandler.SeedRegulations)   // Seeds COBAC/ANTIC/Finance Law into pgvector
		api.GET("/compliance/gaps", compHandler.GetGaps)             // Legacy endpoint
		api.GET("/compliance/violations", compHandler.GetViolations) // Primary dashboard endpoint
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "compliance"})
	})

	log.Printf("Compliance service starting on port %s", cfg.Port)
	go func() {
		if err := r.Run(":" + cfg.Port); err != nil {
			log.Fatalf("Failed to run server: %v", err)
		}
	}()

	// Wait for termination signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Shutting down compliance service...")
}
