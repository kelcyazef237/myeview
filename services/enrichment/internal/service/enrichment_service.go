package service

import (
	"context"
	"sync"
	"time"

	"github.com/myeview/myeview/services/enrichment/internal/domain"
)

type EnrichmentService struct {
	enrichers []Enricher
}

func NewEnrichmentService() *EnrichmentService {
	return &EnrichmentService{
		enrichers: []Enricher{
			NewDNSEnricher(),
			NewHTTPEnricher(),
		},
	}
}

func (s *EnrichmentService) EnrichAsset(ctx context.Context, name string) (*domain.EnrichedAsset, error) {
	finalResult := &domain.EnrichedAsset{
		AssetName:  name,
		Metadata:   make(map[string]interface{}),
		TechStack:  []string{},
		EnrichedAt: time.Now(),
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, enricher := range s.enrichers {
		wg.Add(1)
		go func(e Enricher) {
			defer wg.Done()
			
			// Optional timeout per enricher
			eCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
			defer cancel()

			res, err := e.Enrich(eCtx, name)
			if err != nil || res == nil {
				return
			}

			mu.Lock()
			defer mu.Unlock()

			// Merge Metadata
			if res.Metadata != nil {
				for k, v := range res.Metadata {
					finalResult.Metadata[k] = v
				}
			}

			// Merge TechStack
			if len(res.TechStack) > 0 {
				finalResult.TechStack = append(finalResult.TechStack, res.TechStack...)
			}

			// Merge CloudProvider (first one wins for simplicity)
			if finalResult.CloudProvider == "" && res.CloudProvider != "" {
				finalResult.CloudProvider = res.CloudProvider
			}

		}(enricher)
	}

	wg.Wait()

	// Deduplicate TechStack
	if len(finalResult.TechStack) > 0 {
		seen := make(map[string]bool)
		var unique []string
		for _, tech := range finalResult.TechStack {
			if !seen[tech] {
				seen[tech] = true
				unique = append(unique, tech)
			}
		}
		finalResult.TechStack = unique
	}

	return finalResult, nil
}
