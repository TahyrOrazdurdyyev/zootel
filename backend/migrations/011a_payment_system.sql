-- Migration 011: Advanced Payment System
-- This migration adds comprehensive payment processing, billing, and financial management

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'card', 'bank_account', 'paypal', 'apple_pay', 'google_pay'
    provider VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'square'
    provider_payment_method_id VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    card_brand VARCHAR(20), -- visa, mastercard, etc.
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    bank_account_last4 VARCHAR(4),
    bank_routing_number VARCHAR(20),
    billing_address JSONB,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Intents (Stripe-style)
CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) NOT NULL, -- requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded
    payment_method_id UUID REFERENCES payment_methods(id),
    confirmation_method VARCHAR(20) DEFAULT 'automatic',
    capture_method VARCHAR(20) DEFAULT 'automatic',
    client_secret VARCHAR(255),
    receipt_email VARCHAR(255),
    description TEXT,
    metadata JSONB,
    last_payment_error JSONB,
    next_action JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions (actual payments)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID REFERENCES payment_intents(id),
    stripe_charge_id VARCHAR(255) UNIQUE,
    type VARCHAR(20) NOT NULL, -- 'payment', 'refund', 'dispute', 'transfer'
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) NOT NULL, -- pending, succeeded, failed, canceled
    payment_method_id UUID REFERENCES payment_methods(id),
    fee_amount INTEGER DEFAULT 0,
    net_amount INTEGER,
    failure_code VARCHAR(50),
    failure_message TEXT,
    receipt_url VARCHAR(500),
    refunded_amount INTEGER DEFAULT 0,
    disputed BOOLEAN DEFAULT false,
    metadata JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    stripe_refund_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    reason VARCHAR(50), -- 'duplicate', 'fraudulent', 'requested_by_customer'
    status VARCHAR(20) NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled'
    failure_reason VARCHAR(100),
    receipt_number VARCHAR(100),
    metadata JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payouts (for companies)
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    stripe_payout_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    method VARCHAR(20) DEFAULT 'standard', -- 'standard', 'instant'
    status VARCHAR(20) NOT NULL, -- 'paid', 'pending', 'in_transit', 'canceled', 'failed'
    type VARCHAR(20) DEFAULT 'bank_account',
    failure_code VARCHAR(50),
    failure_message TEXT,
    arrival_date DATE,
    description TEXT,
    statement_descriptor VARCHAR(22),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'open', 'paid', 'void', 'uncollectible'
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax_amount INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    amount_paid INTEGER DEFAULT 0,
    amount_due INTEGER DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0.00,
    description TEXT,
    due_date DATE,
    paid_at TIMESTAMP,
    billing_address JSONB,
    shipping_address JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    service_id UUID REFERENCES services(id),
    product_id UUID REFERENCES products(id),
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_amount INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Plans (for companies)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    stripe_price_id VARCHAR(255) UNIQUE,
    currency VARCHAR(3) DEFAULT 'USD',
    amount INTEGER NOT NULL, -- in cents
    interval_type VARCHAR(20) NOT NULL, -- 'month', 'year'
    interval_count INTEGER DEFAULT 1,
    trial_period_days INTEGER DEFAULT 0,
    features JSONB,
    max_employees INTEGER,
    max_services INTEGER,
    max_bookings_per_month INTEGER,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Subscriptions
CREATE TABLE IF NOT EXISTS company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL, -- 'trialing', 'active', 'incomplete', 'incomplete_expired', 'past_due', 'canceled', 'unpaid'
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    canceled_at TIMESTAMP,
    ended_at TIMESTAMP,
    latest_invoice_id UUID REFERENCES invoices(id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Commissions
CREATE TABLE IF NOT EXISTS platform_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    commission_rate DECIMAL(5,2) NOT NULL,
    gross_amount INTEGER NOT NULL,
    commission_amount INTEGER NOT NULL,
    net_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'collected', 'refunded'
    collected_at TIMESTAMP,
    payout_id UUID REFERENCES payouts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discount Codes
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id), -- NULL for platform-wide codes
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
    value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    minimum_amount INTEGER, -- minimum order amount in cents
    maximum_amount INTEGER, -- maximum discount amount in cents
    usage_limit INTEGER, -- NULL for unlimited
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    applicable_to VARCHAR(20) DEFAULT 'all', -- 'all', 'services', 'products', 'bookings'
    restrictions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, company_id)
);

-- Discount Usage Tracking
CREATE TABLE IF NOT EXISTS discount_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    invoice_id UUID REFERENCES invoices(id),
    discount_amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_intents_company_id ON payment_intents(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_intent_id ON payment_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_transaction_id ON refunds(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payouts_company_id ON payouts(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_platform_commissions_company_id ON platform_commissions(company_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_usage_discount_code_id ON discount_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user_id ON discount_usage(user_id);

-- Update triggers
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON company_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default subscription plans
INSERT INTO subscription_plans (name, description, amount, interval_type, features, max_employees, max_services, max_bookings_per_month, commission_rate) VALUES
('Starter', 'Perfect for small pet care businesses just getting started', 2900, 'month', '{"basic_booking": true, "basic_chat": true, "basic_analytics": true}', 2, 10, 50, 8.00),
('Professional', 'Ideal for growing pet care businesses', 5900, 'month', '{"advanced_booking": true, "ai_chat": true, "advanced_analytics": true, "website_integration": true}', 10, 50, 200, 6.00),
('Enterprise', 'For large pet care operations', 9900, 'month', '{"unlimited_booking": true, "priority_support": true, "custom_integrations": true, "white_label": true}', 50, 500, 1000, 4.00)
ON CONFLICT DO NOTHING; 