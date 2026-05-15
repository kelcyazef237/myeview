package repository

import (
	"context"

	"github.com/myeview/myeview/services/verification/internal/domain"
	"gorm.io/gorm"
)

type AssetRepository interface {
	UpdateVerification(ctx context.Context, orgID string, targetID string, name string, result *domain.VerifiedAsset) error
}

type assetRepository struct {
	db *gorm.DB
}

func NewAssetRepository(db *gorm.DB) AssetRepository {
	return &assetRepository{db: db}
}

func (r *assetRepository) UpdateVerification(ctx context.Context, orgID string, targetID string, name string, result *domain.VerifiedAsset) error {
	return r.db.WithContext(ctx).Model(&domain.Asset{}).
		Where("organization_id = ? AND target_id = ? AND name = ?", orgID, targetID, name).
		Updates(map[string]interface{}{
			"is_active":       result.IsActive,
			"ip_addresses":    result.IPAddresses,
			"ports_open":      result.PortsOpen,
			"tls_valid":       result.TLSValid,
			"tls_cert_issuer": result.TLSCertIssuer,
			"tls_cert_expiry": result.TLSCertExpiry,
			"verified_at":     result.Timestamp,
			"updated_at":      gorm.Expr("NOW()"),
		}).Error
}
