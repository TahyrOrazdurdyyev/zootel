-- Migration 008: Analytics events and tracking
-- Add comprehensive analytics and event tracking system

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_action VARCHAR(100) NOT NULL,
    event_label VARCHAR(255),
    event_value DECIMAL(10,2),
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(20), -- desktop, mobile, tablet
    browser VARCHAR(50),
    os VARCHAR(50),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    custom_dimensions JSONB DEFAULT '{}',
    event_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conversion funnels
CREATE TABLE IF NOT EXISTS conversion_funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    funnel_name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL, -- array of step definitions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create funnel analytics
CREATE TABLE IF NOT EXISTS funnel_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID NOT NULL REFERENCES conversion_funnels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    step_index INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    conversion_value DECIMAL(10,2),
    metadata JSONB DEFAULT '{}'
);

-- Create cohort analysis tables
CREATE TABLE IF NOT EXISTS user_cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cohort_name VARCHAR(255) NOT NULL,
    cohort_date DATE NOT NULL,
    cohort_type VARCHAR(50) NOT NULL, -- registration, first_purchase, etc.
    user_count INTEGER NOT NULL DEFAULT 0,
    definition JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create retention metrics
CREATE TABLE IF NOT EXISTS retention_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cohort_id UUID NOT NULL REFERENCES user_cohorts(id) ON DELETE CASCADE,
    period_number INTEGER NOT NULL, -- 0 = initial period, 1 = first retention period, etc.
    period_date DATE NOT NULL,
    active_users INTEGER NOT NULL DEFAULT 0,
    retention_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create revenue analytics
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    period_date DATE NOT NULL,
    
    -- Revenue metrics
    gross_revenue DECIMAL(15,2) DEFAULT 0,
    net_revenue DECIMAL(15,2) DEFAULT 0,
    refunded_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Transaction metrics
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    refunded_transactions INTEGER DEFAULT 0,
    
    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    
    -- Product/Service metrics
    booking_revenue DECIMAL(15,2) DEFAULT 0,
    product_revenue DECIMAL(15,2) DEFAULT 0,
    
    -- Additional metrics
    average_order_value DECIMAL(10,2) DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    customer_lifetime_value DECIMAL(10,2) DEFAULT 0,
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, period_type, period_date)
);

-- Create user behavior patterns
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    first_observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observation_count INTEGER DEFAULT 1
);

-- Create goal tracking
CREATE TABLE IF NOT EXISTS analytics_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    goal_name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- conversion, revenue, engagement
    goal_conditions JSONB NOT NULL,
    goal_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create goal completions
CREATE TABLE IF NOT EXISTS goal_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES analytics_goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    completion_value DECIMAL(10,2),
    completion_metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create custom reports
CREATE TABLE IF NOT EXISTS custom_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    report_config JSONB NOT NULL,
    schedule_config JSONB DEFAULT '{}',
    is_scheduled BOOLEAN DEFAULT false,
    last_generated_at TIMESTAMP,
    next_generation_at TIMESTAMP,
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_company_date ON analytics_events(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_session ON analytics_events(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category_action ON analytics_events(event_category, event_action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_date ON analytics_events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_funnel_step ON funnel_analytics(funnel_id, step_index);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_user ON funnel_analytics(user_id, step_completed_at);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_company_period ON revenue_analytics(company_id, period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_user ON user_behavior_patterns(user_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_goal_completions_goal_date ON goal_completions(goal_id, completed_at);

-- Analytics aggregation functions
CREATE OR REPLACE FUNCTION calculate_conversion_rate(
    p_company_id UUID,
    p_from_event VARCHAR(100),
    p_to_event VARCHAR(100),
    p_days_back INTEGER DEFAULT 30
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
    total_from INTEGER;
    total_to INTEGER;
    conversion_rate DECIMAL(5,4);
BEGIN
    -- Count users who performed the "from" event
    SELECT COUNT(DISTINCT user_id) INTO total_from
    FROM analytics_events
    WHERE company_id = p_company_id
    AND event_name = p_from_event
    AND created_at >= CURRENT_DATE - INTERVAL '%d days'::format;
    
    -- Count users who performed both events (conversion)
    SELECT COUNT(DISTINCT ae1.user_id) INTO total_to
    FROM analytics_events ae1
    JOIN analytics_events ae2 ON ae1.user_id = ae2.user_id
    WHERE ae1.company_id = p_company_id
    AND ae1.event_name = p_from_event
    AND ae2.event_name = p_to_event
    AND ae1.created_at >= CURRENT_DATE - INTERVAL '%d days'::format
    AND ae2.created_at >= ae1.created_at;
    
    -- Calculate conversion rate
    IF total_from > 0 THEN
        conversion_rate := total_to::DECIMAL / total_from::DECIMAL;
    ELSE
        conversion_rate := 0;
    END IF;
    
    RETURN conversion_rate;
END;
$$ language 'plpgsql';

-- Function to calculate daily active users
CREATE OR REPLACE FUNCTION calculate_daily_active_users(
    p_company_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    dau_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT user_id) INTO dau_count
    FROM analytics_events
    WHERE company_id = p_company_id
    AND DATE(created_at) = p_date
    AND user_id IS NOT NULL;
    
    RETURN COALESCE(dau_count, 0);
END;
$$ language 'plpgsql';

-- Function to update revenue analytics
CREATE OR REPLACE FUNCTION update_revenue_analytics()
RETURNS void AS $$
DECLARE
    company_record RECORD;
    calc_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    FOR company_record IN SELECT id FROM companies LOOP
        -- Daily revenue analytics
        INSERT INTO revenue_analytics (
            company_id, period_type, period_date,
            gross_revenue, net_revenue, total_transactions,
            successful_transactions, booking_revenue, product_revenue
        )
        SELECT 
            company_record.id,
            'daily',
            calc_date,
            COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) +
            COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.price END), 0),
            COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount - COALESCE(o.discount_amount, 0) END), 0) +
            COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.price END), 0),
            COUNT(o.id) + COUNT(b.id),
            COUNT(CASE WHEN o.status = 'completed' THEN o.id END) + COUNT(CASE WHEN b.status = 'completed' THEN b.id END),
            COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.price END), 0),
            COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0)
        FROM companies c
        LEFT JOIN orders o ON c.id = o.company_id AND DATE(o.created_at) = calc_date
        LEFT JOIN bookings b ON c.id = b.company_id AND DATE(b.created_at) = calc_date
        WHERE c.id = company_record.id
        GROUP BY c.id
        ON CONFLICT (company_id, period_type, period_date) DO UPDATE SET
            gross_revenue = EXCLUDED.gross_revenue,
            net_revenue = EXCLUDED.net_revenue,
            total_transactions = EXCLUDED.total_transactions,
            successful_transactions = EXCLUDED.successful_transactions,
            booking_revenue = EXCLUDED.booking_revenue,
            product_revenue = EXCLUDED.product_revenue,
            calculated_at = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$ language 'plpgsql';

-- Insert default analytics goals
INSERT INTO analytics_goals (company_id, goal_name, goal_type, goal_conditions)
SELECT 
    id,
    'Booking Conversion',
    'conversion',
    '{"events": [{"name": "view_service", "step": 1}, {"name": "book_service", "step": 2}]}'
FROM companies
ON CONFLICT DO NOTHING; 