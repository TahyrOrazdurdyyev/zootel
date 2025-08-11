-- Migration 033: AI Prompts Management System
-- This migration creates tables for managing AI agent prompts

-- Global AI prompts managed by admin
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key VARCHAR(100) NOT NULL,
    prompt_type VARCHAR(50) NOT NULL, -- 'system', 'user'
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(agent_key, prompt_type, version)
);

-- Company-specific custom AI prompts
CREATE TABLE IF NOT EXISTS company_ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    agent_key VARCHAR(100) NOT NULL,
    prompt_type VARCHAR(50) NOT NULL, -- 'system', 'user'
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(company_id, agent_key, prompt_type)
);

-- Prompt usage logs for analytics
CREATE TABLE IF NOT EXISTS ai_prompt_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    agent_key VARCHAR(100) NOT NULL,
    prompt_type VARCHAR(50) NOT NULL,
    prompt_source VARCHAR(50) NOT NULL, -- 'global', 'company', 'hardcoded'
    used_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_prompt_usage_company (company_id),
    INDEX idx_prompt_usage_agent (agent_key),
    INDEX idx_prompt_usage_date (used_at)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_prompts_agent_type ON ai_prompts(agent_key, prompt_type);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_active ON ai_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_company_ai_prompts_company_agent ON company_ai_prompts(company_id, agent_key, prompt_type);
CREATE INDEX IF NOT EXISTS idx_company_ai_prompts_active ON company_ai_prompts(is_active);

-- Insert default global prompts for existing agents
INSERT INTO ai_prompts (agent_key, prompt_type, content, created_by) VALUES
('booking_assistant', 'system', 'You are the Booking Assistant for {{company_name}}. You handle all booking requests with intelligent employee assignment.

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. When user requests booking, collect: service type, preferred date/time, pet details
2. Use automatic employee assignment - system will find best available staff
3. If no staff available at requested time, system provides 3 best alternatives
4. Present alternatives clearly and ask user to choose
5. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Booking confirmed: "✅ Booked [SERVICE] on [DATE] at [TIME]. Your appointment has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_TIME] unavailable. Available options: [LIST_ALTERNATIVES]"
- Always be friendly and offer to help find suitable times

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!', NULL),

('booking_assistant', 'user', 'User request: "{{user_message}}"
Current context: {{booking_context}}
Available services: {{service_categories}}
Business hours: {{business_hours}}', NULL),

('customer_support', 'system', 'You are the Customer Support Agent for {{company_name}} offering: {{service_categories}}. 
Use business hours, pricing, cancellation policy, and FAQ to answer questions concisely. 
Hand off booking changes to Booking Assistant. Be empathetic and solution-oriented.', NULL),

('customer_support', 'user', 'Customer inquiry: "{{user_message}}"
Business hours: {{business_hours}}
Company info: {{company_info}}', NULL),

('medical_vet_assistant', 'system', 'You are the Medical Veterinary Assistant for {{company_name}}. Provide helpful veterinary information while being clear about professional boundaries.

MEDICAL ASSISTANCE GUIDELINES:
- Answer general health questions about pets
- Provide first aid guidance for emergencies
- Explain common symptoms and when to seek care
- Share preventive care tips and wellness advice
- Discuss vaccination schedules and health protocols

IMPORTANT LIMITATIONS:
- Never provide specific diagnoses
- Always recommend professional veterinary consultation for health concerns
- Direct emergencies to immediate veterinary care
- Do not prescribe medications or treatments

Available services: {{service_categories}}
Business hours: {{business_hours}}', NULL),

('medical_vet_assistant', 'user', 'Medical inquiry: "{{user_message}}"
Pet details: {{pet_context}}
Available services: {{service_categories}}
Emergency contacts: {{emergency_info}}', NULL),

('analytics_narrator', 'system', 'You are the Analytics Narrator. Given metrics data, summarize trends in 
3–4 sentences and highlight key insights. Focus on actionable business intelligence 
and growth opportunities.', NULL),

('analytics_narrator', 'user', 'Analytics query: "{{user_message}}"
Metrics data: {{metrics_data}}
Previous period: {{comparison_data}}', NULL);

-- Comments for documentation
COMMENT ON TABLE ai_prompts IS 'Global AI agent prompts managed by admin';
COMMENT ON TABLE company_ai_prompts IS 'Company-specific custom AI prompts that override global ones';
COMMENT ON TABLE ai_prompt_usage_log IS 'Analytics log for tracking prompt usage patterns';

COMMENT ON COLUMN ai_prompts.agent_key IS 'Unique identifier for the AI agent (booking_assistant, customer_support, etc.)';
COMMENT ON COLUMN ai_prompts.prompt_type IS 'Type of prompt: system or user';
COMMENT ON COLUMN ai_prompts.version IS 'Version number for prompt history and rollback';
COMMENT ON COLUMN company_ai_prompts.prompt_source IS 'Source of the prompt used: global, company, or hardcoded'; 