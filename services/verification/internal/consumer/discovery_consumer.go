package consumer

import (
	"context"
	"encoding/json"
	"log"

	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/verification/internal/repository"
	"github.com/myeview/myeview/services/verification/internal/service"
)

type DiscoveryConsumer struct {
	ebus events.EventBus
	svc  *service.VerificationService
	repo repository.AssetRepository
}

func NewDiscoveryConsumer(ebus events.EventBus, svc *service.VerificationService, repo repository.AssetRepository) *DiscoveryConsumer {
	return &DiscoveryConsumer{
		ebus: ebus,
		svc:  svc,
		repo: repo,
	}
}

func (c *DiscoveryConsumer) Start(ctx context.Context) error {
	log.Println("Starting DiscoveryConsumer...")

	return c.ebus.Subscribe(ctx, "asset.discovered.>", "verification-group", func(data []byte) error {
		var event events.AssetDiscoveredEvent
		if err := json.Unmarshal(data, &event); err != nil {
			log.Printf("Failed to unmarshal asset.discovered event: %v", err)
			return err
		}

		log.Printf("Received discovery event for asset: %s (Org: %s)", event.AssetName, event.OrganizationID)

		// Verify the asset
		verified, err := c.svc.VerifyAsset(context.Background(), event.AssetName, event.AssetType)
		if err != nil {
			log.Printf("Failed to verify asset %s: %v", event.AssetName, err)
			return err
		}

		// Update DB with verification results
		if err := c.repo.UpdateVerification(context.Background(), event.OrganizationID, event.TargetID, event.AssetName, verified); err != nil {
			log.Printf("Failed to update verification status for %s: %v", event.AssetName, err)
			// Continue to publish event even if DB update fails? 
			// In production, we might want to ensure consistency.
		}

		// Publish verified event
		verifiedEvent := events.AssetVerifiedEvent{
			OrganizationID: event.OrganizationID,
			TargetID:       event.TargetID,
			AssetName:      verified.Name,
			AssetType:      verified.Type,
			IsActive:       verified.IsActive,
			IPAddresses:    verified.IPAddresses,
			PortsOpen:      verified.PortsOpen,
			TLSValid:       verified.TLSValid,
			TLSCertIssuer:  verified.TLSCertIssuer,
			TLSCertExpiry:  verified.TLSCertExpiry,
			VerifiedAt:     verified.Timestamp,
		}

		err = c.ebus.Publish(context.Background(), "asset.verified."+event.TargetID, verifiedEvent)
		if err != nil {
			log.Printf("Failed to publish verified event for %s: %v", verified.Name, err)
			return err
		}

		log.Printf("Successfully verified asset: %s (Active: %v)", verified.Name, verified.IsActive)
		return nil
	})
}
