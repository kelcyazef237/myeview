-- MYEVIEW Compliance RAG: Initial Schema Migration

CREATE EXTENSION IF NOT EXISTS vector;

-- Regulations
CREATE TABLE IF NOT EXISTS regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- e.g., 'COBAC', 'ANTIC'
    version VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regulation Chunks (for RAG)
CREATE TABLE IF NOT EXISTS regulation_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536), -- Assuming OpenAI text-embedding-3-small
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulation_chunks_regulation_id ON regulation_chunks(regulation_id);

-- Compliance Gaps (Findings mapped to assets)
CREATE TABLE IF NOT EXISTS compliance_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    regulation_id UUID NOT NULL REFERENCES regulations(id),
    asset_name VARCHAR(255) NOT NULL,
    violated_requirement TEXT NOT NULL,
    evidence TEXT NOT NULL,
    remediation TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, resolved, accepted
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_gaps_org ON compliance_gaps(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_gaps_asset ON compliance_gaps(asset_name);
