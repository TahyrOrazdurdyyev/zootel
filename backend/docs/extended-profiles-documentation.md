# Extended User and Pet Profiles Documentation

## Overview

This document describes the comprehensive user and pet profile system implemented for the Zootel platform. The system provides detailed profile management for Pet Owners and their pets, including medical records, behavioral information, and advanced features.

## User Profile Extensions

### Basic Information
- **Full Name**: First Name, Last Name
- **Gender**: Male, Female, Other
- **Date of Birth**: For age calculation and targeted services
- **Avatar**: Profile photo upload and management

### Contact Information
- **Email**: Primary contact (existing field)
- **Phone**: E.164 format with PhoneInput component
- **Address**: Street address, apartment number, city, region, postal code
- **Timezone**: For accurate push notifications and scheduling

### Emergency Contacts
- **Contact Name**: Full name of emergency contact person
- **Contact Phone**: Emergency contact phone number
- **Relationship**: Relationship to user (family, friend, etc.)

### Veterinarian Contacts
- **Veterinarian Name**: Primary vet name
- **Clinic Name**: Veterinary clinic name
- **Phone Number**: Clinic contact number

### Notification Preferences
- **Push Notifications**: Enable/disable push notifications
- **SMS Notifications**: Enable/disable SMS notifications
- **Email Notifications**: Enable/disable email notifications
- **Marketing Consent**: Opt-in for promotional emails and offers

## Pet Profile Extensions

### Basic Information
- **Pet Name**: Name of the pet
- **Pet Type**: Selected from admin-managed list (dog, cat, bird, etc.)
- **Breed**: Selected from type-specific breed list
- **Gender**: Male, Female, Unknown
- **Date of Birth**: For age calculation
- **Weight**: Current weight with update tracking
- **Microchip ID**: Microchip identification number
- **Sterilization Status**: Sterilized/castrated status

### Photo Management
- **Main Photo**: Primary pet photo
- **Photo Gallery**: Multiple photos with upload/delete functionality
- **Image Upload**: Drag-and-drop interface with preview

### Medical Information

#### Chronic Conditions
- **Condition List**: Array of chronic medical conditions
- **Management**: Add/remove conditions with UI tags

#### Allergies
- **Allergy List**: Array of known allergies
- **Management**: Add/remove allergies with UI tags

#### Dietary Information
- **Dietary Restrictions**: Special dietary requirements
- **Special Needs**: Mobility issues, special care requirements

#### Vaccination Records
- **Vaccine Name**: Name of administered vaccine
- **Date Administered**: Date vaccine was given
- **Expiry Date**: When vaccine protection expires
- **Next Due Date**: When next vaccination is due
- **Veterinarian Info**: Vet name and clinic
- **Batch Number**: Vaccine batch for tracking
- **Notes**: Additional vaccination notes

#### Medication Records
- **Medication Name**: Name of medication
- **Dosage**: Prescribed dosage
- **Frequency**: Administration frequency
- **Start/End Dates**: Treatment period
- **Prescribed By**: Prescribing veterinarian
- **Instructions**: Administration instructions
- **Side Effects**: Known or observed side effects
- **Active Status**: Currently taking medication

#### Medical History Summary
- **Last Checkup**: Date of last veterinary visit
- **Next Checkup**: Scheduled next appointment
- **Medical Alerts**: Important medical warnings

### Veterinarian Contacts
- **Primary Vet Name**: Pet's primary veterinarian
- **Clinic Name**: Veterinary clinic name
- **Phone Number**: Clinic contact information

### Behavioral Information
- **Favorite Toys**: Preferred toys and activities
- **Behavior Notes**: General behavior patterns and temperament
- **Stress Reactions**: How pet reacts to stress and handling tips
- **Additional Notes**: Any other important information

## Database Schema

### User Table Extensions

```sql
-- Extended address fields
ALTER TABLE users ADD COLUMN apartment_number VARCHAR(20);
ALTER TABLE users ADD COLUMN postal_code VARCHAR(20);

-- Detailed emergency contact fields
ALTER TABLE users ADD COLUMN emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN emergency_contact_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN emergency_contact_relation VARCHAR(100);

-- Detailed veterinarian contact fields
ALTER TABLE users ADD COLUMN vet_name VARCHAR(255);
ALTER TABLE users ADD COLUMN vet_clinic VARCHAR(255);
ALTER TABLE users ADD COLUMN vet_phone VARCHAR(50);

-- Notification preferences
ALTER TABLE users ADD COLUMN notifications_push BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN notifications_sms BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN notifications_email BOOLEAN DEFAULT true;
```

### Pet Table Extensions

```sql
-- Medical information fields
ALTER TABLE pets ADD COLUMN chronic_conditions TEXT[];
ALTER TABLE pets ADD COLUMN dietary_restrictions TEXT;

-- Detailed veterinarian contact fields for pets
ALTER TABLE pets ADD COLUMN vet_name VARCHAR(255);
ALTER TABLE pets ADD COLUMN vet_phone VARCHAR(50);
ALTER TABLE pets ADD COLUMN vet_clinic VARCHAR(255);

-- Behavioral and additional notes
ALTER TABLE pets ADD COLUMN favorite_toys TEXT;
ALTER TABLE pets ADD COLUMN behavior_notes TEXT;
ALTER TABLE pets ADD COLUMN stress_reactions TEXT;
```

### New Medical Tables

#### Pet Vaccinations
```sql
CREATE TABLE pet_vaccinations (
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
```

#### Pet Medications
```sql
CREATE TABLE pet_medications (
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
```

#### Pet Medical History
```sql
CREATE TABLE pet_medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    last_checkup_date DATE,
    next_checkup_date DATE,
    medical_alerts TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pet_id)
);
```

## API Endpoints

### User Profile Endpoints

```http
PUT /api/v1/users/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "male",
  "dateOfBirth": "1990-01-01",
  "phone": "+1234567890",
  "address": "123 Main St",
  "apartmentNumber": "4B",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10001",
  "timezone": "America/New_York",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+1234567891",
  "emergencyContactRelation": "spouse",
  "vetName": "Dr. Smith",
  "vetClinic": "City Vet Clinic",
  "vetPhone": "+1234567892",
  "notificationsPush": true,
  "notificationsSMS": false,
  "notificationsEmail": true,
  "marketingOptIn": false
}
```

### Pet Medical Endpoints

#### Vaccination Management
```http
POST /api/v1/pets/{petId}/vaccinations
GET /api/v1/pets/{petId}/vaccinations
PUT /api/v1/pets/{petId}/vaccinations/{vaccinationId}
DELETE /api/v1/pets/{petId}/vaccinations/{vaccinationId}
```

#### Medication Management
```http
POST /api/v1/pets/{petId}/medications
GET /api/v1/pets/{petId}/medications?active_only=true
PUT /api/v1/pets/{petId}/medications/{medicationId}
DELETE /api/v1/pets/{petId}/medications/{medicationId}
```

#### Medical History
```http
GET /api/v1/pets/{petId}/medical-history
PUT /api/v1/pets/{petId}/medical-history
```

#### Extended Profile
```http
PUT /api/v1/pets/{petId}/extended-profile
```

### Pet Photo Management
```http
POST /api/v1/pets/{petId}/photos
DELETE /api/v1/pets/{petId}/photos
PUT /api/v1/pets/{petId}/main-photo
```

## Frontend Components

### User Profile Components
- **ExtendedUserProfileForm**: Complete user profile management
- **NotificationPreferences**: Notification settings management
- **EmergencyContactForm**: Emergency contact management
- **VeterinarianContactForm**: Vet contact management

### Pet Profile Components
- **ExtendedPetProfile**: Complete pet profile with tabbed interface
- **PetMedicalProfile**: Medical records management
- **PetPhotoGallery**: Photo upload and gallery management
- **VaccinationManager**: Vaccination record management
- **MedicationManager**: Medication record management

### UI Components
- **PetPhotoGallery**: Photo management with upload, delete, and main photo selection
- **TagInput**: For managing allergies and chronic conditions
- **DatePicker**: For vaccination and medication dates
- **FileUpload**: Drag-and-drop photo upload

## Services

### Backend Services
- **PetMedicalService**: Medical record management
- **PetService**: Extended pet profile management
- **UserService**: Extended user profile management

### Service Methods

#### PetMedicalService
- `CreateVaccination(petID, vaccination)`
- `GetPetVaccinations(petID)`
- `UpdateVaccination(vaccinationID, vaccination)`
- `DeleteVaccination(vaccinationID)`
- `CreateMedication(petID, medication)`
- `GetPetMedications(petID, activeOnly)`
- `UpdateMedication(medicationID, medication)`
- `DeleteMedication(medicationID)`
- `GetPetMedicalHistory(petID)`
- `UpdateMedicalHistory(petID, history)`
- `UpdatePetExtendedProfile(petID, updates)`

#### PetService
- `AddPetPhoto(petID, photoURL)`
- `RemovePetPhoto(petID, photoURL)`
- `UpdatePetMainPhoto(petID, photoURL)`
- `UpdatePetWeight(petID, weight)`
- `ValidatePetOwnership(petID, userID)`

## Features

### Medical Record Management
- Complete vaccination tracking with reminders
- Medication management with active/inactive status
- Medical history summaries
- Upcoming vaccination alerts
- Expired medication notifications

### Photo Management
- Multiple photo upload
- Photo gallery with modal view
- Main photo selection
- Photo deletion with confirmation

### Profile Validation
- Pet ownership validation for all operations
- Required field validation
- Data type validation
- Permission checking

### User Experience
- Tabbed interface for organization
- Real-time form validation
- Loading states and error handling
- Mobile-responsive design
- Drag-and-drop file uploads

## Security

### Access Control
- Pet ownership validation for all pet operations
- User authentication required for all endpoints
- Role-based access control
- Input validation and sanitization

### Data Protection
- Medical information encryption in transit
- Secure file upload handling
- Personal information protection
- GDPR compliance ready

## Migration Guide

### Running Migrations
```bash
# Run database setup script
go run scripts/setup-database/main.go

# Or run specific migrations
psql -d zootel -f migrations/028_extend_user_profile.sql
psql -d zootel -f migrations/029_extend_pet_profile.sql
```

### Data Migration
- Existing user and pet records are preserved
- New fields are optional and default to empty/false
- Photo galleries default to empty arrays
- Medical records start fresh (no historical data migration)

## Testing

### Manual Testing Checklist
- [ ] User profile creation and updates
- [ ] Pet profile creation with all fields
- [ ] Vaccination record management
- [ ] Medication record management
- [ ] Photo upload and gallery management
- [ ] Medical history management
- [ ] Ownership validation
- [ ] API endpoint responses
- [ ] Frontend form validation
- [ ] Mobile responsiveness

### API Testing
Use provided Postman collection or test with curl:

```bash
# Test user profile update
curl -X PUT http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test", "lastName": "User"}'

# Test vaccination creation
curl -X POST http://localhost:8080/api/v1/pets/{petId}/vaccinations \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"vaccineName": "Rabies", "dateAdministered": "2024-01-01"}'
```

## Future Enhancements

### Planned Features
- Automated vaccination reminders
- Medication schedule notifications
- Health report generation
- Integration with veterinary clinics
- Medical record sharing
- Insurance integration
- Telemedicine features

### Performance Optimizations
- Medical record pagination
- Photo thumbnail generation
- Caching for frequently accessed data
- Background processing for notifications
- Database indexing optimization

## Support

For technical support or questions about the extended profile system:
1. Check this documentation
2. Review API endpoint specifications
3. Test with provided examples
4. Contact development team

---

**Last Updated**: January 2024
**Version**: 1.0.0 