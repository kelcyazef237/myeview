package consumer

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/scoring/internal/repository"
	"github.com/myeview/myeview/services/scoring/internal/service"
)

type EnrichedConsumer struct {
	ebus events.EventBus
	svc  *service.ScoringService
	repo repository.AssetRepository
}

func NewEnrichedConsumer(ebus events.EventBus, svc *service.ScoringService, repo repository.AssetRepository) *EnrichedConsumer {
	return &EnrichedConsumer{
		ebus: ebus,
		svc:  svc,
		repo: repo,
	}
}

func (c *EnrichedConsumer) Start(ctx context.Context) error {
	log.Println("Starting EnrichedConsumer for Scoring...")

	return c.ebus.Subscribe(ctx, "asset.enriched.>", "scoring-group", func(data []byte) error {
		var event events.AssetEnrichedEvent
		if err := json.Unmarshal(data, &event); err != nil {
			log.Printf("Failed to unmarshal asset.enriched event: %v", err)
			return err
		}

		log.Printf("Scoring asset: %s (Org: %s)", event.AssetName, event.OrganizationID)

		// Calculate score
		result, err := c.svc.CalculateScore(context.Background(), event)
		if err != nil {
			log.Printf("Failed to calculate score for %s: %v", event.AssetName, err)
			return err
		}

		// Update DB
		if err := c.repo.UpdateRiskScore(context.Background(), event.OrganizationID, event.TargetID, event.AssetName, result); err != nil {
			log.Printf("Failed to update risk score for %s: %v", event.AssetName, err)
		}

		// Publish scored event
		scoredEvent := events.RiskScoredEvent{
			OrganizationID: event.OrganizationID,
			TargetID:       event.TargetID,
			AssetName:      event.AssetName,
			Score:          result.Score,
			Severity:       result.Severity,
			Factors:        result.Factors,
			ScoredAt:       time.Now(),
		}

		err = c.ebus.Publish(context.Background(), "risk.scored."+event.TargetID, scoredEvent)
		if err != nil {
			log.Printf("Failed to publish scored event for %s: %v", event.AssetName, err)
			return err
		}

		log.Printf("Successfully scored asset: %s (Score: %d)", event.AssetName, result.Score)
		return nil
	})
}
