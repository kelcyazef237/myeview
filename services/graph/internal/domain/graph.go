package domain

import (
	"time"

	"github.com/google/uuid"
)

type Node struct {
	ID             string                 `gorm:"primaryKey" json:"id"` // Unique identifier (e.g., target domain or IP)
	OrganizationID uuid.UUID              `gorm:"type:uuid;not null;index" json:"organization_id"`
	Label          string                 `gorm:"not null;index" json:"label"` // e.g., "Domain", "IP", "Port", "Service"
	Properties     map[string]interface{} `gorm:"type:jsonb" json:"properties"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
}

type Edge struct {
	ID           uuid.UUID              `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SourceID     string                 `gorm:"not null;index;uniqueIndex:idx_edges_source_target_rel" json:"source_id"`
	TargetID     string                 `gorm:"not null;index;uniqueIndex:idx_edges_source_target_rel" json:"target_id"`
	Relationship string                 `gorm:"not null;index;uniqueIndex:idx_edges_source_target_rel" json:"relationship"` // e.g., "RESOLVES_TO", "EXPOSES", "HOSTS"
	Properties   map[string]interface{} `gorm:"type:jsonb" json:"properties"`
	CreatedAt    time.Time              `json:"created_at"`
}

// Ensure unique edges between same source, target, and relationship
