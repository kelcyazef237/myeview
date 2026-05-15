package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/myeview/myeview/libs/db"
	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/discovery/internal/config"
	"github.com/myeview/myeview/services/discovery/internal/domain"
	"github.com/myeview/myeview/services/discovery/internal/handler"
	"github.com/myeview/myeview/services/discovery/internal/repository"
	"github.com/myeview/myeview/services/discovery/internal/service"
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
	log.Println("Database migrations for assets completed")

	// Initialize Services
	discoverySvc := service.NewDiscoveryService(ebus, assetRepo, cfg.ShodanAPIKey, cfg.CensysAPIID, cfg.CensysSecret)
	log.Println("Discovery service initialized with Base and Advanced modes")

	// Initialize Handlers
	discoveryHandler := handler.NewDiscoveryHandler(discoverySvc, ebus, assetRepo)

	// Setup Router
	r := gin.Default()

	api := r.Group("/api/v1")
	{
		api.POST("/discovery/start", discoveryHandler.Start)
		api.GET("/discovery/stream", discoveryHandler.Stream)
		api.GET("/discovery/assets", discoveryHandler.GetAssets)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "discovery"})
	})

	log.Printf("Discovery service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
