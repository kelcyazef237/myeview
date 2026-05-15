package repository

import (
	"context"

	"github.com/myeview/myeview/services/scoring/internal/domain"
	"gorm.io/gorm"
)

type AssetRepository interface {
	UpdateRiskScore(ctx context.Context, orgID string, targetID string, name string, result *domain.RiskResult) error
}

type assetRepository struct {
	db *gorm.DB
}

func NewAssetRepository(db *gorm.DB) AssetRepository {
	return &assetRepository{db: db}
}

func (r *assetRepository) UpdateRiskScore(ctx context.Context, orgID string, targetID string, name string, result *domain.RiskResult) error {
	return r.db.WithContext(ctx).Model(&domain.Asset{}).
		Where("organization_id = ? AND target_id = ? AND name = ?", orgID, targetID, name).
		Updates(map[string]interface{}{
			"risk_score":    result.Score,
			"risk_severity": result.Severity,
			"updated_at":    gorm.Expr("NOW()"),
		}).Error
}
