package service

import (
	"context"

	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/scoring/internal/domain"
)

type ScoringService struct {
	rules []RiskRule
}

func NewScoringService() *ScoringService {
	return &ScoringService{
		rules: []RiskRule{
			NewCloudExposureRule(),
			NewTechStackRule(),
			NewDNSAuthRule(),
			NewVulnerabilityRule(),
		},
	}
}

func (s *ScoringService) CalculateScore(ctx context.Context, event events.AssetEnrichedEvent) (*domain.RiskResult, error) {
	totalScore := 0
	var allFactors []string

	for _, rule := range s.rules {
		score, factors := rule.Evaluate(event)
		totalScore += score
		if len(factors) > 0 {
			allFactors = append(allFactors, factors...)
		}
	}

	// Cap score at 100
	if totalScore > 100 {
		totalScore = 100
	}

	severity := "info"
	if totalScore >= 80 {
		severity = "critical"
	} else if totalScore >= 60 {
		severity = "high"
	} else if totalScore >= 40 {
		severity = "medium"
	} else if totalScore >= 20 {
		severity = "low"
	}

	return &domain.RiskResult{
		Score:    totalScore,
		Severity: severity,
		Factors:  allFactors,
	}, nil
}
