package service

import (
	"context"
	"testing"
)

func TestEnrichmentService(t *testing.T) {
	svc := NewEnrichmentService()

	// A very basic integration stub test. 
	// In a real environment, we'd mock the HTTP client and DNS resolver.
	t.Run("Enrich Non-Existent Domain", func(t *testing.T) {
		res, err := svc.EnrichAsset(context.Background(), "this-domain-definitely-does-not-exist.invalid")
		
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if res == nil {
			t.Fatalf("Expected result to not be nil")
		}

		if len(res.TechStack) > 0 {
			t.Errorf("Expected empty tech stack for invalid domain")
		}
	})
}
