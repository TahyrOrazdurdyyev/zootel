-- Seed data for Zootel platform

-- Insert default payment settings
INSERT INTO payment_settings (id, stripe_enabled, commission_enabled, commission_percentage)
VALUES (uuid_generate_v4(), false, false, 10.0);

-- Insert default plans
INSERT INTO plans (id, name, price, features, free_trial_enabled, free_trial_days, max_employees, templates_access, demo_mode_access, included_ai_agents, ai_agent_addons) VALUES
(uuid_generate_v4(), 'Starter', 29.99, ARRAY['Basic CRM', 'Up to 5 Employees', 'Basic Analytics'], true, 14, 5, false, false, ARRAY['BookingAssistant'], ARRAY['CustomerSupportAgent', 'ReminderFollowUpBot']),
(uuid_generate_v4(), 'Professional', 79.99, ARRAY['Advanced CRM', 'Up to 20 Employees', 'Advanced Analytics', 'AI Agents'], true, 14, 20, true, true, ARRAY['BookingAssistant', 'CustomerSupportAgent', 'ReminderFollowUpBot'], ARRAY['MedicalVetAssistant', 'MarketingContentGenerator']),
(uuid_generate_v4(), 'Enterprise', 199.99, ARRAY['Full CRM Suite', 'Unlimited Employees', 'Advanced Analytics', 'All AI Agents', 'API Access'], true, 30, 999, true, true, ARRAY['BookingAssistant', 'CustomerSupportAgent', 'ReminderFollowUpBot', 'MedicalVetAssistant', 'MarketingContentGenerator', 'UpsellCrossSellAgent', 'FeedbackSentimentAnalyzer', 'AnalyticsNarrator'], ARRAY[]);

-- Insert pet types
INSERT INTO pet_types (id, name) VALUES
(uuid_generate_v4(), 'Dog'),
(uuid_generate_v4(), 'Cat'),
(uuid_generate_v4(), 'Bird'),
(uuid_generate_v4(), 'Fish'),
(uuid_generate_v4(), 'Rabbit'),
(uuid_generate_v4(), 'Hamster'),
(uuid_generate_v4(), 'Guinea Pig'),
(uuid_generate_v4(), 'Reptile'),
(uuid_generate_v4(), 'Other');

-- Insert breeds for dogs
INSERT INTO breeds (id, name, pet_type_id) 
SELECT uuid_generate_v4(), breed_name, pt.id 
FROM (VALUES 
    ('Labrador Retriever'),
    ('Golden Retriever'),
    ('German Shepherd'),
    ('Bulldog'),
    ('Poodle'),
    ('Beagle'),
    ('Rottweiler'),
    ('Yorkshire Terrier'),
    ('Dachshund'),
    ('Siberian Husky'),
    ('Boxer'),
    ('Border Collie'),
    ('Mixed Breed')
) AS breeds(breed_name)
CROSS JOIN pet_types pt
WHERE pt.name = 'Dog';

-- Insert breeds for cats
INSERT INTO breeds (id, name, pet_type_id)
SELECT uuid_generate_v4(), breed_name, pt.id
FROM (VALUES
    ('Persian'),
    ('Maine Coon'),
    ('British Shorthair'),
    ('Ragdoll'),
    ('Bengal'),
    ('Abyssinian'),
    ('Russian Blue'),
    ('Siamese'),
    ('American Shorthair'),
    ('Scottish Fold'),
    ('Sphynx'),
    ('Mixed Breed')
) AS breeds(breed_name)
CROSS JOIN pet_types pt
WHERE pt.name = 'Cat';

-- Insert service categories
INSERT INTO service_categories (id, name, icon) VALUES
(uuid_generate_v4(), 'Veterinary Services', 'medical-cross'),
(uuid_generate_v4(), 'Pet Grooming', 'scissors'),
(uuid_generate_v4(), 'Pet Boarding', 'home'),
(uuid_generate_v4(), 'Pet Training', 'graduation-cap'),
(uuid_generate_v4(), 'Pet Walking', 'walking'),
(uuid_generate_v4(), 'Pet Sitting', 'user-heart'),
(uuid_generate_v4(), 'Pet Transportation', 'truck'),
(uuid_generate_v4(), 'Pet Photography', 'camera'),
(uuid_generate_v4(), 'Pet Daycare', 'sun'),
(uuid_generate_v4(), 'Emergency Care', 'ambulance'),
(uuid_generate_v4(), 'Pet Supplies', 'shopping-bag'),
(uuid_generate_v4(), 'Pet Food', 'utensils');

-- Insert default AI agent prompts (these will be used as templates)
-- Note: These are stored separately and will be copied to companies when they subscribe to plans

-- Demo data (only if demo mode is enabled)
-- This would typically be inserted by a separate demo data script
-- when demo_mode_access is granted to a company 