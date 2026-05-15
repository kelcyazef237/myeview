package service

import (
	"context"
	"testing"
	"fmt"

	"github.com/pgvector/pgvector-go"
)

// mockLLMService is a stub for testing
type mockLLMService struct{}

func (m *mockLLMService) GenerateEmbedding(ctx context.Context, text string) (pgvector.Vector, error) {
	if text == "" {
		return pgvector.NewVector(make([]float32, 1536)), fmt.Errorf("empty text")
	}
	// Return a dummy vector
	return pgvector.NewVector(make([]float32, 1536)), nil
}

func (m *mockLLMService) AnalyzeGap(ctx context.Context, regulationContext string, assetRisks string) (string, error) {
	// Return mock JSON
	return `[{"violated_requirement": "Encryption required", "evidence": "Port 80 open", "remediation": "Close port 80", "severity": "high"}]`, nil
}

func TestLLMServiceStub(t *testing.T) {
	llm := &mockLLMService{}

	t.Run("GenerateEmbedding success", func(t *testing.T) {
		vec, err := llm.GenerateEmbedding(context.Background(), "test")
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		if len(vec.Slice()) != 1536 {
			t.Errorf("Expected vector of length 1536, got %d", len(vec.Slice()))
		}
	})

	t.Run("AnalyzeGap success", func(t *testing.T) {
		res, err := llm.AnalyzeGap(context.Background(), "context", "risks")
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		if res == "" {
			t.Errorf("Expected JSON response, got empty string")
		}
	})
}
