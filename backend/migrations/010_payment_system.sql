-- Migration: 010_payment_system.sql
-- Description: Add comprehensive payment system with Stripe integration and commission handling

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'card', 'bank_transfer', 'digital_wallet', 'cash', 'crypto'
    is_active BOOLEAN DEFAULT TRUE,
    processing_fee_percentage DECIMAL(5,4) DEFAULT 0,
    processing_fee_fixed DECIMAL(10,2) DEFAULT 0,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2) DEFAULT NULL,
    supported_currencies TEXT[] DEFAULT '{"USD"}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment settings table
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_enabled BOOLEAN DEFAULT FALSE,
    stripe_publishable_key TEXT,
    stripe_secret_key TEXT,
    stripe_webhook_secret TEXT,
    commission_enabled BOOLEAN DEFAULT FALSE,
    commission_percentage DECIMAL(5,2) DEFAULT 10.00,
    commission_fixed_fee DECIMAL(10,2) DEFAULT 0.00,
    minimum_payout DECIMAL(10,2) DEFAULT 50.00,
    payout_schedule VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, bi_weekly, monthly
    default_currency VARCHAR(3) DEFAULT 'USD',
    tax_enabled BOOLEAN DEFAULT FALSE,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    refund_window_hours INTEGER DEFAULT 24,
    automatic_refunds BOOLEAN DEFAULT FALSE,
    partial_refunds_enabled BOOLEAN DEFAULT TRUE,
    late_payment_enabled BOOLEAN DEFAULT TRUE,
    grace_period_days INTEGER DEFAULT 7,
    late_fee_percentage DECIMAL(5,2) DEFAULT 5.00,
    maximum_late_fee DECIMAL(10,2) DEFAULT 100.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    commission_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed, canceled, refunded, partially_refunded
    payment_type VARCHAR(50) DEFAULT 'service', -- service, product, subscription, addon
    description TEXT,
    metadata JSONB DEFAULT '{}',
    client_secret TEXT,
    failure_reason TEXT,
    processed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    stripe_refund_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, failed, canceled
    failure_reason TEXT,
    requested_by UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create company payouts table
CREATE TABLE IF NOT EXISTS company_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stripe_transfer_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_transit, paid, failed, canceled
    description TEXT,
    failure_reason TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sales DECIMAL(10,2) NOT NULL,
    commission_deducted DECIMAL(10,2) NOT NULL,
    processing_fees DECIMAL(10,2) DEFAULT 0,
    refunds_deducted DECIMAL(10,2) DEFAULT 0,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create commission transactions table
CREATE TABLE IF NOT EXISTS commission_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- commission, processing_fee, refund, chargeback
    amount DECIMAL(10,2) NOT NULL,
    percentage_applied DECIMAL(5,2),
    fixed_fee_applied DECIMAL(10,2),
    description TEXT,
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, reversed
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription billing table
CREATE TABLE IF NOT EXISTS subscription_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, past_due, unpaid, canceled, incomplete, trialing
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly, quarterly
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    next_billing_date TIMESTAMP,
    payment_method_id UUID REFERENCES payment_methods(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_billing_id UUID REFERENCES subscription_billing(id) ON DELETE CASCADE,
    stripe_invoice_item_id VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- subscription, addon, overage, discount, tax
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    proration BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_billing_id UUID REFERENCES subscription_billing(id) ON DELETE SET NULL,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    invoice_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'draft', -- draft, open, paid, uncollectible, void
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_due DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    voided_at TIMESTAMP,
    attempt_count INTEGER DEFAULT 0,
    next_payment_attempt TIMESTAMP,
    pdf_url TEXT,
    hosted_invoice_url TEXT,
    payment_intent_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    stripe_dispute_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    reason VARCHAR(100),
    status VARCHAR(50), -- warning_needs_response, warning_under_review, warning_closed, needs_response, under_review, charge_refunded, won, lost
    evidence_due_by TIMESTAMP,
    evidence_submitted BOOLEAN DEFAULT FALSE,
    is_charge_refundable BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment methods
INSERT INTO payment_methods (id, name, type, is_active, processing_fee_percentage, processing_fee_fixed) VALUES
(uuid_generate_v4(), 'Credit Card', 'card', TRUE, 2.9, 0.30),
(uuid_generate_v4(), 'Debit Card', 'card', TRUE, 2.9, 0.30),
(uuid_generate_v4(), 'Bank Transfer', 'bank_transfer', TRUE, 0.8, 0.00),
(uuid_generate_v4(), 'Cash', 'cash', TRUE, 0.0, 0.00),
(uuid_generate_v4(), 'Apple Pay', 'digital_wallet', TRUE, 2.9, 0.30),
(uuid_generate_v4(), 'Google Pay', 'digital_wallet', TRUE, 2.9, 0.30)
ON CONFLICT (name) DO NOTHING;

-- Insert default payment settings
INSERT INTO payment_settings (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);

CREATE INDEX IF NOT EXISTS idx_company_payouts_company_id ON company_payouts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_payouts_status ON company_payouts(status);
CREATE INDEX IF NOT EXISTS idx_company_payouts_period ON company_payouts(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_payment_id ON commission_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_company_id ON commission_transactions(company_id);

CREATE INDEX IF NOT EXISTS idx_subscription_billing_company_id ON subscription_billing(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_billing_status ON subscription_billing(status);
CREATE INDEX IF NOT EXISTS idx_subscription_billing_next_billing_date ON subscription_billing(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Functions for payment processing

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    payment_amount DECIMAL,
    commission_percentage DECIMAL DEFAULT NULL,
    commission_fixed_fee DECIMAL DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
    settings_record RECORD;
    commission DECIMAL;
BEGIN
    -- Get commission settings if not provided
    IF commission_percentage IS NULL OR commission_fixed_fee IS NULL THEN
        SELECT ps.commission_percentage, ps.commission_fixed_fee 
        INTO settings_record
        FROM payment_settings ps 
        WHERE ps.commission_enabled = TRUE 
        LIMIT 1;
        
        commission_percentage := COALESCE(commission_percentage, settings_record.commission_percentage, 0);
        commission_fixed_fee := COALESCE(commission_fixed_fee, settings_record.commission_fixed_fee, 0);
    END IF;
    
    -- Calculate commission: (amount * percentage / 100) + fixed_fee
    commission := (payment_amount * commission_percentage / 100) + commission_fixed_fee;
    
    RETURN ROUND(commission, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to create commission transaction
CREATE OR REPLACE FUNCTION create_commission_transaction(
    p_payment_id UUID,
    p_company_id UUID,
    p_transaction_type VARCHAR,
    p_amount DECIMAL,
    p_percentage_applied DECIMAL DEFAULT NULL,
    p_fixed_fee_applied DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    INSERT INTO commission_transactions (
        payment_id,
        company_id,
        transaction_type,
        amount,
        percentage_applied,
        fixed_fee_applied,
        description
    ) VALUES (
        p_payment_id,
        p_company_id,
        p_transaction_type,
        p_amount,
        p_percentage_applied,
        p_fixed_fee_applied,
        'Automatic ' || p_transaction_type || ' transaction'
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status(
    p_payment_id UUID,
    p_status VARCHAR,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    payment_record RECORD;
    commission_amount DECIMAL;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record FROM payments WHERE id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update payment status
    UPDATE payments 
    SET 
        status = p_status,
        failure_reason = p_failure_reason,
        processed_at = CASE WHEN p_status = 'succeeded' THEN CURRENT_TIMESTAMP ELSE processed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    -- If payment succeeded, create commission transaction
    IF p_status = 'succeeded' AND payment_record.commission_amount > 0 THEN
        PERFORM create_commission_transaction(
            p_payment_id,
            payment_record.company_id,
            'commission',
            payment_record.commission_amount
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate company balance
CREATE OR REPLACE FUNCTION get_company_balance(p_company_id UUID)
RETURNS TABLE(
    total_sales DECIMAL,
    total_commission DECIMAL,
    total_refunds DECIMAL,
    available_balance DECIMAL,
    pending_balance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0) as total_sales,
        COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.commission_amount ELSE 0 END), 0) as total_commission,
        COALESCE(SUM(CASE WHEN pr.status = 'succeeded' THEN pr.amount ELSE 0 END), 0) as total_refunds,
        COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN (p.amount - p.commission_amount) ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN pr.status = 'succeeded' THEN pr.amount ELSE 0 END), 0) as available_balance,
        COALESCE(SUM(CASE WHEN p.status = 'processing' THEN (p.amount - p.commission_amount) ELSE 0 END), 0) as pending_balance
    FROM payments p
    LEFT JOIN payment_refunds pr ON p.id = pr.payment_id
    WHERE p.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    year_month VARCHAR;
    sequence_num INTEGER;
    invoice_num VARCHAR;
BEGIN
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'INV' || year_month || '%';
    
    invoice_num := 'INV' || year_month || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update payment timestamps
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_timestamp
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_timestamp();

-- Create views for reporting
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.company_id,
    c.name as company_name,
    p.user_id,
    u.email as user_email,
    p.amount,
    p.commission_amount,
    p.total_amount,
    p.status,
    p.payment_type,
    p.created_at,
    p.processed_at,
    pm.name as payment_method_name,
    pm.type as payment_method_type
FROM payments p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id;

CREATE OR REPLACE VIEW company_revenue_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    COUNT(p.id) as total_transactions,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN p.status = 'succeeded' THEN p.commission_amount ELSE 0 END) as total_commission,
    SUM(CASE WHEN p.status = 'succeeded' THEN (p.amount - p.commission_amount) ELSE 0 END) as net_revenue,
    AVG(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE NULL END) as avg_transaction_amount,
    MAX(p.created_at) as last_transaction_date
FROM companies c
LEFT JOIN payments p ON c.id = p.company_id
GROUP BY c.id, c.name;

-- Add constraints
ALTER TABLE payments ADD CONSTRAINT chk_payment_amount_positive CHECK (amount > 0);
ALTER TABLE payments ADD CONSTRAINT chk_total_amount_positive CHECK (total_amount > 0);
ALTER TABLE payment_refunds ADD CONSTRAINT chk_refund_amount_positive CHECK (amount > 0);
ALTER TABLE company_payouts ADD CONSTRAINT chk_payout_amount_positive CHECK (amount > 0);

-- Comment on tables
COMMENT ON TABLE payments IS 'Store all payment transactions including bookings and orders';
COMMENT ON TABLE payment_refunds IS 'Track all refund transactions';
COMMENT ON TABLE company_payouts IS 'Track payouts to companies';
COMMENT ON TABLE commission_transactions IS 'Track commission calculations and deductions';
COMMENT ON TABLE payment_settings IS 'Global payment configuration settings';
COMMENT ON TABLE subscription_billing IS 'Handle subscription billing for companies';
COMMENT ON TABLE invoices IS 'Store generated invoices';
COMMENT ON TABLE payment_disputes IS 'Track payment disputes and chargebacks'; 