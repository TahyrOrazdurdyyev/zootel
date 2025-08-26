-- Migration: 034_inventory_system.sql
-- Description: Add inventory management system for retail companies

-- Add inventory fields to existing products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'piece';

-- Create inventory_transactions table for stock movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_alerts table for low stock notifications
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expiry_warning')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_company_id ON inventory_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_company_id ON inventory_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_unread ON inventory_alerts(is_read) WHERE is_read = false;

-- Create trigger to update products.updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- Create trigger to update stock after transactions
CREATE OR REPLACE FUNCTION update_product_stock_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock
    IF NEW.transaction_type = 'in' THEN
        UPDATE products 
        SET stock = stock + NEW.quantity 
        WHERE id = NEW.product_id;
    ELSIF NEW.transaction_type = 'out' THEN
        UPDATE products 
        SET stock = stock - NEW.quantity 
        WHERE id = NEW.product_id;
    ELSIF NEW.transaction_type = 'adjustment' THEN
        UPDATE products 
        SET stock = NEW.new_stock 
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_stock_after_transaction
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_after_transaction();

-- Create trigger to create alerts for low stock
CREATE OR REPLACE FUNCTION create_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is low or out
    IF NEW.stock <= NEW.low_stock_alert AND NEW.stock > 0 THEN
        INSERT INTO inventory_alerts (company_id, product_id, alert_type, message)
        VALUES (NEW.company_id, NEW.id, 'low_stock', 
                'Product "' || NEW.name || '" is running low on stock. Current stock: ' || NEW.stock || ' ' || COALESCE(NEW.unit, 'piece'));
    ELSIF NEW.stock = 0 THEN
        INSERT INTO inventory_alerts (company_id, product_id, alert_type, message)
        VALUES (NEW.company_id, NEW.id, 'out_of_stock', 
                'Product "' || NEW.name || '" is out of stock.');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_low_stock_alert
    AFTER UPDATE OF stock ON products
    FOR EACH ROW
    EXECUTE FUNCTION create_low_stock_alert();

-- Update existing products with inventory data (if any exist)
UPDATE products SET 
    cost = 20.00,
    unit = 'kg'
WHERE name LIKE '%Food%' AND cost IS NULL;

UPDATE products SET 
    cost = 8.00,
    unit = 'set'
WHERE name LIKE '%Toy%' AND cost IS NULL;

UPDATE products SET 
    cost = 12.00,
    unit = 'piece'
WHERE name LIKE '%Collar%' AND cost IS NULL;

-- Grant permissions to zootel_user
GRANT ALL PRIVILEGES ON TABLE inventory_transactions TO zootel_user;
GRANT ALL PRIVILEGES ON TABLE inventory_alerts TO zootel_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO zootel_user; 