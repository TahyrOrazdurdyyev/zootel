-- Migration 029: Extend pet profile with detailed medical information
-- Add chronic conditions, dietary restrictions, vet contacts, behavior notes

-- Add medical information fields
ALTER TABLE pets ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[];
ALTER TABLE pets ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;

-- Add detailed veterinarian contact fields for pets
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_name VARCHAR(255);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_phone VARCHAR(50);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS vet_clinic VARCHAR(255);

-- Add behavioral and additional notes
ALTER TABLE pets ADD COLUMN IF NOT EXISTS favorite_toys TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS behavior_notes TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS stress_reactions TEXT;

-- Create table for vaccination records
CREATE TABLE IF NOT EXISTS pet_vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    date_administered DATE NOT NULL,
    expiry_date DATE,
    vet_name VARCHAR(255),
    vet_clinic VARCHAR(255),
    batch_number VARCHAR(100),
    notes TEXT,
    next_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for medication records
CREATE TABLE IF NOT EXISTS pet_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    prescribed_by VARCHAR(255),
    instructions TEXT,
    side_effects TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for pet medical history summaries
CREATE TABLE IF NOT EXISTS pet_medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    last_checkup_date DATE,
    next_checkup_date DATE,
    medical_alerts TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pet_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_pet_id ON pet_vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_date ON pet_vaccinations(date_administered);
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_expiry ON pet_vaccinations(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_next_due ON pet_vaccinations(next_due_date);

CREATE INDEX IF NOT EXISTS idx_pet_medications_pet_id ON pet_medications(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_medications_active ON pet_medications(is_active);
CREATE INDEX IF NOT EXISTS idx_pet_medications_start_date ON pet_medications(start_date);
CREATE INDEX IF NOT EXISTS idx_pet_medications_end_date ON pet_medications(end_date);

CREATE INDEX IF NOT EXISTS idx_pet_medical_history_pet_id ON pet_medical_history(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_medical_history_next_checkup ON pet_medical_history(next_checkup_date);

CREATE INDEX IF NOT EXISTS idx_pets_chronic_conditions ON pets USING GIN(chronic_conditions);
CREATE INDEX IF NOT EXISTS idx_pets_vet_phone ON pets(vet_phone);

-- Add comments for new fields and tables
COMMENT ON COLUMN pets.chronic_conditions IS 'Array of chronic medical conditions';
COMMENT ON COLUMN pets.dietary_restrictions IS 'Special dietary requirements and restrictions';
COMMENT ON COLUMN pets.vet_name IS 'Name of pets primary veterinarian';
COMMENT ON COLUMN pets.vet_phone IS 'Phone number of pets veterinarian';
COMMENT ON COLUMN pets.vet_clinic IS 'Name of pets primary veterinary clinic';
COMMENT ON COLUMN pets.favorite_toys IS 'Description of pets favorite toys and activities';
COMMENT ON COLUMN pets.behavior_notes IS 'Notes about pets behavior patterns';
COMMENT ON COLUMN pets.stress_reactions IS 'How pet reacts to stress and handling tips';

COMMENT ON TABLE pet_vaccinations IS 'Detailed vaccination records for pets';
COMMENT ON TABLE pet_medications IS 'Current and historical medication records';
COMMENT ON TABLE pet_medical_history IS 'Medical history summary and upcoming appointments'; 