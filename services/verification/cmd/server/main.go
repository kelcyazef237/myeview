package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/myeview/myeview/libs/db"
	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/verification/internal/config"
	"github.com/myeview/myeview/services/verification/internal/consumer"
	"github.com/myeview/myeview/services/verification/internal/domain"
	"github.com/myeview/myeview/services/verification/internal/repository"
	"github.com/myeview/myeview/services/verification/internal/service"
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

	// Auto-migrate Asset model (shared with discovery)
	if err := database.AutoMigrate(&domain.Asset{}); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Services
	verSvc := service.NewVerificationService()

	// Initialize Consumers
	discoveryConsumer := consumer.NewDiscoveryConsumer(ebus, verSvc, assetRepo)

	// Context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := discoveryConsumer.Start(ctx); err != nil {
		log.Fatalf("Failed to start discovery consumer: %v", err)
	}

	log.Println("Verification service is running...")

	// Wait for termination signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("Shutting down verification service...")
}
