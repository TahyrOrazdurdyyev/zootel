-- Update plans table structure
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrate existing price to monthly_price if exists
UPDATE plans SET monthly_price = price WHERE monthly_price = 0 AND price > 0;

-- Make old price column nullable (remove NOT NULL constraint)
ALTER TABLE plans ALTER COLUMN price DROP NOT NULL;

-- Create addon_pricing table
CREATE TABLE IF NOT EXISTS addon_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    addon_type VARCHAR(50) NOT NULL,
    addon_key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) DEFAULT 0,
    yearly_price DECIMAL(10,2) DEFAULT 0,
    one_time_price DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addon_pricing_type ON addon_pricing(addon_type);
CREATE INDEX IF NOT EXISTS idx_addon_pricing_available ON addon_pricing(is_available);

-- Insert sample addon pricing data
INSERT INTO addon_pricing (addon_type, addon_key, name, description, monthly_price, yearly_price, is_available) VALUES
('ai_agent', 'booking_assistant', 'Booking Assistant', 'AI agent for automated booking management', 29.99, 299.99, true),
('ai_agent', 'customer_support', 'Customer Support Agent', 'AI agent for customer service', 39.99, 399.99, true),
('ai_agent', 'reminder_bot', 'Reminder Follow-up Bot', 'Automated reminder and follow-up system', 19.99, 199.99, true),
('extra_employee', 'additional_user', 'Additional Employee', 'Extra employee access to the system', 9.99, 99.99, true),
('crm_feature', 'advanced_analytics', 'Advanced Analytics', 'Enhanced reporting and analytics features', 49.99, 499.99, true)
ON CONFLICT DO NOTHING;
