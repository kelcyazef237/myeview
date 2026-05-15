package repository

import (
	"context"
	"fmt"

	"github.com/myeview/myeview/services/graph/internal/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type GraphRepository interface {
	UpsertNode(ctx context.Context, node *domain.Node) error
	UpsertEdge(ctx context.Context, edge *domain.Edge) error
	GetGraphByOrg(ctx context.Context, orgID string) ([]domain.Node, []domain.Edge, error)
}

type graphRepository struct {
	db *gorm.DB
}

func NewGraphRepository(db *gorm.DB) GraphRepository {
	return &graphRepository{db: db}
}

func (r *graphRepository) UpsertNode(ctx context.Context, node *domain.Node) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"properties", "updated_at"}),
	}).Create(node).Error
}

func (r *graphRepository) UpsertEdge(ctx context.Context, edge *domain.Edge) error {
	// Custom raw SQL to avoid duplicates if source, target, relationship match
	query := `
		INSERT INTO edges (id, source_id, target_id, relationship, properties, created_at)
		VALUES (gen_random_uuid(), ?, ?, ?, ?, NOW())
		ON CONFLICT (source_id, target_id, relationship) DO NOTHING;
	`
	err := r.db.WithContext(ctx).Exec(query, edge.SourceID, edge.TargetID, edge.Relationship, edge.Properties).Error
	if err != nil {
		return fmt.Errorf("failed to upsert edge: %w", err)
	}
	return nil
}

func (r *graphRepository) GetGraphByOrg(ctx context.Context, orgID string) ([]domain.Node, []domain.Edge, error) {
	var nodes []domain.Node
	var edges []domain.Edge

	if err := r.db.WithContext(ctx).Where("organization_id = ?", orgID).Find(&nodes).Error; err != nil {
		return nil, nil, err
	}

	// Fetch edges where source or target is in the org
	if len(nodes) > 0 {
		nodeIDs := make([]string, len(nodes))
		for i, n := range nodes {
			nodeIDs[i] = n.ID
		}
		if err := r.db.WithContext(ctx).Where("source_id IN ? OR target_id IN ?", nodeIDs, nodeIDs).Find(&edges).Error; err != nil {
			return nil, nil, err
		}
	}

	return nodes, edges, nil
}
