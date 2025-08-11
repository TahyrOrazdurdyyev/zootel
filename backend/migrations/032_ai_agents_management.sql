-- Migration: AI Agents Management System
-- Description: Adds admin activity logging and AI agents pricing data

-- Create admin_activity_log table if not exists
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_activity_log
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_resource_type ON admin_activity_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at);

-- Insert AI Agents pricing data if not exists
INSERT INTO addon_pricing (id, addon_type, addon_key, name, description, monthly_price, yearly_price, one_time_price, is_available) VALUES
('ai_booking_assistant', 'ai_agent', 'BookingAssistant', 'Booking Assistant', 'AI assistant for managing bookings and appointments', 19.99, 199.99, 299.99, true),
('ai_customer_support', 'ai_agent', 'CustomerSupportAgent', 'Customer Support Agent', 'AI-powered customer support and chat assistance', 29.99, 299.99, 449.99, true),
('ai_reminder_followup', 'ai_agent', 'ReminderFollowUpBot', 'Reminder & Follow-up Bot', 'Automated reminders and follow-up communications', 14.99, 149.99, 199.99, true),
('ai_medical_vet', 'ai_agent', 'MedicalVetAssistant', 'Medical Vet Assistant', 'AI assistant for veterinary consultations and medical advice', 49.99, 499.99, 749.99, true),
('ai_marketing_content', 'ai_agent', 'MarketingContentGenerator', 'Marketing Content Generator', 'AI-powered marketing content and social media posts', 24.99, 249.99, 349.99, true),
('ai_upsell_crosssell', 'ai_agent', 'UpsellCrossSellAgent', 'Upsell & Cross-sell Agent', 'AI agent for sales optimization and revenue growth', 34.99, 349.99, 499.99, true),
('ai_feedback_sentiment', 'ai_agent', 'FeedbackSentimentAnalyzer', 'Feedback Sentiment Analyzer', 'AI analysis of customer feedback and sentiment', 19.99, 199.99, 299.99, true),
('ai_analytics_narrator', 'ai_agent', 'AnalyticsNarrator', 'Analytics Narrator', 'AI-powered analytics insights and reporting', 39.99, 399.99, 599.99, true)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price,
    one_time_price = EXCLUDED.one_time_price,
    is_available = EXCLUDED.is_available,
    updated_at = NOW();

-- Update existing plans to include AI agents if not already included
-- Basic plan gets booking assistant
UPDATE plans SET 
    included_ai_agents = CASE 
        WHEN included_ai_agents IS NULL OR included_ai_agents = '{}' THEN ARRAY['BookingAssistant']
        WHEN NOT ('BookingAssistant' = ANY(included_ai_agents)) THEN array_append(included_ai_agents, 'BookingAssistant')
        ELSE included_ai_agents
    END,
    ai_agent_addons = CASE 
        WHEN ai_agent_addons IS NULL OR ai_agent_addons = '{}' THEN ARRAY['CustomerSupportAgent', 'ReminderFollowUpBot', 'MarketingContentGenerator']
        ELSE ai_agent_addons
    END
WHERE name ILIKE '%basic%' OR name ILIKE '%starter%';

-- Professional plan gets booking assistant + customer support
UPDATE plans SET 
    included_ai_agents = CASE 
        WHEN included_ai_agents IS NULL OR included_ai_agents = '{}' THEN ARRAY['BookingAssistant', 'CustomerSupportAgent']
        ELSE included_ai_agents || ARRAY['BookingAssistant', 'CustomerSupportAgent']
    END,
    ai_agent_addons = CASE 
        WHEN ai_agent_addons IS NULL OR ai_agent_addons = '{}' THEN ARRAY['ReminderFollowUpBot', 'MedicalVetAssistant', 'MarketingContentGenerator', 'UpsellCrossSellAgent']
        ELSE ai_agent_addons
    END
WHERE name ILIKE '%professional%' OR name ILIKE '%pro%';

-- Business/Enterprise plan gets all agents
UPDATE plans SET 
    included_ai_agents = ARRAY['BookingAssistant', 'CustomerSupportAgent', 'ReminderFollowUpBot', 'MedicalVetAssistant', 'MarketingContentGenerator', 'UpsellCrossSellAgent', 'FeedbackSentimentAnalyzer', 'AnalyticsNarrator'],
    ai_agent_addons = ARRAY[]::TEXT[]
WHERE name ILIKE '%business%' OR name ILIKE '%enterprise%' OR name ILIKE '%premium%';

-- Add comments for clarity
COMMENT ON TABLE admin_activity_log IS 'Logs all admin actions for audit trail';
COMMENT ON COLUMN admin_activity_log.admin_id IS 'ID of the admin user who performed the action';
COMMENT ON COLUMN admin_activity_log.action IS 'Type of action performed (e.g., activate_ai_agent, deactivate_ai_agent)';
COMMENT ON COLUMN admin_activity_log.resource_type IS 'Type of resource being acted upon (e.g., company_addon, plan)';
COMMENT ON COLUMN admin_activity_log.resource_id IS 'ID of the specific resource';
COMMENT ON COLUMN admin_activity_log.details IS 'Additional details about the action in JSON format';

-- Insert sample data for testing (optional)
DO $$
DECLARE
    test_company_id UUID;
    basic_plan_id UUID;
BEGIN
    -- Get first company for testing
    SELECT id INTO test_company_id FROM companies WHERE is_active = true LIMIT 1;
    
    -- Get basic plan ID
    SELECT id INTO basic_plan_id FROM plans WHERE name ILIKE '%starter%' OR name ILIKE '%basic%' LIMIT 1;
    
    IF test_company_id IS NOT NULL AND basic_plan_id IS NOT NULL THEN
        -- Ensure test company has a plan
        UPDATE companies SET plan_id = basic_plan_id WHERE id = test_company_id AND plan_id IS NULL;
        
        -- Insert a sample addon activation (customer support agent for testing)
        INSERT INTO company_addons (
            id, company_id, addon_type, addon_key, price, billing_cycle, status,
            auto_renew, purchased_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), test_company_id, 'ai_agent', 'CustomerSupportAgent', 29.99, 'monthly', 'active',
            true, NOW(), NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$; 