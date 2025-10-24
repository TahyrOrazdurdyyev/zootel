-- Create crypto payments tables
CREATE TABLE IF NOT EXISTS crypto_currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    icon VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    min_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
    max_amount DECIMAL(18, 8) NOT NULL DEFAULT 999999999,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crypto_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code VARCHAR(10) NOT NULL REFERENCES crypto_currencies(code) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    min_amount DECIMAL(18, 8) NOT NULL DEFAULT 0,
    max_amount DECIMAL(18, 8) NOT NULL DEFAULT 999999999,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(currency_code, code)
);

CREATE TABLE IF NOT EXISTS crypto_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id VARCHAR(255) NOT NULL UNIQUE, -- NowPayments payment ID
    currency VARCHAR(10) NOT NULL,
    network VARCHAR(50) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    address VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- new, confirming, confirmed, expired, failed
    transaction_hash VARCHAR(255),
    qr_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crypto_currencies_code ON crypto_currencies (code);
CREATE INDEX IF NOT EXISTS idx_crypto_currencies_is_active ON crypto_currencies (is_active);
CREATE INDEX IF NOT EXISTS idx_crypto_networks_currency_code ON crypto_networks (currency_code);
CREATE INDEX IF NOT EXISTS idx_crypto_networks_is_active ON crypto_networks (is_active);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_order_id ON crypto_payments (order_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_payment_id ON crypto_payments (payment_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments (status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_created_at ON crypto_payments (created_at);

-- Insert popular crypto currencies
INSERT INTO crypto_currencies (code, name, symbol, icon, is_active, min_amount, max_amount) VALUES
('BTC', 'Bitcoin', '₿', 'https://nowpayments.io/images/coins/BTC.svg', true, 0.0001, 10),
('ETH', 'Ethereum', 'Ξ', 'https://nowpayments.io/images/coins/ETH.svg', true, 0.001, 100),
('USDT', 'Tether', '₮', 'https://nowpayments.io/images/coins/USDT.svg', true, 1, 100000),
('USDC', 'USD Coin', '◊', 'https://nowpayments.io/images/coins/USDC.svg', true, 1, 100000),
('BNB', 'Binance Coin', 'BNB', 'https://nowpayments.io/images/coins/BNB.svg', true, 0.01, 1000),
('ADA', 'Cardano', '₳', 'https://nowpayments.io/images/coins/ADA.svg', true, 1, 100000),
('SOL', 'Solana', '◎', 'https://nowpayments.io/images/coins/SOL.svg', true, 0.01, 1000),
('MATIC', 'Polygon', '⬟', 'https://nowpayments.io/images/coins/MATIC.svg', true, 1, 100000),
('DOT', 'Polkadot', '●', 'https://nowpayments.io/images/coins/DOT.svg', true, 0.1, 10000),
('AVAX', 'Avalanche', '🔺', 'https://nowpayments.io/images/coins/AVAX.svg', true, 0.1, 10000)
ON CONFLICT (code) DO NOTHING;

-- Insert networks for each currency
INSERT INTO crypto_networks (currency_code, name, code, is_active, min_amount, max_amount) VALUES
-- Bitcoin networks
('BTC', 'Bitcoin', 'bitcoin', true, 0.0001, 10),
-- Ethereum networks
('ETH', 'Ethereum', 'ethereum', true, 0.001, 100),
('USDT', 'Ethereum', 'ethereum', true, 1, 100000),
('USDC', 'Ethereum', 'ethereum', true, 1, 100000),
-- Polygon networks
('USDT', 'Polygon', 'polygon', true, 1, 100000),
('USDC', 'Polygon', 'polygon', true, 1, 100000),
('MATIC', 'Polygon', 'polygon', true, 1, 100000),
-- Binance Smart Chain
('BNB', 'Binance Smart Chain', 'bsc', true, 0.01, 1000),
('USDT', 'Binance Smart Chain', 'bsc', true, 1, 100000),
('USDC', 'Binance Smart Chain', 'bsc', true, 1, 100000),
-- Cardano
('ADA', 'Cardano', 'cardano', true, 1, 100000),
-- Solana
('SOL', 'Solana', 'solana', true, 0.01, 1000),
('USDT', 'Solana', 'solana', true, 1, 100000),
('USDC', 'Solana', 'solana', true, 1, 100000),
-- Polkadot
('DOT', 'Polkadot', 'polkadot', true, 0.1, 10000),
-- Avalanche
('AVAX', 'Avalanche', 'avalanche', true, 0.1, 10000),
('USDT', 'Avalanche', 'avalanche', true, 1, 100000),
('USDC', 'Avalanche', 'avalanche', true, 1, 100000)
ON CONFLICT (currency_code, code) DO NOTHING;

-- Add payment method to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_payment_id UUID REFERENCES crypto_payments(id);

-- Create index on payment method
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders (payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_crypto_payment_id ON orders (crypto_payment_id);
