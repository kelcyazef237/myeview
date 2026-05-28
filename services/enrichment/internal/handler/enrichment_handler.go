package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/myeview/myeview/libs/auth"
	"github.com/myeview/myeview/services/enrichment/internal/repository"
)

type EnrichmentHandler struct {
	repo repository.AssetRepository
}

func NewEnrichmentHandler(repo repository.AssetRepository) *EnrichmentHandler {
	return &EnrichmentHandler{repo: repo}
}

func (h *EnrichmentHandler) GetResults(c *gin.Context) {
	orgID := auth.GetOrgID(c)
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id required"})
		return
	}

	assets, err := h.repo.FindEnrichedByOrg(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Map to UI EnrichmentResult
	var results []map[string]interface{}
	for _, asset := range assets {
		results = append(results, map[string]interface{}{
			"id":              asset.ID.String(),
			"asset_name":      asset.Name,
			"asset_type":      asset.Type,
			"organization_id": asset.OrganizationID.String(),
			"tech_stack":      asset.TechStack,
			"cloud_provider":  asset.CloudProvider,
			"dns_records":     []string{},
			"tls_info":        nil,
			"http_headers":    map[string]string{},
			"cdn_waf":         "",
			"enriched_at":     asset.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, results)
}
