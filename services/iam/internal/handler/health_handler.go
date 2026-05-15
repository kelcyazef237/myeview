package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/myeview/myeview/services/iam/internal/dto"
)

const serviceVersion = "1.0.0"

// HealthHandler handles health check and readiness endpoints.
type HealthHandler struct{}

// NewHealthHandler creates a new health handler.
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Health handles GET /health — basic liveness probe.
func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, dto.HealthResponse{
		Status:  "up",
		Service: "iam",
		Version: serviceVersion,
	})
}

// Ready handles GET /ready — readiness probe (checks dependencies).
func (h *HealthHandler) Ready(c *gin.Context) {
	// TODO: Add database ping check and Redis check
	c.JSON(http.StatusOK, dto.HealthResponse{
		Status:  "ready",
		Service: "iam",
		Version: serviceVersion,
	})
}
