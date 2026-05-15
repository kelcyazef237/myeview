package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/myeview/myeview/libs/logger"
	"github.com/myeview/myeview/services/iam/internal/config"
	"github.com/myeview/myeview/services/iam/internal/domain"
	"github.com/myeview/myeview/services/iam/internal/handler"
	"github.com/myeview/myeview/services/iam/internal/repository"
	"github.com/myeview/myeview/services/iam/internal/router"
	"github.com/myeview/myeview/services/iam/internal/service"
)

func main() {
	// ── Load Config ──
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load config", err)
	}

	// ── Database ──
	db, err := connectDB(cfg)
	if err != nil {
		logger.Fatal("Failed to connect to database", err)
	}

	// Auto-migrate domain models
	if err := db.AutoMigrate(&domain.Organization{}, &domain.User{}); err != nil {
		logger.Fatal("Failed to run migrations", err)
	}
	logger.Info("Database migrations completed")

	// ── Dependency Injection ──
	userRepo := repository.NewUserRepository(db)
	orgRepo := repository.NewOrganizationRepository(db)
	authService := service.NewAuthService(userRepo, orgRepo, cfg)

	authHandler := handler.NewAuthHandler(authService)
	healthHandler := handler.NewHealthHandler()

	// ── Router ──
	r := router.Setup(cfg, authHandler, healthHandler)

	// ── HTTP Server with Graceful Shutdown ──
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// Start server in goroutine
	go func() {
		logger.Info(fmt.Sprintf("IAM Service starting on :%s", cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed", err)
		}
	}()

	// ── Graceful Shutdown ──
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down IAM service...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", err)
	}

	logger.Info("IAM service stopped")
}

func connectDB(cfg *config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.Database.DSN()), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(time.Hour)

	logger.Info("Connected to PostgreSQL")
	return db, nil
}
