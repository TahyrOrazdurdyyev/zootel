-- Migration 027: Add business_type field to companies table
-- This field explicitly defines the primary business type of a company

-- Add business_type column to companies table
ALTER TABLE companies ADD COLUMN business_type VARCHAR(50) DEFAULT 'general';

-- Create index for better performance
CREATE INDEX idx_companies_business_type ON companies(business_type);

-- Update existing companies based on their service categories
UPDATE companies SET business_type = 'veterinary' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN services s ON s.company_id = c.id
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE LOWER(sc.name) IN ('veterinary', 'medical', 'emergency', 'dental')
);

UPDATE companies SET business_type = 'grooming' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN services s ON s.company_id = c.id
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE LOWER(sc.name) IN ('grooming', 'beauty')
) AND business_type = 'general';

UPDATE companies SET business_type = 'boarding' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN services s ON s.company_id = c.id
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE LOWER(sc.name) IN ('boarding', 'accommodation', 'hotel')
) AND business_type = 'general';

UPDATE companies SET business_type = 'training' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN services s ON s.company_id = c.id
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE LOWER(sc.name) IN ('training', 'behavior')
) AND business_type = 'general';

UPDATE companies SET business_type = 'walking' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN services s ON s.company_id = c.id
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE LOWER(sc.name) IN ('walking', 'exercise')
) AND business_type = 'general';

UPDATE companies SET business_type = 'sitting' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN services s ON s.company_id = c.id
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE LOWER(sc.name) IN ('sitting', 'care')
) AND business_type = 'general';

UPDATE companies SET business_type = 'pet_taxi' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN services s ON s.company_id = c.id
    JOIN service_categories sc ON sc.id = s.category_id
    WHERE LOWER(sc.name) IN ('taxi', 'transport', 'transportation')
) AND business_type = 'general';

UPDATE companies SET business_type = 'retail' 
WHERE id IN (
    SELECT DISTINCT c.id 
    FROM companies c
    JOIN products p ON p.company_id = c.id
    JOIN service_categories sc ON sc.id = p.category_id
    WHERE LOWER(sc.name) IN ('food', 'nutrition', 'retail', 'products', 'supplies')
) AND business_type = 'general';

-- Add comment to the column
COMMENT ON COLUMN companies.business_type IS 'Primary business type of the company (veterinary, grooming, boarding, training, walking, sitting, pet_taxi, retail, general)'; 