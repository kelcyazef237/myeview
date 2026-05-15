package service

import (
	"context"

	"github.com/myeview/myeview/services/enrichment/internal/domain"
)

// Enricher defines the interface for an intelligence gathering module
type Enricher interface {
	Name() string
	Enrich(ctx context.Context, name string) (*domain.EnrichedAsset, error)
}
