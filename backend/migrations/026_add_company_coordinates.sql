-- Migration: Add geolocation coordinates to companies
-- Add latitude and longitude fields for precise location mapping

ALTER TABLE companies ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add indexes for geolocation queries
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_companies_city_country ON companies(city, country);

-- Add constraint to ensure both lat/lng are provided together or both are null
ALTER TABLE companies ADD CONSTRAINT check_coordinates 
    CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)); 