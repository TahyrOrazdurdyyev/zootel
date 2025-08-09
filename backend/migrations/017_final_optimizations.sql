-- Migration 015: Final Optimizations and Performance Enhancements
-- This migration adds final performance optimizations, caching, and monitoring features

-- Performance Monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL, -- 'response_time', 'memory_usage', 'cpu_usage', 'database_queries'
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20), -- 'ms', 'mb', 'percent', 'count'
    endpoint VARCHAR(255),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    additional_data JSONB
);

-- Application Caching
CREATE TABLE IF NOT EXISTS cache_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_value JSONB NOT NULL,
    cache_tags TEXT[], -- Tags for cache invalidation
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Background Jobs Queue
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'report_generation', 'data_sync', 'cleanup'
    job_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'retrying'
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    worker_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false, -- For sensitive configs like API keys
    is_public BOOLEAN DEFAULT false, -- Can be accessed by frontend
    environment VARCHAR(20) DEFAULT 'all', -- 'development', 'staging', 'production', 'all'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature Flags (Global)
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage DECIMAL(5,2) DEFAULT 0.00, -- Gradual rollout percentage
    target_audience JSONB, -- JSON criteria for who sees the feature
    environment VARCHAR(20) DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, API key, etc.
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_size_minutes INTEGER DEFAULT 60,
    max_requests INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint, window_start)
);

-- Audit Logs (Comprehensive logging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
    resource_type VARCHAR(50) NOT NULL, -- 'user', 'company', 'booking', 'order', etc.
    resource_id UUID,
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    api_key_used VARCHAR(100),
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    request_body JSONB,
    response_status INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Error Logs
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(50) NOT NULL, -- 'application', 'database', 'network', 'validation'
    error_code VARCHAR(20),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    session_id VARCHAR(100),
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    request_body JSONB,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'error', -- 'debug', 'info', 'warning', 'error', 'fatal'
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Database Backup Logs
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(30) NOT NULL, -- 'full', 'incremental', 'schema_only'
    backup_location VARCHAR(500) NOT NULL,
    backup_size_bytes BIGINT,
    compression_type VARCHAR(20), -- 'gzip', 'lz4', 'none'
    encryption_enabled BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    error_message TEXT,
    retention_until DATE,
    created_by VARCHAR(100), -- System user or admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health Check Results
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_name VARCHAR(100) NOT NULL,
    check_type VARCHAR(30) NOT NULL, -- 'database', 'redis', 'external_api', 'disk_space', 'memory'
    status VARCHAR(20) NOT NULL, -- 'healthy', 'warning', 'critical', 'unknown'
    response_time_ms INTEGER,
    message TEXT,
    details JSONB,
    threshold_warning DECIMAL(10,2),
    threshold_critical DECIMAL(10,2),
    measured_value DECIMAL(15,4),
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Retention Policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    retention_days INTEGER NOT NULL,
    archive_before_delete BOOLEAN DEFAULT false,
    archive_location VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_cleanup_at TIMESTAMP,
    next_cleanup_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search Index (For full-text search optimization)
CREATE TABLE IF NOT EXISTS search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'company', 'service', 'product', 'user'
    entity_id UUID NOT NULL,
    title VARCHAR(255),
    content TEXT,
    keywords TEXT[], -- Array of keywords for better matching
    search_vector TSVECTOR, -- PostgreSQL full-text search vector
    boost_score DECIMAL(3,2) DEFAULT 1.00, -- Relevance boost
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id)
);

-- Notification Queue (For batching and retry logic)
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(30) NOT NULL, -- 'email', 'sms', 'push', 'webhook'
    recipient VARCHAR(255) NOT NULL, -- Email, phone, device token, or URL
    subject VARCHAR(255),
    message TEXT NOT NULL,
    template_id VARCHAR(100),
    template_data JSONB,
    priority INTEGER DEFAULT 5,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    provider_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Statistics
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key VARCHAR(255),
    company_id UUID REFERENCES companies(id),
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    response_status INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    date_hour TIMESTAMP NOT NULL, -- Truncated to hour for aggregation
    request_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(api_key, company_id, endpoint, http_method, response_status, date_hour)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_timestamp ON performance_metrics(metric_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_company_timestamp ON performance_metrics(company_id, timestamp) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_tags ON cache_entries USING GIN(cache_tags);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status_scheduled ON background_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_background_jobs_type_status ON background_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_window ON rate_limits(identifier, window_start);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id_created_at ON audit_logs(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type_id ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_resolved ON error_logs(severity, is_resolved);
CREATE INDEX IF NOT EXISTS idx_health_checks_name_checked_at ON health_checks(check_name, checked_at);
CREATE INDEX IF NOT EXISTS idx_search_index_entity_type ON search_index(entity_type);
CREATE INDEX IF NOT EXISTS idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_scheduled ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_company_date ON api_usage_stats(company_id, date_hour);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_endpoint_date ON api_usage_stats(endpoint, date_hour);

-- Update triggers
CREATE TRIGGER update_cache_entries_updated_at BEFORE UPDATE ON cache_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON system_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update search index
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'companies' THEN
        INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector)
        VALUES (
            'company',
            NEW.id,
            NEW.name,
            COALESCE(NEW.description, ''),
            string_to_array(lower(NEW.name || ' ' || COALESCE(NEW.description, '')), ' '),
            to_tsvector('english', NEW.name || ' ' || COALESCE(NEW.description, ''))
        )
        ON CONFLICT (entity_type, entity_id) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            keywords = EXCLUDED.keywords,
            search_vector = EXCLUDED.search_vector,
            last_updated = CURRENT_TIMESTAMP;
    ELSIF TG_TABLE_NAME = 'services' THEN
        INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector)
        VALUES (
            'service',
            NEW.id,
            NEW.name,
            COALESCE(NEW.description, ''),
            string_to_array(lower(NEW.name || ' ' || COALESCE(NEW.description, '')), ' '),
            to_tsvector('english', NEW.name || ' ' || COALESCE(NEW.description, ''))
        )
        ON CONFLICT (entity_type, entity_id) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            keywords = EXCLUDED.keywords,
            search_vector = EXCLUDED.search_vector,
            last_updated = CURRENT_TIMESTAMP;
    ELSIF TG_TABLE_NAME = 'products' THEN
        INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector)
        VALUES (
            'product',
            NEW.id,
            NEW.name,
            COALESCE(NEW.description, ''),
            string_to_array(lower(NEW.name || ' ' || COALESCE(NEW.description, '')), ' '),
            to_tsvector('english', NEW.name || ' ' || COALESCE(NEW.description, ''))
        )
        ON CONFLICT (entity_type, entity_id) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            keywords = EXCLUDED.keywords,
            search_vector = EXCLUDED.search_vector,
            last_updated = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_entries WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old data based on retention policies
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(table_name VARCHAR, deleted_count INTEGER) AS $$
DECLARE
    policy RECORD;
    sql_query TEXT;
    result_count INTEGER;
BEGIN
    FOR policy IN SELECT * FROM data_retention_policies WHERE is_active = true LOOP
        sql_query := format('DELETE FROM %I WHERE created_at < CURRENT_DATE - INTERVAL ''%s days''', 
                           policy.table_name, policy.retention_days);
        
        EXECUTE sql_query;
        GET DIAGNOSTICS result_count = ROW_COUNT;
        
        -- Update last cleanup time
        UPDATE data_retention_policies 
        SET last_cleanup_at = CURRENT_TIMESTAMP,
            next_cleanup_at = CURRENT_TIMESTAMP + INTERVAL '1 day'
        WHERE id = policy.id;
        
        table_name := policy.table_name;
        deleted_count := result_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Triggers for search index updates
CREATE TRIGGER update_company_search_index AFTER INSERT OR UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_search_index();
CREATE TRIGGER update_service_search_index AFTER INSERT OR UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_search_index();
CREATE TRIGGER update_product_search_index AFTER INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_search_index();

-- Insert default system configurations
INSERT INTO system_configurations (config_key, config_value, description, is_public) VALUES
('app_name', '"Zootel"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('maintenance_mode', 'false', 'Maintenance mode flag', true),
('max_upload_size_mb', '50', 'Maximum file upload size in MB', true),
('supported_file_types', '["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"]', 'Supported file upload types', true),
('default_timezone', '"UTC"', 'Default timezone for the application', true),
('enable_registration', 'true', 'Allow new user registrations', true),
('email_verification_required', 'true', 'Require email verification for new users', false),
('max_booking_advance_days', '90', 'Maximum days in advance for bookings', true),
('default_currency', '"USD"', 'Default currency', true),
('platform_commission_rate', '5.0', 'Platform commission rate percentage', false)
ON CONFLICT (config_key) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, description, is_enabled) VALUES
('enable_chat_widget', 'Enable chat widget on company websites', true),
('enable_booking_widget', 'Enable booking widget on company websites', true),
('enable_loyalty_program', 'Enable loyalty program features', true),
('enable_review_system', 'Enable review and rating system', true),
('enable_marketplace', 'Enable public marketplace', true),
('enable_multi_location', 'Enable multi-location support', false),
('enable_franchise_management', 'Enable franchise management features', false),
('enable_white_label', 'Enable white label configurations', false),
('enable_advanced_analytics', 'Enable advanced analytics features', true),
('enable_ab_testing', 'Enable A/B testing framework', false)
ON CONFLICT (flag_name) DO NOTHING;

-- Insert default data retention policies
INSERT INTO data_retention_policies (table_name, retention_days, archive_before_delete) VALUES
('performance_metrics', 90, false),
('audit_logs', 365, true),
('error_logs', 180, false),
('background_jobs', 30, false),
('notification_queue', 30, false),
('health_checks', 30, false),
('api_usage_stats', 365, true),
('user_activity_log', 180, false),
('analytics_events', 730, true)
ON CONFLICT DO NOTHING;

-- Create initial search index for existing data
INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector)
SELECT 
    'company',
    id,
    name,
    COALESCE(description, ''),
    string_to_array(lower(name || ' ' || COALESCE(description, '')), ' '),
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
FROM companies
ON CONFLICT DO NOTHING;

INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector)
SELECT 
    'service',
    id,
    name,
    COALESCE(description, ''),
    string_to_array(lower(name || ' ' || COALESCE(description, '')), ' '),
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
FROM services
ON CONFLICT DO NOTHING;

INSERT INTO search_index (entity_type, entity_id, title, content, keywords, search_vector)
SELECT 
    'product',
    id,
    name,
    COALESCE(description, ''),
    string_to_array(lower(name || ' ' || COALESCE(description, '')), ' '),
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
FROM products
ON CONFLICT DO NOTHING; 