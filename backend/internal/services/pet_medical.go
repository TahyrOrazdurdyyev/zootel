package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type PetMedicalService struct {
	db *sql.DB
}

func NewPetMedicalService(db *sql.DB) *PetMedicalService {
	return &PetMedicalService{db: db}
}

// Vaccination management
func (s *PetMedicalService) CreateVaccination(petID string, vaccination *models.VaccinationRecord) error {
	vaccination.ID = uuid.New().String()

	query := `
		INSERT INTO pet_vaccinations (
			id, pet_id, vaccine_name, date_administered, expiry_date,
			vet_name, vet_clinic, batch_number, notes, next_due_date
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err := s.db.Exec(query,
		vaccination.ID, petID, vaccination.VaccineName, vaccination.DateAdministered,
		vaccination.ExpiryDate, vaccination.VetName, vaccination.VetClinic,
		vaccination.BatchNumber, vaccination.Notes, vaccination.NextDueDate,
	)

	return err
}

func (s *PetMedicalService) GetPetVaccinations(petID string) ([]models.VaccinationRecord, error) {
	query := `
		SELECT id, vaccine_name, date_administered, expiry_date, vet_name,
			   vet_clinic, batch_number, notes, next_due_date
		FROM pet_vaccinations 
		WHERE pet_id = $1 
		ORDER BY date_administered DESC`

	rows, err := s.db.Query(query, petID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vaccinations []models.VaccinationRecord
	for rows.Next() {
		var vaccination models.VaccinationRecord
		err := rows.Scan(
			&vaccination.ID, &vaccination.VaccineName, &vaccination.DateAdministered,
			&vaccination.ExpiryDate, &vaccination.VetName, &vaccination.VetClinic,
			&vaccination.BatchNumber, &vaccination.Notes, &vaccination.NextDueDate,
		)
		if err != nil {
			return nil, err
		}
		vaccinations = append(vaccinations, vaccination)
	}

	return vaccinations, nil
}

func (s *PetMedicalService) UpdateVaccination(vaccinationID string, vaccination *models.VaccinationRecord) error {
	query := `
		UPDATE pet_vaccinations SET
			vaccine_name = $2, date_administered = $3, expiry_date = $4,
			vet_name = $5, vet_clinic = $6, batch_number = $7, notes = $8,
			next_due_date = $9, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	_, err := s.db.Exec(query,
		vaccinationID, vaccination.VaccineName, vaccination.DateAdministered,
		vaccination.ExpiryDate, vaccination.VetName, vaccination.VetClinic,
		vaccination.BatchNumber, vaccination.Notes, vaccination.NextDueDate,
	)

	return err
}

func (s *PetMedicalService) DeleteVaccination(vaccinationID string) error {
	query := `DELETE FROM pet_vaccinations WHERE id = $1`
	_, err := s.db.Exec(query, vaccinationID)
	return err
}

// Medication management
func (s *PetMedicalService) CreateMedication(petID string, medication *models.MedicationRecord) error {
	medication.ID = uuid.New().String()

	query := `
		INSERT INTO pet_medications (
			id, pet_id, medication_name, dosage, frequency, start_date,
			end_date, prescribed_by, instructions, side_effects, is_active
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := s.db.Exec(query,
		medication.ID, petID, medication.MedicationName, medication.Dosage,
		medication.Frequency, medication.StartDate, medication.EndDate,
		medication.PrescribedBy, medication.Instructions, medication.SideEffects,
		medication.IsActive,
	)

	return err
}

func (s *PetMedicalService) GetPetMedications(petID string, activeOnly bool) ([]models.MedicationRecord, error) {
	query := `
		SELECT id, medication_name, dosage, frequency, start_date, end_date,
			   prescribed_by, instructions, side_effects, is_active
		FROM pet_medications 
		WHERE pet_id = $1`

	args := []interface{}{petID}
	if activeOnly {
		query += ` AND is_active = true`
	}
	query += ` ORDER BY start_date DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var medications []models.MedicationRecord
	for rows.Next() {
		var medication models.MedicationRecord
		err := rows.Scan(
			&medication.ID, &medication.MedicationName, &medication.Dosage,
			&medication.Frequency, &medication.StartDate, &medication.EndDate,
			&medication.PrescribedBy, &medication.Instructions, &medication.SideEffects,
			&medication.IsActive,
		)
		if err != nil {
			return nil, err
		}
		medications = append(medications, medication)
	}

	return medications, nil
}

func (s *PetMedicalService) UpdateMedication(medicationID string, medication *models.MedicationRecord) error {
	query := `
		UPDATE pet_medications SET
			medication_name = $2, dosage = $3, frequency = $4, start_date = $5,
			end_date = $6, prescribed_by = $7, instructions = $8, side_effects = $9,
			is_active = $10, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1`

	_, err := s.db.Exec(query,
		medicationID, medication.MedicationName, medication.Dosage,
		medication.Frequency, medication.StartDate, medication.EndDate,
		medication.PrescribedBy, medication.Instructions, medication.SideEffects,
		medication.IsActive,
	)

	return err
}

func (s *PetMedicalService) DeleteMedication(medicationID string) error {
	query := `DELETE FROM pet_medications WHERE id = $1`
	_, err := s.db.Exec(query, medicationID)
	return err
}

// Medical history management
func (s *PetMedicalService) GetPetMedicalHistory(petID string) (*models.PetMedicalHistory, error) {
	// Get vaccinations
	vaccinations, err := s.GetPetVaccinations(petID)
	if err != nil {
		return nil, err
	}

	// Get medications
	medications, err := s.GetPetMedications(petID, false)
	if err != nil {
		return nil, err
	}

	// Get medical history summary
	var history models.PetMedicalHistory
	history.PetID = petID
	history.Vaccinations = vaccinations
	history.Medications = medications

	query := `
		SELECT last_checkup_date, next_checkup_date, medical_alerts
		FROM pet_medical_history WHERE pet_id = $1`

	err = s.db.QueryRow(query, petID).Scan(
		&history.LastCheckupDate, &history.NextCheckupDate, pq.Array(&history.MedicalAlerts),
	)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	return &history, nil
}

func (s *PetMedicalService) UpdateMedicalHistory(petID string, history *models.PetMedicalHistory) error {
	query := `
		INSERT INTO pet_medical_history (pet_id, last_checkup_date, next_checkup_date, medical_alerts)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (pet_id) DO UPDATE SET
			last_checkup_date = EXCLUDED.last_checkup_date,
			next_checkup_date = EXCLUDED.next_checkup_date,
			medical_alerts = EXCLUDED.medical_alerts,
			updated_at = CURRENT_TIMESTAMP`

	_, err := s.db.Exec(query,
		petID, history.LastCheckupDate, history.NextCheckupDate,
		pq.Array(history.MedicalAlerts),
	)

	return err
}

// Extended pet profile management
func (s *PetMedicalService) UpdatePetExtendedProfile(petID string, updates map[string]interface{}) error {
	allowedFields := map[string]string{
		"chronic_conditions":   "chronic_conditions",
		"dietary_restrictions": "dietary_restrictions",
		"vet_name":             "vet_name",
		"vet_phone":            "vet_phone",
		"vet_clinic":           "vet_clinic",
		"favorite_toys":        "favorite_toys",
		"behavior_notes":       "behavior_notes",
		"stress_reactions":     "stress_reactions",
		"photo_gallery":        "photo_gallery",
		"allergies":            "allergies",
		"special_needs":        "special_needs",
	}

	var setParts []string
	var args []interface{}
	argIndex := 1

	for field, value := range updates {
		if dbField, allowed := allowedFields[field]; allowed {
			setParts = append(setParts, fmt.Sprintf("%s = $%d", dbField, argIndex))

			// Handle array fields
			if field == "chronic_conditions" || field == "photo_gallery" || field == "allergies" {
				if arr, ok := value.([]string); ok {
					args = append(args, pq.Array(arr))
				} else {
					args = append(args, value)
				}
			} else {
				args = append(args, value)
			}
			argIndex++
		}
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no valid fields to update")
	}

	// Add updated_at
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	// Add pet ID for WHERE clause
	args = append(args, petID)

	query := fmt.Sprintf(`
		UPDATE pets 
		SET %s 
		WHERE id = $%d`,
		fmt.Sprintf("%s", setParts), argIndex)

	_, err := s.db.Exec(query, args...)
	return err
}

// Utility functions
func (s *PetMedicalService) GetUpcomingVaccinations(days int) ([]models.VaccinationRecord, error) {
	query := `
		SELECT pv.id, pv.pet_id, pv.vaccine_name, pv.next_due_date, 
			   p.name as pet_name, u.first_name, u.last_name, u.email
		FROM pet_vaccinations pv
		JOIN pets p ON p.id = pv.pet_id
		JOIN users u ON u.id = p.user_id
		WHERE pv.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '%d days'
		ORDER BY pv.next_due_date`

	rows, err := s.db.Query(fmt.Sprintf(query, days))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vaccinations []models.VaccinationRecord
	for rows.Next() {
		var vaccination models.VaccinationRecord
		var petName, firstName, lastName, email string
		err := rows.Scan(
			&vaccination.ID, &vaccination.VetName, &vaccination.VaccineName,
			&vaccination.NextDueDate, &petName, &firstName, &lastName, &email,
		)
		if err != nil {
			return nil, err
		}
		vaccinations = append(vaccinations, vaccination)
	}

	return vaccinations, nil
}

func (s *PetMedicalService) GetExpiredMedications() ([]models.MedicationRecord, error) {
	query := `
		SELECT pm.id, pm.pet_id, pm.medication_name, pm.end_date,
			   p.name as pet_name, u.first_name, u.last_name, u.email
		FROM pet_medications pm
		JOIN pets p ON p.id = pm.pet_id
		JOIN users u ON u.id = p.user_id
		WHERE pm.is_active = true AND pm.end_date < CURRENT_DATE
		ORDER BY pm.end_date`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var medications []models.MedicationRecord
	for rows.Next() {
		var medication models.MedicationRecord
		var petName, firstName, lastName, email string
		err := rows.Scan(
			&medication.ID, &medication.PrescribedBy, &medication.MedicationName,
			&medication.EndDate, &petName, &firstName, &lastName, &email,
		)
		if err != nil {
			return nil, err
		}
		medications = append(medications, medication)
	}

	return medications, nil
}
