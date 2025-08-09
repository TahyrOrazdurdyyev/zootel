-- Migration 018: Fix model fields
-- Add missing fields to User and Service tables

-- Add Role field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'pet_owner';

-- Add missing fields to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_id VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS pet_types TEXT[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS available_days TEXT[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE services ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE services ADD COLUMN IF NOT EXISTS assigned_employees TEXT[];
ALTER TABLE services ADD COLUMN IF NOT EXISTS max_bookings_per_slot INTEGER DEFAULT 1;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_time_before INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_time_after INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS advance_booking_days INTEGER DEFAULT 30;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Update existing users to have proper roles
UPDATE users SET role = 'pet_owner' WHERE role IS NULL OR role = '';

-- Create index on user role for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create indexes on service fields for performance
CREATE INDEX IF NOT EXISTS idx_services_pet_types ON services USING GIN(pet_types);
CREATE INDEX IF NOT EXISTS idx_services_available_days ON services USING GIN(available_days); 