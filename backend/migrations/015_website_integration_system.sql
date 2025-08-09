-- Migration 015: Website Integration System
-- This migration adds comprehensive website integration features for companies

-- Company Integration Settings
CREATE TABLE IF NOT EXISTS company_integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    website_integration_enabled BOOLEAN DEFAULT false,
    api_key VARCHAR(255) UNIQUE,
    allowed_domains TEXT[], -- Array of allowed domains
    widget_configuration JSONB DEFAULT '{}', -- Widget styling and configuration
    booking_widget_enabled BOOLEAN DEFAULT true,
    chat_widget_enabled BOOLEAN DEFAULT true,
    analytics_widget_enabled BOOLEAN DEFAULT true,
    custom_css TEXT,
    custom_javascript TEXT,
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    cors_origins TEXT[], -- Array of CORS origins
    rate_limit_per_hour INTEGER DEFAULT 1000,
    features_enabled JSONB DEFAULT '{"booking": true, "chat": true, "analytics": true}',
    integration_status VARCHAR(20) DEFAULT 'inactive', -- 'inactive', 'active', 'suspended'
    last_api_call TIMESTAMP,
    total_api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id)
);

-- Widget Analytics
CREATE TABLE IF NOT EXISTS widget_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    widget_type VARCHAR(30) NOT NULL, -- 'booking', 'chat', 'analytics'
    event_type VARCHAR(50) NOT NULL, -- 'load', 'interaction', 'conversion', 'error'
    page_url VARCHAR(1000),
    referrer VARCHAR(1000),
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(100),
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website Visitor Tracking
CREATE TABLE IF NOT EXISTS website_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100) NOT NULL, -- Generated visitor ID
    session_id VARCHAR(100),
    first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_visits INTEGER DEFAULT 1,
    total_page_views INTEGER DEFAULT 1,
    pages_visited JSONB DEFAULT '[]', -- Array of page URLs
    referrer_source VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    device_type VARCHAR(30), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2) DEFAULT 0.00,
    conversion_date TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, visitor_id)
);

-- Widget Conversion Funnels
CREATE TABLE IF NOT EXISTS widget_conversion_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    funnel_name VARCHAR(100) NOT NULL,
    steps JSONB NOT NULL, -- Array of funnel steps
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Widget Conversion Events
CREATE TABLE IF NOT EXISTS widget_conversion_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES widget_conversion_funnels(id) ON DELETE CASCADE,
    visitor_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100),
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website Integration Templates
CREATE TABLE IF NOT EXISTS website_integration_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(30) NOT NULL, -- 'booking_widget', 'chat_widget', 'full_integration'
    description TEXT,
    html_template TEXT NOT NULL,
    css_template TEXT,
    javascript_template TEXT NOT NULL,
    configuration_schema JSONB, -- JSON schema for configuration
    preview_image_url VARCHAR(500),
    is_premium BOOLEAN DEFAULT false,
    category VARCHAR(50), -- 'modern', 'classic', 'minimal', 'colorful'
    tags TEXT[], -- Array of tags for filtering
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Template Usage
CREATE TABLE IF NOT EXISTS company_template_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES website_integration_templates(id) ON DELETE CASCADE,
    widget_type VARCHAR(30) NOT NULL,
    custom_configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, template_id, widget_type)
);

-- API Key Usage Logs
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(1000),
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website Integration Webhooks
CREATE TABLE IF NOT EXISTS integration_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    webhook_url VARCHAR(500) NOT NULL,
    webhook_secret VARCHAR(255),
    event_types TEXT[] NOT NULL, -- Array of event types to send
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_success TIMESTAMP,
    last_failure TIMESTAMP,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Delivery Logs
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES integration_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    delivery_status VARCHAR(20) NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
    http_status_code INTEGER,
    response_body TEXT,
    delivery_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Website Performance Metrics
CREATE TABLE IF NOT EXISTS website_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    page_url VARCHAR(1000) NOT NULL,
    metric_name VARCHAR(50) NOT NULL, -- 'load_time', 'first_paint', 'widget_load_time'
    metric_value DECIMAL(10,4) NOT NULL,
    visitor_id VARCHAR(100),
    session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEO Integration Data
CREATE TABLE IF NOT EXISTS seo_integration_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    page_url VARCHAR(1000) NOT NULL,
    page_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    schema_org_data JSONB, -- JSON-LD structured data
    og_tags JSONB, -- Open Graph tags
    twitter_card_data JSONB,
    canonical_url VARCHAR(1000),
    last_crawled TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seo_score DECIMAL(5,2),
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, page_url)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_integration_settings_company_id ON company_integration_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_integration_settings_api_key ON company_integration_settings(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_widget_analytics_company_timestamp ON widget_analytics(company_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_widget_analytics_widget_type ON widget_analytics(widget_type);
CREATE INDEX IF NOT EXISTS idx_website_visitors_company_id ON website_visitors(company_id);
CREATE INDEX IF NOT EXISTS idx_website_visitors_visitor_id ON website_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_website_visitors_session_id ON website_visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_widget_conversion_events_funnel_id ON widget_conversion_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_widget_conversion_events_visitor_session ON widget_conversion_events(visitor_id, session_id);
CREATE INDEX IF NOT EXISTS idx_company_template_usage_company_id ON company_template_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_company_timestamp ON api_key_usage_logs(company_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_api_key ON api_key_usage_logs(api_key);
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_company_id ON integration_webhooks(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook_id ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_status ON webhook_delivery_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_website_performance_metrics_company_url ON website_performance_metrics(company_id, page_url);
CREATE INDEX IF NOT EXISTS idx_seo_integration_data_company_id ON seo_integration_data(company_id);

-- Update triggers
CREATE TRIGGER update_company_integration_settings_updated_at BEFORE UPDATE ON company_integration_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_website_visitors_updated_at BEFORE UPDATE ON website_visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_widget_conversion_funnels_updated_at BEFORE UPDATE ON widget_conversion_funnels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_website_integration_templates_updated_at BEFORE UPDATE ON website_integration_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_webhooks_updated_at BEFORE UPDATE ON integration_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_integration_data_updated_at BEFORE UPDATE ON seo_integration_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN 'zootel_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to update API usage stats
CREATE OR REPLACE FUNCTION update_api_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE company_integration_settings
    SET 
        last_api_call = CURRENT_TIMESTAMP,
        total_api_calls = total_api_calls + 1
    WHERE api_key = NEW.api_key;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track visitor sessions
CREATE OR REPLACE FUNCTION track_visitor_session()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO website_visitors (
        company_id, visitor_id, session_id, last_visit, 
        pages_visited, device_type, browser, operating_system, 
        ip_address, user_agent
    ) VALUES (
        NEW.company_id,
        COALESCE(NEW.session_id, gen_random_uuid()::text),
        NEW.session_id,
        CURRENT_TIMESTAMP,
        ARRAY[NEW.page_url],
        CASE 
            WHEN NEW.user_agent ILIKE '%mobile%' THEN 'mobile'
            WHEN NEW.user_agent ILIKE '%tablet%' THEN 'tablet'
            ELSE 'desktop'
        END,
        CASE 
            WHEN NEW.user_agent ILIKE '%chrome%' THEN 'Chrome'
            WHEN NEW.user_agent ILIKE '%firefox%' THEN 'Firefox'
            WHEN NEW.user_agent ILIKE '%safari%' THEN 'Safari'
            ELSE 'Other'
        END,
        CASE 
            WHEN NEW.user_agent ILIKE '%windows%' THEN 'Windows'
            WHEN NEW.user_agent ILIKE '%mac%' THEN 'macOS'
            WHEN NEW.user_agent ILIKE '%linux%' THEN 'Linux'
            WHEN NEW.user_agent ILIKE '%android%' THEN 'Android'
            WHEN NEW.user_agent ILIKE '%ios%' THEN 'iOS'
            ELSE 'Other'
        END,
        NEW.ip_address,
        NEW.user_agent
    )
    ON CONFLICT (company_id, visitor_id) DO UPDATE SET
        last_visit = CURRENT_TIMESTAMP,
        total_visits = website_visitors.total_visits + 1,
        total_page_views = website_visitors.total_page_views + 1,
        pages_visited = array_append(website_visitors.pages_visited, NEW.page_url),
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_api_usage_stats_trigger AFTER INSERT ON api_key_usage_logs FOR EACH ROW EXECUTE FUNCTION update_api_usage_stats();
CREATE TRIGGER track_visitor_session_trigger AFTER INSERT ON widget_analytics FOR EACH ROW EXECUTE FUNCTION track_visitor_session();

-- Insert default website integration templates
INSERT INTO website_integration_templates (template_name, template_type, description, html_template, css_template, javascript_template, category, tags) VALUES
(
    'Modern Booking Widget',
    'booking_widget',
    'Clean and modern booking widget with smooth animations',
    '<div id="zootel-booking-modern" class="zootel-booking-widget modern-theme"></div>',
    '.modern-theme { border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }',
    'ZootelBooking.init({container: "#zootel-booking-modern", theme: "modern"});',
    'modern',
    ARRAY['responsive', 'animations', 'clean']
),
(
    'Classic Chat Widget',
    'chat_widget',
    'Traditional chat widget with professional styling',
    '<div id="zootel-chat-classic" class="zootel-chat-widget classic-theme"></div>',
    '.classic-theme { border: 1px solid #ddd; border-radius: 4px; }',
    'ZootelChat.init({container: "#zootel-chat-classic", theme: "classic"});',
    'classic',
    ARRAY['professional', 'traditional', 'business']
),
(
    'Minimal Analytics Widget',
    'analytics_widget',
    'Lightweight analytics tracking with minimal footprint',
    '<script src="https://api.zootel.com/widgets/analytics-minimal.js"></script>',
    '',
    'ZootelAnalytics.init({theme: "minimal", autoTrack: true});',
    'minimal',
    ARRAY['lightweight', 'auto-tracking', 'privacy-friendly']
)
ON CONFLICT DO NOTHING;

-- Create default integration settings for existing companies with website integration enabled
INSERT INTO company_integration_settings (
    company_id, 
    website_integration_enabled, 
    api_key,
    features_enabled,
    integration_status
)
SELECT 
    id,
    website_integration_enabled,
    CASE 
        WHEN website_integration_enabled = true AND api_key IS NOT NULL 
        THEN api_key 
        ELSE generate_api_key() 
    END,
    '{"booking": true, "chat": true, "analytics": true}',
    CASE 
        WHEN website_integration_enabled = true 
        THEN 'active' 
        ELSE 'inactive' 
    END
FROM companies 
WHERE id NOT IN (SELECT company_id FROM company_integration_settings); 