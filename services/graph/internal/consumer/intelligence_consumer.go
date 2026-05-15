package consumer

import (
	"context"
	"encoding/json"
	"log"

	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/graph/internal/service"
)

type IntelligenceConsumer struct {
	ebus events.EventBus
	svc  *service.GraphService
}

func NewIntelligenceConsumer(ebus events.EventBus, svc *service.GraphService) *IntelligenceConsumer {
	return &IntelligenceConsumer{
		ebus: ebus,
		svc:  svc,
	}
}

func (c *IntelligenceConsumer) Start(ctx context.Context) error {
	log.Println("Starting IntelligenceConsumer for Graph...")

	// Listen to Verified Events
	err := c.ebus.Subscribe(ctx, "asset.verified.>", "graph-group", func(data []byte) error {
		var event events.AssetVerifiedEvent
		if err := json.Unmarshal(data, &event); err != nil {
			return err
		}
		return c.svc.ProcessVerifiedEvent(context.Background(), event)
	})
	if err != nil {
		return err
	}

	// Listen to Enriched Events
	err = c.ebus.Subscribe(ctx, "asset.enriched.>", "graph-group", func(data []byte) error {
		var event events.AssetEnrichedEvent
		if err := json.Unmarshal(data, &event); err != nil {
			return err
		}
		return c.svc.ProcessEnrichedEvent(context.Background(), event)
	})
	if err != nil {
		return err
	}

	// Listen to Risk Scored Events
	err = c.ebus.Subscribe(ctx, "risk.scored.>", "graph-group", func(data []byte) error {
		var event events.RiskScoredEvent
		if err := json.Unmarshal(data, &event); err != nil {
			return err
		}
		return c.svc.ProcessRiskScoredEvent(context.Background(), event)
	})

	return err
}
