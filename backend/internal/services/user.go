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
			date_of_birth, phone, address, apartment_number, country, state, city, 
			postal_code, timezone, avatar_url, emergency_contact, emergency_contact_name,
			emergency_contact_phone, emergency_contact_relation, vet_contact, vet_name,
			vet_clinic, vet_phone, notification_methods, notifications_push, 
			notifications_sms, notifications_email, marketing_opt_in, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
			$17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
		)`

	_, err := s.db.Exec(query,
		user.ID, user.FirebaseUID, user.Email, user.FirstName, user.LastName,
		user.Role, user.Gender, user.DateOfBirth, user.Phone, user.Address,
		user.ApartmentNumber, user.Country, user.State, user.City, user.PostalCode,
		user.Timezone, user.AvatarURL, user.EmergencyContact, user.EmergencyContactName,
		user.EmergencyContactPhone, user.EmergencyContactRelation, user.VetContact,
		user.VetName, user.VetClinic, user.VetPhone, user.NotificationMethods,
		user.NotificationsPush, user.NotificationsSMS, user.NotificationsEmail,
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
		SELECT id, firebase_uid, email, 
			   COALESCE(first_name, '') as first_name, 
			   COALESCE(last_name, '') as last_name, 
			   role, 
			   COALESCE(gender, '') as gender,
			   date_of_birth, 
			   COALESCE(phone, '') as phone, 
			   COALESCE(address, '') as address, 
			   COALESCE(apartment_number, '') as apartment_number, 
			   COALESCE(country, '') as country, 
			   COALESCE(state, '') as state, 
			   COALESCE(city, '') as city, 
			   COALESCE(postal_code, '') as postal_code, 
			   COALESCE(timezone, '') as timezone, 
			   COALESCE(avatar_url, '') as avatar_url, 
			   COALESCE(emergency_contact, '') as emergency_contact, 
			   COALESCE(emergency_contact_name, '') as emergency_contact_name,
			   COALESCE(emergency_contact_phone, '') as emergency_contact_phone, 
			   COALESCE(emergency_contact_relation, '') as emergency_contact_relation, 
			   COALESCE(vet_contact, '') as vet_contact, 
			   COALESCE(vet_name, '') as vet_name,
			   COALESCE(vet_clinic, '') as vet_clinic, 
			   COALESCE(vet_phone, '') as vet_phone, 
			   notification_methods, 
			   notifications_push, 
			   notifications_sms, 
			   notifications_email, 
			   marketing_opt_in, 
			   created_at, 
			   updated_at
		FROM users WHERE firebase_uid = $1`

	err := s.db.QueryRow(query, firebaseUID).Scan(
		&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
		&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
		&user.ApartmentNumber, &user.Country, &user.State, &user.City, &user.PostalCode,
		&user.Timezone, &user.AvatarURL, &user.EmergencyContact, &user.EmergencyContactName,
		&user.EmergencyContactPhone, &user.EmergencyContactRelation, &user.VetContact,
		&user.VetName, &user.VetClinic, &user.VetPhone, &user.NotificationMethods,
		&user.NotificationsPush, &user.NotificationsSMS, &user.NotificationsEmail,
		&user.MarketingOptIn, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUsers returns paginated list of users (admin only)
func (s *UserService) GetUsers(page, limit int, role string) ([]models.User, error) {
	offset := (page - 1) * limit

	query := `
		SELECT id, firebase_uid, email, 
		       COALESCE(first_name, '') as first_name, 
		       COALESCE(last_name, '') as last_name, 
		       role, 
		       COALESCE(phone, '') as phone, 
		       COALESCE(country, '') as country, 
		       COALESCE(state, '') as state, 
		       COALESCE(city, '') as city, 
		       created_at
		FROM users`

	args := []interface{}{}

	if role != "" {
		query += " WHERE role = $1"
		args = append(args, role)
		query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3"
		args = append(args, limit, offset)
	} else {
		query += " ORDER BY created_at DESC LIMIT $1 OFFSET $2"
		args = append(args, limit, offset)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.FirebaseUID, &user.Email,
			&user.FirstName, &user.LastName, &user.Role,
			&user.Phone, &user.Country, &user.State, &user.City,
			&user.CreatedAt,
		)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return users, nil
}

// SearchUsers searches users by query (admin only)
func (s *UserService) SearchUsers(query, role string, limit int) ([]models.User, error) {
	sqlQuery := `
		SELECT id, firebase_uid, email, 
		       COALESCE(first_name, '') as first_name, 
		       COALESCE(last_name, '') as last_name, 
		       role, 
		       COALESCE(phone, '') as phone, 
		       COALESCE(country, '') as country, 
		       COALESCE(state, '') as state, 
		       COALESCE(city, '') as city, 
		       created_at
		FROM users
		WHERE (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)`

	args := []interface{}{"%" + query + "%"}

	if role != "" {
		sqlQuery += " AND role = $2"
		args = append(args, role)
		sqlQuery += " ORDER BY created_at DESC LIMIT $3"
		args = append(args, limit)
	} else {
		sqlQuery += " ORDER BY created_at DESC LIMIT $2"
		args = append(args, limit)
	}

	rows, err := s.db.Query(sqlQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID, &user.FirebaseUID, &user.Email,
			&user.FirstName, &user.LastName, &user.Role,
			&user.Phone, &user.Country, &user.State, &user.City,
			&user.CreatedAt,
		)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return users, nil
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	query := `
		SELECT id, firebase_uid, email, first_name, last_name, role, gender,
			   date_of_birth, phone, address, apartment_number, country, state, city, 
			   postal_code, timezone, avatar_url, emergency_contact, emergency_contact_name,
			   emergency_contact_phone, emergency_contact_relation, vet_contact, vet_name,
			   vet_clinic, vet_phone, notification_methods, notifications_push, 
			   notifications_sms, notifications_email, marketing_opt_in, created_at, updated_at
		FROM users WHERE email = $1`

	err := s.db.QueryRow(query, email).Scan(
		&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
		&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
		&user.ApartmentNumber, &user.Country, &user.State, &user.City, &user.PostalCode,
		&user.Timezone, &user.AvatarURL, &user.EmergencyContact, &user.EmergencyContactName,
		&user.EmergencyContactPhone, &user.EmergencyContactRelation, &user.VetContact,
		&user.VetName, &user.VetClinic, &user.VetPhone, &user.NotificationMethods,
		&user.NotificationsPush, &user.NotificationsSMS, &user.NotificationsEmail,
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
			phone = $6, address = $7, apartment_number = $8, country = $9, state = $10, 
			city = $11, postal_code = $12, timezone = $13, avatar_url = $14, 
			emergency_contact = $15, emergency_contact_name = $16, emergency_contact_phone = $17,
			emergency_contact_relation = $18, vet_contact = $19, vet_name = $20, vet_clinic = $21,
			vet_phone = $22, notification_methods = $23, notifications_push = $24, 
			notifications_sms = $25, notifications_email = $26, marketing_opt_in = $27,
			updated_at = $28
		WHERE id = $1`

	_, err := s.db.Exec(query,
		userID, updates.FirstName, updates.LastName, updates.Gender,
		updates.DateOfBirth, updates.Phone, updates.Address, updates.ApartmentNumber,
		updates.Country, updates.State, updates.City, updates.PostalCode, updates.Timezone,
		updates.AvatarURL, updates.EmergencyContact, updates.EmergencyContactName,
		updates.EmergencyContactPhone, updates.EmergencyContactRelation, updates.VetContact,
		updates.VetName, updates.VetClinic, updates.VetPhone, updates.NotificationMethods,
		updates.NotificationsPush, updates.NotificationsSMS, updates.NotificationsEmail,
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

	if role != "" {
		whereClause = "WHERE u.role = $3"
		args = append(args, role)
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users u %s", whereClause)
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
		SELECT u.id, u.firebase_uid, u.email, 
		       COALESCE(u.first_name, '') as first_name, 
		       COALESCE(u.last_name, '') as last_name, 
		       u.role, 
		       COALESCE(u.gender, '') as gender,
		       u.date_of_birth, 
		       COALESCE(u.phone, '') as phone, 
		       COALESCE(u.address, '') as address, 
		       COALESCE(u.country, '') as country, 
		       COALESCE(u.state, '') as state, 
		       COALESCE(u.city, '') as city, 
		       COALESCE(u.timezone, '') as timezone,
		       COALESCE(u.avatar_url, '') as avatar_url, 
		       COALESCE(u.emergency_contact, '') as emergency_contact, 
		       COALESCE(u.vet_contact, '') as vet_contact, 
		       COALESCE(u.notification_methods::text, '[]') as notification_methods,
		       COALESCE(u.marketing_opt_in, false) as marketing_opt_in, 
		       u.created_at, u.updated_at,
		       -- Analytics fields
		       COALESCE(bs.total_bookings, 0) as total_bookings,
		       COALESCE(os.total_orders, 0) as total_orders,
		       COALESCE(os.order_frequency, 0) as order_frequency,
		       COALESCE(os.average_check, 0) as average_check,
		       COALESCE(os.total_spent, 0) as total_spent,
		       COALESCE(os.total_spent * 0.1, 0) as zootel_commission,
		       COALESCE(os.cancelled_orders, 0) as cancelled_orders,
		       COALESCE(os.refunded_orders, 0) as refunded_orders,
		       COALESCE(cs.favorite_category, '') as favorite_category,
		       COALESCE(cs.favorite_company, '') as favorite_company,
		       COALESCE(ps.preferred_payment, '') as preferred_payment
		FROM users u
		LEFT JOIN (
			SELECT user_id, 
				COUNT(*) as total_bookings
			FROM bookings 
			WHERE status IN ('confirmed', 'completed')
			GROUP BY user_id
		) bs ON u.id = bs.user_id
		LEFT JOIN (
			SELECT user_id,
				COUNT(*) as total_orders,
				ROUND(COUNT(*)::numeric / GREATEST(EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 2592000, 1), 2) as order_frequency,
				ROUND(AVG(total_amount), 2) as average_check,
				ROUND(SUM(total_amount), 2) as total_spent,
				COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
				COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_orders
			FROM orders
			GROUP BY user_id
		) os ON u.id = os.user_id
		LEFT JOIN (
			SELECT user_id,
				COALESCE(MODE() WITHIN GROUP (ORDER BY s.category_id), '') as favorite_category,
				COALESCE(MODE() WITHIN GROUP (ORDER BY c.name), '') as favorite_company
			FROM bookings b
			JOIN services s ON b.service_id = s.id
			JOIN companies c ON s.company_id = c.id
			WHERE b.status IN ('confirmed', 'completed') 
			AND s.category_id IS NOT NULL
			GROUP BY user_id
		) cs ON u.id = cs.user_id
		LEFT JOIN (
			SELECT user_id,
				MODE() WITHIN GROUP (ORDER BY payment_method) as preferred_payment
			FROM payments
			WHERE status = 'completed'
			GROUP BY user_id
		) ps ON u.id = ps.user_id
		%s
		ORDER BY u.created_at DESC
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
		var notificationMethodsStr string
		err := rows.Scan(
			&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName,
			&user.Role, &user.Gender, &user.DateOfBirth, &user.Phone, &user.Address,
			&user.Country, &user.State, &user.City, &user.Timezone, &user.AvatarURL,
			&user.EmergencyContact, &user.VetContact, &notificationMethodsStr,
			&user.MarketingOptIn, &user.CreatedAt, &user.UpdatedAt,
			// Analytics fields
			&user.TotalBookings, &user.TotalOrders, &user.OrderFrequency,
			&user.AverageCheck, &user.TotalSpent, &user.ZootelCommission,
			&user.CancelledOrders, &user.RefundedOrders, &user.FavoriteCategory,
			&user.FavoriteCompany, &user.PreferredPayment,
		)
		if err != nil {
			return nil, 0, err
		}

		// Convert string back to pq.StringArray if needed
		// For now, we'll leave it as empty array since it's not used in UI
		user.NotificationMethods = pq.StringArray{}
		users = append(users, user)
	}

	return users, total, nil
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
		SELECT id, owner_id, name, COALESCE(description, '') as description, 
			   COALESCE(business_type, '') as business_type, 
			   COALESCE(country, '') as country, COALESCE(state, '') as state, 
			   COALESCE(city, '') as city, COALESCE(address, '') as address, 
			   COALESCE(phone, '') as phone, COALESCE(email, '') as email, 
			   COALESCE(website, '') as website, COALESCE(logo_url, '') as logo_url,
			   COALESCE(business_hours, '') as business_hours, 
			   COALESCE(plan_id::text, '') as plan_id, 
			   COALESCE(trial_expired, false) as trial_expired, 
			   COALESCE(special_partner, false) as special_partner,
			   COALESCE(manual_enabled_crm, false) as manual_enabled_crm, 
			   COALESCE(manual_enabled_ai_agents, false) as manual_enabled_ai_agents,
			   COALESCE(is_demo, false) as is_demo, COALESCE(is_active, true) as is_active,
			   COALESCE(website_integration_enabled, false) as website_integration_enabled,
			   COALESCE(api_key, '') as api_key, 
			   COALESCE(publish_to_marketplace, true) as publish_to_marketplace,
			   COALESCE(subscription_status, 'trial') as subscription_status, 
			   trial_ends_at, subscription_expires_at,
			   latitude, longitude, created_at, updated_at
		FROM companies WHERE owner_id = $1`

	err := s.db.QueryRow(query, ownerID).Scan(
		&company.ID, &company.OwnerID, &company.Name, &company.Description,
		&company.BusinessType, &company.Country, &company.State, &company.City,
		&company.Address, &company.Phone, &company.Email, &company.Website,
		&company.LogoURL, &company.BusinessHours,
		&company.PlanID, &company.TrialExpired, &company.SpecialPartner,
		&company.ManualEnabledCRM, &company.ManualEnabledAIAgents,
		&company.IsDemo, &company.IsActive, &company.WebsiteIntegrationEnabled,
		&company.APIKey, &company.PublishToMarketplace,
		&company.SubscriptionStatus, &company.TrialEndsAt, &company.SubscriptionExpiresAt,
		&company.Latitude, &company.Longitude, &company.CreatedAt, &company.UpdatedAt,
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
			&order.ID, &order.UserID, &order.CompanyID, &order.Items,
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
