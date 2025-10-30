-- Add missing columns to service_categories table
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS background_image VARCHAR(255);
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing categories with default background images
UPDATE service_categories SET background_image = '/images/' || LOWER(name) || '.png' WHERE background_image IS NULL OR background_image = '';

-- Add some default categories if table is empty (without description first)
INSERT INTO service_categories (id, name, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Grooming',
    '✂️',
    '/images/grooming.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Grooming');

INSERT INTO service_categories (id, name, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Veterinary',
    '🏥',
    '/images/veterinary.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Veterinary');

INSERT INTO service_categories (id, name, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Boarding',
    '🏠',
    '/images/boarding.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Boarding');

INSERT INTO service_categories (id, name, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Training',
    '🎾',
    '/images/training.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Training');

INSERT INTO service_categories (id, name, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Walking',
    '🚶',
    '/images/walking.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Walking');

INSERT INTO service_categories (id, name, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Pet Sitting',
    '👥',
    '/images/sitting.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Pet Sitting');

-- Now update descriptions for existing categories
UPDATE service_categories SET description = 'Haircut, washing, coat care' WHERE name = 'Grooming';
UPDATE service_categories SET description = 'Consultations, treatment, vaccinations' WHERE name = 'Veterinary';
UPDATE service_categories SET description = 'Pet hotels' WHERE name = 'Boarding';
UPDATE service_categories SET description = 'Education and behavior correction' WHERE name = 'Training';
UPDATE service_categories SET description = 'Dog walks' WHERE name = 'Walking';
UPDATE service_categories SET description = 'Home care' WHERE name = 'Pet Sitting';
