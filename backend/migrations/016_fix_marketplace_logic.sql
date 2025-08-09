-- Migration 016: Fix marketplace logic
-- Ensure companies without website integration are always visible
-- Companies with integration can choose their visibility

-- Create trigger to enforce marketplace logic
CREATE OR REPLACE FUNCTION enforce_marketplace_logic()
RETURNS TRIGGER AS $$
BEGIN
    -- If website integration is disabled, force publish_to_marketplace = true
    IF NEW.website_integration_enabled = false THEN
        NEW.publish_to_marketplace = true;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to companies table
DROP TRIGGER IF EXISTS enforce_marketplace_logic ON companies;
CREATE TRIGGER enforce_marketplace_logic
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION enforce_marketplace_logic();

-- Add constraint to enforce the rule at database level
ALTER TABLE companies DROP CONSTRAINT IF EXISTS marketplace_logic_constraint;
ALTER TABLE companies ADD CONSTRAINT marketplace_logic_constraint
    CHECK (
        (website_integration_enabled = false AND publish_to_marketplace = true) OR
        (website_integration_enabled = true)
    );

-- Update existing companies to comply with new logic
UPDATE companies 
SET publish_to_marketplace = true 
WHERE website_integration_enabled = false;

-- Create view for public marketplace companies
CREATE OR REPLACE VIEW public_marketplace_companies AS
SELECT 
    c.*,
    CASE 
        WHEN c.website_integration_enabled = false THEN false
        ELSE true
    END as can_toggle_marketplace
FROM companies c
WHERE c.publish_to_marketplace = true
AND c.is_active = true;

-- Add marketplace eligibility function
CREATE OR REPLACE FUNCTION get_marketplace_eligibility(company_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    integration_enabled BOOLEAN;
    result JSONB;
BEGIN
    SELECT website_integration_enabled INTO integration_enabled
    FROM companies
    WHERE id = company_uuid;
    
    IF integration_enabled = false THEN
        result := jsonb_build_object(
            'can_toggle', false,
            'reason', 'Companies without website integration must remain visible in marketplace'
        );
    ELSE
        result := jsonb_build_object(
            'can_toggle', true,
            'reason', null
        );
    END IF;
    
    RETURN result;
END;
$$ language 'plpgsql'; 