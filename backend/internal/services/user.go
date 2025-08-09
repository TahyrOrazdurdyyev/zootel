package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

// User Registration and Authentication
func (s *UserService) CreateUser(user *models.User) error {
	user.ID = uuid.New().String()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	// Set default role if not specified
	if user.Role == "" {
		user.Role = "pet_owner"
	}

	query := `
		INSERT INTO users (
			id, firebase_uid, email, first_name, last_name, role, gender,
			date_of_birth, phone, address, country, state, city, timezone,
			avatar_url, emergency_contact, vet_contact, notification_methods,
			marketing_opt_in, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18, $19, $20, $21
		)`

	_, err := s.db.Exec(query,
		user.ID, user.FirebaseUID, user.Email, user.FirstName, user.LastName,
		user.Role, user.Gender, user.DateOfBirth, user.Phone, user.Address,
		user.Country, user.State, user.City, user.Timezone, user.AvatarURL,
		user.EmergencyContact, user.VetContact, user.NotificationMethods,
		user.MarketingOptIn, user.CreatedAt, user.UpdatedAt,
	)

	return err
}

func (s *UserService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, firebase_uid, email, first_name, last_name, role, gender,
			   date_of_birth, phone, address, country, state, city, timezone,
			   avatar_url, emergency_contact, vet_contact, notification_methods,
			   marketing_opt_in, created_at, updated_at
		FROM users WHERE id = $1`

	err := s.db.QueryRow(query, userID).Scan(
		&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
		&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
		&user.Country, &user.State, &user.City, &user.Timezone, &user.AvatarURL,
		&user.EmergencyContact, &user.VetContact, &user.NotificationMethods,
		&user.MarketingOptIn, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) GetUserByFirebaseUID(firebaseUID string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, firebase_uid, email, first_name, last_name, role, gender,
			   date_of_birth, phone, address, country, state, city, timezone,
			   avatar_url, emergency_contact, vet_contact, notification_methods,
			   marketing_opt_in, created_at, updated_at
		FROM users WHERE firebase_uid = $1`

	err := s.db.QueryRow(query, firebaseUID).Scan(
		&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
		&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
		&user.Country, &user.State, &user.City, &user.Timezone, &user.AvatarURL,
		&user.EmergencyContact, &user.VetContact, &user.NotificationMethods,
		&user.MarketingOptIn, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, firebase_uid, email, first_name, last_name, role, gender,
			   date_of_birth, phone, address, country, state, city, timezone,
			   avatar_url, emergency_contact, vet_contact, notification_methods,
			   marketing_opt_in, created_at, updated_at
		FROM users WHERE email = $1`

	err := s.db.QueryRow(query, email).Scan(
		&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
		&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
		&user.Country, &user.State, &user.City, &user.Timezone, &user.AvatarURL,
		&user.EmergencyContact, &user.VetContact, &user.NotificationMethods,
		&user.MarketingOptIn, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) UpdateUser(userID string, updates *models.User) error {
	updates.UpdatedAt = time.Now()

	query := `
		UPDATE users SET 
			first_name = $2, last_name = $3, gender = $4, date_of_birth = $5,
			phone = $6, address = $7, country = $8, state = $9, city = $10,
			timezone = $11, avatar_url = $12, emergency_contact = $13,
			vet_contact = $14, notification_methods = $15, marketing_opt_in = $16,
			updated_at = $17
		WHERE id = $1`

	_, err := s.db.Exec(query,
		userID, updates.FirstName, updates.LastName, updates.Gender,
		updates.DateOfBirth, updates.Phone, updates.Address, updates.Country,
		updates.State, updates.City, updates.Timezone, updates.AvatarURL,
		updates.EmergencyContact, updates.VetContact, updates.NotificationMethods,
		updates.MarketingOptIn, updates.UpdatedAt,
	)

	return err
}

func (s *UserService) UpdateUserRole(userID, newRole string) error {
	query := `UPDATE users SET role = $2, updated_at = $3 WHERE id = $1`
	_, err := s.db.Exec(query, userID, newRole, time.Now())
	return err
}

func (s *UserService) DeleteUser(userID string) error {
	// Soft delete by marking as inactive or actual deletion
	// For GDPR compliance, we might want to actually delete the data
	query := `DELETE FROM users WHERE id = $1`
	_, err := s.db.Exec(query, userID)
	return err
}

// Profile Management
func (s *UserService) UploadAvatar(userID, avatarURL string) error {
	query := `UPDATE users SET avatar_url = $2, updated_at = $3 WHERE id = $1`
	_, err := s.db.Exec(query, userID, avatarURL, time.Now())
	return err
}

func (s *UserService) UpdateNotificationPreferences(userID string, methods []string) error {
	query := `UPDATE users SET notification_methods = $2, updated_at = $3 WHERE id = $1`
	_, err := s.db.Exec(query, userID, pq.Array(methods), time.Now())
	return err
}

func (s *UserService) UpdateMarketingOptIn(userID string, optIn bool) error {
	query := `UPDATE users SET marketing_opt_in = $2, updated_at = $3 WHERE id = $1`
	_, err := s.db.Exec(query, userID, optIn, time.Now())
	return err
}

// Admin functions for user management
func (s *UserService) GetAllUsers(page, limit int, role string) ([]models.User, int, error) {
	offset := (page - 1) * limit

	whereClause := ""
	args := []interface{}{limit, offset}
	argIndex := 3

	if role != "" {
		whereClause = "WHERE role = $3"
		args = append(args, role)
		argIndex++
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users %s", whereClause)
	var total int
	if role != "" {
		err := s.db.QueryRow(countQuery, role).Scan(&total)
		if err != nil {
			return nil, 0, err
		}
	} else {
		err := s.db.QueryRow(countQuery).Scan(&total)
		if err != nil {
			return nil, 0, err
		}
	}

	// Get users
	query := fmt.Sprintf(`
		SELECT id, firebase_uid, email, first_name, last_name, role, gender,
			   date_of_birth, phone, address, country, state, city, timezone,
			   avatar_url, emergency_contact, vet_contact, notification_methods,
			   marketing_opt_in, created_at, updated_at
		FROM users %s
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`, whereClause)

	var rows *sql.Rows
	var err error

	if role != "" {
		rows, err = s.db.Query(query, limit, offset, role)
	} else {
		rows, err = s.db.Query(query, limit, offset)
	}

	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
			&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
			&user.Country, &user.State, &user.City, &user.Timezone, &user.AvatarURL,
			&user.EmergencyContact, &user.VetContact, &user.NotificationMethods,
			&user.MarketingOptIn, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}

	return users, total, nil
}

func (s *UserService) SearchUsers(query string, role string, limit int) ([]models.User, error) {
	searchQuery := `
		SELECT id, firebase_uid, email, first_name, last_name, role, gender,
			   date_of_birth, phone, address, country, state, city, timezone,
			   avatar_url, emergency_contact, vet_contact, notification_methods,
			   marketing_opt_in, created_at, updated_at
		FROM users 
		WHERE (
			LOWER(first_name) LIKE LOWER($1) OR 
			LOWER(last_name) LIKE LOWER($1) OR 
			LOWER(email) LIKE LOWER($1)
		)`

	args := []interface{}{"%" + query + "%"}

	if role != "" {
		searchQuery += " AND role = $2"
		args = append(args, role)
	}

	searchQuery += " ORDER BY created_at DESC LIMIT $" + fmt.Sprintf("%d", len(args)+1)
	args = append(args, limit)

	rows, err := s.db.Query(searchQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
			&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
			&user.Country, &user.State, &user.City, &user.Timezone, &user.AvatarURL,
			&user.EmergencyContact, &user.VetContact, &user.NotificationMethods,
			&user.MarketingOptIn, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

// User statistics
func (s *UserService) GetUserStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total users by role
	roleQuery := `
		SELECT role, COUNT(*) 
		FROM users 
		GROUP BY role`

	rows, err := s.db.Query(roleQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roleStats := make(map[string]int)
	for rows.Next() {
		var role string
		var count int
		err := rows.Scan(&role, &count)
		if err != nil {
			return nil, err
		}
		roleStats[role] = count
	}
	stats["by_role"] = roleStats

	// Recent registrations
	var recentCount int
	err = s.db.QueryRow(`
		SELECT COUNT(*) FROM users 
		WHERE created_at >= NOW() - INTERVAL '30 days'
	`).Scan(&recentCount)
	if err != nil {
		return nil, err
	}
	stats["recent_registrations"] = recentCount

	// Active users (users who have made bookings/orders recently)
	var activeCount int
	err = s.db.QueryRow(`
		SELECT COUNT(DISTINCT u.id) FROM users u
		LEFT JOIN bookings b ON u.id = b.user_id
		LEFT JOIN orders o ON u.id = o.user_id
		WHERE (b.created_at >= NOW() - INTERVAL '30 days' OR o.created_at >= NOW() - INTERVAL '30 days')
	`).Scan(&activeCount)
	if err != nil {
		return nil, err
	}
	stats["active_users"] = activeCount

	return stats, nil
}

// Company Owner specific functions
func (s *UserService) CreateCompanyOwner(user *models.User) error {
	user.Role = "company_owner"
	return s.CreateUser(user)
}

func (s *UserService) GetCompanyByOwner(ownerID string) (*models.Company, error) {
	var company models.Company
	query := `
		SELECT id, owner_id, name, description, categories, country, state, city,
			   address, phone, email, website, logo_url, media_gallery,
			   business_hours, plan_id, trial_expired, special_partner,
			   manual_enabled_crm, manual_enabled_ai_agents, is_demo, is_active,
			   website_integration_enabled, api_key, publish_to_marketplace,
			   created_at, updated_at
		FROM companies WHERE owner_id = $1`

	err := s.db.QueryRow(query, ownerID).Scan(
		&company.ID, &company.OwnerID, &company.Name, &company.Description,
		&company.Categories, &company.Country, &company.State, &company.City,
		&company.Address, &company.Phone, &company.Email, &company.Website,
		&company.LogoURL, &company.MediaGallery, &company.BusinessHours,
		&company.PlanID, &company.TrialExpired, &company.SpecialPartner,
		&company.ManualEnabledCRM, &company.ManualEnabledAIAgents,
		&company.IsDemo, &company.IsActive, &company.WebsiteIntegrationEnabled,
		&company.APIKey, &company.PublishToMarketplace,
		&company.CreatedAt, &company.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &company, nil
}

// Pet Owner specific functions
func (s *UserService) GetUserPets(userID string) ([]models.Pet, error) {
	query := `
		SELECT p.id, p.user_id, p.name, p.pet_type_id, p.breed_id, p.gender,
			   p.date_of_birth, p.weight, p.microchip_id, p.sterilized,
			   p.photo_url, p.photo_gallery, p.vaccinations, p.allergies,
			   p.medications, p.special_needs, p.vet_contact, p.notes,
			   p.created_at, p.updated_at
		FROM pets p
		WHERE p.user_id = $1
		ORDER BY p.created_at DESC`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pets []models.Pet
	for rows.Next() {
		var pet models.Pet
		err := rows.Scan(
			&pet.ID, &pet.UserID, &pet.Name, &pet.PetTypeID, &pet.BreedID,
			&pet.Gender, &pet.DateOfBirth, &pet.Weight, &pet.MicrochipID,
			&pet.Sterilized, &pet.PhotoURL, &pet.PhotoGallery, &pet.Vaccinations,
			&pet.Allergies, &pet.Medications, &pet.SpecialNeeds, &pet.VetContact,
			&pet.Notes, &pet.CreatedAt, &pet.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		pets = append(pets, pet)
	}

	return pets, nil
}

func (s *UserService) GetUserBookings(userID string, limit int) ([]models.Booking, error) {
	query := `
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, payment_id,
			   created_at, updated_at
		FROM bookings
		WHERE user_id = $1
		ORDER BY date_time DESC
		LIMIT $2`

	rows, err := s.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var booking models.Booking
		err := rows.Scan(
			&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
			&booking.PetID, &booking.EmployeeID, &booking.DateTime, &booking.Duration,
			&booking.Price, &booking.Status, &booking.Notes, &booking.PaymentID,
			&booking.CreatedAt, &booking.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, booking)
	}

	return bookings, nil
}

func (s *UserService) GetUserOrders(userID string, limit int) ([]models.Order, error) {
	query := `
		SELECT id, user_id, company_id, order_items, total_amount, status,
			   shipping_address, payment_id, tracking_number, created_at, updated_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2`

	rows, err := s.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		err := rows.Scan(
			&order.ID, &order.UserID, &order.CompanyID, &order.OrderItems,
			&order.TotalAmount, &order.Status, &order.ShippingAddress,
			&order.PaymentID, &order.TrackingNumber, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		orders = append(orders, order)
	}

	return orders, nil
}

// User validation
func (s *UserService) ValidateUserAccess(userID, targetUserID string) bool {
	// Users can only access their own data unless they're admin
	return userID == targetUserID
}

func (s *UserService) IsEmailTaken(email string) (bool, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE email = $1", email).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
