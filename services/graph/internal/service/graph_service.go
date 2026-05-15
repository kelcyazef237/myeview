package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/myeview/myeview/libs/events"
	"github.com/myeview/myeview/services/graph/internal/domain"
	"github.com/myeview/myeview/services/graph/internal/repository"
)

type GraphService struct {
	repo repository.GraphRepository
}

func NewGraphService(repo repository.GraphRepository) *GraphService {
	return &GraphService{repo: repo}
}

func (s *GraphService) ProcessVerifiedEvent(ctx context.Context, event events.AssetVerifiedEvent) error {
	orgID, err := uuid.Parse(event.OrganizationID)
	if err != nil {
		return err
	}

	// Create Target Node (Domain)
	targetNode := &domain.Node{
		ID:             event.TargetID,
		OrganizationID: orgID,
		Label:          "Domain",
		Properties:     map[string]interface{}{},
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	s.repo.UpsertNode(ctx, targetNode)

	// Create Asset Node (Subdomain/IP)
	assetNode := &domain.Node{
		ID:             event.AssetName,
		OrganizationID: orgID,
		Label:          event.AssetType,
		Properties:     map[string]interface{}{"is_active": event.IsActive},
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	s.repo.UpsertNode(ctx, assetNode)

	// Edge: Target -> Asset
	if event.TargetID != event.AssetName {
		s.repo.UpsertEdge(ctx, &domain.Edge{
			SourceID:     event.TargetID,
			TargetID:     event.AssetName,
			Relationship: "RESOLVES_TO",
			Properties:   map[string]interface{}{},
		})
	}

	// Create IP Nodes and Edges
	for _, ip := range event.IPAddresses {
		ipNode := &domain.Node{
			ID:             ip,
			OrganizationID: orgID,
			Label:          "IP",
			Properties:     map[string]interface{}{},
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		s.repo.UpsertNode(ctx, ipNode)

		s.repo.UpsertEdge(ctx, &domain.Edge{
			SourceID:     event.AssetName,
			TargetID:     ip,
			Relationship: "RESOLVES_TO",
			Properties:   map[string]interface{}{},
		})

		// Create Port Nodes and Edges
		for _, port := range event.PortsOpen {
			portID := fmt.Sprintf("%s:%d", ip, port)
			portNode := &domain.Node{
				ID:             portID,
				OrganizationID: orgID,
				Label:          "Port",
				Properties:     map[string]interface{}{"port": port},
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			s.repo.UpsertNode(ctx, portNode)

			s.repo.UpsertEdge(ctx, &domain.Edge{
				SourceID:     ip,
				TargetID:     portID,
				Relationship: "EXPOSES",
				Properties:   map[string]interface{}{},
			})
		}
	}

	return nil
}

func (s *GraphService) ProcessEnrichedEvent(ctx context.Context, event events.AssetEnrichedEvent) error {
	orgID, err := uuid.Parse(event.OrganizationID)
	if err != nil {
		return err
	}

	// Update Asset Node with metadata
	assetNode := &domain.Node{
		ID:             event.AssetName,
		OrganizationID: orgID,
		Label:          "Asset", // Default, might be updated if existing
		Properties: map[string]interface{}{
			"tech_stack":     event.TechStack,
			"cloud_provider": event.CloudProvider,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	s.repo.UpsertNode(ctx, assetNode)
	return nil
}

func (s *GraphService) ProcessRiskScoredEvent(ctx context.Context, event events.RiskScoredEvent) error {
	orgID, err := uuid.Parse(event.OrganizationID)
	if err != nil {
		return err
	}

	// Update Asset Node with risk score
	assetNode := &domain.Node{
		ID:             event.AssetName,
		OrganizationID: orgID,
		Label:          "Asset",
		Properties: map[string]interface{}{
			"risk_score":    event.Score,
			"risk_severity": event.Severity,
			"risk_factors":  event.Factors,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	s.repo.UpsertNode(ctx, assetNode)
	return nil
}

func (s *GraphService) GetGraph(ctx context.Context, orgID string) ([]domain.Node, []domain.Edge, error) {
	return s.repo.GetGraphByOrg(ctx, orgID)
}
