-- Migration 014: Advanced Platform Features
-- This migration adds advanced features like multi-location support, franchise management, and API integrations

-- Company Locations (Multi-location support)
CREATE TABLE IF NOT EXISTS company_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    location_name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(100),
    business_hours JSONB, -- JSON object with hours for each day
    special_hours JSONB, -- JSON array of special hours (holidays, etc.)
    services_available JSONB, -- JSON array of service IDs available at this location
    capacity_limits JSONB, -- JSON object with capacity limits for different services
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    location_type VARCHAR(30) DEFAULT 'branch', -- 'branch', 'franchise', 'mobile', 'popup'
    amenities JSONB, -- JSON array of amenities
    parking_info TEXT,
    public_transport_info TEXT,
    accessibility_features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location Staff Assignments
CREATE TABLE IF NOT EXISTS location_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES company_locations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    working_hours JSONB, -- JSON object with working hours
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_id, employee_id)
);

-- Franchise Management
CREATE TABLE IF NOT EXISTS franchise_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    franchise_name VARCHAR(100) NOT NULL,
    franchise_model VARCHAR(30) NOT NULL, -- 'unit_franchise', 'area_development', 'master_franchise'
    initial_fee DECIMAL(10,2) NOT NULL,
    royalty_percentage DECIMAL(5,2) NOT NULL,
    marketing_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    territory_rights VARCHAR(100),
    contract_duration_years INTEGER DEFAULT 10,
    renewal_terms TEXT,
    training_requirements TEXT,
    operational_standards TEXT,
    brand_guidelines TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Franchise Agreements
CREATE TABLE IF NOT EXISTS franchise_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_system_id UUID NOT NULL REFERENCES franchise_systems(id) ON DELETE CASCADE,
    franchisee_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    location_id UUID REFERENCES company_locations(id),
    agreement_number VARCHAR(50) UNIQUE NOT NULL,
    signed_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    territory_description TEXT,
    initial_fee_paid DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'terminated', 'expired'
    contract_document_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Franchise Payments
CREATE TABLE IF NOT EXISTS franchise_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_agreement_id UUID NOT NULL REFERENCES franchise_agreements(id) ON DELETE CASCADE,
    payment_type VARCHAR(30) NOT NULL, -- 'initial_fee', 'royalty', 'marketing_fee', 'penalty'
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'waived'
    payment_method VARCHAR(30),
    reference_period_start DATE,
    reference_period_end DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Integrations (Third-party integrations)
CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- 'calendar', 'accounting', 'marketing', 'payment', 'crm'
    provider_name VARCHAR(100) NOT NULL, -- 'google_calendar', 'quickbooks', 'mailchimp', etc.
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT, -- Encrypted API key
    refresh_token_encrypted TEXT, -- Encrypted refresh token
    access_token_encrypted TEXT, -- Encrypted access token
    token_expires_at TIMESTAMP,
    configuration JSONB, -- JSON configuration specific to the integration
    sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'real_time', 'hourly', 'daily', 'weekly'
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'active', -- 'active', 'error', 'disabled'
    error_count INTEGER DEFAULT 0,
    last_error_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration Sync Logs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(30) NOT NULL, -- 'import', 'export', 'bi_directional'
    entity_type VARCHAR(50) NOT NULL, -- 'bookings', 'customers', 'services', 'payments'
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed', 'cancelled'
    error_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Multi-tenant Configuration
CREATE TABLE IF NOT EXISTS tenant_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE, -- Custom domain for the company
    subdomain VARCHAR(100) UNIQUE, -- Subdomain like company.zootel.com
    custom_branding JSONB, -- Colors, logo, fonts, etc.
    custom_css TEXT,
    custom_javascript TEXT,
    email_templates JSONB, -- Customized email templates
    sms_templates JSONB, -- Customized SMS templates
    feature_flags JSONB, -- Company-specific feature flags
    regional_settings JSONB, -- Currency, timezone, date format, etc.
    third_party_scripts JSONB, -- Google Analytics, Facebook Pixel, etc.
    seo_settings JSONB, -- Meta tags, descriptions, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B Testing Framework
CREATE TABLE IF NOT EXISTS ab_test_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for platform-wide tests
    experiment_name VARCHAR(100) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed', 'cancelled'
    traffic_percentage DECIMAL(5,2) DEFAULT 50.00, -- Percentage of traffic to include
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    success_metric VARCHAR(50), -- 'conversion_rate', 'revenue', 'engagement', etc.
    configuration JSONB, -- Test configuration and variants
    results JSONB, -- Test results and statistics
    winner_variant VARCHAR(50),
    confidence_level DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B Test Participations
CREATE TABLE IF NOT EXISTS ab_test_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES ab_test_experiments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    variant VARCHAR(50) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    conversion_date TIMESTAMP,
    UNIQUE(experiment_id, user_id)
);

-- White Label Configuration
CREATE TABLE IF NOT EXISTS white_label_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    brand_name VARCHAR(100) NOT NULL,
    brand_logo_url VARCHAR(500),
    brand_icon_url VARCHAR(500),
    primary_color VARCHAR(7), -- Hex color
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    font_family VARCHAR(100),
    custom_domain VARCHAR(255),
    ssl_certificate_url VARCHAR(500),
    email_from_name VARCHAR(100),
    email_from_address VARCHAR(255),
    support_email VARCHAR(255),
    support_phone VARCHAR(20),
    privacy_policy_url VARCHAR(500),
    terms_of_service_url VARCHAR(500),
    app_store_url VARCHAR(500),
    google_play_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced Reporting
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    report_name VARCHAR(100) NOT NULL,
    description TEXT,
    report_type VARCHAR(30) NOT NULL, -- 'financial', 'operational', 'marketing', 'custom'
    data_sources JSONB NOT NULL, -- Tables and fields to include
    filters JSONB, -- Report filters
    grouping JSONB, -- Grouping configuration
    sorting JSONB, -- Sorting configuration
    chart_configuration JSONB, -- Chart settings
    schedule_frequency VARCHAR(20), -- 'none', 'daily', 'weekly', 'monthly'
    schedule_time TIME,
    email_recipients JSONB, -- Array of email addresses
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Executions
CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
    executed_by UUID REFERENCES users(id),
    execution_type VARCHAR(20) NOT NULL, -- 'manual', 'scheduled'
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    data_generated JSONB,
    file_url VARCHAR(500), -- Generated file URL
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_locations_company_id ON company_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_locations_city_state ON company_locations(city, state);
CREATE INDEX IF NOT EXISTS idx_company_locations_coordinates ON company_locations(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_location_staff_location_id ON location_staff(location_id);
CREATE INDEX IF NOT EXISTS idx_location_staff_employee_id ON location_staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_franchise_systems_parent_company ON franchise_systems(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_franchise_agreements_system_id ON franchise_agreements(franchise_system_id);
CREATE INDEX IF NOT EXISTS idx_franchise_agreements_franchisee_id ON franchise_agreements(franchisee_company_id);
CREATE INDEX IF NOT EXISTS idx_franchise_payments_agreement_id ON franchise_payments(franchise_agreement_id);
CREATE INDEX IF NOT EXISTS idx_franchise_payments_due_date ON franchise_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_api_integrations_company_id ON api_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_type ON api_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration_id ON integration_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_tenant_configurations_company_id ON tenant_configurations(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_configurations_domain ON tenant_configurations(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ab_test_experiments_company_id ON ab_test_experiments(company_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_participations_experiment_id ON ab_test_participations(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_participations_user_id ON ab_test_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_company_id ON white_label_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_company_id ON custom_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);

-- Update triggers
CREATE TRIGGER update_company_locations_updated_at BEFORE UPDATE ON company_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_franchise_systems_updated_at BEFORE UPDATE ON franchise_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_franchise_agreements_updated_at BEFORE UPDATE ON franchise_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON api_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_configurations_updated_at BEFORE UPDATE ON tenant_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_experiments_updated_at BEFORE UPDATE ON ab_test_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_white_label_configs_updated_at BEFORE UPDATE ON white_label_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary location per company
CREATE OR REPLACE FUNCTION ensure_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Set all other locations of this company to non-primary
        UPDATE company_locations 
        SET is_primary = false 
        WHERE company_id = NEW.company_id AND id != NEW.id;
    END IF;
    
    -- If this is the first location for the company, make it primary
    IF (SELECT COUNT(*) FROM company_locations WHERE company_id = NEW.company_id) = 0 THEN
        NEW.is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for primary location constraint
CREATE TRIGGER ensure_single_primary_location_trigger BEFORE INSERT OR UPDATE ON company_locations FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_location();

-- Function to calculate franchise payments
CREATE OR REPLACE FUNCTION calculate_franchise_payments()
RETURNS TRIGGER AS $$
DECLARE
    franchise_system RECORD;
    payment_amount DECIMAL(10,2);
    due_date DATE;
BEGIN
    -- Get franchise system details
    SELECT fs.* INTO franchise_system
    FROM franchise_systems fs
    JOIN franchise_agreements fa ON fa.franchise_system_id = fs.id
    WHERE fa.id = NEW.id;
    
    -- Calculate initial fee payment
    IF TG_OP = 'INSERT' THEN
        INSERT INTO franchise_payments (
            franchise_agreement_id, payment_type, amount, due_date, status
        ) VALUES (
            NEW.id, 'initial_fee', franchise_system.initial_fee, NEW.effective_date, 'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic franchise payment calculation
CREATE TRIGGER calculate_franchise_payments_trigger AFTER INSERT ON franchise_agreements FOR EACH ROW EXECUTE FUNCTION calculate_franchise_payments();

-- Create primary location for existing companies
INSERT INTO company_locations (company_id, location_name, address, city, state, country, is_primary, is_active)
SELECT 
    id,
    name || ' - Main Location',
    COALESCE(address, 'Address not specified'),
    COALESCE(city, 'City not specified'),
    COALESCE(state, 'State not specified'),
    COALESCE(country, 'Country not specified'),
    true,
    true
FROM companies 
WHERE id NOT IN (SELECT company_id FROM company_locations);

-- Create default tenant configuration for existing companies
INSERT INTO tenant_configurations (company_id, subdomain, feature_flags, regional_settings, is_active)
SELECT 
    id,
    LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g')),
    '{"booking_widget": true, "chat_widget": true, "reviews": true, "loyalty": true}',
    '{"currency": "USD", "timezone": "UTC", "date_format": "MM/DD/YYYY", "time_format": "12h"}',
    true
FROM companies 
WHERE id NOT IN (SELECT company_id FROM tenant_configurations); 