package services

import (
	"database/sql"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type PetService struct {
	db *sql.DB
}

func NewPetService(db *sql.DB) *PetService {
	return &PetService{db: db}
}

// CreatePet creates a new pet profile
func (s *PetService) CreatePet(pet *models.Pet) error {
	pet.ID = uuid.New().String()
	pet.CreatedAt = time.Now()
	pet.UpdatedAt = time.Now()

	query := `
		INSERT INTO pets (
			id, user_id, name, pet_type_id, breed_id, gender, date_of_birth,
			weight, microchip_id, sterilized, photo_url, photo_gallery,
			vaccinations, allergies, medications, chronic_conditions,
			special_needs, dietary_restrictions, vet_contact, vet_name,
			vet_phone, vet_clinic, notes, favorite_toys, behavior_notes,
			stress_reactions, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
			$16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
		)`

	_, err := s.db.Exec(query,
		pet.ID, pet.UserID, pet.Name, pet.PetTypeID, pet.BreedID,
		pet.Gender, pet.DateOfBirth, pet.Weight, pet.MicrochipID,
		pet.Sterilized, pet.PhotoURL, pq.Array(pet.PhotoGallery),
		pet.Vaccinations, pq.Array(pet.Allergies), pet.Medications,
		pq.Array(pet.ChronicConditions), pet.SpecialNeeds, pet.DietaryRestrictions,
		pet.VetContact, pet.VetName, pet.VetPhone, pet.VetClinic,
		pet.Notes, pet.FavoriteToys, pet.BehaviorNotes, pet.StressReactions,
		pet.CreatedAt, pet.UpdatedAt,
	)

	return err
}

// GetPetByID retrieves a pet by ID
func (s *PetService) GetPetByID(petID string) (*models.Pet, error) {
	var pet models.Pet
	query := `
		SELECT id, user_id, name, pet_type_id, breed_id, gender, date_of_birth,
			   weight, microchip_id, sterilized, photo_url, photo_gallery,
			   vaccinations, allergies, medications, chronic_conditions,
			   special_needs, dietary_restrictions, vet_contact, vet_name,
			   vet_phone, vet_clinic, notes, favorite_toys, behavior_notes,
			   stress_reactions, created_at, updated_at
		FROM pets WHERE id = $1`

	err := s.db.QueryRow(query, petID).Scan(
		&pet.ID, &pet.UserID, &pet.Name, &pet.PetTypeID, &pet.BreedID,
		&pet.Gender, &pet.DateOfBirth, &pet.Weight, &pet.MicrochipID,
		&pet.Sterilized, &pet.PhotoURL, pq.Array(&pet.PhotoGallery),
		&pet.Vaccinations, pq.Array(&pet.Allergies), &pet.Medications,
		pq.Array(&pet.ChronicConditions), &pet.SpecialNeeds, &pet.DietaryRestrictions,
		&pet.VetContact, &pet.VetName, &pet.VetPhone, &pet.VetClinic,
		&pet.Notes, &pet.FavoriteToys, &pet.BehaviorNotes, &pet.StressReactions,
		&pet.CreatedAt, &pet.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &pet, nil
}

// GetUserPets retrieves all pets for a user
func (s *PetService) GetUserPets(userID string) ([]*models.Pet, error) {
	query := `
		SELECT id, user_id, name, pet_type_id, breed_id, gender, date_of_birth,
			   weight, microchip_id, sterilized, photo_url, photo_gallery,
			   vaccinations, allergies, medications, chronic_conditions,
			   special_needs, dietary_restrictions, vet_contact, vet_name,
			   vet_phone, vet_clinic, notes, favorite_toys, behavior_notes,
			   stress_reactions, created_at, updated_at
		FROM pets WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pets []*models.Pet
	for rows.Next() {
		pet := &models.Pet{}
		err := rows.Scan(
			&pet.ID, &pet.UserID, &pet.Name, &pet.PetTypeID, &pet.BreedID,
			&pet.Gender, &pet.DateOfBirth, &pet.Weight, &pet.MicrochipID,
			&pet.Sterilized, &pet.PhotoURL, pq.Array(&pet.PhotoGallery),
			&pet.Vaccinations, pq.Array(&pet.Allergies), &pet.Medications,
			pq.Array(&pet.ChronicConditions), &pet.SpecialNeeds, &pet.DietaryRestrictions,
			&pet.VetContact, &pet.VetName, &pet.VetPhone, &pet.VetClinic,
			&pet.Notes, &pet.FavoriteToys, &pet.BehaviorNotes, &pet.StressReactions,
			&pet.CreatedAt, &pet.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		pets = append(pets, pet)
	}

	return pets, nil
}

// UpdatePet updates a pet profile
func (s *PetService) UpdatePet(petID string, pet *models.Pet) error {
	pet.UpdatedAt = time.Now()

	query := `
		UPDATE pets SET
			name = $2, pet_type_id = $3, breed_id = $4, gender = $5,
			date_of_birth = $6, weight = $7, microchip_id = $8, sterilized = $9,
			photo_url = $10, photo_gallery = $11, vaccinations = $12, allergies = $13,
			medications = $14, chronic_conditions = $15, special_needs = $16,
			dietary_restrictions = $17, vet_contact = $18, vet_name = $19,
			vet_phone = $20, vet_clinic = $21, notes = $22, favorite_toys = $23,
			behavior_notes = $24, stress_reactions = $25, updated_at = $26
		WHERE id = $1`

	_, err := s.db.Exec(query,
		petID, pet.Name, pet.PetTypeID, pet.BreedID, pet.Gender,
		pet.DateOfBirth, pet.Weight, pet.MicrochipID, pet.Sterilized,
		pet.PhotoURL, pq.Array(pet.PhotoGallery), pet.Vaccinations,
		pq.Array(pet.Allergies), pet.Medications, pq.Array(pet.ChronicConditions),
		pet.SpecialNeeds, pet.DietaryRestrictions, pet.VetContact, pet.VetName,
		pet.VetPhone, pet.VetClinic, pet.Notes, pet.FavoriteToys,
		pet.BehaviorNotes, pet.StressReactions, pet.UpdatedAt,
	)

	return err
}

// DeletePet deletes a pet
func (s *PetService) DeletePet(petID string) error {
	query := `DELETE FROM pets WHERE id = $1`
	_, err := s.db.Exec(query, petID)
	return err
}

// AddPetPhoto adds a photo to pet gallery
func (s *PetService) AddPetPhoto(petID, photoURL string) error {
	query := `
		UPDATE pets SET 
			photo_gallery = array_append(photo_gallery, $2),
			updated_at = $3
		WHERE id = $1`

	_, err := s.db.Exec(query, petID, photoURL, time.Now())
	return err
}

// RemovePetPhoto removes a photo from pet gallery
func (s *PetService) RemovePetPhoto(petID, photoURL string) error {
	query := `
		UPDATE pets SET 
			photo_gallery = array_remove(photo_gallery, $2),
			updated_at = $3
		WHERE id = $1`

	_, err := s.db.Exec(query, petID, photoURL, time.Now())
	return err
}

// UpdatePetMainPhoto updates the main photo of a pet
func (s *PetService) UpdatePetMainPhoto(petID, photoURL string) error {
	query := `
		UPDATE pets SET 
			photo_url = $2,
			updated_at = $3
		WHERE id = $1`

	_, err := s.db.Exec(query, petID, photoURL, time.Now())
	return err
}

// GetPetWithDetails retrieves pet with detailed type and breed information
func (s *PetService) GetPetWithDetails(petID string) (*models.Pet, error) {
	query := `
		SELECT p.id, p.user_id, p.name, p.pet_type_id, p.breed_id, p.gender,
			   p.date_of_birth, p.weight, p.microchip_id, p.sterilized,
			   p.photo_url, p.photo_gallery, p.vaccinations, p.allergies,
			   p.medications, p.chronic_conditions, p.special_needs,
			   p.dietary_restrictions, p.vet_contact, p.vet_name, p.vet_phone,
			   p.vet_clinic, p.notes, p.favorite_toys, p.behavior_notes,
			   p.stress_reactions, p.created_at, p.updated_at,
			   pt.name as pet_type_name, b.name as breed_name
		FROM pets p
		LEFT JOIN pet_types pt ON pt.id = p.pet_type_id
		LEFT JOIN breeds b ON b.id = p.breed_id
		WHERE p.id = $1`

	var pet models.Pet
	var petTypeName, breedName sql.NullString

	err := s.db.QueryRow(query, petID).Scan(
		&pet.ID, &pet.UserID, &pet.Name, &pet.PetTypeID, &pet.BreedID,
		&pet.Gender, &pet.DateOfBirth, &pet.Weight, &pet.MicrochipID,
		&pet.Sterilized, &pet.PhotoURL, pq.Array(&pet.PhotoGallery),
		&pet.Vaccinations, pq.Array(&pet.Allergies), &pet.Medications,
		pq.Array(&pet.ChronicConditions), &pet.SpecialNeeds, &pet.DietaryRestrictions,
		&pet.VetContact, &pet.VetName, &pet.VetPhone, &pet.VetClinic,
		&pet.Notes, &pet.FavoriteToys, &pet.BehaviorNotes, &pet.StressReactions,
		&pet.CreatedAt, &pet.UpdatedAt, &petTypeName, &breedName,
	)

	if err != nil {
		return nil, err
	}

	return &pet, nil
}

// UpdatePetWeight updates pet weight
func (s *PetService) UpdatePetWeight(petID string, weight float64) error {
	query := `
		UPDATE pets SET 
			weight = $2,
			updated_at = $3
		WHERE id = $1`

	_, err := s.db.Exec(query, petID, weight, time.Now())
	return err
}

// GetPetsByBreed retrieves pets by breed for analytics
func (s *PetService) GetPetsByBreed(breedID string) ([]*models.Pet, error) {
	query := `
		SELECT id, user_id, name, pet_type_id, breed_id, gender,
			   date_of_birth, weight, created_at
		FROM pets 
		WHERE breed_id = $1 
		ORDER BY created_at DESC`

	rows, err := s.db.Query(query, breedID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pets []*models.Pet
	for rows.Next() {
		pet := &models.Pet{}
		err := rows.Scan(
			&pet.ID, &pet.UserID, &pet.Name, &pet.PetTypeID, &pet.BreedID,
			&pet.Gender, &pet.DateOfBirth, &pet.Weight, &pet.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		pets = append(pets, pet)
	}

	return pets, nil
}

// ValidatePetOwnership checks if user owns the pet
func (s *PetService) ValidatePetOwnership(petID, userID string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM pets WHERE id = $1 AND user_id = $2`

	err := s.db.QueryRow(query, petID, userID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
