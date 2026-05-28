package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/myeview/myeview/libs/auth"
	"github.com/myeview/myeview/services/graph/internal/service"
)

type GraphHandler struct {
	svc *service.GraphService
}

func NewGraphHandler(svc *service.GraphService) *GraphHandler {
	return &GraphHandler{svc: svc}
}

func (h *GraphHandler) GetGraph(c *gin.Context) {
	orgID := auth.GetOrgID(c)
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id required"})
		return
	}

	nodes, edges, err := h.svc.GetGraph(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"nodes": nodes,
		"edges": edges,
	})
}
