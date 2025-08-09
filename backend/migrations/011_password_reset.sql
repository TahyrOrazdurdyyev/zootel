-- Migration: 011_password_reset.sql
-- Description: Add password reset functionality

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add email verification status to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL
);

-- Create index for email verification tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired password reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired email verification tokens
    DELETE FROM email_verification_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(user_email TEXT)
RETURNS TABLE(token TEXT, user_id UUID, expires_at TIMESTAMP) AS $$
DECLARE
    target_user_id UUID;
    reset_token TEXT;
    token_expires_at TIMESTAMP;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id FROM users WHERE email = user_email AND is_active = TRUE;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found or inactive';
    END IF;
    
    -- Generate token and expiration
    reset_token := generate_secure_token(64);
    token_expires_at := CURRENT_TIMESTAMP + INTERVAL '1 hour';
    
    -- Invalidate existing tokens for this user
    UPDATE password_reset_tokens 
    SET used = TRUE, used_at = CURRENT_TIMESTAMP 
    WHERE password_reset_tokens.user_id = target_user_id AND used = FALSE;
    
    -- Insert new token
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (target_user_id, reset_token, token_expires_at);
    
    -- Return token info
    RETURN QUERY SELECT reset_token, target_user_id, token_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Function to verify and use password reset token
CREATE OR REPLACE FUNCTION verify_password_reset_token(reset_token TEXT)
RETURNS TABLE(user_id UUID, valid BOOLEAN) AS $$
DECLARE
    token_user_id UUID;
    token_valid BOOLEAN := FALSE;
BEGIN
    -- Check if token exists, is not used, and not expired
    SELECT prt.user_id INTO token_user_id
    FROM password_reset_tokens prt
    WHERE prt.token = reset_token 
        AND prt.used = FALSE 
        AND prt.expires_at > CURRENT_TIMESTAMP;
    
    IF token_user_id IS NOT NULL THEN
        token_valid := TRUE;
        
        -- Mark token as used
        UPDATE password_reset_tokens 
        SET used = TRUE, used_at = CURRENT_TIMESTAMP 
        WHERE token = reset_token;
    END IF;
    
    RETURN QUERY SELECT token_user_id, token_valid;
END;
$$ LANGUAGE plpgsql;

-- Function to create email verification token
CREATE OR REPLACE FUNCTION create_email_verification_token(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    verification_token TEXT;
    token_expires_at TIMESTAMP;
BEGIN
    -- Generate token and expiration (24 hours)
    verification_token := generate_secure_token(64);
    token_expires_at := CURRENT_TIMESTAMP + INTERVAL '24 hours';
    
    -- Invalidate existing tokens for this user
    UPDATE email_verification_tokens 
    SET used = TRUE, used_at = CURRENT_TIMESTAMP 
    WHERE user_id = target_user_id AND used = FALSE;
    
    -- Insert new token
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (target_user_id, verification_token, token_expires_at);
    
    RETURN verification_token;
END;
$$ LANGUAGE plpgsql;

-- Function to verify email with token
CREATE OR REPLACE FUNCTION verify_email_token(verification_token TEXT)
RETURNS TABLE(user_id UUID, success BOOLEAN) AS $$
DECLARE
    token_user_id UUID;
    verification_success BOOLEAN := FALSE;
BEGIN
    -- Check if token exists, is not used, and not expired
    SELECT evt.user_id INTO token_user_id
    FROM email_verification_tokens evt
    WHERE evt.token = verification_token 
        AND evt.used = FALSE 
        AND evt.expires_at > CURRENT_TIMESTAMP;
    
    IF token_user_id IS NOT NULL THEN
        verification_success := TRUE;
        
        -- Mark token as used
        UPDATE email_verification_tokens 
        SET used = TRUE, used_at = CURRENT_TIMESTAMP 
        WHERE token = verification_token;
        
        -- Mark user email as verified
        UPDATE users 
        SET email_verified = TRUE, email_verified_at = CURRENT_TIMESTAMP 
        WHERE id = token_user_id;
    END IF;
    
    RETURN QUERY SELECT token_user_id, verification_success;
END;
$$ LANGUAGE plpgsql;

-- Add audit trail for password changes
CREATE TABLE IF NOT EXISTS password_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_by VARCHAR(50) NOT NULL, -- 'user', 'admin', 'reset'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for password change history
CREATE INDEX IF NOT EXISTS idx_password_change_history_user_id ON password_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_change_history_created_at ON password_change_history(created_at);

-- Function to log password change
CREATE OR REPLACE FUNCTION log_password_change(
    target_user_id UUID,
    change_method VARCHAR(50),
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO password_change_history (user_id, changed_by, ip_address, user_agent)
    VALUES (target_user_id, change_method, client_ip, client_user_agent);
END;
$$ LANGUAGE plpgsql;

-- Create view for active password reset tokens
CREATE OR REPLACE VIEW active_password_reset_tokens AS
SELECT 
    prt.id,
    prt.user_id,
    prt.token,
    prt.expires_at,
    prt.created_at,
    u.email,
    u.username
FROM password_reset_tokens prt
JOIN users u ON prt.user_id = u.id
WHERE prt.used = FALSE 
    AND prt.expires_at > CURRENT_TIMESTAMP;

-- Create view for recent password changes
CREATE OR REPLACE VIEW recent_password_changes AS
SELECT 
    pch.id,
    pch.user_id,
    pch.changed_by,
    pch.ip_address,
    pch.user_agent,
    pch.created_at,
    u.email,
    u.username
FROM password_change_history pch
JOIN users u ON pch.user_id = u.id
WHERE pch.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY pch.created_at DESC;

-- Insert notification templates for password reset
INSERT INTO notification_templates (id, name, type, title, content, is_active) VALUES
(uuid_generate_v4(), 'password_reset_request', 'email', 'Password Reset Request', 
'Hello {{user_name}},

You have requested to reset your password for your Zootel account.

Please click the link below to reset your password:
{{reset_link}}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
Zootel Team', true),

(uuid_generate_v4(), 'password_reset_success', 'email', 'Password Successfully Reset',
'Hello {{user_name}},

Your password has been successfully reset for your Zootel account.

If you did not make this change, please contact our support team immediately.

Best regards,
Zootel Team', true),

(uuid_generate_v4(), 'email_verification', 'email', 'Verify Your Email Address',
'Hello {{user_name}},

Welcome to Zootel! Please verify your email address by clicking the link below:
{{verification_link}}

This link will expire in 24 hours.

Best regards,
Zootel Team', true)

ON CONFLICT (name) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    updated_at = CURRENT_TIMESTAMP;

-- Create scheduled task to clean up expired tokens (runs daily)
-- This will be handled by the application cron job
COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Should be called daily by application cron job to clean up expired tokens'; 