-- Migration 023: Add indexes for location-based searches
-- This migration adds indexes to optimize location-based queries and analytics

-- Create indexes for location fields to improve search performance
CREATE INDEX IF NOT EXISTS idx_users_country ON users (country);
CREATE INDEX IF NOT EXISTS idx_users_state ON users (state);
CREATE INDEX IF NOT EXISTS idx_users_city ON users (city);

-- Create composite indexes for regional analytics
CREATE INDEX IF NOT EXISTS idx_users_country_state ON users (country, state);
CREATE INDEX IF NOT EXISTS idx_users_country_city ON users (country, city);
CREATE INDEX IF NOT EXISTS idx_users_location_full ON users (country, state, city);

-- Create index for location-based user searches with creation date
CREATE INDEX IF NOT EXISTS idx_users_location_created ON users (country, state, city, created_at);

-- Add constraint to ensure location data consistency
-- Countries should not be empty if provided
ALTER TABLE users ADD CONSTRAINT chk_country_not_empty 
CHECK (country IS NULL OR country != '');

-- States should not be empty if provided
ALTER TABLE users ADD CONSTRAINT chk_state_not_empty 
CHECK (state IS NULL OR state != '');

-- Cities should not be empty if provided  
ALTER TABLE users ADD CONSTRAINT chk_city_not_empty 
CHECK (city IS NULL OR city != '');

-- Comment for documentation
COMMENT ON INDEX idx_users_country IS 'Index for country-based user searches';
COMMENT ON INDEX idx_users_state IS 'Index for state-based user searches';
COMMENT ON INDEX idx_users_city IS 'Index for city-based user searches';
COMMENT ON INDEX idx_users_location_full IS 'Composite index for full location searches';
COMMENT ON INDEX idx_users_location_created IS 'Index for location analytics with time dimension'; 