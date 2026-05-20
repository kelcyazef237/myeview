package events

import "time"

// AssetDiscoveredEvent is published when the discovery service finds an asset.
type AssetDiscoveredEvent struct {
	OrganizationID string    `json:"organization_id"`
	TargetID       string    `json:"target_id"`   // E.g., the root domain
	AssetName      string    `json:"asset_name"`  // The discovered subdomain or IP
	AssetType      string    `json:"asset_type"`  // e.g., "subdomain", "ip"
	Source         string    `json:"source"`      // e.g., "crt.sh", "shodan"
	DiscoveredAt   time.Time `json:"discovered_at"`
	Status         string    `json:"status,omitempty"` // e.g., "started", "completed"
}

// AssetVerifiedEvent is published when the verification service confirms the asset is alive.
type AssetVerifiedEvent struct {
	OrganizationID string    `json:"organization_id"`
	TargetID       string    `json:"target_id"`
	AssetName      string    `json:"asset_name"`
	AssetType      string    `json:"asset_type"`
	IsActive       bool      `json:"is_active"`
	IPAddresses    []string  `json:"ip_addresses,omitempty"`
	PortsOpen      []int     `json:"ports_open,omitempty"`
	TLSValid       bool      `json:"tls_valid,omitempty"`
	TLSCertIssuer  string    `json:"tls_cert_issuer,omitempty"`
	TLSCertExpiry  time.Time `json:"tls_cert_expiry,omitempty"`
	VerifiedAt     time.Time `json:"verified_at"`
}

// AssetEnrichedEvent is published when the enrichment service adds metadata.
type AssetEnrichedEvent struct {
	OrganizationID string                 `json:"organization_id"`
	TargetID       string                 `json:"target_id"`
	AssetName      string                 `json:"asset_name"`
	Metadata       map[string]interface{} `json:"metadata"`
	TechStack      []string               `json:"tech_stack,omitempty"`
	CloudProvider  string                 `json:"cloud_provider,omitempty"`
	Vulnerabilities []string              `json:"vulnerabilities,omitempty"`
	EnrichedAt     time.Time              `json:"enriched_at"`
}

// RiskScoredEvent is published when the scoring service calculates an asset score.
type RiskScoredEvent struct {
	OrganizationID string    `json:"organization_id"`
	TargetID       string    `json:"target_id"`
	AssetName      string    `json:"asset_name"`
	Score          int       `json:"score"`    // 0-100
	Severity       string    `json:"severity"` // info, low, medium, high, critical
	Factors        []string  `json:"factors"`
	ScoredAt       time.Time `json:"scored_at"`
}
