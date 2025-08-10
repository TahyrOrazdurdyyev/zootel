-- Migration: Add discount fields to services table
-- Created: 2024-01-01

-- Add discount fields to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMP;
ALTER TABLE services ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP;

-- Add constraints
ALTER TABLE services ADD CONSTRAINT check_discount_percentage 
    CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));

ALTER TABLE services ADD CONSTRAINT check_original_price 
    CHECK (original_price IS NULL OR original_price > 0);

ALTER TABLE services ADD CONSTRAINT check_sale_dates 
    CHECK (sale_start_date IS NULL OR sale_end_date IS NULL OR sale_start_date < sale_end_date);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_is_on_sale ON services(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_services_sale_end_date ON services(sale_end_date);

-- Update existing services to set is_on_sale = FALSE by default
UPDATE services SET is_on_sale = FALSE WHERE is_on_sale IS NULL; 