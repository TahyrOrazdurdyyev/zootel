-- Migration: Product Variants System
-- Add product variants support (size, color, weight, flavor, etc.)

-- Add additional fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS nutritional_info JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_wholesale_quantity INTEGER DEFAULT 1;

-- Create product variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    attributes JSONB NOT NULL DEFAULT '{}', -- {size: "L", color: "red", weight: "500g"}
    price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    low_stock_alert INTEGER DEFAULT 5,
    image_url TEXT,
    image_gallery TEXT[],
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product attributes table for managing available attributes
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- size, color, weight, flavor
    display_name VARCHAR(255) NOT NULL,
    attribute_type VARCHAR(50) NOT NULL, -- select, multi-select, text, number
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product attribute values table
CREATE TABLE IF NOT EXISTS product_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    display_value VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create delivery methods table
CREATE TABLE IF NOT EXISTS delivery_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    method_type VARCHAR(50) NOT NULL, -- courier, pickup_point, self_pickup
    base_price DECIMAL(10,2) DEFAULT 0,
    price_per_km DECIMAL(10,2) DEFAULT 0,
    free_delivery_threshold DECIMAL(10,2),
    estimated_delivery_days INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    availability_zones JSONB DEFAULT '[]',
    working_hours JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create price tiers table for quantity-based pricing
CREATE TABLE IF NOT EXISTS price_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL,
    max_quantity INTEGER,
    price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2),
    tier_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add order delivery tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method_id UUID REFERENCES delivery_methods(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Create customer segments table
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    segment_type VARCHAR(50) NOT NULL, -- activity, purchase_volume, pet_type, loyalty
    criteria JSONB NOT NULL, -- {min_orders: 5, min_amount: 1000}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customer segment assignments
CREATE TABLE IF NOT EXISTS customer_segment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_assigned BOOLEAN DEFAULT true,
    UNIQUE(user_id, segment_id)
);

-- Create marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- abandoned_cart, product_reminder, cross_sell
    target_segments JSONB DEFAULT '[]',
    template_id UUID,
    trigger_conditions JSONB,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create marketing events tracking
CREATE TABLE IF NOT EXISTS marketing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- sent, opened, clicked, converted
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order history for repeat orders
CREATE TABLE IF NOT EXISTS order_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    items JSONB NOT NULL, -- [{product_id, variant_id, quantity}]
    created_from_order_id UUID REFERENCES orders(id),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default product attributes
INSERT INTO product_attributes (name, display_name, attribute_type, is_required, sort_order) VALUES
('size', 'Size', 'select', false, 1),
('color', 'Color', 'select', false, 2),
('weight', 'Weight', 'select', false, 3),
('flavor', 'Flavor', 'select', false, 4),
('age_group', 'Age Group', 'select', false, 5),
('material', 'Material', 'select', false, 6);

-- Insert default attribute values
INSERT INTO product_attribute_values (attribute_id, value, display_value, sort_order) 
SELECT id, 'xs', 'Extra Small', 1 FROM product_attributes WHERE name = 'size'
UNION ALL
SELECT id, 's', 'Small', 2 FROM product_attributes WHERE name = 'size'
UNION ALL
SELECT id, 'm', 'Medium', 3 FROM product_attributes WHERE name = 'size'
UNION ALL
SELECT id, 'l', 'Large', 4 FROM product_attributes WHERE name = 'size'
UNION ALL
SELECT id, 'xl', 'Extra Large', 5 FROM product_attributes WHERE name = 'size';

-- Insert default delivery methods (global)
INSERT INTO delivery_methods (name, description, method_type, base_price, estimated_delivery_days) VALUES
('Standard Delivery', 'Delivery within 3-5 business days', 'courier', 5.99, 4),
('Express Delivery', 'Next day delivery', 'courier', 12.99, 1),
('Pickup Point', 'Collect from nearest pickup point', 'pickup_point', 2.99, 2),
('Store Pickup', 'Collect from store', 'self_pickup', 0.00, 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_attribute_values_attribute_id ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_price_tiers_product_id ON price_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_price_tiers_variant_id ON price_tiers(variant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_methods_company_id ON delivery_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_customer_segment_assignments_user_id ON customer_segment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_company_id ON marketing_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_campaign_id ON marketing_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_order_templates_user_id ON order_templates(user_id); 