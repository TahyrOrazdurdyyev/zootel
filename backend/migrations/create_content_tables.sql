-- Create content management tables for Careers, Press Center, and Blog

-- Create careers table
CREATE TABLE IF NOT EXISTS careers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Full-time, Part-time, Remote, Contract
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    salary_range VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create press_releases table
CREATE TABLE IF NOT EXISTS press_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    image_id VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    image_id VARCHAR(255),
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    author_name VARCHAR(255),
    author_bio TEXT,
    author_image TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITHOUT TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_careers_active ON careers(is_active);
CREATE INDEX IF NOT EXISTS idx_careers_department ON careers(department);
CREATE INDEX IF NOT EXISTS idx_careers_type ON careers(type);

CREATE INDEX IF NOT EXISTS idx_press_releases_published ON press_releases(is_published);
CREATE INDEX IF NOT EXISTS idx_press_releases_published_at ON press_releases(published_at);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);

-- Insert sample data for careers
INSERT INTO careers (title, department, location, type, description, requirements, benefits, salary_range, is_active) VALUES
('Senior Frontend Developer', 'Engineering', 'Remote', 'Full-time', 'We are looking for a Senior Frontend Developer to join our team and help build the future of pet care technology.', 'React, TypeScript, 5+ years experience', 'Health insurance, Remote work, Stock options', '$80,000 - $120,000', true),
('Product Manager', 'Product', 'San Francisco, CA', 'Full-time', 'Lead product strategy and development for our pet care platform.', 'Product management experience, Pet industry knowledge preferred', 'Health insurance, Equity, Pet-friendly office', '$90,000 - $140,000', true),
('Customer Success Manager', 'Customer Success', 'Remote', 'Full-time', 'Help our pet care businesses succeed on the Zootel platform.', 'Customer success experience, Excellent communication skills', 'Health insurance, Remote work, Professional development', '$60,000 - $90,000', true)
ON CONFLICT DO NOTHING;

-- Insert sample data for press releases
INSERT INTO press_releases (title, subtitle, content, summary, is_published, published_at) VALUES
('Zootel Raises $5M Series A to Revolutionize Pet Care', 'Leading pet care platform secures funding to expand nationwide', 'Zootel, the leading digital platform connecting pet owners with trusted care providers, today announced it has raised $5 million in Series A funding...', 'Zootel secures Series A funding to expand its pet care marketplace platform nationwide.', true, CURRENT_TIMESTAMP - INTERVAL '30 days'),
('Zootel Launches AI-Powered Booking Assistant', 'New AI technology makes pet care booking easier than ever', 'Zootel today unveiled its revolutionary AI-powered booking assistant that helps pet owners find and book the perfect care services...', 'Zootel introduces AI booking assistant to streamline pet care appointments.', true, CURRENT_TIMESTAMP - INTERVAL '15 days'),
('Partnership with National Veterinary Association', 'Zootel partners with NVA to improve pet healthcare access', 'Zootel has announced a strategic partnership with the National Veterinary Association to improve access to quality pet healthcare...', 'Strategic partnership aims to improve pet healthcare accessibility nationwide.', true, CURRENT_TIMESTAMP - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Insert sample data for blog posts
INSERT INTO blog_posts (title, slug, content, excerpt, category, tags, author_name, author_bio, is_published, published_at) VALUES
('10 Essential Tips for New Pet Owners', '10-essential-tips-new-pet-owners', 'Bringing a new pet home is an exciting experience, but it can also be overwhelming. Here are 10 essential tips to help you get started on the right foot...', 'Essential guidance for first-time pet owners to ensure a smooth transition for both pet and family.', 'Pet Care', ARRAY['pet care', 'new owners', 'tips'], 'Dr. Sarah Johnson', 'Dr. Sarah Johnson is a veterinarian with over 10 years of experience in pet care and animal behavior.', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('How to Choose the Right Groomer for Your Pet', 'choose-right-groomer-pet', 'Finding the perfect groomer for your furry friend is crucial for their health and happiness. Here''s what you need to know...', 'A comprehensive guide to selecting the best grooming services for your pet''s specific needs.', 'Grooming', ARRAY['grooming', 'pet care', 'guide'], 'Maria Rodriguez', 'Maria Rodriguez is a certified pet groomer and owner of Paws & Claws Grooming Salon.', true, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('The Benefits of Regular Vet Checkups', 'benefits-regular-vet-checkups', 'Regular veterinary checkups are one of the most important things you can do for your pet''s health. Here''s why...', 'Learn why regular veterinary visits are essential for maintaining your pet''s long-term health and wellbeing.', 'Health', ARRAY['veterinary', 'health', 'prevention'], 'Dr. Michael Chen', 'Dr. Michael Chen is a practicing veterinarian specializing in preventive care and internal medicine.', true, CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (slug) DO NOTHING;
