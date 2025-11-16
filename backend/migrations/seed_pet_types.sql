-- Seed basic pet types if they don't exist
INSERT INTO pet_types (id, name, created_at) VALUES
(uuid_generate_v4(), 'Dog', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Cat', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Bird', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Fish', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Rabbit', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Hamster', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Guinea Pig', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Reptile', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Horse', CURRENT_TIMESTAMP),
(uuid_generate_v4(), 'Other', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;
