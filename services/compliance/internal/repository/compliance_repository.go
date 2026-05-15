package repository

import (
	"context"

	"github.com/myeview/myeview/services/compliance/internal/domain"
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type ComplianceRepository interface {
	SaveRegulation(ctx context.Context, reg *domain.Regulation) error
	SaveChunks(ctx context.Context, chunks []domain.RegulationChunk) error
	FindSimilarChunks(ctx context.Context, embedding pgvector.Vector, limit int) ([]domain.RegulationChunk, error)
	SaveGap(ctx context.Context, gap *domain.ComplianceGap) error
	GetGapsByOrg(ctx context.Context, orgID string) ([]domain.ComplianceGap, error)
}

type complianceRepository struct {
	db *gorm.DB
}

func NewComplianceRepository(db *gorm.DB) ComplianceRepository {
	return &complianceRepository{db: db}
}

func (r *complianceRepository) SaveRegulation(ctx context.Context, reg *domain.Regulation) error {
	return r.db.WithContext(ctx).Create(reg).Error
}

func (r *complianceRepository) SaveChunks(ctx context.Context, chunks []domain.RegulationChunk) error {
	return r.db.WithContext(ctx).Create(&chunks).Error
}

func (r *complianceRepository) FindSimilarChunks(ctx context.Context, embedding pgvector.Vector, limit int) ([]domain.RegulationChunk, error) {
	var chunks []domain.RegulationChunk
	// Use pgvector `<->` operator for cosine distance
	err := r.db.WithContext(ctx).
		Order(gorm.Expr("embedding <-> ?", embedding)).
		Limit(limit).
		Find(&chunks).Error
	return chunks, err
}

func (r *complianceRepository) SaveGap(ctx context.Context, gap *domain.ComplianceGap) error {
	return r.db.WithContext(ctx).Create(gap).Error
}

func (r *complianceRepository) GetGapsByOrg(ctx context.Context, orgID string) ([]domain.ComplianceGap, error) {
	var gaps []domain.ComplianceGap
	err := r.db.WithContext(ctx).Where("organization_id = ?", orgID).Find(&gaps).Error
	return gaps, err
}
