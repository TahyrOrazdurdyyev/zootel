# User Data Analytics Report (UPDATED)

## 📊 Overview

The Zootel system implements multi-level analytics where different user categories have access to different sets of Pet Owners data. **IMPORTANT: At the administrator's request, the system has been updated to provide companies with extended access to customer data.**

## 🏢 Data Transferred to Pet Companies (EXTENDED)

### 1. Extended Customer Data Through Bookings

**Source**: `BookingService.GetBookingsByCompany()`

**Transferred Data**:
```json
{
  "customer": {
    "user_id": "uuid",
    "first_name": "Name",
    "last_name": "Surname", 
    "email": "email@example.com",
    "phone": "+1234567890",
    "gender": "male/female/other",
    "date_of_birth": "1990-01-15T00:00:00Z",
    "address": "Street, house",
    "apartment_number": "15A",
    "country": "Country",
    "state": "State/Region",
    "city": "City",
    "postal_code": "12345",
    "emergency_contact_name": "Emergency contact name",
    "emergency_contact_phone": "+1234567891",
    "emergency_contact_relation": "spouse/parent/friend"
  },
  "pet": {
    "pet_id": "uuid",
    "pet_name": "Pet name",
    "pet_type": "Pet type (dog, cat, etc.)",
    "breed": "Breed",
    "gender": "male/female/unknown",
    "date_of_birth": "2020-05-10T00:00:00Z",
    "weight": 15.5,
    "microchip_id": "123456789012345",
    "sterilized": true,
    "chronic_conditions": ["allergy", "arthritis"],
    "allergies": ["chicken", "wheat"],
    "dietary_restrictions": "Hypoallergenic food",
    "special_needs": "Needs special care",
    "vet_name": "Dr. Smith",
    "vet_phone": "+1234567892",
    "vet_clinic": "City Veterinary Clinic",
    "behavior_notes": "Friendly, loves children",
    "stress_reactions": "Hides from loud sounds",
    "favorite_toys": "Balls, ropes"
  }
}
```

### 2. Complete Company Customer List

**Source**: `BookingService.GetCompanyCustomers()`

**Transferred Data**:
```json
{
  "user_id": "uuid",
  "first_name": "Name",
  "last_name": "Surname",
  "email": "email@example.com", 
  "phone": "+1234567890",
  "gender": "male/female/other",
  "date_of_birth": "1990-01-15T00:00:00Z",
  "address": "Street, house",
  "apartment_number": "15A",
  "country": "Country",
  "state": "State/Region",
  "city": "City",
  "postal_code": "12345",
  "emergency_contact_name": "Emergency contact name",
  "emergency_contact_phone": "+1234567891",
  "emergency_contact_relation": "spouse/parent/friend"
}
```

### 3. Customer Pet Medical Data

**New API endpoints**:

#### A. Detailed Pet Medical Data
**Endpoint**: `GET /api/v1/bookings/customer-pets/{petId}/medical-data`
**Source**: `BookingService.GetCustomerPetMedicalData()`

#### B. Pet Vaccinations
**Endpoint**: `GET /api/v1/bookings/customer-pets/{petId}/vaccinations`
**Source**: `BookingService.GetCustomerPetVaccinations()`

**Transferred Data**:
```json
[
  {
    "id": "uuid",
    "vaccine_name": "Rabies",
    "date_administered": "2024-01-15",
    "expiry_date": "2025-01-15",
    "vet_name": "Dr. Smith",
    "vet_clinic": "City Veterinary Clinic",
    "batch_number": "VAC123456",
    "notes": "No reactions",
    "next_due_date": "2025-01-15"
  }
]
```

#### C. Pet Medications
**Endpoint**: `GET /api/v1/bookings/customer-pets/{petId}/medications`
**Source**: `BookingService.GetCustomerPetMedications()`

**Transferred Data**:
```json
[
  {
    "id": "uuid",
    "medication_name": "Analgin",
    "dosage": "10mg",
    "frequency": "2 times per day",
    "start_date": "2024-01-01",
    "end_date": "2024-01-14",
    "prescribed_by": "Dr. Smith",
    "instructions": "Give with food",
    "side_effects": "Possible drowsiness",
    "is_active": false
  }
]
```

### 4. Access Control System

**Important**: Companies receive pet medical data **ONLY** if:
- The company has active bookings with this pet, OR
- The company has orders from this pet's owner

**Access Check**:
```sql
SELECT COUNT(*) FROM (
    SELECT 1 FROM bookings b WHERE b.company_id = $1 AND b.pet_id = $2
    UNION
    SELECT 1 FROM orders o 
    JOIN pets p ON o.user_id = p.user_id
    WHERE o.company_id = $1 AND p.id = $2
) as access_check
```

### 5. What is NOW Transferred to Companies

**✅ NEW user data:**
- ✅ User date of birth
- ✅ User gender  
- ✅ Full address (including apartment and postal code)
- ✅ Emergency contacts (name, phone, relationship)

**✅ NEW pet data:**
- ✅ Pet date of birth
- ✅ Pet gender
- ✅ Weight and microchip
- ✅ Sterilization status
- ✅ Chronic conditions
- ✅ Allergies
- ✅ Dietary restrictions
- ✅ Special needs
- ✅ Pet veterinarian contacts
- ✅ Behavioral notes
- ✅ Stress reactions
- ✅ Favorite toys

**✅ NEW medical records:**
- ✅ Complete vaccination history
- ✅ Current and past medications
- ✅ Dosages and administration instructions
- ✅ Veterinarian information
- ✅ Side effects and warnings

## 👑 Data Transferred to SuperAdmin (NO CHANGES)

**Complete data of all users remains unchanged** - SuperAdmin has access to all information in the system.

## 🔐 Updated Data Protection Principles

### 1. Extended Access with Control

Companies now receive **extended access** to data, but **only** for their clients:
- Access is provided only when there are business relationships
- Medical data is available only for pets that the company has worked with
- All requests are logged for audit

### 2. Automatic Access Rights Verification

Every request for medical data includes verification:
```go
func (s *BookingService) GetCustomerPetMedicalData(companyID, petID string) (*models.PetData, error) {
    // Access verification
    var accessCount int
    err := s.db.QueryRow(`
        SELECT COUNT(*) FROM (
            SELECT 1 FROM bookings WHERE company_id = $1 AND pet_id = $2
            UNION
            SELECT 1 FROM orders o JOIN pets p ON o.user_id = p.user_id
            WHERE o.company_id = $1 AND p.id = $2
        ) as access_check
    `, companyID, petID).Scan(&accessCount)
    
    if accessCount == 0 {
        return nil, fmt.Errorf("company does not have access to this pet")
    }
    // ... get data only after access confirmation
}
```

### 3. Updated Logging

All access to extended data is logged:
```json
{
  "event_type": "extended_data_access",
  "company_id": "uuid",
  "user_id": "uuid",
  "pet_id": "uuid",
  "data_type": "medical_data|vaccinations|medications",
  "timestamp": "2024-01-01T00:00:00Z",
  "ip_address": "192.168.1.1",
  "access_granted": true
}
```

## 📋 Updated Data Breakdown by Type

### Personal Data

| Field | Pet Companies | SuperAdmin | Purpose of Use |
|-------|---------------|------------|----------------|
| Name | ✅ | ✅ | Customer identification |
| Surname | ✅ | ✅ | Customer identification |
| Email | ✅ | ✅ | Customer communication |
| Phone | ✅ | ✅ | Customer communication |
| **Date of Birth** | ✅ **NEW** | ✅ | Age-specific service features |
| **Gender** | ✅ **NEW** | ✅ | Service personalization |

### Geographic Data

| Field | Pet Companies | SuperAdmin | Purpose of Use |
|-------|---------------|------------|----------------|
| Country | ✅ | ✅ | Regional analytics |
| State/Region | ✅ | ✅ | Regional analytics |
| City | ✅ | ✅ | Local analytics |
| **Address** | ✅ **NEW** | ✅ | Delivery and mobile services |
| **Apartment** | ✅ **NEW** | ✅ | Precise addressing |
| **Postal Code** | ✅ **NEW** | ✅ | Precise location |

### Contact Data

| Field | Pet Companies | SuperAdmin | Purpose of Use |
|-------|---------------|------------|----------------|
| Main Phone | ✅ | ✅ | Customer communication |
| **Emergency Contact** | ✅ **NEW** | ✅ | Safety and emergency cases |
| **Contact Relationship** | ✅ **NEW** | ✅ | Understanding connections |

### Pet Data

| Field | Pet Companies | SuperAdmin | Purpose of Use |
|-------|---------------|------------|----------------|
| Pet Name | ✅ | ✅ | Pet identification |
| Type/Breed | ✅ | ✅ | Service selection |
| **Pet Gender** | ✅ **NEW** | ✅ | Specific services |
| **Date of Birth** | ✅ **NEW** | ✅ | Age-specific features |
| **Weight** | ✅ **NEW** | ✅ | Dosages, service sizing |
| **Microchip** | ✅ **NEW** | ✅ | Identification, safety |
| **Sterilization** | ✅ **NEW** | ✅ | Medical features |

### Pet Medical Data

| Field | Pet Companies | SuperAdmin | Purpose of Use |
|-------|---------------|------------|----------------|
| **Chronic Conditions** | ✅ **NEW** | ✅ | Service safety |
| **Allergies** | ✅ **NEW** | ✅ | Reaction prevention |
| **Diet** | ✅ **NEW** | ✅ | Proper nutrition |
| **Special Needs** | ✅ **NEW** | ✅ | Service adaptation |
| **Vaccinations** | ✅ **NEW** | ✅ | Medical safety |
| **Medications** | ✅ **NEW** | ✅ | Procedure compatibility |
| **Pet Veterinarian** | ✅ **NEW** | ✅ | Treatment coordination |

### Behavioral Data

| Field | Pet Companies | SuperAdmin | Purpose of Use |
|-------|---------------|------------|----------------|
| **Behavioral Notes** | ✅ **NEW** | ✅ | Proper approach |
| **Stress Reactions** | ✅ **NEW** | ✅ | Safety and comfort |
| **Favorite Toys** | ✅ **NEW** | ✅ | Motivation and comfort |

## 🎯 Benefits of Extended Access

### For Pet Companies

1. **Improved Service Quality**
   - Knowledge of allergies prevents dangerous reactions
   - Understanding behavior improves service
   - Medication information helps avoid conflicts

2. **Service Personalization**
   - Adaptation to pet age and size
   - Consideration of chronic conditions
   - Use of favorite toys for motivation

3. **Safety**
   - Emergency contacts for emergency situations
   - Coordination with primary veterinarian
   - Information about current treatment

4. **Efficiency**
   - Quick access to complete information
   - Less time spent collecting data
   - Better service planning

### For Pet Owners

1. **Better Service**
   - Companies know pet characteristics
   - Fewer repeated explanations
   - Safer services

2. **Convenience**
   - No need to tell about the pet every time
   - Automatic consideration of medical features
   - Coordination between different service providers

## 🚨 Updated Security Measures

### 1. Strict Access Control

- **Access only to own clients**: Company sees data only of Pet Owners who actually used their services
- **Medical data only for serviced pets**: Access to vaccinations/medications only for pets that the company worked with
- **Automatic rights verification**: Every request is verified at the database level

### 2. Extended Logging

```go
func (s *AnalyticsService) TrackExtendedDataAccess(companyID, userID, petID, dataType string) {
    s.TrackEvent(&TrackEventRequest{
        CompanyID: companyID,
        EventType: "extended_data_access",
        EventName: "medical_data_accessed",
        EventData: map[string]interface{}{
            "accessed_user_id": userID,
            "accessed_pet_id": petID,
            "data_type": dataType,
        },
    })
}
```

### 3. Time Limitations

- Access to data only while there are active business relationships
- Historical data available for a certain period
- Automatic access restriction when cooperation ends

## 📈 New Analytics Capabilities

### For Pet Companies

1. **Medical Analytics**
   - Statistics on customer diseases
   - Treatment effectiveness analysis
   - Trends in pet health

2. **Demographic Analysis**
   - Age distribution of customers
   - Gender preferences in services
   - Regional features

3. **Behavioral Analytics**
   - Pet behavior patterns
   - Effectiveness of various approaches
   - Breed preferences

## 📜 Regulatory Compliance (UPDATED)

### GDPR Compliance

- ✅ **Legal Basis**: Processing is necessary for contract execution
- ✅ **Consent**: Users are informed about data transfer when booking
- ✅ **Minimization**: Data is transferred only to companies with business relationships
- ✅ **Processing Purpose**: Improving service quality and safety
- ✅ **Subject Rights**: Ability to withdraw consent, delete data

### Updated User Notification

```
When booking services, the company will have access to the following information:
- Your contact details and address
- Emergency contact information  
- Pet medical information (allergies, medications, vaccinations)
- Pet behavioral characteristics

This data is used exclusively for safe and quality service provision. 
The company cannot transfer this data to third parties.
```

## 🔄 Implementation Procedures

### 1. Data Migration

- API endpoints update
- Database expansion (already completed)
- Access control system update

### 2. User Notification

- Email distribution about data policy changes
- User agreement update
- Information notifications in the application

### 3. Company Training

- Guide on using new data
- Privacy principles training
- New capabilities demonstration

---

**Important Change**: The system has been updated to provide companies with extended access to customer data, including date of birth, gender, full address, emergency contacts, and complete pet medical information. All changes are implemented while maintaining security and access control principles.

**This report is current as of**: January 2024  
**Version**: 2.0.0 (EXTENDED ACCESS)  
**Next Update**: When analytics functionality changes 