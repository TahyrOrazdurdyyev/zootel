-- Migration 003: Update notification system
-- Add notification preferences and enhanced notification scheduling

-- Add notification preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_verified BOOLEAN DEFAULT false;

-- Create notification_schedules table (moved from later migration)
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    notify_at TIMESTAMP NOT NULL,
    type VARCHAR(100) NOT NULL,
    payload TEXT,
    sent BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,
    notification_method VARCHAR(50) DEFAULT 'email',
    template_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- email, sms, push
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES notification_schedules(id) ON DELETE SET NULL,
    template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL,
    method VARCHAR(50) NOT NULL, -- email, sms, push
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, delivered
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_notify_at ON notification_schedules(notify_at);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_sent ON notification_schedules(sent);

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject, content, variables) VALUES
('booking_confirmation', 'email', 'Booking Confirmation - {{service_name}}', 
 'Dear {{user_name}}, your booking for {{service_name}} on {{booking_date}} has been confirmed.', 
 '["user_name", "service_name", "booking_date", "company_name"]'),
('booking_reminder', 'email', 'Upcoming Appointment Reminder', 
 'Hi {{user_name}}, this is a reminder for your appointment tomorrow at {{booking_time}}.', 
 '["user_name", "booking_time", "service_name"]'),
('payment_confirmation', 'email', 'Payment Received', 
 'Thank you {{user_name}}! We have received your payment of ${{amount}} for {{service_name}}.', 
 '["user_name", "amount", "service_name"]')
ON CONFLICT DO NOTHING;

-- Update trigger for notification_schedules
CREATE OR REPLACE FUNCTION update_notification_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_schedules_updated_at
    BEFORE UPDATE ON notification_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_schedules_updated_at(); 