package consumer

import (
	"context"
	"encoding/json"
	"log"

	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/compliance/internal/service"
)

type RiskConsumer struct {
	ebus events.EventBus
	svc  *service.GapAnalysisService
}

func NewRiskConsumer(ebus events.EventBus, svc *service.GapAnalysisService) *RiskConsumer {
	return &RiskConsumer{
		ebus: ebus,
		svc:  svc,
	}
}

func (c *RiskConsumer) Start(ctx context.Context) error {
	log.Println("Starting RiskConsumer for Compliance RAG...")

	return c.ebus.Subscribe(ctx, "risk.scored.>", "compliance-group", func(data []byte) error {
		var event events.RiskScoredEvent
		if err := json.Unmarshal(data, &event); err != nil {
			log.Printf("Failed to unmarshal risk.scored event: %v", err)
			return err
		}

		// Let the service decide if the score is high enough to process
		err := c.svc.ProcessRiskEvent(context.Background(), event)
		if err != nil {
			log.Printf("Failed to process risk event for %s: %v", event.AssetName, err)
		}
		return nil // Return nil so NATS acknowledges the message even if LLM fails
	})
}
