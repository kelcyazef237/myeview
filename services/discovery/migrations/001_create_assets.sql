-- MYEVIEW Assets: Initial Schema Migration
-- Creates the table for storing discovered and verified assets.

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, -- Link to IAM organization
    target_id VARCHAR(255) NOT NULL, -- Root target (e.g., example.com)
    name VARCHAR(255) NOT NULL, -- Discovered asset name (e.g., api.example.com)
    type VARCHAR(50) NOT NULL, -- subdomain, ip, etc.
    source VARCHAR(100), -- crt.sh, shodan, etc.
    is_active BOOLEAN DEFAULT FALSE,
    ip_addresses TEXT[],
    ports_open INTEGER[],
    tls_valid BOOLEAN DEFAULT FALSE,
    tls_cert_issuer TEXT,
    tls_cert_expiry TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    metadata JSONB,
    tech_stack TEXT[],
    cloud_provider VARCHAR(100),
    risk_score INTEGER DEFAULT 0,
    risk_severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, target_id, name)
);

CREATE INDEX IF NOT EXISTS idx_assets_target_id ON assets(target_id);
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_organization_id ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_assets_is_active ON assets(is_active);
