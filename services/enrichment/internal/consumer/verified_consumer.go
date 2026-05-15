package consumer

import (
	"context"
	"encoding/json"
	"log"

	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/enrichment/internal/repository"
	"github.com/myeview/myeview/services/enrichment/internal/service"
)

type VerifiedConsumer struct {
	ebus events.EventBus
	svc  *service.EnrichmentService
	repo repository.AssetRepository
}

func NewVerifiedConsumer(ebus events.EventBus, svc *service.EnrichmentService, repo repository.AssetRepository) *VerifiedConsumer {
	return &VerifiedConsumer{
		ebus: ebus,
		svc:  svc,
		repo: repo,
	}
}

func (c *VerifiedConsumer) Start(ctx context.Context) error {
	log.Println("Starting VerifiedConsumer for Enrichment...")

	return c.ebus.Subscribe(ctx, "asset.verified.>", "enrichment-group", func(data []byte) error {
		var event events.AssetVerifiedEvent
		if err := json.Unmarshal(data, &event); err != nil {
			log.Printf("Failed to unmarshal asset.verified event: %v", err)
			return err
		}

		// Only enrich active assets
		if !event.IsActive {
			return nil
		}

		log.Printf("Enriching asset: %s (Org: %s)", event.AssetName, event.OrganizationID)

		// Enrich the asset
		enriched, err := c.svc.EnrichAsset(context.Background(), event.AssetName)
		if err != nil {
			log.Printf("Failed to enrich asset %s: %v", event.AssetName, err)
			return err
		}

		// Update DB
		if err := c.repo.UpdateEnrichment(context.Background(), event.OrganizationID, event.TargetID, event.AssetName, enriched); err != nil {
			log.Printf("Failed to update enrichment for %s: %v", event.AssetName, err)
		}

		// Publish enriched event
		enrichedEvent := events.AssetEnrichedEvent{
			OrganizationID: event.OrganizationID,
			TargetID:       event.TargetID,
			AssetName:      enriched.AssetName,
			Metadata:       enriched.Metadata,
			TechStack:      enriched.TechStack,
			CloudProvider:  enriched.CloudProvider,
			EnrichedAt:     enriched.EnrichedAt,
		}

		err = c.ebus.Publish(context.Background(), "asset.enriched."+event.TargetID, enrichedEvent)
		if err != nil {
			log.Printf("Failed to publish enriched event for %s: %v", enriched.AssetName, err)
			return err
		}

		log.Printf("Successfully enriched asset: %s", enriched.AssetName)
		return nil
	})
}
