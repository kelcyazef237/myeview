package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/compliance/internal/domain"
	"github.com/myeview/myeview/services/compliance/internal/repository"
)

type GapAnalysisService struct {
	repo repository.ComplianceRepository
	llm  LLMService
}

func NewGapAnalysisService(repo repository.ComplianceRepository, llm LLMService) *GapAnalysisService {
	return &GapAnalysisService{
		repo: repo,
		llm:  llm,
	}
}

type LLMGapResponse struct {
	ViolatedRequirement string `json:"violated_requirement"`
	Evidence            string `json:"evidence"`
	Remediation         string `json:"remediation"`
	Severity            string `json:"severity"`
}

// ProcessRiskEvent is the main entry point called by the NATS consumer.
// It runs a two-tier compliance matching strategy:
//
//	Tier 1: Deterministic match against the canonical regulatory KB (zero cost, zero latency)
//	Tier 2: RAG + LLM analysis via pgvector (only for unmatched findings, score ≥ 60)
func (s *GapAnalysisService) ProcessRiskEvent(ctx context.Context, event events.RiskScoredEvent) error {
	orgID, err := uuid.Parse(event.OrganizationID)
	if err != nil {
		return fmt.Errorf("invalid organization_id: %w", err)
	}

	log.Printf("[Compliance] Processing risk event: %s | Score: %d | Severity: %s | Factors: %v",
		event.AssetName, event.Score, event.Severity, event.Factors)

	// ── TIER 1: Deterministic Regulatory Matching ──────────────────────────────
	// Build a metadata hint map from the event for richer keyword matching
	assetMeta := map[string]string{
		"severity": event.Severity,
		"score":    fmt.Sprintf("%d", event.Score),
	}

	matchedRules := FindMatchingRules(event.Factors, assetMeta)

	if len(matchedRules) > 0 {
		log.Printf("[Compliance] Tier 1 matched %d regulatory rule(s) for %s (deterministic)",
			len(matchedRules), event.AssetName)

		evidence := fmt.Sprintf("Asset: %s | Risk Score: %d (%s) | Detected Factors: %s",
			event.AssetName, event.Score, strings.ToUpper(event.Severity),
			strings.Join(event.Factors, "; "))

		for _, rule := range matchedRules {
			gap := BuildViolationGap(rule, event.OrganizationID, event.AssetName, evidence)
			gap.OrganizationID = orgID

			if err := s.repo.SaveGap(ctx, gap); err != nil {
				log.Printf("[Compliance] Failed to save deterministic gap for %s (%s): %v",
					event.AssetName, rule.CanonicalKey, err)
			} else {
				log.Printf("[Compliance] ✅ Saved violation: [%s] %s → %s",
					rule.AlertLevel, event.AssetName, rule.CanonicalKey)
			}
		}
		// Tier 1 matched — skip Tier 2 to save tokens
		return nil
	}

	// ── TIER 2: RAG + LLM (Fallback for novel/unmatched findings) ─────────────
	// Only fire for HIGH or CRITICAL risk events to control token cost
	if event.Score < 60 {
		log.Printf("[Compliance] Score %d below threshold for RAG analysis. Skipping.", event.Score)
		return nil
	}

	log.Printf("[Compliance] No deterministic match for %s. Falling back to RAG analysis...", event.AssetName)

	riskDescription := fmt.Sprintf(
		"Asset: %s\nRisk Score: %d\nSeverity: %s\nFactors: %v",
		event.AssetName, event.Score, event.Severity, event.Factors,
	)

	// Generate embedding for semantic search
	queryEmbedding, err := s.llm.GenerateEmbedding(ctx, riskDescription)
	if err != nil {
		return fmt.Errorf("failed to embed risk query: %w", err)
	}

	// Find top 3 most relevant regulation chunks via cosine similarity
	similarChunks, err := s.repo.FindSimilarChunks(ctx, queryEmbedding, 3)
	if err != nil {
		return fmt.Errorf("failed to find similar regulation chunks: %w", err)
	}

	if len(similarChunks) == 0 {
		log.Println("[Compliance] No relevant regulation chunks found in vector DB. Has the DB been seeded?")
		return nil
	}

	// Build regulation context string
	contextStr := ""
	var regID uuid.UUID
	for i, chunk := range similarChunks {
		if i == 0 {
			regID = chunk.RegulationID
		}
		contextStr += fmt.Sprintf("--- Regulation Chunk ---\n%s\n\n", chunk.Content)
	}

	// Call LLM for gap analysis
	jsonResponse, err := s.llm.AnalyzeGap(ctx, contextStr, riskDescription)
	if err != nil {
		return fmt.Errorf("LLM gap analysis failed: %w", err)
	}

	// Parse and persist LLM gaps
	var gaps []LLMGapResponse
	if err := json.Unmarshal([]byte(jsonResponse), &gaps); err != nil {
		log.Printf("[Compliance] Failed to parse LLM response: %v\nRaw: %s", err, jsonResponse)
		return fmt.Errorf("invalid JSON from LLM: %w", err)
	}

	for _, g := range gaps {
		dbGap := &domain.ComplianceGap{
			OrganizationID:      orgID,
			RegulationID:        regID,
			AssetName:           event.AssetName,
			CanonicalKey:        "RAG_GENERATED",
			LawName:             "See violated requirement",
			AlertLevel:          severityToAlertLevel(g.Severity),
			MatchSource:         "rag",
			ViolatedRequirement: g.ViolatedRequirement,
			Evidence:            g.Evidence,
			Remediation:         g.Remediation,
			Severity:            g.Severity,
			Status:              "open",
		}
		if err := s.repo.SaveGap(ctx, dbGap); err != nil {
			log.Printf("[Compliance] Failed to save RAG gap for %s: %v", event.AssetName, err)
		}
	}

	log.Printf("[Compliance] RAG analysis complete: saved %d gap(s) for %s", len(gaps), event.AssetName)
	return nil
}

func severityToAlertLevel(severity string) string {
	switch strings.ToLower(severity) {
	case "critical":
		return "CRITICAL ALERT"
	case "high":
		return "HIGH ALERT"
	default:
		return "ADVISORY"
	}
}
