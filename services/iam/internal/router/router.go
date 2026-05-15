package router

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/myeview/myeview/services/iam/internal/config"
	"github.com/myeview/myeview/services/iam/internal/handler"
	"github.com/myeview/myeview/services/iam/internal/middleware"
)

// Setup configures all routes and middleware for the IAM service.
func Setup(cfg *config.Config, authHandler *handler.AuthHandler, healthHandler *handler.HealthHandler) *gin.Engine {
	r := gin.New()

	// ── Global Middleware ──
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(cfg.CORS.AllowedOrigins))

	// Rate limiter: 100 requests per minute per IP
	limiter := middleware.NewRateLimiter(100, 1*time.Minute)
	r.Use(limiter.Middleware())

	// ── Health Endpoints (no auth) ──
	r.GET("/health", healthHandler.Health)
	r.GET("/ready", healthHandler.Ready)

	// ── API v1 ──
	v1 := r.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			// Public endpoints
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)

			// Protected endpoints
			protected := auth.Group("")
			protected.Use(middleware.Auth(cfg.JWT.Secret))
			{
				protected.GET("/me", authHandler.Me)
			}
		}
	}

	return r
}
