package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type Regulation struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Version     string         `json:"version"`
	Description string         `json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type RegulationChunk struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RegulationID uuid.UUID      `gorm:"type:uuid;not null;index" json:"regulation_id"`
	Content      string         `gorm:"not null" json:"content"`
	Embedding    pgvector.Vector `gorm:"type:vector(1536)" json:"-"` // OpenAI embedding dimension
	ChunkIndex   int            `gorm:"not null" json:"chunk_index"`
	CreatedAt    time.Time      `json:"created_at"`
}

type ComplianceGap struct {
	ID                  uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrganizationID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"organization_id"`
	RegulationID        uuid.UUID      `gorm:"type:uuid" json:"regulation_id,omitempty"` // set only for RAG-sourced gaps
	AssetName           string         `gorm:"not null;index" json:"asset_name"`

	// ── Canonical Law Fields (the "one stable primary key" per the compliance doc) ──
	CanonicalKey        string         `gorm:"not null;index;default:''" json:"canonical_key"`
	LawName             string         `gorm:"not null;default:''" json:"law_name"`
	Article             string         `gorm:"not null;default:''" json:"article"`
	BusinessStake       string         `gorm:"not null;default:''" json:"business_stake"`
	AlertLevel          string         `gorm:"not null;default:'HIGH ALERT'" json:"alert_level"`
	MatchSource         string         `gorm:"not null;default:'rag'" json:"match_source"` // "deterministic" | "rag"

	// ── Finding Fields ──
	ViolatedRequirement string         `gorm:"not null" json:"violated_requirement"`
	Evidence            string         `gorm:"not null" json:"evidence"`
	Remediation         string         `gorm:"not null" json:"remediation"`
	Severity            string         `gorm:"not null;default:'medium'" json:"severity"`
	Status              string         `gorm:"not null;default:'open'" json:"status"`

	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`
}

