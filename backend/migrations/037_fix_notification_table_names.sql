-- Fix notification table names to match code
-- The code uses notification_schedule (singular) and notification_log (singular)
-- But some migrations create notification_schedules (plural) and notification_logs (plural)

-- 1. Create notification_schedule table if it doesn't exist (or rename notification_schedules if it exists)
DO $$
BEGIN
    -- Rename notification_schedules to notification_schedule if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_schedules') THEN
        ALTER TABLE notification_schedules RENAME TO notification_schedule;
    END IF;
    
    -- Create notification_schedule if neither exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_schedule') THEN
        CREATE TABLE notification_schedule (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            scheduled_for TIMESTAMP NOT NULL,
            notification_method VARCHAR(50) DEFAULT 'email',
            payload_ser JSONB DEFAULT '{}',
            sent BOOLEAN DEFAULT false,
            sent_at TIMESTAMP,
            status VARCHAR(20) DEFAULT 'pending',
            retry_count INTEGER DEFAULT 0,
            next_retry_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_notification_schedule_user_id ON notification_schedule(user_id);
        CREATE INDEX idx_notification_schedule_sent ON notification_schedule(sent);
        CREATE INDEX idx_notification_schedule_scheduled_for ON notification_schedule(scheduled_for);
    END IF;
    
    -- Ensure notification_method column exists
    ALTER TABLE notification_schedule ADD COLUMN IF NOT EXISTS notification_method VARCHAR(50) DEFAULT 'email';
END $$;

-- 2. Rename notification_logs to notification_log if notification_logs exists and notification_log doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_logs') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_log') THEN
        ALTER TABLE notification_logs RENAME TO notification_log;
    END IF;
END $$;

