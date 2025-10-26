-- Add notification_method column to notification_schedule table
ALTER TABLE notification_schedule ADD COLUMN IF NOT EXISTS notification_method VARCHAR(50) DEFAULT 'email';

-- Update existing records to have notification_method
UPDATE notification_schedule SET notification_method = 'email' WHERE notification_method IS NULL;

