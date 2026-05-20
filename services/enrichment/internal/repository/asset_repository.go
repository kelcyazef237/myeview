package repository

import (
	"context"
	"encoding/json"

	"github.com/lib/pq"
	"github.com/myeview/myeview/services/enrichment/internal/domain"
	"gorm.io/gorm"
)

type AssetRepository interface {
	UpdateEnrichment(ctx context.Context, orgID string, targetID string, name string, result *domain.EnrichedAsset) error
	FindEnrichedByOrg(ctx context.Context, orgID string) ([]domain.Asset, error)
}

type assetRepository struct {
	db *gorm.DB
}

func NewAssetRepository(db *gorm.DB) AssetRepository {
	return &assetRepository{db: db}
}

func (r *assetRepository) UpdateEnrichment(ctx context.Context, orgID string, targetID string, name string, result *domain.EnrichedAsset) error {
	metadataBytes, err := json.Marshal(result.Metadata)
	if err != nil {
		return err
	}
	return r.db.WithContext(ctx).Model(&domain.Asset{}).
		Where("organization_id = ? AND target_id = ? AND name = ?", orgID, targetID, name).
		Updates(map[string]interface{}{
			"metadata":       metadataBytes,
			"tech_stack":     pq.Array(result.TechStack),
			"cloud_provider": result.CloudProvider,
			"updated_at":     gorm.Expr("NOW()"),
		}).Error
}

func (r *assetRepository) FindEnrichedByOrg(ctx context.Context, orgID string) ([]domain.Asset, error) {
	var assets []domain.Asset
	err := r.db.WithContext(ctx).Where("organization_id = ? AND (cloud_provider != '' OR tech_stack IS NOT NULL)", orgID).Order("updated_at DESC").Find(&assets).Error
	return assets, err
}

