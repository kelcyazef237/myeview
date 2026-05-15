package repository

import (
	"context"
	"fmt"

	"github.com/myeview/myeview/services/discovery/internal/domain"
	"gorm.io/gorm"
)

type AssetRepository interface {
	Upsert(ctx context.Context, asset *domain.Asset) error
	FindByTarget(ctx context.Context, targetID string) ([]domain.Asset, error)
	FindByOrg(ctx context.Context, orgID string) ([]domain.Asset, error)
}

type assetRepository struct {
	db *gorm.DB
}

func NewAssetRepository(db *gorm.DB) AssetRepository {
	return &assetRepository{db: db}
}

func (r *assetRepository) Upsert(ctx context.Context, asset *domain.Asset) error {
	// Use Name and TargetID as unique constraint for upsert
	// Note: In production, we'd have a proper unique index on (organization_id, target_id, name)
	result := r.db.WithContext(ctx).Where("target_id = ? AND name = ?", asset.TargetID, asset.Name).FirstOrCreate(asset)
	if result.Error != nil {
		return fmt.Errorf("failed to upsert asset: %w", result.Error)
	}

	// If it already existed, update the source and discovered_at if needed
	if result.RowsAffected == 0 {
		result = r.db.WithContext(ctx).Model(asset).Updates(map[string]interface{}{
			"source":        asset.Source,
			"updated_at":    gorm.Expr("NOW()"),
		})
	}

	return result.Error
}

func (r *assetRepository) FindByTarget(ctx context.Context, targetID string) ([]domain.Asset, error) {
	var assets []domain.Asset
	result := r.db.WithContext(ctx).Where("target_id = ?", targetID).Find(&assets)
	return assets, result.Error
}

func (r *assetRepository) FindByOrg(ctx context.Context, orgID string) ([]domain.Asset, error) {
	var assets []domain.Asset
	result := r.db.WithContext(ctx).Where("organization_id = ?", orgID).Order("discovered_at DESC").Find(&assets)
	return assets, result.Error
}
