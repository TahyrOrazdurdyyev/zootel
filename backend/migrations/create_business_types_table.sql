-- Create business_types table
CREATE TABLE IF NOT EXISTS business_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_business_types_active ON business_types(is_active);
CREATE INDEX IF NOT EXISTS idx_business_types_sort_order ON business_types(sort_order);

-- Insert initial business types data
INSERT INTO business_types (name, description, is_active, sort_order) VALUES
('Veterinary Clinic', 'Medical services for animals', true, 1),
('Grooming Salon', 'Pet grooming and beauty services', true, 2),
('Pet Hotel', 'Temporary pet accommodation', true, 3),
('Pet Training', 'Training and behavior modification', true, 4),
('Dog Walking', 'Dog walking services', true, 5),
('Pet Sitting', 'Pet care at home', true, 6),
('Pet Transportation', 'Pet transportation services', true, 7),
('Pet Store', 'Pet products and supplies', true, 8),
('General Services', 'Comprehensive pet services', true, 9)
ON CONFLICT (name) DO NOTHING;
