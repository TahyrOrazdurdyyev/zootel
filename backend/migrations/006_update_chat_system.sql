-- Migration 006: Update chat system
-- Add enhanced chat features, AI agents, and real-time capabilities

-- Add enhanced fields to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS chat_type VARCHAR(50) DEFAULT 'customer_support';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS ai_agent_id UUID;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES employees(id);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add enhanced fields to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create chat participants table for group chats
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    ai_agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- admin, moderator, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    CONSTRAINT chat_participants_one_participant CHECK (
        (user_id IS NOT NULL)::int + (employee_id IS NOT NULL)::int + (ai_agent_id IS NOT NULL)::int = 1
    )
);

-- Create chat templates for quick responses
CREATE TABLE IF NOT EXISTS chat_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat automation rules
CREATE TABLE IF NOT EXISTS chat_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- message_received, keyword_match, time_based, etc.
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    action_type VARCHAR(50) NOT NULL, -- send_message, assign_agent, escalate, etc.
    action_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat analytics table
CREATE TABLE IF NOT EXISTS chat_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, chat_id, date, metric_type)
);

-- Create AI agent responses tracking
CREATE TABLE IF NOT EXISTS ai_agent_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    was_helpful BOOLEAN,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat escalation tracking
CREATE TABLE IF NOT EXISTS chat_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    from_agent_type VARCHAR(20) NOT NULL, -- ai, employee
    from_agent_id UUID,
    to_agent_type VARCHAR(20) NOT NULL, -- employee, supervisor
    to_agent_id UUID,
    escalation_reason VARCHAR(100) NOT NULL,
    escalation_notes TEXT,
    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- Add chat queue management
CREATE TABLE IF NOT EXISTS chat_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_concurrent_chats INTEGER DEFAULT 5,
    auto_assign BOOLEAN DEFAULT true,
    business_hours_only BOOLEAN DEFAULT false,
    priority_weight INTEGER DEFAULT 1,
    skills_required TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employee queue assignments
CREATE TABLE IF NOT EXISTS employee_queue_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    queue_id UUID NOT NULL REFERENCES chat_queues(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    max_concurrent_chats INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, queue_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_company_status ON chats(company_id, status);
CREATE INDEX IF NOT EXISTS idx_chats_last_activity ON chats(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_chats_ai_agent ON chats(ai_agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_templates_company ON chat_templates(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_automation_company ON chat_automation_rules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_company_date ON chat_analytics(company_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_agent_responses_agent ON ai_agent_responses(ai_agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_escalations_chat ON chat_escalations(chat_id, escalated_at);

-- Update triggers
CREATE OR REPLACE FUNCTION update_chat_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_activity_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_activity_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_activity();

-- Function to auto-assign chats to available agents
CREATE OR REPLACE FUNCTION auto_assign_chat(chat_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    company_uuid UUID;
    available_employee UUID;
BEGIN
    -- Get company_id from chat
    SELECT company_id INTO company_uuid FROM chats WHERE id = chat_uuid;
    
    -- Find available employee with least active chats
    SELECT e.id INTO available_employee
    FROM employees e
    JOIN employee_queue_assignments eq ON e.id = eq.employee_id
    WHERE e.company_id = company_uuid 
    AND e.is_active = true
    AND eq.is_active = true
    AND (
        SELECT COUNT(*) 
        FROM chats c 
        WHERE c.assigned_employee_id = e.id 
        AND c.status = 'active'
    ) < eq.max_concurrent_chats
    ORDER BY (
        SELECT COUNT(*) 
        FROM chats c 
        WHERE c.assigned_employee_id = e.id 
        AND c.status = 'active'
    )
    LIMIT 1;
    
    -- Assign if available employee found
    IF available_employee IS NOT NULL THEN
        UPDATE chats 
        SET assigned_employee_id = available_employee,
            status = 'active'
        WHERE id = chat_uuid;
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ language 'plpgsql'; 