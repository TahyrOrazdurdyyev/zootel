-- Add description column to service_categories table
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Add some default categories if table is empty
INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    uuid_generate_v4(),
    'Grooming',
    'Haircut, washing, coat care',
    '✂️',
    '/images/grooming.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Grooming');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    uuid_generate_v4(),
    'Veterinary',
    'Consultations, treatment, vaccinations',
    '🏥',
    '/images/veterinary.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Veterinary');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    uuid_generate_v4(),
    'Boarding',
    'Pet hotels',
    '🏠',
    '/images/boarding.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Boarding');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    uuid_generate_v4(),
    'Training',
    'Education and behavior correction',
    '🎾',
    '/images/training.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Training');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    uuid_generate_v4(),
    'Walking',
    'Dog walks',
    '🚶',
    '/images/walking.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Walking');

INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) 
SELECT 
    uuid_generate_v4(),
    'Pet Sitting',
    'Home care',
    '👥',
    '/images/sitting.png',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE name = 'Pet Sitting');
