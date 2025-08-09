-- Enhanced Payment System Migration
-- Adds commission and escrow functionality to payments

-- Update payments table to support commission and escrow
ALTER TABLE payments ADD COLUMN IF NOT EXISTS platform_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50) DEFAULT 'card';

-- Update payment_settings table to include webhook secret
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT;

-- Add trial_ends_at to companies table if not exists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_transferred_at ON payments(transferred_at);
CREATE INDEX IF NOT EXISTS idx_payments_company_status ON payments(company_id, status);
CREATE INDEX IF NOT EXISTS idx_companies_trial_ends_at ON companies(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_companies_trial_expired ON companies(trial_expired);

-- Insert default payment settings if none exist
INSERT INTO payment_settings (
    id, 
    stripe_enabled, 
    commission_enabled, 
    commission_percentage,
    stripe_publishable_key,
    stripe_secret_key,
    stripe_webhook_secret,
    created_at, 
    updated_at
)
SELECT 
    gen_random_uuid()::text,
    false,
    true,
    10.0,
    '',
    '',
    '',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM payment_settings);

-- Update existing payments to calculate platform and company amounts
UPDATE payments 
SET 
    platform_amount = amount,
    company_amount = CASE 
        WHEN (SELECT commission_enabled FROM payment_settings LIMIT 1) = true 
        THEN amount - (amount * (SELECT commission_percentage FROM payment_settings LIMIT 1) / 100.0)
        ELSE amount 
    END
WHERE platform_amount = 0.00 OR platform_amount IS NULL; 