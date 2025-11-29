-- Migration: Create company_addons table for AI agent addons management
-- This table tracks manually added AI agents and other addons for companies

CREATE TABLE IF NOT EXISTS company_addons (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    addon_type VARCHAR(50) NOT NULL, -- 'ai_agent', 'feature', etc.
    addon_key VARCHAR(100) NOT NULL, -- agent key or feature key
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly', 'one_time', 'free'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    next_billing_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_addons_company_id ON company_addons(company_id);
CREATE INDEX IF NOT EXISTS idx_company_addons_type_key ON company_addons(addon_type, addon_key);
CREATE INDEX IF NOT EXISTS idx_company_addons_status ON company_addons(status);
CREATE INDEX IF NOT EXISTS idx_company_addons_expires_at ON company_addons(expires_at);

-- Add comments
COMMENT ON TABLE company_addons IS 'Tracks manually purchased addons (AI agents, features) for companies';
COMMENT ON COLUMN company_addons.addon_type IS 'Type of addon: ai_agent, feature, etc.';
COMMENT ON COLUMN company_addons.addon_key IS 'Unique key identifying the specific addon';
COMMENT ON COLUMN company_addons.billing_cycle IS 'How often the addon is billed: monthly, yearly, one_time, free';
COMMENT ON COLUMN company_addons.status IS 'Current status: active, cancelled, expired';
