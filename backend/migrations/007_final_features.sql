-- Migration 007: Final features
-- Add advanced features, analytics, and system optimization

-- Create file uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL, -- can reference users, employees, or companies
    uploader_type VARCHAR(20) NOT NULL, -- user, employee, company
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_purpose VARCHAR(50) NOT NULL, -- avatar, logo, document, media, etc.
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    virus_scan_status VARCHAR(20) DEFAULT 'pending', -- pending, clean, infected, error
    virus_scan_result TEXT,
    expires_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system events/audit log
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- security, data, system, user_action
    actor_id UUID,
    actor_type VARCHAR(20), -- user, employee, admin, system
    target_id UUID,
    target_type VARCHAR(50), -- company, user, booking, order, etc.
    action VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info', -- critical, high, medium, low, info
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20),
    dimensions JSONB DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key VARCHAR(100) UNIQUE NOT NULL,
    flag_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_audience JSONB DEFAULT '{}', -- conditions for who sees the feature
    environment VARCHAR(20) DEFAULT 'production',
    created_by VARCHAR(255),
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create A/B test experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_key VARCHAR(100) UNIQUE NOT NULL,
    experiment_name VARCHAR(255) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, running, paused, completed
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    traffic_percentage INTEGER DEFAULT 50,
    control_variant VARCHAR(100) DEFAULT 'control',
    test_variants JSONB NOT NULL DEFAULT '[]',
    success_metrics JSONB DEFAULT '[]',
    target_audience JSONB DEFAULT '{}',
    results JSONB DEFAULT '{}',
    winner_variant VARCHAR(100),
    statistical_significance DECIMAL(5,4),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user experiment assignments
CREATE TABLE IF NOT EXISTS user_experiment_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    variant VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_exposure_at TIMESTAMP,
    conversion_events JSONB DEFAULT '[]',
    UNIQUE(experiment_id, user_id),
    UNIQUE(experiment_id, session_id)
);

-- Create system health checks
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- database, api, external_service, etc.
    status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy
    response_time_ms INTEGER,
    error_message TEXT,
    details JSONB DEFAULT '{}',
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rate limiting records
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP, user_id, api_key, etc.
    limit_type VARCHAR(50) NOT NULL, -- api_calls, uploads, messages, etc.
    window_start TIMESTAMP NOT NULL,
    window_size_seconds INTEGER NOT NULL,
    request_count INTEGER DEFAULT 1,
    limit_exceeded BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, limit_type, window_start)
);

-- Add advanced analytics columns to existing tables
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) DEFAULT 'direct';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referrer_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_source VARCHAR(50) DEFAULT 'direct';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- Add advanced company analytics view
CREATE OR REPLACE VIEW company_analytics_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    
    -- Booking metrics
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN b.id END) as bookings_last_30_days,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
    
    -- Order metrics
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.id END) as orders_last_30_days,
    
    -- Revenue metrics
    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.price END), 0) as booking_revenue,
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) as order_revenue,
    COALESCE(SUM(CASE WHEN b.status = 'completed' AND b.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN b.price END), 0) as booking_revenue_30_days,
    
    -- Customer metrics
    COUNT(DISTINCT b.user_id) + COUNT(DISTINCT o.user_id) as unique_customers,
    COUNT(DISTINCT CASE WHEN b.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN b.user_id END) + 
    COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.user_id END) as new_customers_30_days,
    
    -- Review metrics
    COUNT(DISTINCT cr.id) as total_reviews,
    COALESCE(AVG(cr.rating), 0) as average_rating,
    
    -- Chat metrics
    COUNT(DISTINCT ch.id) as total_chats,
    COUNT(DISTINCT CASE WHEN ch.status = 'resolved' THEN ch.id END) as resolved_chats,
    
    -- Source analytics
    COUNT(DISTINCT CASE WHEN sa.source_type = 'marketplace' THEN sa.id END) as marketplace_interactions,
    COUNT(DISTINCT CASE WHEN sa.source_type = 'website' THEN sa.id END) as website_interactions

FROM companies c
LEFT JOIN bookings b ON c.id = b.company_id
LEFT JOIN orders o ON c.id = o.company_id
LEFT JOIN company_reviews cr ON c.id = cr.company_id AND cr.is_public = true
LEFT JOIN chats ch ON c.id = ch.company_id
LEFT JOIN source_analytics sa ON c.id = sa.company_id
GROUP BY c.id, c.name;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploader ON file_uploads(uploader_type, uploader_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_purpose ON file_uploads(upload_purpose, created_at);
CREATE INDEX IF NOT EXISTS idx_system_events_type_category ON system_events(event_type, event_category, created_at);
CREATE INDEX IF NOT EXISTS idx_system_events_actor ON system_events(actor_type, actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_timestamp ON performance_metrics(metric_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_key_status ON ab_experiments(experiment_key, status);
CREATE INDEX IF NOT EXISTS idx_user_experiment_assignments_user ON user_experiment_assignments(user_id, assigned_at);
CREATE INDEX IF NOT EXISTS idx_health_checks_service_checked ON health_checks(service_name, checked_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_type ON rate_limits(identifier, limit_type, window_start);

-- Cleanup old data function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old performance metrics (older than 90 days)
    DELETE FROM performance_metrics WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    -- Delete old system events (older than 1 year)
    DELETE FROM system_events WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
    
    -- Delete old health checks (older than 7 days)
    DELETE FROM health_checks WHERE checked_at < CURRENT_DATE - INTERVAL '7 days';
    
    -- Delete old rate limit records (older than 1 day)
    DELETE FROM rate_limits WHERE created_at < CURRENT_DATE - INTERVAL '1 day';
    
    -- Delete expired file uploads
    DELETE FROM file_uploads WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
    
    -- Delete old cart abandonment records (older than 6 months)
    DELETE FROM cart_abandonment WHERE abandoned_at < CURRENT_DATE - INTERVAL '6 months';
    
    -- Update cart sessions that are expired
    UPDATE cart_sessions SET cart_id = NULL WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ language 'plpgsql';

-- Insert initial feature flags
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) VALUES
('marketplace_v2', 'Marketplace V2', 'New marketplace interface with enhanced filtering', false),
('ai_chat_suggestions', 'AI Chat Suggestions', 'AI-powered response suggestions for customer support', false),
('advanced_analytics', 'Advanced Analytics', 'Enhanced analytics dashboard with custom metrics', true),
('real_time_notifications', 'Real-time Notifications', 'WebSocket-based real-time notifications', true),
('mobile_app_integration', 'Mobile App Integration', 'Enhanced mobile app features and API endpoints', true)
ON CONFLICT (flag_key) DO NOTHING; 