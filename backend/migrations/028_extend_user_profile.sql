-- Migration 028: Extend user profile with additional fields
-- Add detailed address, emergency contacts, vet contacts, and notification preferences

-- Add detailed address fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS apartment_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Add detailed emergency contact fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(100);

-- Add detailed veterinarian contact fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS vet_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vet_clinic VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vet_phone VARCHAR(50);

-- Add detailed notification preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_push BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_sms BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_postal_code ON users(postal_code);
CREATE INDEX IF NOT EXISTS idx_users_emergency_contact_phone ON users(emergency_contact_phone);
CREATE INDEX IF NOT EXISTS idx_users_vet_phone ON users(vet_phone);

-- Add comments for new fields
COMMENT ON COLUMN users.apartment_number IS 'Apartment/unit number for detailed address';
COMMENT ON COLUMN users.postal_code IS 'Postal/ZIP code for user address';
COMMENT ON COLUMN users.emergency_contact_name IS 'Full name of emergency contact person';
COMMENT ON COLUMN users.emergency_contact_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN users.emergency_contact_relation IS 'Relationship to emergency contact (family, friend, etc.)';
COMMENT ON COLUMN users.vet_name IS 'Name of primary veterinarian';
COMMENT ON COLUMN users.vet_clinic IS 'Name of veterinary clinic';
COMMENT ON COLUMN users.vet_phone IS 'Phone number of veterinarian/clinic';
COMMENT ON COLUMN users.notifications_push IS 'Enable push notifications';
COMMENT ON COLUMN users.notifications_sms IS 'Enable SMS notifications';
COMMENT ON COLUMN users.notifications_email IS 'Enable email notifications'; 