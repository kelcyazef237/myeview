package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	
	"gorm.io/gorm"
)

type Asset struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrganizationID uuid.UUID      `gorm:"type:uuid;not null;index" json:"organization_id"`
	TargetID       string         `gorm:"not null;index" json:"target_id"`
	Name           string         `gorm:"not null;index" json:"name"`
	Type           string         `gorm:"not null" json:"type"`
	Source         string         `json:"source"`
	IsActive       bool           `gorm:"default:false" json:"is_active"`
	IPAddresses    pq.StringArray `gorm:"type:text[]" json:"ip_addresses"`
	PortsOpen      pq.Int64Array  `gorm:"type:integer[]" json:"ports_open"`
	TLSValid       bool           `json:"tls_valid"`
	TLSCertIssuer  string         `json:"tls_cert_issuer"`
	TLSCertExpiry  *time.Time     `json:"tls_cert_expiry"`
	DiscoveredAt   time.Time      `json:"discovered_at"`
	VerifiedAt     *time.Time     `json:"verified_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type VerifiedAsset struct {
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	IsActive      bool      `json:"is_active"`
	IPAddresses   []string  `json:"ip_addresses"`
	PortsOpen     []int     `json:"ports_open"`
	TLSValid      bool      `json:"tls_valid"`
	TLSCertIssuer string    `json:"tls_cert_issuer"`
	TLSCertExpiry time.Time `json:"tls_cert_expiry"`
	Timestamp     time.Time `json:"timestamp"`
}
