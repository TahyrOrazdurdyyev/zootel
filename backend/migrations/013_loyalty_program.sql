-- Migration 013: Loyalty Program System
-- This migration adds comprehensive loyalty program functionality

-- Loyalty Programs (Company-specific loyalty programs)
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    program_type VARCHAR(30) NOT NULL, -- 'points', 'tiers', 'cashback', 'visits'
    is_active BOOLEAN DEFAULT true,
    points_per_dollar DECIMAL(5,2) DEFAULT 1.00, -- Points earned per dollar spent
    cashback_percentage DECIMAL(5,2) DEFAULT 0.00, -- Cashback percentage
    visit_threshold INTEGER DEFAULT 10, -- Visits needed for reward
    point_value DECIMAL(5,4) DEFAULT 0.01, -- Dollar value per point
    minimum_redemption_points INTEGER DEFAULT 100,
    points_expire_days INTEGER, -- NULL for no expiration
    auto_enroll BOOLEAN DEFAULT true,
    welcome_bonus_points INTEGER DEFAULT 0,
    referral_bonus_points INTEGER DEFAULT 0,
    birthday_bonus_points INTEGER DEFAULT 0,
    terms_and_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Loyalty Accounts
CREATE TABLE IF NOT EXISTS user_loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    total_points_earned INTEGER DEFAULT 0,
    current_points_balance INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    tier_level VARCHAR(50) DEFAULT 'bronze',
    tier_points INTEGER DEFAULT 0, -- Points toward next tier
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_visits INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, loyalty_program_id)
);

-- Points Transactions (Earning and Spending)
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_account_id UUID NOT NULL REFERENCES user_loyalty_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'earned', 'redeemed', 'expired', 'adjusted', 'bonus'
    points_amount INTEGER NOT NULL, -- Positive for earned, negative for spent
    transaction_reason VARCHAR(100) NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    reward_redemption_id UUID,
    expiration_date DATE, -- For earned points
    reference_id VARCHAR(100), -- External reference
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    tier_name VARCHAR(50) NOT NULL,
    tier_level INTEGER NOT NULL, -- 1, 2, 3, etc.
    points_required INTEGER NOT NULL,
    spending_required DECIMAL(10,2) DEFAULT 0.00,
    visits_required INTEGER DEFAULT 0,
    tier_color VARCHAR(7), -- Hex color code
    tier_benefits JSONB, -- JSON array of benefits
    points_multiplier DECIMAL(3,2) DEFAULT 1.00, -- Point earning multiplier
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    free_services JSONB, -- JSON array of free services
    priority_booking BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(loyalty_program_id, tier_level)
);

-- Rewards Catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    reward_name VARCHAR(100) NOT NULL,
    description TEXT,
    reward_type VARCHAR(30) NOT NULL, -- 'discount', 'free_service', 'free_product', 'cashback', 'gift_card'
    points_cost INTEGER NOT NULL,
    cash_value DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    applicable_services JSONB, -- JSON array of service IDs
    applicable_products JSONB, -- JSON array of product IDs
    maximum_uses INTEGER, -- Per user lifetime limit
    usage_limit_per_period INTEGER, -- Per user per period limit
    usage_period_days INTEGER, -- Period for usage limit
    minimum_tier_required VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    terms_and_conditions TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_account_id UUID NOT NULL REFERENCES user_loyalty_accounts(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    redemption_code VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'used', 'expired', 'cancelled'
    booking_id UUID REFERENCES bookings(id), -- If used for a booking
    order_id UUID REFERENCES orders(id), -- If used for an order
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Challenges/Campaigns
CREATE TABLE IF NOT EXISTS loyalty_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    challenge_name VARCHAR(100) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(30) NOT NULL, -- 'spending', 'visits', 'referrals', 'reviews', 'social_share'
    target_value INTEGER NOT NULL, -- Target amount (dollars, visits, etc.)
    reward_points INTEGER NOT NULL,
    bonus_reward_id UUID REFERENCES loyalty_rewards(id),
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    max_participants INTEGER, -- NULL for unlimited
    current_participants INTEGER DEFAULT 0,
    terms_and_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_account_id UUID NOT NULL REFERENCES user_loyalty_accounts(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES loyalty_challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    reward_claimed BOOLEAN DEFAULT false,
    reward_claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(loyalty_account_id, challenge_id)
);

-- Referral Tracking
CREATE TABLE IF NOT EXISTS loyalty_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_loyalty_account_id UUID NOT NULL REFERENCES user_loyalty_accounts(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    referrer_bonus_points INTEGER DEFAULT 0,
    referred_bonus_points INTEGER DEFAULT 0,
    referrer_points_awarded BOOLEAN DEFAULT false,
    referred_points_awarded BOOLEAN DEFAULT false,
    conversion_booking_id UUID REFERENCES bookings(id),
    conversion_order_id UUID REFERENCES orders(id),
    conversion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Program Analytics
CREATE TABLE IF NOT EXISTS loyalty_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_date DATE NOT NULL,
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(loyalty_program_id, metric_name, metric_date)
);

-- Automated Rewards (Birthday, anniversary, etc.)
CREATE TABLE IF NOT EXISTS automated_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    trigger_type VARCHAR(30) NOT NULL, -- 'birthday', 'anniversary', 'tier_upgrade', 'milestone'
    reward_type VARCHAR(30) NOT NULL,
    points_amount INTEGER DEFAULT 0,
    reward_id UUID REFERENCES loyalty_rewards(id),
    trigger_conditions JSONB, -- JSON conditions for trigger
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_company_id ON loyalty_programs(company_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_accounts_user_id ON user_loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loyalty_accounts_program_id ON user_loyalty_accounts(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_account_id ON points_transactions(loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_program_id ON loyalty_tiers(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_program_id ON loyalty_rewards(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_account_id ON reward_redemptions(loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_challenges_program_id ON loyalty_challenges(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_account_id ON user_challenge_progress(loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_referrals_referrer_id ON loyalty_referrals(referrer_loyalty_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_referrals_referred_id ON loyalty_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_analytics_program_date ON loyalty_analytics(loyalty_program_id, metric_date);

-- Update triggers
CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_loyalty_accounts_updated_at BEFORE UPDATE ON user_loyalty_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_tiers_updated_at BEFORE UPDATE ON loyalty_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_challenges_updated_at BEFORE UPDATE ON loyalty_challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_challenge_progress_updated_at BEFORE UPDATE ON user_challenge_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automated_rewards_updated_at BEFORE UPDATE ON automated_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update loyalty account balance
CREATE OR REPLACE FUNCTION update_loyalty_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_loyalty_accounts
    SET 
        current_points_balance = current_points_balance + NEW.points_amount,
        total_points_earned = CASE 
            WHEN NEW.transaction_type = 'earned' THEN total_points_earned + NEW.points_amount
            ELSE total_points_earned
        END,
        total_points_redeemed = CASE 
            WHEN NEW.transaction_type = 'redeemed' THEN total_points_redeemed + ABS(NEW.points_amount)
            ELSE total_points_redeemed
        END,
        last_activity_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.loyalty_account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update user tier
CREATE OR REPLACE FUNCTION check_tier_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    current_tier_level INTEGER;
    new_tier_record RECORD;
BEGIN
    -- Get current tier level
    SELECT COALESCE(lt.tier_level, 0) INTO current_tier_level
    FROM user_loyalty_accounts ula
    LEFT JOIN loyalty_tiers lt ON lt.loyalty_program_id = ula.loyalty_program_id 
        AND lt.tier_name = ula.tier_level
    WHERE ula.id = NEW.id;
    
    -- Find the highest tier the user qualifies for
    SELECT * INTO new_tier_record
    FROM loyalty_tiers
    WHERE loyalty_program_id = NEW.loyalty_program_id
        AND tier_level > current_tier_level
        AND (points_required <= NEW.tier_points OR points_required <= NEW.total_points_earned)
        AND (spending_required <= NEW.total_spent)
        AND (visits_required <= NEW.total_visits)
    ORDER BY tier_level DESC
    LIMIT 1;
    
    -- Update tier if qualification found
    IF new_tier_record IS NOT NULL THEN
        UPDATE user_loyalty_accounts
        SET tier_level = new_tier_record.tier_name
        WHERE id = NEW.id;
        
        -- Create tier upgrade bonus transaction
        INSERT INTO points_transactions (
            loyalty_account_id, transaction_type, points_amount, 
            transaction_reason, description
        ) VALUES (
            NEW.id, 'bonus', 100, 'tier_upgrade',
            'Bonus points for reaching ' || new_tier_record.tier_name || ' tier'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_loyalty_balance_trigger AFTER INSERT ON points_transactions FOR EACH ROW EXECUTE FUNCTION update_loyalty_balance();
CREATE TRIGGER check_tier_upgrade_trigger AFTER UPDATE ON user_loyalty_accounts FOR EACH ROW EXECUTE FUNCTION check_tier_upgrade();

-- Create default loyalty program for existing companies
INSERT INTO loyalty_programs (company_id, name, description, program_type, points_per_dollar, point_value, minimum_redemption_points)
SELECT 
    id, 
    name || ' Loyalty Program',
    'Earn points for every dollar spent and redeem for discounts and rewards.',
    'points',
    1.00,
    0.01,
    100
FROM companies
WHERE id NOT IN (SELECT company_id FROM loyalty_programs);

-- Create default tier structure for new programs
INSERT INTO loyalty_tiers (loyalty_program_id, tier_name, tier_level, points_required, tier_color, points_multiplier)
SELECT 
    lp.id,
    unnest(ARRAY['Bronze', 'Silver', 'Gold', 'Platinum']),
    unnest(ARRAY[1, 2, 3, 4]),
    unnest(ARRAY[0, 500, 1500, 3000]),
    unnest(ARRAY['#CD7F32', '#C0C0C0', '#FFD700', '#E5E4E2']),
    unnest(ARRAY[1.0, 1.2, 1.5, 2.0])
FROM loyalty_programs lp
WHERE lp.id NOT IN (SELECT loyalty_program_id FROM loyalty_tiers); 