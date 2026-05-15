package service

import (
	"context"
	"testing"

	"github.com/myeview/myeview/libs/events"
)

func TestCloudExposureRule(t *testing.T) {
	rule := NewCloudExposureRule()

	t.Run("No Cloud Provider", func(t *testing.T) {
		event := events.AssetEnrichedEvent{}
		score, factors := rule.Evaluate(event)

		if score != 0 {
			t.Errorf("Expected score 0, got %d", score)
		}
		if len(factors) != 0 {
			t.Errorf("Expected 0 factors, got %d", len(factors))
		}
	})

	t.Run("With Cloud Provider", func(t *testing.T) {
		event := events.AssetEnrichedEvent{
			CloudProvider: "AWS",
		}
		score, factors := rule.Evaluate(event)

		if score != 5 {
			t.Errorf("Expected score 5, got %d", score)
		}
		if len(factors) != 1 {
			t.Errorf("Expected 1 factor, got %d", len(factors))
		}
		if factors[0] != "Cloud exposure: AWS" {
			t.Errorf("Unexpected factor message: %s", factors[0])
		}
	})
}

func TestDNSAuthRule(t *testing.T) {
	rule := NewDNSAuthRule()

	t.Run("Missing Both Records", func(t *testing.T) {
		event := events.AssetEnrichedEvent{
			Metadata: map[string]interface{}{},
		}
		score, factors := rule.Evaluate(event)

		if score != 25 {
			t.Errorf("Expected score 25, got %d", score)
		}
		if len(factors) != 2 {
			t.Errorf("Expected 2 factors, got %d", len(factors))
		}
	})

	t.Run("Has SPF but no DMARC", func(t *testing.T) {
		event := events.AssetEnrichedEvent{
			Metadata: map[string]interface{}{
				"spf_record": "v=spf1 include:_spf.example.com ~all",
			},
		}
		score, factors := rule.Evaluate(event)

		if score != 10 {
			t.Errorf("Expected score 10, got %d", score)
		}
		if len(factors) != 1 {
			t.Errorf("Expected 1 factor, got %d", len(factors))
		}
		if factors[0] != "Missing DMARC record" {
			t.Errorf("Unexpected factor message: %s", factors[0])
		}
	})
}

func TestScoringServiceAggregation(t *testing.T) {
	svc := NewScoringService()

	event := events.AssetEnrichedEvent{
		CloudProvider: "Cloudflare",
		TechStack:     []string{"nginx", "php"},
		Vulnerabilities: []string{"CVE-2023-XXXX"},
		Metadata: map[string]interface{}{}, // Missing DNS records
	}

	result, err := svc.CalculateScore(context.Background(), event)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// 5 (Cloud) + 4 (TechStack) + 25 (DNS) + 40 (Vuln) = 74
	if result.Score != 74 {
		t.Errorf("Expected total score 74, got %d", result.Score)
	}

	if result.Severity != "high" {
		t.Errorf("Expected severity high, got %s", result.Severity)
	}
}
