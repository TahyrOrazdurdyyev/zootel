-- Migration 005: Update company schema
-- Add website integration, marketplace settings, and enhanced company features

-- Add website integration fields to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website_integration_enabled BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS api_key_created_at TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);

-- Add marketplace visibility settings
ALTER TABLE companies ADD COLUMN IF NOT EXISTS publish_to_marketplace BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS marketplace_featured BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS marketplace_priority INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS marketplace_tags TEXT[] DEFAULT '{}';

-- Add enhanced company settings
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_policies JSONB DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_radius INTEGER DEFAULT 0; -- in kilometers
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS booking_advance_limit INTEGER DEFAULT 30; -- days
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS refund_policy TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS terms_of_service TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS privacy_policy TEXT;

-- Add integration features tracking
CREATE TABLE IF NOT EXISTS company_integration_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value TEXT,
    is_enabled BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, feature_key)
);

-- Add source tracking for marketplace analytics
CREATE TABLE IF NOT EXISTS source_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- website, marketplace, mobile, widget
    source_details JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    action_type VARCHAR(50) NOT NULL, -- view, click, booking, purchase
    action_details JSONB DEFAULT '{}',
    conversion_value DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create company ratings and reviews
CREATE TABLE IF NOT EXISTS company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    helpful_votes INTEGER DEFAULT 0,
    not_helpful_votes INTEGER DEFAULT 0,
    company_response TEXT,
    company_response_date TIMESTAMP,
    moderation_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    moderation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_id, booking_id, order_id)
);

-- Create company certifications and badges
CREATE TABLE IF NOT EXISTS company_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    certification_name VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255),
    certification_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    verification_url TEXT,
    document_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add company statistics view
CREATE OR REPLACE VIEW company_statistics AS
SELECT 
    c.id,
    c.name,
    c.publish_to_marketplace,
    c.website_integration_enabled,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT cr.id) as total_reviews,
    COALESCE(AVG(cr.rating), 0) as average_rating,
    COUNT(DISTINCT e.id) as total_employees,
    COUNT(DISTINCT s.id) as total_services,
    COUNT(DISTINCT p.id) as total_products,
    COALESCE(SUM(b.price), 0) + COALESCE(SUM(o.total_amount), 0) as total_revenue
FROM companies c
LEFT JOIN bookings b ON c.id = b.company_id AND b.status = 'completed'
LEFT JOIN orders o ON c.id = o.company_id AND o.status = 'completed'
LEFT JOIN company_reviews cr ON c.id = cr.company_id AND cr.is_public = true
LEFT JOIN employees e ON c.id = e.company_id AND e.is_active = true
LEFT JOIN services s ON c.id = s.company_id AND s.is_active = true
LEFT JOIN products p ON c.id = p.company_id AND p.is_active = true
GROUP BY c.id, c.name, c.publish_to_marketplace, c.website_integration_enabled;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_api_key ON companies(api_key);
CREATE INDEX IF NOT EXISTS idx_companies_marketplace ON companies(publish_to_marketplace, marketplace_featured);
CREATE INDEX IF NOT EXISTS idx_company_integration_features_company ON company_integration_features(company_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_source_analytics_company ON source_analytics(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_source_analytics_action ON source_analytics(action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_company_reviews_company ON company_reviews(company_id, is_public);
CREATE INDEX IF NOT EXISTS idx_company_reviews_user ON company_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_company_certifications_company ON company_certifications(company_id, is_public);

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN 'zk_' || encode(gen_random_bytes(32), 'hex');
END;
$$ language 'plpgsql';

-- Update triggers
CREATE OR REPLACE FUNCTION update_company_integration_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_integration_features_updated_at
    BEFORE UPDATE ON company_integration_features
    FOR EACH ROW
    EXECUTE FUNCTION update_company_integration_features_updated_at();

CREATE TRIGGER update_company_reviews_updated_at
    BEFORE UPDATE ON company_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_company_integration_features_updated_at();

CREATE TRIGGER update_company_certifications_updated_at
    BEFORE UPDATE ON company_certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_company_integration_features_updated_at(); 