-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    flag_emoji VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_base BOOLEAN DEFAULT false,
    exchange_rate DECIMAL(15,8) DEFAULT 1.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_currencies_base ON currencies(is_base);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, flag_emoji, is_active, is_base, exchange_rate) VALUES
('USD', 'US Dollar', '$', '🇺🇸', true, true, 1.0),
('EUR', 'Euro', '€', '🇪🇺', true, false, 0.85),
('RUB', 'Russian Ruble', '₽', '🇷🇺', true, false, 75.0),
('GBP', 'British Pound', '£', '🇬🇧', true, false, 0.73),
('CAD', 'Canadian Dollar', 'C$', '🇨🇦', true, false, 1.25),
('AUD', 'Australian Dollar', 'A$', '🇦🇺', true, false, 1.35),
('JPY', 'Japanese Yen', '¥', '🇯🇵', true, false, 110.0),
('CHF', 'Swiss Franc', 'CHF', '🇨🇭', true, false, 0.92),
('CNY', 'Chinese Yuan', '¥', '🇨🇳', true, false, 6.45),
('INR', 'Indian Rupee', '₹', '🇮🇳', true, false, 74.0)
ON CONFLICT (code) DO NOTHING;
