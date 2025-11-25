package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"sort"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type BookingService struct {
	db                  *sql.DB
	notificationService *NotificationService
	emailService        *EmailService
	smsService          *SMSService
}

func NewBookingService(db *sql.DB, notificationService *NotificationService, emailService *EmailService, smsService *SMSService) *BookingService {
	return &BookingService{
		db:                  db,
		notificationService: notificationService,
		emailService:        emailService,
		smsService:          smsService,
	}
}

type BookingRequest struct {
	UserID     string    `json:"user_id" binding:"required"`
	CompanyID  string    `json:"company_id" binding:"required"`
	ServiceID  string    `json:"service_id" binding:"required"`
	PetID      string    `json:"pet_id"` // Made optional for company bookings
	EmployeeID *string   `json:"employee_id"`
	DateTime   time.Time `json:"date_time" binding:"required"`
	Notes      string    `json:"notes"`
}

type AvailabilitySlot struct {
	DateTime     time.Time `json:"date_time"`
	Available    bool      `json:"available"`
	EmployeeID   *string   `json:"employee_id"`
	EmployeeName string    `json:"employee_name"`
	MaxBookings  int       `json:"max_bookings"`
	CurrentCount int       `json:"current_count"`
	ServiceID    string    `json:"service_id"`
	ServiceName  string    `json:"service_name"`
	Price        float64   `json:"price"`
	Duration     int       `json:"duration"`
}

type BookingNotification struct {
	Type        string                 `json:"type"`
	BookingID   string                 `json:"booking_id"`
	UserID      string                 `json:"user_id"`
	CompanyID   string                 `json:"company_id"`
	ScheduledAt time.Time              `json:"scheduled_at"`
	Data        map[string]interface{} `json:"data"`
}

type EmployeeAvailability struct {
	EmployeeID      string `json:"employee_id"`
	EmployeeName    string `json:"employee_name"`
	Available       bool   `json:"available"`
	CurrentBookings int    `json:"current_bookings"`
}

type AlternativeSlot struct {
	DateTime     time.Time     `json:"date_time"`
	EmployeeID   string        `json:"employee_id"`
	EmployeeName string        `json:"employee_name"`
	TimeDiff     time.Duration `json:"time_diff"`
	Priority     float64       `json:"priority"`
}

type BookingResult struct {
	Success          bool
	Booking          *models.Booking
	AssignedEmployee *EmployeeAvailability
	Message          string
	Alternatives     []AlternativeSlot
}

type AIBookingRequest struct {
	UserID    string    `json:"user_id" binding:"required"`
	CompanyID string    `json:"company_id" binding:"required"`
	ServiceID string    `json:"service_id" binding:"required"`
	PetID     string    `json:"pet_id" binding:"required"`
	DateTime  time.Time `json:"date_time" binding:"required"`
	Notes     string    `json:"notes"`
}

type AIBookingResponse struct {
	Success         bool
	BookingID       string
	Message         string
	Employee        *EmployeeInfo // Only for internal use, not shown to clients
	Alternatives    []string
	SuggestedAction string
	ClientMessage   string // Clean message for clients without employee details
}

type EmployeeInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// CreateBooking creates a new booking with availability checking
func (s *BookingService) CreateBooking(req *BookingRequest) (*models.Booking, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Validate service exists and is active
	var service models.Service
	err = tx.QueryRow(`
		SELECT id, company_id, name, price, duration, max_bookings_per_slot, 
			   advance_booking_days, cancellation_policy, is_active
		FROM services 
		WHERE id = $1 AND company_id = $2 AND is_active = true
	`, req.ServiceID, req.CompanyID).Scan(
		&service.ID, &service.CompanyID, &service.Name, &service.Price,
		&service.Duration, &service.MaxBookingsPerSlot, &service.AdvanceBookingDays,
		&service.CancellationPolicy, &service.IsActive,
	)
	if err != nil {
		return nil, fmt.Errorf("service not found or inactive")
	}

	// 2. Check advance booking limit
	maxAdvanceDate := time.Now().AddDate(0, 0, service.AdvanceBookingDays)
	if req.DateTime.After(maxAdvanceDate) {
		return nil, fmt.Errorf("booking date exceeds advance booking limit of %d days", service.AdvanceBookingDays)
	}

	// 3. Check if booking is in the past
	if req.DateTime.Before(time.Now()) {
		return nil, fmt.Errorf("cannot book appointments in the past")
	}

	// 4. Check availability
	available, err := s.checkTimeSlotAvailability(tx, req.ServiceID, req.DateTime, req.EmployeeID)
	if err != nil {
		return nil, err
	}
	if !available {
		return nil, fmt.Errorf("requested time slot is not available")
	}

	// 5. Validate pet belongs to user
	var petOwnerID string
	err = tx.QueryRow("SELECT user_id FROM pets WHERE id = $1", req.PetID).Scan(&petOwnerID)
	if err != nil {
		return nil, fmt.Errorf("pet not found")
	}
	if petOwnerID != req.UserID {
		return nil, fmt.Errorf("pet does not belong to user")
	}

	// 6. Create booking
	booking := &models.Booking{
		ID:         uuid.New().String(),
		UserID:     req.UserID,
		CompanyID:  req.CompanyID,
		ServiceID:  req.ServiceID,
		PetID:      &req.PetID,
		EmployeeID: req.EmployeeID,
		DateTime:   req.DateTime,
		Duration:   service.Duration,
		Price:      service.Price,
		Status:     "pending",
		Notes:      &req.Notes,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	_, err = tx.Exec(`
		INSERT INTO bookings (
			id, user_id, company_id, service_id, pet_id, employee_id,
			date_time, duration, price, status, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`, booking.ID, booking.UserID, booking.CompanyID, booking.ServiceID,
		booking.PetID, booking.EmployeeID, booking.DateTime, booking.Duration,
		booking.Price, booking.Status, booking.Notes, booking.CreatedAt, booking.UpdatedAt)

	if err != nil {
		return nil, err
	}

	// 7. Schedule notifications
	err = s.scheduleBookingNotifications(tx, booking)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	// 8. Send immediate notifications
	go s.sendBookingCreatedNotifications(booking)

	return booking, nil
}

// CheckAvailability returns available time slots for a service
func (s *BookingService) CheckAvailability(serviceID string, date time.Time, employeeID *string) ([]AvailabilitySlot, error) {
	// Get service details and business hours
	var service models.Service
	err := s.db.QueryRow(`
		SELECT s.id, s.name, s.price, s.duration, s.max_bookings_per_slot,
			   s.available_days, s.start_time, s.end_time, s.buffer_time_before, s.buffer_time_after,
			   c.business_hours
		FROM services s
		JOIN companies c ON s.company_id = c.id
		WHERE s.id = $1 AND s.is_active = true
	`, serviceID).Scan(
		&service.ID, &service.Name, &service.Price, &service.Duration,
		&service.MaxBookingsPerSlot, &service.AvailableDays,
		&service.StartTime, &service.EndTime, &service.BufferTimeBefore,
		&service.BufferTimeAfter, &service.CompanyID, // using CompanyID field to store business_hours
	)
	if err != nil {
		return nil, err
	}

	// Check if the requested date is available for this service
	dayOfWeek := date.Weekday().String()
	available := false
	for _, availableDay := range service.AvailableDays {
		if availableDay == strings.ToLower(dayOfWeek) {
			available = true
			break
		}
	}
	if !available {
		return []AvailabilitySlot{}, nil
	}

	// Generate time slots for the day
	slots := s.generateTimeSlots(service, date)

	// Get existing bookings for the day
	existingBookings, err := s.getExistingBookings(serviceID, date, employeeID)
	if err != nil {
		return nil, err
	}

	// Check availability for each slot
	var availableSlots []AvailabilitySlot
	for _, slot := range slots {
		currentCount := 0
		for _, booking := range existingBookings {
			if s.timeSlotsOverlap(slot, booking.DateTime, time.Duration(service.Duration)*time.Minute) {
				currentCount++
			}
		}

		availableSlots = append(availableSlots, AvailabilitySlot{
			DateTime:     slot,
			Available:    currentCount < service.MaxBookingsPerSlot,
			ServiceID:    service.ID,
			ServiceName:  service.Name,
			Price:        service.Price,
			Duration:     service.Duration,
			MaxBookings:  service.MaxBookingsPerSlot,
			CurrentCount: currentCount,
		})
	}

	return availableSlots, nil
}

// UpdateBooking updates a booking with provided fields
func (s *BookingService) UpdateBooking(bookingID string, updates map[string]interface{}) (*models.Booking, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	// Add updated_at automatically
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	// Handle each possible update field
	if dateTime, ok := updates["date_time"]; ok {
		setParts = append(setParts, fmt.Sprintf("date_time = $%d", argIndex))
		args = append(args, dateTime)
		argIndex++
	}

	if notes, ok := updates["notes"]; ok {
		setParts = append(setParts, fmt.Sprintf("notes = $%d", argIndex))
		args = append(args, notes)
		argIndex++
	}

	if employeeID, ok := updates["employee_id"]; ok {
		setParts = append(setParts, fmt.Sprintf("employee_id = $%d", argIndex))
		args = append(args, employeeID)
		argIndex++
	}

	if status, ok := updates["status"]; ok {
		setParts = append(setParts, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, status)
		argIndex++
	}

	if duration, ok := updates["duration"]; ok {
		setParts = append(setParts, fmt.Sprintf("duration = $%d", argIndex))
		args = append(args, duration)
		argIndex++
	}

	if len(setParts) == 1 { // Only updated_at
		return nil, fmt.Errorf("no valid fields to update")
	}

	// Add the booking ID as the last argument
	args = append(args, bookingID)

	query := fmt.Sprintf(`
		UPDATE bookings 
		SET %s 
		WHERE id = $%d
		RETURNING id, user_id, company_id, service_id, pet_id, employee_id,
				  date_time, duration, price, status, notes, created_at, updated_at
	`, strings.Join(setParts, ", "), argIndex)

	var booking models.Booking
	err = tx.QueryRow(query, args...).Scan(
		&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
		&booking.PetID, &booking.EmployeeID, &booking.DateTime, &booking.Duration,
		&booking.Price, &booking.Status, &booking.Notes, &booking.CreatedAt, &booking.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	return &booking, nil
}

// UpdateBookingStatus updates booking status and sends notifications
func (s *BookingService) UpdateBookingStatus(bookingID, newStatus string, notes string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get current booking
	var booking models.Booking
	err = tx.QueryRow(`
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, created_at, updated_at
		FROM bookings WHERE id = $1
	`, bookingID).Scan(
		&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
		&booking.PetID, &booking.EmployeeID, &booking.DateTime, &booking.Duration,
		&booking.Price, &booking.Status, &booking.Notes, &booking.CreatedAt, &booking.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// Validate status transition
	if !s.isValidStatusTransition(booking.Status, newStatus) {
		return fmt.Errorf("invalid status transition from %s to %s", booking.Status, newStatus)
	}

	// Update booking
	_, err = tx.Exec(`
		UPDATE bookings 
		SET status = $2, notes = $3, updated_at = $4 
		WHERE id = $1
	`, bookingID, newStatus, notes, time.Now())
	if err != nil {
		return err
	}

	// Handle status-specific logic
	switch newStatus {
	case "confirmed":
		err = s.scheduleReminderNotifications(tx, &booking)
	case "cancelled":
		err = s.cancelBookingNotifications(tx, bookingID)
	case "completed":
		err = s.scheduleFollowUpNotifications(tx, &booking)
	}

	if err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	// Send status change notifications
	go s.sendStatusChangeNotifications(&booking, newStatus)

	return nil
}

// GetBookingsByUser returns bookings for a specific user
func (s *BookingService) GetBookingsByUser(userID string, status string, limit int) ([]models.Booking, error) {
	whereClause := "WHERE user_id = $1"
	args := []interface{}{userID}
	argIndex := 2

	if status != "" {
		whereClause += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, payment_id,
			   created_at, updated_at
		FROM bookings %s
		ORDER BY date_time DESC
		LIMIT $%d
	`, whereClause, argIndex)

	args = append(args, limit)

	rows, err := s.db.Query(query, args...)
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

// GetBookingsByCompany retrieves bookings by company ID with full customer data
func (s *BookingService) GetBookingsByCompany(companyID string, startDate ...interface{}) ([]*models.BookingWithCustomerData, error) {
	query := `
		SELECT 
			b.id, b.user_id, b.company_id, b.service_id, b.pet_id, b.employee_id,
			b.date_time, b.duration, b.price, b.status, b.notes, b.payment_id,
			b.created_at, b.updated_at,
			-- Extended user data
			u.first_name, u.last_name, u.email, u.phone, u.gender, u.date_of_birth,
			COALESCE(u.address, '') as address,
			COALESCE(u.apartment_number, '') as apartment_number,
			COALESCE(u.country, '') as country,
			COALESCE(u.state, '') as state,
			COALESCE(u.city, '') as city,
			COALESCE(u.postal_code, '') as postal_code,
			COALESCE(u.emergency_contact_name, '') as emergency_contact_name,
			COALESCE(u.emergency_contact_phone, '') as emergency_contact_phone,
			COALESCE(u.emergency_contact_relation, '') as emergency_contact_relation,
			-- Extended pet data
			COALESCE(p.name, '') as pet_name,
			COALESCE(p.gender, '') as pet_gender,
			p.date_of_birth as pet_date_of_birth,
			COALESCE(p.weight, 0) as pet_weight,
			COALESCE(p.microchip_id, '') as pet_microchip_id,
			COALESCE(p.sterilized, false) as pet_sterilized,
			COALESCE(p.chronic_conditions, '{}') as pet_chronic_conditions,
			COALESCE(p.allergies, '{}') as pet_allergies,
			COALESCE(p.dietary_restrictions, '') as pet_dietary_restrictions,
			COALESCE(p.special_needs, '') as pet_special_needs,
			COALESCE(p.vet_name, '') as pet_vet_name,
			COALESCE(p.vet_phone, '') as pet_vet_phone,
			COALESCE(p.vet_clinic, '') as pet_vet_clinic,
			COALESCE(p.behavior_notes, '') as pet_behavior_notes,
			COALESCE(p.stress_reactions, '') as pet_stress_reactions,
			COALESCE(p.favorite_toys, '') as pet_favorite_toys,
			COALESCE(pt.name, '') as pet_type_name,
			COALESCE(br.name, '') as breed_name
		FROM bookings b
		JOIN users u ON b.user_id = u.id
		LEFT JOIN pets p ON b.pet_id = p.id
		LEFT JOIN pet_types pt ON p.pet_type_id = pt.id
		LEFT JOIN breeds br ON p.breed_id = br.id
		WHERE b.company_id = $1`

	args := []interface{}{companyID}
	argIndex := 2

	// Handle optional date range and status parameters
	if len(startDate) >= 2 {
		if startTime, ok := startDate[0].(time.Time); ok {
			if endTime, ok := startDate[1].(time.Time); ok {
				query += fmt.Sprintf(" AND DATE(b.date_time) BETWEEN $%d AND $%d", argIndex, argIndex+1)
				args = append(args, startTime, endTime)
				argIndex += 2
			}
		}
	}

	if len(startDate) >= 3 {
		if status, ok := startDate[2].(string); ok && status != "" {
			query += fmt.Sprintf(" AND b.status = $%d", argIndex)
			args = append(args, status)
			argIndex++
		}
	}

	query += " ORDER BY b.created_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query bookings: %w", err)
	}
	defer rows.Close()

	var bookings []*models.BookingWithCustomerData
	for rows.Next() {
		booking := &models.Booking{}
		bookingWithData := &models.BookingWithCustomerData{Booking: booking}

		var petName, petGender, petDietaryRestrictions, petSpecialNeeds, petVetName, petVetPhone, petVetClinic sql.NullString
		var petBehaviorNotes, petStressReactions, petFavoriteToys, petTypeName, breedName sql.NullString
		var petMicrochipID sql.NullString
		var petDateOfBirth sql.NullTime
		var petWeight sql.NullFloat64
		var petSterilized sql.NullBool
		var petChronicConditions, petAllergies pq.StringArray

		err := rows.Scan(
			&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
			&booking.PetID, &booking.EmployeeID, &booking.DateTime, &booking.Duration,
			&booking.Price, &booking.Status, &booking.Notes, &booking.PaymentID,
			&booking.CreatedAt, &booking.UpdatedAt,
			// Extended user data
			&bookingWithData.Customer.FirstName, &bookingWithData.Customer.LastName,
			&bookingWithData.Customer.Email, &bookingWithData.Customer.Phone,
			&bookingWithData.Customer.Gender, &bookingWithData.Customer.DateOfBirth,
			&bookingWithData.Customer.Address, &bookingWithData.Customer.ApartmentNumber,
			&bookingWithData.Customer.Country, &bookingWithData.Customer.State,
			&bookingWithData.Customer.City, &bookingWithData.Customer.PostalCode,
			&bookingWithData.Customer.EmergencyContactName, &bookingWithData.Customer.EmergencyContactPhone,
			&bookingWithData.Customer.EmergencyContactRelation,
			// Extended pet data
			&petName, &petGender, &petDateOfBirth, &petWeight, &petMicrochipID,
			&petSterilized, &petChronicConditions, &petAllergies, &petDietaryRestrictions,
			&petSpecialNeeds, &petVetName, &petVetPhone, &petVetClinic,
			&petBehaviorNotes, &petStressReactions, &petFavoriteToys,
			&petTypeName, &breedName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}

		// Set customer data
		bookingWithData.Customer.UserID = booking.UserID

		// Set extended pet data
		if booking.PetID != nil {
			bookingWithData.Pet.PetID = *booking.PetID
		}

		if petName.Valid {
			bookingWithData.Pet.PetName = petName.String
		}
		if petGender.Valid {
			bookingWithData.Pet.Gender = petGender.String
		}
		if petDateOfBirth.Valid {
			bookingWithData.Pet.DateOfBirth = &petDateOfBirth.Time
		}
		if petWeight.Valid {
			bookingWithData.Pet.Weight = petWeight.Float64
		}
		if petMicrochipID.Valid {
			bookingWithData.Pet.MicrochipID = petMicrochipID.String
		}
		if petSterilized.Valid {
			bookingWithData.Pet.Sterilized = petSterilized.Bool
		}
		if petChronicConditions != nil {
			bookingWithData.Pet.ChronicConditions = []string(petChronicConditions)
		}
		if petAllergies != nil {
			bookingWithData.Pet.Allergies = []string(petAllergies)
		}
		if petDietaryRestrictions.Valid {
			bookingWithData.Pet.DietaryRestrictions = petDietaryRestrictions.String
		}
		if petSpecialNeeds.Valid {
			bookingWithData.Pet.SpecialNeeds = petSpecialNeeds.String
		}
		if petVetName.Valid {
			bookingWithData.Pet.VetName = petVetName.String
		}
		if petVetPhone.Valid {
			bookingWithData.Pet.VetPhone = petVetPhone.String
		}
		if petVetClinic.Valid {
			bookingWithData.Pet.VetClinic = petVetClinic.String
		}
		if petBehaviorNotes.Valid {
			bookingWithData.Pet.BehaviorNotes = petBehaviorNotes.String
		}
		if petStressReactions.Valid {
			bookingWithData.Pet.StressReactions = petStressReactions.String
		}
		if petFavoriteToys.Valid {
			bookingWithData.Pet.FavoriteToys = petFavoriteToys.String
		}
		if petTypeName.Valid {
			bookingWithData.Pet.PetType = petTypeName.String
		}
		if breedName.Valid {
			bookingWithData.Pet.Breed = breedName.String
		}

		bookings = append(bookings, bookingWithData)
	}

	return bookings, nil
}

// GetCompanyCustomers returns all customers who made at least one booking/order with the company
func (s *BookingService) GetCompanyCustomers(companyID string) ([]models.CustomerData, error) {
	query := `
		SELECT DISTINCT
			u.id as user_id,
			u.first_name, u.last_name, u.email, u.phone, u.gender, u.date_of_birth,
			COALESCE(u.address, '') as address,
			COALESCE(u.apartment_number, '') as apartment_number,
			COALESCE(u.country, '') as country,
			COALESCE(u.state, '') as state,
			COALESCE(u.city, '') as city,
			COALESCE(u.postal_code, '') as postal_code,
			COALESCE(u.emergency_contact_name, '') as emergency_contact_name,
			COALESCE(u.emergency_contact_phone, '') as emergency_contact_phone,
			COALESCE(u.emergency_contact_relation, '') as emergency_contact_relation
		FROM users u
		WHERE u.id IN (
			SELECT DISTINCT user_id FROM bookings WHERE company_id = $1
			UNION
			SELECT DISTINCT user_id FROM orders WHERE company_id = $1
		)
		ORDER BY u.first_name, u.last_name
	`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query customers: %w", err)
	}
	defer rows.Close()

	var customers []models.CustomerData
	for rows.Next() {
		var customer models.CustomerData
		err := rows.Scan(
			&customer.UserID, &customer.FirstName, &customer.LastName,
			&customer.Email, &customer.Phone, &customer.Gender, &customer.DateOfBirth,
			&customer.Address, &customer.ApartmentNumber, &customer.Country,
			&customer.State, &customer.City, &customer.PostalCode,
			&customer.EmergencyContactName, &customer.EmergencyContactPhone,
			&customer.EmergencyContactRelation,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan customer: %w", err)
		}
		customers = append(customers, customer)
	}

	return customers, nil
}

// GetCustomerBookingHistory returns booking history for a specific customer
func (s *BookingService) GetCustomerBookingHistory(companyID, userID string) ([]*models.BookingWithCustomerData, error) {
	query := `
		SELECT 
			b.id, b.user_id, b.company_id, b.service_id, b.pet_id, b.employee_id,
			b.date_time, b.duration, b.price, b.status, b.notes, b.payment_id,
			b.created_at, b.updated_at,
			u.first_name, u.last_name, u.email, u.phone,
			COALESCE(u.country, '') as country,
			COALESCE(u.state, '') as state,
			COALESCE(u.city, '') as city,
			COALESCE(p.name, '') as pet_name,
			COALESCE(pt.name, '') as pet_type_name,
			COALESCE(b.breed, '') as breed_name
		FROM bookings b
		JOIN users u ON b.user_id = u.id
		LEFT JOIN pets p ON b.pet_id = p.id
		LEFT JOIN pet_types pt ON p.pet_type_id = pt.id
		WHERE b.company_id = $1 AND b.user_id = $2
		ORDER BY b.created_at DESC
	`

	rows, err := s.db.Query(query, companyID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query customer bookings: %w", err)
	}
	defer rows.Close()

	var bookings []*models.BookingWithCustomerData
	for rows.Next() {
		booking := &models.Booking{}
		bookingWithData := &models.BookingWithCustomerData{Booking: booking}

		err := rows.Scan(
			&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
			&booking.PetID, &booking.EmployeeID, &booking.DateTime, &booking.Duration,
			&booking.Price, &booking.Status, &booking.Notes, &booking.PaymentID,
			&booking.CreatedAt, &booking.UpdatedAt,
			&bookingWithData.Customer.FirstName, &bookingWithData.Customer.LastName,
			&bookingWithData.Customer.Email, &bookingWithData.Customer.Phone,
			&bookingWithData.Customer.Country, &bookingWithData.Customer.State,
			&bookingWithData.Customer.City,
			&bookingWithData.Pet.PetName, &bookingWithData.Pet.PetType,
			&bookingWithData.Pet.Breed,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan customer booking: %w", err)
		}

		// Set IDs
		bookingWithData.Customer.UserID = booking.UserID
		if booking.PetID != nil {
			bookingWithData.Pet.PetID = *booking.PetID
		}

		bookings = append(bookings, bookingWithData)
	}

	return bookings, nil
}

// Helper methods

func (s *BookingService) checkTimeSlotAvailability(tx *sql.Tx, serviceID string, dateTime time.Time, employeeID *string) (bool, error) {
	// Get service max bookings per slot
	var maxBookings int
	err := tx.QueryRow("SELECT max_bookings_per_slot FROM services WHERE id = $1", serviceID).Scan(&maxBookings)
	if err != nil {
		return false, err
	}

	// Count existing bookings for this time slot
	whereClause := `
		WHERE service_id = $1 
		AND date_time = $2 
		AND status NOT IN ('cancelled', 'rejected')
	`
	args := []interface{}{serviceID, dateTime}

	if employeeID != nil {
		whereClause += " AND employee_id = $3"
		args = append(args, *employeeID)
	}

	var currentBookings int
	query := fmt.Sprintf("SELECT COUNT(*) FROM bookings %s", whereClause)
	err = tx.QueryRow(query, args...).Scan(&currentBookings)
	if err != nil {
		return false, err
	}

	return currentBookings < maxBookings, nil
}

func (s *BookingService) generateTimeSlots(service models.Service, date time.Time) []time.Time {
	var slots []time.Time

	// Parse start and end times
	startTime, _ := time.Parse("15:04:05", service.StartTime)
	endTime, _ := time.Parse("15:04:05", service.EndTime)

	// Create slots from start to end time with service duration intervals
	current := time.Date(date.Year(), date.Month(), date.Day(),
		startTime.Hour(), startTime.Minute(), 0, 0, date.Location())
	end := time.Date(date.Year(), date.Month(), date.Day(),
		endTime.Hour(), endTime.Minute(), 0, 0, date.Location())

	duration := time.Duration(service.Duration) * time.Minute
	bufferBefore := time.Duration(service.BufferTimeBefore) * time.Minute
	bufferAfter := time.Duration(service.BufferTimeAfter) * time.Minute

	for current.Add(duration+bufferAfter).Before(end) || current.Add(duration+bufferAfter).Equal(end) {
		slots = append(slots, current)
		current = current.Add(duration + bufferBefore + bufferAfter)
	}

	return slots
}

func (s *BookingService) getExistingBookings(serviceID string, date time.Time, employeeID *string) ([]models.Booking, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	whereClause := `
		WHERE service_id = $1 
		AND date_time >= $2 
		AND date_time < $3 
		AND status NOT IN ('cancelled', 'rejected')
	`
	args := []interface{}{serviceID, startOfDay, endOfDay}

	if employeeID != nil {
		whereClause += " AND employee_id = $4"
		args = append(args, *employeeID)
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, payment_id,
			   created_at, updated_at
		FROM bookings %s
		ORDER BY date_time
	`, whereClause)

	rows, err := s.db.Query(query, args...)
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

func (s *BookingService) timeSlotsOverlap(slot1 time.Time, slot2 time.Time, duration time.Duration) bool {
	slot1End := slot1.Add(duration)
	slot2End := slot2.Add(duration)

	return slot1.Before(slot2End) && slot2.Before(slot1End)
}

func (s *BookingService) isValidStatusTransition(currentStatus, newStatus string) bool {
	validTransitions := map[string][]string{
		"pending":     {"confirmed", "cancelled", "rejected"},
		"confirmed":   {"in_progress", "cancelled", "rescheduled"},
		"in_progress": {"completed", "cancelled"},
		"completed":   {},
		"cancelled":   {},
		"rejected":    {},
		"rescheduled": {"confirmed", "cancelled"},
	}

	allowedStatuses, exists := validTransitions[currentStatus]
	if !exists {
		return false
	}

	for _, status := range allowedStatuses {
		if status == newStatus {
			return true
		}
	}

	return false
}

// Notification methods

func (s *BookingService) scheduleBookingNotifications(tx *sql.Tx, booking *models.Booking) error {
	notifications := []BookingNotification{
		{
			Type:        "booking_reminder_24h",
			BookingID:   booking.ID,
			UserID:      booking.UserID,
			CompanyID:   booking.CompanyID,
			ScheduledAt: booking.DateTime.Add(-24 * time.Hour),
		},
		{
			Type:        "booking_reminder_2h",
			BookingID:   booking.ID,
			UserID:      booking.UserID,
			CompanyID:   booking.CompanyID,
			ScheduledAt: booking.DateTime.Add(-2 * time.Hour),
		},
	}

	for _, notification := range notifications {
		notificationData, _ := json.Marshal(notification)
		_, err := tx.Exec(`
			INSERT INTO notification_schedule (id, user_id, type, title, message, scheduled_for, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`,
			uuid.New().String(),
			notification.UserID,
			notification.Type,
			"Booking Reminder",
			string(notificationData),
			notification.ScheduledAt,
			time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *BookingService) scheduleReminderNotifications(tx *sql.Tx, booking *models.Booking) error {
	// Additional reminders for confirmed bookings
	return s.scheduleBookingNotifications(tx, booking)
}

func (s *BookingService) cancelBookingNotifications(tx *sql.Tx, bookingID string) error {
	_, err := tx.Exec(`
		DELETE FROM notification_schedule 
		WHERE message LIKE '%"booking_id":"` + bookingID + `"%' AND sent = false
	`)
	return err
}

func (s *BookingService) scheduleFollowUpNotifications(tx *sql.Tx, booking *models.Booking) error {
	// Schedule follow-up notification 24 hours after completion
	followUpTime := booking.DateTime.Add(time.Duration(booking.Duration)*time.Minute + 24*time.Hour)

	notification := BookingNotification{
		Type:        "booking_followup",
		BookingID:   booking.ID,
		UserID:      booking.UserID,
		CompanyID:   booking.CompanyID,
		ScheduledAt: followUpTime,
	}

	notificationData, _ := json.Marshal(notification)
	_, err := tx.Exec(`
		INSERT INTO notification_schedule (id, user_id, type, title, message, scheduled_for, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		uuid.New().String(),
		notification.UserID,
		notification.Type,
		"How was your experience?",
		string(notificationData),
		notification.ScheduledAt,
		time.Now(),
	)

	return err
}

func (s *BookingService) sendBookingCreatedNotifications(booking *models.Booking) {
	// Send email/SMS notifications for booking creation
	// TODO: Implement email/SMS notification sending
	fmt.Printf("Booking created notification for booking ID: %s\n", booking.ID)
}

func (s *BookingService) sendStatusChangeNotifications(booking *models.Booking, newStatus string) {
	// Send notifications for status changes
	// TODO: Implement status change notifications
	fmt.Printf("Booking status changed to %s for booking ID: %s\n", newStatus, booking.ID)
}

// GetBookingByID returns a booking by its ID
func (s *BookingService) GetBookingByID(bookingID string) (*models.Booking, error) {
	var booking models.Booking
	err := s.db.QueryRow(`
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, payment_id,
			   created_at, updated_at
		FROM bookings WHERE id = $1
	`, bookingID).Scan(
		&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
		&booking.PetID, &booking.EmployeeID, &booking.DateTime, &booking.Duration,
		&booking.Price, &booking.Status, &booking.Notes, &booking.PaymentID,
		&booking.CreatedAt, &booking.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

// RescheduleBooking reschedules a booking to a new date/time
func (s *BookingService) RescheduleBooking(bookingID string, newDateTime time.Time, reason string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get current booking
	var booking models.Booking
	err = tx.QueryRow(`
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, created_at, updated_at
		FROM bookings WHERE id = $1
	`, bookingID).Scan(
		&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
		&booking.PetID, &booking.EmployeeID, &booking.DateTime, &booking.Duration,
		&booking.Price, &booking.Status, &booking.Notes, &booking.CreatedAt, &booking.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// Check availability for new time slot
	available, err := s.checkTimeSlotAvailability(tx, booking.ServiceID, newDateTime, booking.EmployeeID)
	if err != nil {
		return err
	}
	if !available {
		return fmt.Errorf("new time slot is not available")
	}

	// Update booking
	_, err = tx.Exec(`
		UPDATE bookings 
		SET date_time = $2, status = 'rescheduled', notes = $3, updated_at = $4 
		WHERE id = $1
	`, bookingID, newDateTime, reason, time.Now())
	if err != nil {
		return err
	}

	// Cancel old notifications and schedule new ones
	err = s.cancelBookingNotifications(tx, bookingID)
	if err != nil {
		return err
	}

	booking.DateTime = newDateTime
	err = s.scheduleBookingNotifications(tx, &booking)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetBookingsByEmployee retrieves bookings by employee ID with optional date range and status filtering
func (s *BookingService) GetBookingsByEmployee(employeeID string, startDate, endDate time.Time, status string) ([]models.Booking, error) {
	query := `
		SELECT 
			id, user_id, company_id, service_id, pet_id, employee_id,
			date_time, duration, price, status, notes, payment_id,
			created_at, updated_at
		FROM bookings 
		WHERE employee_id = $1
		AND DATE(date_time) BETWEEN $2 AND $3`

	args := []interface{}{employeeID, startDate, endDate}
	argIndex := 4

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
	}

	query += " ORDER BY date_time ASC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query employee bookings: %w", err)
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
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}
		bookings = append(bookings, booking)
	}

	return bookings, nil
}

// GetBookingStatistics returns booking statistics for a company
func (s *BookingService) GetBookingStatistics(companyID string, days int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	whereClause := ""
	args := []interface{}{}
	argIndex := 1

	if companyID != "" {
		whereClause = "WHERE company_id = $1"
		args = append(args, companyID)
		argIndex++
	}

	if days > 0 {
		if whereClause == "" {
			whereClause = fmt.Sprintf("WHERE created_at >= NOW() - INTERVAL '%d days'", days)
		} else {
			whereClause += fmt.Sprintf(" AND created_at >= NOW() - INTERVAL '%d days'", days)
		}
	}

	// Total bookings and revenue
	query := fmt.Sprintf(`
		SELECT 
			COUNT(*) as total_bookings,
			COALESCE(SUM(price), 0) as total_revenue,
			COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
			COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
			COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings
		FROM bookings %s
	`, whereClause)

	var totalBookings, completedBookings, cancelledBookings, pendingBookings int
	var totalRevenue float64

	err := s.db.QueryRow(query, args...).Scan(
		&totalBookings, &totalRevenue, &completedBookings,
		&cancelledBookings, &pendingBookings,
	)
	if err != nil {
		return nil, err
	}

	stats["total_bookings"] = totalBookings
	stats["total_revenue"] = totalRevenue
	stats["completed_bookings"] = completedBookings
	stats["cancelled_bookings"] = cancelledBookings
	stats["pending_bookings"] = pendingBookings

	// Calculate rates
	if totalBookings > 0 {
		stats["completion_rate"] = float64(completedBookings) / float64(totalBookings) * 100
		stats["cancellation_rate"] = float64(cancelledBookings) / float64(totalBookings) * 100
		stats["average_booking_value"] = totalRevenue / float64(totalBookings)
	} else {
		stats["completion_rate"] = 0.0
		stats["cancellation_rate"] = 0.0
		stats["average_booking_value"] = 0.0
	}

	return stats, nil
}

// GetUpcomingBookings returns upcoming bookings for a user
func (s *BookingService) GetUpcomingBookings(userID string, limit int) ([]models.Booking, error) {
	query := `
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, payment_id,
			   created_at, updated_at
		FROM bookings 
		WHERE user_id = $1 
			AND date_time >= NOW() 
			AND status IN ('confirmed', 'pending')
		ORDER BY date_time ASC
		LIMIT $2
	`

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

// FindAvailableEmployee finds the best available employee for a service at a specific time
func (s *BookingService) FindAvailableEmployee(serviceID string, dateTime time.Time) (*EmployeeAvailability, error) {
	// Get all employees assigned to this service
	var assignedEmployees []string
	err := s.db.QueryRow(`
		SELECT assigned_employees 
		FROM services 
		WHERE id = $1 AND is_active = true
	`, serviceID).Scan(pq.Array(&assignedEmployees))

	if err != nil {
		return nil, fmt.Errorf("failed to get service employees: %w", err)
	}

	if len(assignedEmployees) == 0 {
		return nil, fmt.Errorf("no employees assigned to this service")
	}

	// Check availability for each employee
	var availableEmployees []EmployeeAvailability

	for _, employeeID := range assignedEmployees {
		availability, err := s.checkEmployeeAvailability(employeeID, serviceID, dateTime)
		if err != nil {
			continue // Skip this employee if there's an error
		}

		if availability.Available {
			availableEmployees = append(availableEmployees, *availability)
		}
	}

	if len(availableEmployees) == 0 {
		return nil, fmt.Errorf("no employees available at requested time")
	}

	// Find the best employee (least busy)
	bestEmployee := &availableEmployees[0]
	for i := range availableEmployees {
		if availableEmployees[i].CurrentBookings < bestEmployee.CurrentBookings {
			bestEmployee = &availableEmployees[i]
		}
	}

	return bestEmployee, nil
}

// FindAlternativeSlots finds alternative available time slots when requested time is not available
func (s *BookingService) FindAlternativeSlots(serviceID string, requestedDateTime time.Time, daysToSearch int) ([]AlternativeSlot, error) {
	var alternatives []AlternativeSlot

	// Get service details for duration and working hours
	var service models.Service
	err := s.db.QueryRow(`
		SELECT id, duration, available_days, start_time, end_time, 
			   buffer_time_before, buffer_time_after, assigned_employees
		FROM services 
		WHERE id = $1 AND is_active = true
	`, serviceID).Scan(
		&service.ID, &service.Duration, pq.Array(&service.AvailableDays),
		&service.StartTime, &service.EndTime, &service.BufferTimeBefore,
		&service.BufferTimeAfter, pq.Array(&service.AssignedEmployees),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get service details: %w", err)
	}

	// Search for alternatives in the next 'daysToSearch' days
	searchDate := requestedDateTime.Truncate(24 * time.Hour)
	endDate := searchDate.AddDate(0, 0, daysToSearch)

	for currentDate := searchDate; currentDate.Before(endDate); currentDate = currentDate.AddDate(0, 0, 1) {
		// Check if service is available on this day
		dayOfWeek := strings.ToLower(currentDate.Weekday().String())
		serviceAvailable := false
		for _, availableDay := range service.AvailableDays {
			if availableDay == dayOfWeek {
				serviceAvailable = true
				break
			}
		}

		if !serviceAvailable {
			continue
		}

		// Generate time slots for this day
		slots := s.generateTimeSlots(service, currentDate)

		for _, slot := range slots {
			// Skip slots in the past
			if slot.Before(time.Now()) {
				continue
			}

			// Find available employee for this slot
			employee, err := s.FindAvailableEmployee(serviceID, slot)
			if err != nil {
				continue // No employee available for this slot
			}

			// Calculate time difference from requested time
			timeDiff := slot.Sub(requestedDateTime)
			if timeDiff < 0 {
				timeDiff = -timeDiff
			}

			alternatives = append(alternatives, AlternativeSlot{
				DateTime:     slot,
				EmployeeID:   employee.EmployeeID,
				EmployeeName: employee.EmployeeName,
				TimeDiff:     timeDiff,
				Priority:     s.calculateSlotPriority(slot, requestedDateTime, employee.CurrentBookings),
			})
		}
	}

	// Sort alternatives by priority (best matches first)
	sort.Slice(alternatives, func(i, j int) bool {
		return alternatives[i].Priority > alternatives[j].Priority
	})

	// Return top 10 alternatives
	if len(alternatives) > 10 {
		alternatives = alternatives[:10]
	}

	return alternatives, nil
}

// AutoAssignBooking automatically assigns best available employee or suggests alternatives
func (s *BookingService) AutoAssignBooking(req *BookingRequest) (*BookingResult, error) {
	// First, try to find available employee for requested time
	employee, err := s.FindAvailableEmployee(req.ServiceID, req.DateTime)
	if err == nil {
		// Employee found, create booking
		req.EmployeeID = &employee.EmployeeID
		booking, err := s.CreateBooking(req)
		if err != nil {
			return nil, err
		}

		return &BookingResult{
			Success:          true,
			Booking:          booking,
			AssignedEmployee: employee,
			Message:          fmt.Sprintf("Booking confirmed with %s", employee.EmployeeName),
		}, nil
	}

	// No employee available, find alternatives
	alternatives, err := s.FindAlternativeSlots(req.ServiceID, req.DateTime, 14) // Search 2 weeks ahead
	if err != nil || len(alternatives) == 0 {
		return &BookingResult{
			Success:      false,
			Message:      "No available slots found in the next 2 weeks",
			Alternatives: []AlternativeSlot{},
		}, nil
	}

	return &BookingResult{
		Success:      false,
		Message:      "Requested time is not available. Here are alternative options:",
		Alternatives: alternatives,
	}, nil
}

// ProcessAIBookingRequest handles booking request from AI assistant
func (s *BookingService) ProcessAIBookingRequest(req *AIBookingRequest) (*AIBookingResponse, error) {
	// Convert AI request to standard booking request
	bookingReq := &BookingRequest{
		UserID:    req.UserID,
		CompanyID: req.CompanyID,
		ServiceID: req.ServiceID,
		PetID:     req.PetID,
		DateTime:  req.DateTime,
		Notes:     req.Notes,
	}

	// Try to auto-assign booking
	result, err := s.AutoAssignBooking(bookingReq)
	if err != nil {
		return &AIBookingResponse{
			Success:       false,
			Message:       "Failed to process booking request",
			ClientMessage: "Sorry, we couldn't process your booking request at this time. Please try again later.",
		}, err
	}

	if result.Success {
		// Create client-friendly message without employee details
		clientMessage := fmt.Sprintf("✅ Your appointment has been successfully booked for %s at %s! We'll see you soon.",
			result.Booking.DateTime.Format("January 2, 2006"),
			result.Booking.DateTime.Format("3:04 PM"))

		return &AIBookingResponse{
			Success:         true,
			BookingID:       result.Booking.ID,
			Message:         fmt.Sprintf("Booking confirmed with employee %s", result.AssignedEmployee.EmployeeName),
			Employee:        &EmployeeInfo{ID: result.AssignedEmployee.EmployeeID, Name: result.AssignedEmployee.EmployeeName},
			Alternatives:    []string{},
			SuggestedAction: "Booking completed successfully",
			ClientMessage:   clientMessage,
		}, nil
	}

	// If no immediate slot available, suggest alternatives
	alternatives := make([]string, 0, len(result.Alternatives))
	for _, alt := range result.Alternatives {
		alternatives = append(alternatives, alt.DateTime.Format("January 2, 2006 at 3:04 PM"))
	}

	clientMessage := "❌ The requested time is not available. Here are some alternative options:\n"
	for i, alt := range alternatives {
		clientMessage += fmt.Sprintf("%d. %s\n", i+1, alt)
	}
	clientMessage += "Please let us know which time works best for you!"

	return &AIBookingResponse{
		Success:         false,
		Message:         "No immediate availability, alternatives provided",
		Employee:        nil,
		Alternatives:    alternatives,
		SuggestedAction: "Client needs to choose alternative time",
		ClientMessage:   clientMessage,
	}, nil
}

// ProcessAIBookingRequestChat handles booking request from chat service (adapter method)
func (s *BookingService) ProcessAIBookingRequestChat(req *AIBookingRequestChat) (*AIBookingResponseChat, error) {
	// Convert chat request to standard booking request
	standardReq := &AIBookingRequest{
		UserID:    req.UserID,
		CompanyID: req.CompanyID,
		ServiceID: req.ServiceID,
		PetID:     req.PetID,
		DateTime:  req.DateTime,
		Notes:     req.Notes,
	}

	// Call the main processing method
	response, err := s.ProcessAIBookingRequest(standardReq)
	if err != nil {
		return nil, err
	}

	// Convert response back to chat format
	chatResponse := &AIBookingResponseChat{
		Success:         response.Success,
		BookingID:       response.BookingID,
		Message:         response.Message,
		Alternatives:    response.Alternatives,
		SuggestedAction: response.SuggestedAction,
		ClientMessage:   response.ClientMessage,
	}

	if response.Employee != nil {
		chatResponse.Employee = &EmployeeInfoChat{
			ID:   response.Employee.ID,
			Name: response.Employee.Name,
		}
	}

	return chatResponse, nil
}

// Types for chat integration
type AIBookingRequestChat struct {
	UserID    string    `json:"user_id"`
	CompanyID string    `json:"company_id"`
	ServiceID string    `json:"service_id"`
	PetID     string    `json:"pet_id"`
	DateTime  time.Time `json:"date_time"`
	Notes     string    `json:"notes"`
}

type AIBookingResponseChat struct {
	Success         bool
	BookingID       string
	Message         string
	Employee        *EmployeeInfoChat
	Alternatives    []string
	SuggestedAction string
	ClientMessage   string // Clean message for clients without employee details
}

type EmployeeInfoChat struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// Helper function to check individual employee availability
func (s *BookingService) checkEmployeeAvailability(employeeID, serviceID string, dateTime time.Time) (*EmployeeAvailability, error) {
	// Get employee details and work schedule
	var employee EmployeeAvailability
	var workSchedule string

	err := s.db.QueryRow(`
		SELECT id, name, work_schedule, is_active
		FROM employees 
		WHERE id = $1 AND is_active = true
	`, employeeID).Scan(&employee.EmployeeID, &employee.EmployeeName, &workSchedule, &employee.Available)

	if err != nil {
		return nil, err
	}

	// Parse work schedule (simplified - assume JSON format)
	var schedule map[string]interface{}
	if err := json.Unmarshal([]byte(workSchedule), &schedule); err != nil {
		// Default to available if schedule parsing fails
		employee.Available = true
	} else {
		// Check if employee works on this day/time (simplified logic)
		dayOfWeek := strings.ToLower(dateTime.Weekday().String())
		if daySchedule, exists := schedule[dayOfWeek]; exists {
			employee.Available = daySchedule != nil
		}
	}

	// Count current bookings for this employee at this time
	var bookingCount int
	err = s.db.QueryRow(`
		SELECT COUNT(*) 
		FROM bookings 
		WHERE employee_id = $1 
		AND date_time = $2 
		AND status NOT IN ('cancelled', 'rejected')
	`, employeeID, dateTime).Scan(&bookingCount)

	if err != nil {
		bookingCount = 0
	}

	employee.CurrentBookings = bookingCount

	// Check if employee is overbooked
	var maxBookings int
	err = s.db.QueryRow(`
		SELECT max_bookings_per_slot 
		FROM services 
		WHERE id = $1
	`, serviceID).Scan(&maxBookings)

	if err != nil {
		maxBookings = 1 // Default
	}

	if bookingCount >= maxBookings {
		employee.Available = false
	}

	return &employee, nil
}

// Helper function to calculate slot priority for sorting alternatives
func (s *BookingService) calculateSlotPriority(slotTime, requestedTime time.Time, employeeLoad int) float64 {
	// Lower time difference = higher priority
	timeDiff := slotTime.Sub(requestedTime)
	if timeDiff < 0 {
		timeDiff = -timeDiff
	}

	// Convert to hours for calculation
	hoursDiff := timeDiff.Hours()

	// Base priority decreases with time difference
	timePriority := 100.0 / (1.0 + hoursDiff/24.0) // Decay over days

	// Employee load factor (less busy = higher priority)
	loadPriority := 10.0 / (1.0 + float64(employeeLoad))

	return timePriority + loadPriority
}

// GetCustomerPetMedicalData returns medical data for a customer's pet if company has access
func (s *BookingService) GetCustomerPetMedicalData(companyID, petID string) (*models.PetData, error) {
	// First verify that company has access to this pet through bookings/orders
	var accessCount int
	err := s.db.QueryRow(`
		SELECT COUNT(*) FROM (
			SELECT 1 FROM bookings b 
			WHERE b.company_id = $1 AND b.pet_id = $2
			UNION
			SELECT 1 FROM orders o 
			JOIN pets p ON o.user_id = p.user_id
			WHERE o.company_id = $1 AND p.id = $2
		) as access_check
	`, companyID, petID).Scan(&accessCount)

	if err != nil {
		return nil, fmt.Errorf("failed to check access: %w", err)
	}

	if accessCount == 0 {
		return nil, fmt.Errorf("company does not have access to this pet")
	}

	// Get detailed pet medical data
	query := `
		SELECT 
			p.id, p.name, p.gender, p.date_of_birth, p.weight, p.microchip_id, p.sterilized,
			COALESCE(p.chronic_conditions, '{}') as chronic_conditions,
			COALESCE(p.allergies, '{}') as allergies,
			COALESCE(p.dietary_restrictions, '') as dietary_restrictions,
			COALESCE(p.special_needs, '') as special_needs,
			COALESCE(p.vet_name, '') as vet_name,
			COALESCE(p.vet_phone, '') as vet_phone,
			COALESCE(p.vet_clinic, '') as vet_clinic,
			COALESCE(p.behavior_notes, '') as behavior_notes,
			COALESCE(p.stress_reactions, '') as stress_reactions,
			COALESCE(p.favorite_toys, '') as favorite_toys,
			COALESCE(pt.name, '') as pet_type_name,
			COALESCE(b.name, '') as breed_name
		FROM pets p
		LEFT JOIN pet_types pt ON p.pet_type_id = pt.id
		LEFT JOIN breeds b ON p.breed_id = b.id
		WHERE p.id = $1
	`

	var petData models.PetData
	var chronicConditions, allergies pq.StringArray

	err = s.db.QueryRow(query, petID).Scan(
		&petData.PetID, &petData.PetName, &petData.Gender, &petData.DateOfBirth,
		&petData.Weight, &petData.MicrochipID, &petData.Sterilized,
		&chronicConditions, &allergies, &petData.DietaryRestrictions,
		&petData.SpecialNeeds, &petData.VetName, &petData.VetPhone,
		&petData.VetClinic, &petData.BehaviorNotes, &petData.StressReactions,
		&petData.FavoriteToys, &petData.PetType, &petData.Breed,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get pet data: %w", err)
	}

	// Convert arrays
	if chronicConditions != nil {
		petData.ChronicConditions = []string(chronicConditions)
	}
	if allergies != nil {
		petData.Allergies = []string(allergies)
	}

	return &petData, nil
}

// GetCustomerPetVaccinations returns vaccination data for a customer's pet if company has access
func (s *BookingService) GetCustomerPetVaccinations(companyID, petID string) ([]models.VaccinationRecord, error) {
	// First verify access
	var accessCount int
	err := s.db.QueryRow(`
		SELECT COUNT(*) FROM (
			SELECT 1 FROM bookings b 
			WHERE b.company_id = $1 AND b.pet_id = $2
			UNION
			SELECT 1 FROM orders o 
			JOIN pets p ON o.user_id = p.user_id
			WHERE o.company_id = $1 AND p.id = $2
		) as access_check
	`, companyID, petID).Scan(&accessCount)

	if err != nil {
		return nil, fmt.Errorf("failed to check access: %w", err)
	}

	if accessCount == 0 {
		return nil, fmt.Errorf("company does not have access to this pet")
	}

	// Get vaccination data
	query := `
		SELECT 
			id, vaccine_name, date_administered, expiry_date, vet_name,
			vet_clinic, batch_number, notes, next_due_date
		FROM pet_vaccinations 
		WHERE pet_id = $1 
		ORDER BY date_administered DESC
	`

	rows, err := s.db.Query(query, petID)
	if err != nil {
		return nil, fmt.Errorf("failed to query vaccinations: %w", err)
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
			return nil, fmt.Errorf("failed to scan vaccination: %w", err)
		}
		vaccinations = append(vaccinations, vaccination)
	}

	return vaccinations, nil
}

// GetCustomerPetMedications returns medication data for a customer's pet if company has access
func (s *BookingService) GetCustomerPetMedications(companyID, petID string) ([]models.MedicationRecord, error) {
	// First verify access
	var accessCount int
	err := s.db.QueryRow(`
		SELECT COUNT(*) FROM (
			SELECT 1 FROM bookings b 
			WHERE b.company_id = $1 AND b.pet_id = $2
			UNION
			SELECT 1 FROM orders o 
			JOIN pets p ON o.user_id = p.user_id
			WHERE o.company_id = $1 AND p.id = $2
		) as access_check
	`, companyID, petID).Scan(&accessCount)

	if err != nil {
		return nil, fmt.Errorf("failed to check access: %w", err)
	}

	if accessCount == 0 {
		return nil, fmt.Errorf("company does not have access to this pet")
	}

	// Get medication data
	query := `
		SELECT 
			id, medication_name, dosage, frequency, start_date, end_date,
			prescribed_by, instructions, side_effects, is_active
		FROM pet_medications 
		WHERE pet_id = $1 
		ORDER BY start_date DESC
	`

	rows, err := s.db.Query(query, petID)
	if err != nil {
		return nil, fmt.Errorf("failed to query medications: %w", err)
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
			return nil, fmt.Errorf("failed to scan medication: %w", err)
		}
		medications = append(medications, medication)
	}

	return medications, nil
}

// FindOrCreateCustomer finds existing customer by phone or creates new one
func (s *BookingService) FindOrCreateCustomer(name, phone string) (*models.User, error) {
	// First try to find existing customer by phone
	var user models.User
	err := s.db.QueryRow(`
		SELECT id, firebase_uid, email, first_name, last_name, phone, role, created_at, updated_at
		FROM users 
		WHERE phone = $1 AND role = 'pet_owner'
		LIMIT 1
	`, phone).Scan(
		&user.ID, &user.FirebaseUID, &user.Email, &user.FirstName, &user.LastName, &user.Phone, 
		&user.Role, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == nil {
		// Customer found, update name if different
		fullName := user.FirstName + " " + user.LastName
		if strings.TrimSpace(fullName) != name {
			// Split name into first and last
			nameParts := strings.Fields(name)
			firstName := nameParts[0]
			lastName := ""
			if len(nameParts) > 1 {
				lastName = strings.Join(nameParts[1:], " ")
			}
			
			_, updateErr := s.db.Exec(`
				UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW() 
				WHERE id = $3
			`, firstName, lastName, user.ID)
			if updateErr != nil {
				fmt.Printf("⚠️ Warning: Failed to update customer name: %v\n", updateErr)
			} else {
				user.FirstName = firstName
				user.LastName = lastName
			}
		}
		return &user, nil
	}

	if err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to query customer: %w", err)
	}

	// Customer not found, create new one
	userID := uuid.New().String()
	email := fmt.Sprintf("%s@temp.zootel.com", phone) // Temporary email
	firebaseUID := fmt.Sprintf("temp_%s_%s", phone, userID[:8]) // Temporary Firebase UID
	
	// Split name into first and last
	nameParts := strings.Fields(name)
	firstName := nameParts[0]
	lastName := ""
	if len(nameParts) > 1 {
		lastName = strings.Join(nameParts[1:], " ")
	}

	_, err = s.db.Exec(`
		INSERT INTO users (id, firebase_uid, email, first_name, last_name, phone, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, 'pet_owner', NOW(), NOW())
	`, userID, firebaseUID, email, firstName, lastName, phone)

	if err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	// Return the created user
	user = models.User{
		ID:          userID,
		FirebaseUID: firebaseUID,
		Email:       email,
		FirstName:   firstName,
		LastName:    lastName,
		Phone:       phone,
		Role:        "pet_owner",
	}

	fmt.Printf("✅ Created new customer: %s (%s)\n", name, phone)
	return &user, nil
}

// FindOrCreatePet finds existing pet by name and owner or creates new one
func (s *BookingService) FindOrCreatePet(ownerID, petName string) (*models.Pet, error) {
	// First try to find existing pet by name and owner
	var pet models.Pet
	err := s.db.QueryRow(`
		SELECT id, user_id, name, pet_type_id, breed_id, weight, gender, created_at, updated_at
		FROM pets 
		WHERE user_id = $1 AND name = $2
		LIMIT 1
	`, ownerID, petName).Scan(
		&pet.ID, &pet.UserID, &pet.Name, &pet.PetTypeID, 
		&pet.BreedID, &pet.Weight, &pet.Gender,
		&pet.CreatedAt, &pet.UpdatedAt,
	)

	if err == nil {
		// Pet found
		return &pet, nil
	}

	if err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to query pet: %w", err)
	}

	// Pet not found, create new one
	petID := uuid.New().String()
	
	// Use NULL for optional UUID fields instead of empty strings
	_, err = s.db.Exec(`
		INSERT INTO pets (id, user_id, name, pet_type_id, breed_id, weight, gender, created_at, updated_at)
		VALUES ($1, $2, $3, NULL, NULL, 0, 'unknown', NOW(), NOW())
	`, petID, ownerID, petName)

	if err != nil {
		return nil, fmt.Errorf("failed to create pet: %w", err)
	}

	// Return the created pet
	pet = models.Pet{
		ID:        petID,
		UserID:    ownerID,
		Name:      petName,
		PetTypeID: "", // Will be empty for temp pets
		BreedID:   "", // Will be empty for temp pets
		Weight:    0,
		Gender:    "unknown",
	}

	fmt.Printf("✅ Created new pet: %s for owner %s\n", petName, ownerID)
	return &pet, nil
}
