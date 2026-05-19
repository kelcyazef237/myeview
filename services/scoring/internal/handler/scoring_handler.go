package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/myeview/myeview/services/scoring/internal/repository"
)

type ScoringHandler struct {
	repo repository.AssetRepository
}

func NewScoringHandler(repo repository.AssetRepository) *ScoringHandler {
	return &ScoringHandler{repo: repo}
}

func (h *ScoringHandler) GetFindings(c *gin.Context) {
	orgID := c.Query("organization_id")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id required"})
		return
	}

	assets, err := h.repo.FindScoredByOrg(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Map to UI RiskFinding
	var findings []map[string]interface{}
	for _, asset := range assets {
		findings = append(findings, map[string]interface{}{
			"id":              asset.ID.String() + "_finding",
			"title":           "Exposed " + asset.Type + " (" + asset.Name + ")",
			"severity":        asset.RiskSeverity,
			"confidence":      90,
			"asset_id":        asset.ID.String(),
			"asset_value":     asset.Name,
			"description":     "Risk score detected for this asset.",
			"evidence":        "Observed via passive discovery and enrichment.",
			"remediation":     "Review the asset configuration and apply security best practices.",
			"compliance_refs": []string{},
			"created_at":      asset.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, findings)
}
