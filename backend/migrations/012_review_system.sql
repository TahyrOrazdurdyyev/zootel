-- Migration 012: Review and Rating System
-- This migration adds comprehensive review and rating functionality

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    service_id UUID REFERENCES services(id),
    product_id UUID REFERENCES products(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    response TEXT, -- Company response to review
    response_date TIMESTAMP,
    is_verified BOOLEAN DEFAULT false, -- Verified purchase/booking
    is_featured BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published', -- 'pending', 'published', 'hidden', 'removed'
    moderation_notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Helpfulness Votes
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);

-- Review Reports
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL, -- 'spam', 'inappropriate', 'fake', 'off_topic', 'harassment'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    moderator_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Company Review Statistics (materialized view for performance)
CREATE TABLE IF NOT EXISTS company_review_stats (
    company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_1_count INTEGER DEFAULT 0,
    rating_2_count INTEGER DEFAULT 0,
    rating_3_count INTEGER DEFAULT 0,
    rating_4_count INTEGER DEFAULT 0,
    rating_5_count INTEGER DEFAULT 0,
    last_review_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Review Statistics
CREATE TABLE IF NOT EXISTS service_review_stats (
    service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    last_review_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Review Statistics
CREATE TABLE IF NOT EXISTS product_review_stats (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    last_review_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Templates (for companies to use as auto-responses)
CREATE TABLE IF NOT EXISTS review_response_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    template_text TEXT NOT NULL,
    category VARCHAR(50), -- 'positive', 'negative', 'neutral', 'complaint'
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Reminders (automated system to request reviews)
CREATE TABLE IF NOT EXISTS review_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    reminder_type VARCHAR(50) NOT NULL, -- 'booking_completed', 'order_delivered', 'follow_up'
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'opened', 'clicked', 'reviewed'
    email_template_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Incentives (rewards for leaving reviews)
CREATE TABLE IF NOT EXISTS review_incentives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    incentive_type VARCHAR(30) NOT NULL, -- 'discount', 'points', 'free_service', 'cash_back'
    value DECIMAL(10,2), -- Discount amount or points
    minimum_rating INTEGER DEFAULT 1,
    conditions JSONB, -- JSON conditions for eligibility
    usage_limit INTEGER, -- Per user limit
    total_budget DECIMAL(10,2), -- Total budget for incentive
    used_budget DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Incentive Claims
CREATE TABLE IF NOT EXISTS review_incentive_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incentive_id UUID NOT NULL REFERENCES review_incentives(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    claimed_value DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'redeemed', 'expired'
    expires_at TIMESTAMP,
    redeemed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Quality Scores (AI-based quality assessment)
CREATE TABLE IF NOT EXISTS review_quality_scores (
    review_id UUID PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
    authenticity_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    helpfulness_score DECIMAL(3,2) DEFAULT 0.00,
    sentiment_score DECIMAL(3,2) DEFAULT 0.00, -- -1.00 to 1.00
    language_quality_score DECIMAL(3,2) DEFAULT 0.00,
    spam_probability DECIMAL(3,2) DEFAULT 0.00,
    overall_quality_score DECIMAL(3,2) DEFAULT 0.00,
    analysis_details JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_company_rating ON reviews(company_id, rating);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reminders_scheduled_for ON review_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_review_reminders_status ON review_reminders(status);
CREATE INDEX IF NOT EXISTS idx_review_incentive_claims_user_id ON review_incentive_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_review_incentive_claims_status ON review_incentive_claims(status);

-- Update triggers
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_response_templates_updated_at BEFORE UPDATE ON review_response_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_incentives_updated_at BEFORE UPDATE ON review_incentives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update company review statistics
CREATE OR REPLACE FUNCTION update_company_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert company review stats
    INSERT INTO company_review_stats (company_id, total_reviews, average_rating, rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, last_review_date, updated_at)
    SELECT 
        NEW.company_id,
        COUNT(*),
        ROUND(AVG(rating::numeric), 2),
        COUNT(CASE WHEN rating = 1 THEN 1 END),
        COUNT(CASE WHEN rating = 2 THEN 1 END),
        COUNT(CASE WHEN rating = 3 THEN 1 END),
        COUNT(CASE WHEN rating = 4 THEN 1 END),
        COUNT(CASE WHEN rating = 5 THEN 1 END),
        MAX(created_at),
        CURRENT_TIMESTAMP
    FROM reviews 
    WHERE company_id = NEW.company_id AND status = 'published'
    ON CONFLICT (company_id) DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_1_count = EXCLUDED.rating_1_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_5_count = EXCLUDED.rating_5_count,
        last_review_date = EXCLUDED.last_review_date,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update service review statistics
CREATE OR REPLACE FUNCTION update_service_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.service_id IS NOT NULL THEN
        INSERT INTO service_review_stats (service_id, total_reviews, average_rating, last_review_date, updated_at)
        SELECT 
            NEW.service_id,
            COUNT(*),
            ROUND(AVG(rating::numeric), 2),
            MAX(created_at),
            CURRENT_TIMESTAMP
        FROM reviews 
        WHERE service_id = NEW.service_id AND status = 'published'
        ON CONFLICT (service_id) DO UPDATE SET
            total_reviews = EXCLUDED.total_reviews,
            average_rating = EXCLUDED.average_rating,
            last_review_date = EXCLUDED.last_review_date,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update product review statistics
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_id IS NOT NULL THEN
        INSERT INTO product_review_stats (product_id, total_reviews, average_rating, last_review_date, updated_at)
        SELECT 
            NEW.product_id,
            COUNT(*),
            ROUND(AVG(rating::numeric), 2),
            MAX(created_at),
            CURRENT_TIMESTAMP
        FROM reviews 
        WHERE product_id = NEW.product_id AND status = 'published'
        ON CONFLICT (product_id) DO UPDATE SET
            total_reviews = EXCLUDED.total_reviews,
            average_rating = EXCLUDED.average_rating,
            last_review_date = EXCLUDED.last_review_date,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reviews 
    SET helpful_count = (
        SELECT COUNT(*) 
        FROM review_votes 
        WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
        AND vote_type = 'helpful'
    )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic statistics updates
CREATE TRIGGER update_company_review_stats_trigger AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_company_review_stats();
CREATE TRIGGER update_service_review_stats_trigger AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_service_review_stats();
CREATE TRIGGER update_product_review_stats_trigger AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();
CREATE TRIGGER update_review_helpful_count_trigger AFTER INSERT OR DELETE ON review_votes FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- Initialize stats for existing companies
INSERT INTO company_review_stats (company_id, total_reviews, average_rating, updated_at)
SELECT id, 0, 0.00, CURRENT_TIMESTAMP FROM companies
ON CONFLICT DO NOTHING; 