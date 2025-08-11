-- Migration: Review System
-- Description: Creates tables for customer reviews and ratings

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_company_status_created ON reviews(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_company_rating ON reviews(company_id, rating);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Add constraints to ensure logical consistency
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_or_order_check 
    CHECK (
        (booking_id IS NOT NULL AND order_id IS NULL) OR
        (booking_id IS NULL AND order_id IS NOT NULL) OR
        (booking_id IS NULL AND order_id IS NULL)
    );

-- Add constraint to ensure user can only review if they have a booking/order
-- This will be enforced at application level for better error handling

-- Add some sample data for testing (optional)
INSERT INTO reviews (user_id, company_id, service_id, rating, comment, status) 
SELECT 
    u.id as user_id,
    c.id as company_id,
    s.id as service_id,
    4 as rating,
    'Отличный сервис, очень довольны!' as comment,
    'approved' as status
FROM users u, companies c, services s 
WHERE u.role = 'pet_owner' 
AND c.is_active = true 
AND s.company_id = c.id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert more varied sample reviews
INSERT INTO reviews (user_id, company_id, rating, comment, status, created_at) 
VALUES 
(
    (SELECT id FROM users WHERE role = 'pet_owner' LIMIT 1),
    (SELECT id FROM companies WHERE is_active = true LIMIT 1),
    5,
    'Прекрасное обслуживание! Персонал очень внимательный к нашему питомцу. Будем обращаться снова!',
    'approved',
    NOW() - INTERVAL '2 days'
),
(
    (SELECT id FROM users WHERE role = 'pet_owner' OFFSET 1 LIMIT 1),
    (SELECT id FROM companies WHERE is_active = true LIMIT 1),
    3,
    'Нормально, но можно было бы лучше. Долго ждали своей очереди.',
    'approved',
    NOW() - INTERVAL '5 days'
),
(
    (SELECT id FROM users WHERE role = 'pet_owner' OFFSET 2 LIMIT 1),
    (SELECT id FROM companies WHERE is_active = true OFFSET 1 LIMIT 1),
    5,
    'Замечательная клиника! Врачи профессионалы, очень бережно обращаются с животными.',
    'approved',
    NOW() - INTERVAL '1 week'
)
ON CONFLICT DO NOTHING; 