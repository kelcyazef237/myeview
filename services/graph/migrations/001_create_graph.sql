-- MYEVIEW Graph: Initial Schema Migration
-- Creates the table for storing attack path nodes and edges.

CREATE TABLE IF NOT EXISTS nodes (
    id VARCHAR(255) PRIMARY KEY, -- Using string ID (target, ip, etc.)
    organization_id UUID NOT NULL,
    label VARCHAR(50) NOT NULL,
    properties JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_organization_id ON nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label);

CREATE TABLE IF NOT EXISTS edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(255) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    properties JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_id, target_id, relationship)
);

CREATE INDEX IF NOT EXISTS idx_edges_source_id ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target_id ON edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_relationship ON edges(relationship);
