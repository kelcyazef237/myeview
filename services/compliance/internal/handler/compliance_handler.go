package handler

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/myeview/myeview/libs/auth"
	"github.com/myeview/myeview/services/compliance/internal/repository"
	"github.com/myeview/myeview/services/compliance/internal/service"
)

type ComplianceHandler struct {
	ingestSvc *service.IngestionService
	repo      repository.ComplianceRepository
}

func NewComplianceHandler(ingestSvc *service.IngestionService, repo repository.ComplianceRepository) *ComplianceHandler {
	return &ComplianceHandler{
		ingestSvc: ingestSvc,
		repo:      repo,
	}
}

// ── Ingest: POST /api/v1/compliance/ingest ────────────────────────────────────

type IngestRequest struct {
	Name    string `json:"name" binding:"required"`
	Version string `json:"version"`
	Content string `json:"content" binding:"required"`
}

func (h *ComplianceHandler) Ingest(c *gin.Context) {
	var req IngestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.ingestSvc.IngestRegulation(c.Request.Context(), req.Name, req.Version, req.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Regulation ingested and embedded successfully"})
}

// ── Seed: POST /api/v1/compliance/seed ───────────────────────────────────────
// Seeds the canonical Cameroonian regulations (COBAC/ANTIC/Finance Law) into
// the pgvector database for RAG fallback. Safe to call multiple times.

func (h *ComplianceHandler) SeedRegulations(c *gin.Context) {
	regulations := service.SeedRegulations()
	seeded := 0

	for _, reg := range regulations {
		if err := h.ingestSvc.IngestRegulation(
			context.Background(), reg.Name, reg.Version, reg.Content,
		); err != nil {
			log.Printf("[Compliance] Warning: failed to seed regulation '%s': %v", reg.Name, err)
			// Continue seeding others even if one fails
		} else {
			log.Printf("[Compliance] Seeded regulation: %s v%s", reg.Name, reg.Version)
			seeded++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Regulatory database seed complete",
		"total":        len(regulations),
		"seeded":       seeded,
		"regulations":  regulationNames(regulations),
	})
}

func regulationNames(regs []struct {
	Name    string
	Version string
	Content string
}) []string {
	var names []string
	for _, r := range regs {
		names = append(names, r.Name+" v"+r.Version)
	}
	return names
}

// ── GetGaps: GET /api/v1/compliance/gaps ─────────────────────────────────────
// Returns all compliance gaps for an organization (legacy endpoint)

func (h *ComplianceHandler) GetGaps(c *gin.Context) {
	orgID := auth.GetOrgID(c)
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id required"})
		return
	}

	gaps, err := h.repo.GetGapsByOrg(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gaps)
}

// ── GetViolations: GET /api/v1/compliance/violations ─────────────────────────
// Returns regulatory violation alerts grouped by canonical law key.
// This is the primary endpoint for the MYEVIEW Compliance Dashboard.

func (h *ComplianceHandler) GetViolations(c *gin.Context) {
	orgID := auth.GetOrgID(c)
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id required"})
		return
	}

	gaps, err := h.repo.GetGapsByOrg(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Build summary counts
	counts := map[string]int{
		"CRITICAL ALERT": 0,
		"HIGH ALERT":     0,
		"ADVISORY":       0,
		"total":          len(gaps),
	}
	for _, g := range gaps {
		if _, ok := counts[g.AlertLevel]; ok {
			counts[g.AlertLevel]++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"summary":    counts,
		"violations": gaps,
	})
}
