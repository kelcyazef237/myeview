package service

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/discovery/internal/domain"
	"github.com/myeview/myeview/services/discovery/internal/repository"
)

type DiscoveryService struct {
	baseSources     []domain.DiscoverySource
	advancedSources []domain.DiscoverySource
	ebus            events.EventBus
	repo            repository.AssetRepository
}

func NewDiscoveryService(ebus events.EventBus, repo repository.AssetRepository, shodanKey, censysID, censysSecret string) *DiscoveryService {
	base := []domain.DiscoverySource{
		NewCrtshService(),
		NewAlienVaultSource(),
		NewHackerTargetSource(),
		NewDNSBruteSource(),
	}

	advanced := []domain.DiscoverySource{}
	if shodanKey != "" {
		advanced = append(advanced, NewShodanSource(shodanKey))
	}
	if censysID != "" && censysSecret != "" {
		advanced = append(advanced, NewCensysSource(censysID, censysSecret))
	}

	return &DiscoveryService{
		baseSources:     base,
		advancedSources: advanced,
		ebus:            ebus,
		repo:            repo,
	}
}

// StartDiscovery kicks off the discovery process for a target domain asynchronously.
func (s *DiscoveryService) StartDiscovery(orgID uuid.UUID, target string, mode string, apiKeys map[string]string) {
	go func() {
		log.Printf("Starting %s discovery for target: %s (Org: %s)", mode, target, orgID)

		// Publish started event
		s.ebus.Publish(context.Background(), "asset.discovered."+target, events.AssetDiscoveredEvent{
			OrganizationID: orgID.String(),
			TargetID:       target,
			Status:         "started",
			DiscoveredAt:   time.Now(),
		})

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		var sources []domain.DiscoverySource
		sources = append(sources, s.baseSources...)

		if mode == "advanced" {
			// Append globally configured advanced sources
			sources = append(sources, s.advancedSources...)

			// Dynamically initialize advanced sources if keys are provided via the UI
			if apiKeys != nil {
				if key, ok := apiKeys["shodan"]; ok && key != "" {
					sources = append(sources, NewShodanSource(key))
				}
				censysID := apiKeys["censys_id"]
				censysSecret := apiKeys["censys_secret"]
				if censysID != "" && censysSecret != "" {
					sources = append(sources, NewCensysSource(censysID, censysSecret))
				}
			}
		}

		var wg sync.WaitGroup
		assetChan := make(chan domain.DiscoveredAsset, 2000)

		for _, source := range sources {
			wg.Add(1)
			go func(src domain.DiscoverySource) {
				defer wg.Done()
				log.Printf("[%s] Running source %s for %s", mode, src.Name(), target)
				assets, err := src.Discover(ctx, target)
				if err != nil {
					log.Printf("[%s] Source %s failed: %v", mode, src.Name(), err)
					return
				}
				for _, a := range assets {
					assetChan <- a
				}
			}(source)
		}

		// Close the channel when all sources are done
		go func() {
			wg.Wait()
			close(assetChan)
		}()

		uniqueAssets := make(map[string]domain.DiscoveredAsset)

		for a := range assetChan {
			if _, exists := uniqueAssets[a.Name]; !exists {
				uniqueAssets[a.Name] = a
			}
		}

		log.Printf("Found %d unique assets for %s", len(uniqueAssets), target)

		for _, asset := range uniqueAssets {
			// Persist to DB
			dbAsset := &domain.Asset{
				OrganizationID: orgID,
				TargetID:       target,
				Name:           asset.Name,
				Type:           asset.Type,
				Source:         asset.Source,
				DiscoveredAt:   asset.Timestamp,
			}

			if err := s.repo.Upsert(context.Background(), dbAsset); err != nil {
				log.Printf("Failed to persist asset %s: %v", asset.Name, err)
			}

			event := events.AssetDiscoveredEvent{
				OrganizationID: orgID.String(),
				TargetID:       target,
				AssetName:      asset.Name,
				AssetType:      asset.Type,
				Source:         asset.Source,
				DiscoveredAt:   asset.Timestamp,
			}

			err := s.ebus.Publish(context.Background(), "asset.discovered."+target, event)
			if err != nil {
				log.Printf("Failed to publish discovered event for %s: %v", asset.Name, err)
			}
		}

		// Publish completed event
		s.ebus.Publish(context.Background(), "asset.discovered."+target, events.AssetDiscoveredEvent{
			OrganizationID: orgID.String(),
			TargetID:       target,
			Status:         "completed",
			DiscoveredAt:   time.Now(),
		})

		log.Printf("Discovery completed for target: %s", target)
	}()
}
