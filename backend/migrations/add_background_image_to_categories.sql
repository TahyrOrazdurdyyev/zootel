-- Add background_image column to service_categories table
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS background_image VARCHAR(255);

-- Add updated_at column if it doesn't exist
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing categories with default background images
UPDATE service_categories SET background_image = '/images/' || LOWER(name) || '.png' WHERE background_image IS NULL OR background_image = '';

-- Add some default categories if table is empty
INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Grooming',
    'Haircut, washing, coat care',
    '✂️',
    '/images/grooming.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Grooming');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Veterinary',
    'Consultations, treatment, vaccinations',
    '🏥',
    '/images/veterinary.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Veterinary');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Boarding',
    'Pet hotels',
    '🏠',
    '/images/boarding.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Boarding');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Training',
    'Education and behavior correction',
    '🎾',
    '/images/training.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Training');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Walking',
    'Dog walks',
    '🚶',
    '/images/walking.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Walking');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    gen_random_uuid()::text,
    'Pet Sitting',
    'Home care',
    '👥',
    '/images/sitting.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Pet Sitting');
