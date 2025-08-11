-- Add subscription-related fields to companies table

-- Add subscription fields if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_subscription_expires_at ON companies(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscription_status);

-- Update existing companies to have trial status
UPDATE companies 
SET subscription_status = 'trial' 
WHERE subscription_status IS NULL OR subscription_status = '';

-- Add constraint for subscription_status
ALTER TABLE companies ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('trial', 'active', 'expired', 'canceled', 'suspended')); 