package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
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
	PetID      string    `json:"pet_id" binding:"required"`
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

// GetBookingsByCompany returns bookings for a specific company
func (s *BookingService) GetBookingsByCompany(companyID string) ([]*BookingWithCustomerData, error) {
	query := `
		SELECT 
			b.id, b.user_id, b.company_id, b.service_id, b.pet_id, b.employee_id,
			b.booking_date, b.booking_time, b.duration, b.status, b.notes,
			b.cancellation_reason, b.created_at, b.updated_at,
			u.first_name, u.last_name, u.email, u.phone,
			COALESCE(u.country, '') as country,
			COALESCE(u.state, '') as state,
			COALESCE(u.city, '') as city,
			p.name as pet_name,
			pt.name as pet_type_name,
			COALESCE(b.breed, '') as breed_name
		FROM bookings b
		JOIN users u ON b.user_id = u.id
		LEFT JOIN pets p ON b.pet_id = p.id
		LEFT JOIN pet_types pt ON p.pet_type_id = pt.id
		WHERE b.company_id = $1
		ORDER BY b.created_at DESC
	`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query bookings: %w", err)
	}
	defer rows.Close()

	var bookings []*BookingWithCustomerData
	for rows.Next() {
		booking := &models.Booking{}
		bookingWithData := &BookingWithCustomerData{Booking: booking}

		var petName, petTypeName, breedName sql.NullString

		err := rows.Scan(
			&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
			&booking.PetID, &booking.EmployeeID, &booking.BookingDate, &booking.BookingTime,
			&booking.Duration, &booking.Status, &booking.Notes, &booking.CancellationReason,
			&booking.CreatedAt, &booking.UpdatedAt,
			&bookingWithData.Customer.FirstName, &bookingWithData.Customer.LastName,
			&bookingWithData.Customer.Email, &bookingWithData.Customer.Phone,
			&bookingWithData.Customer.Country, &bookingWithData.Customer.State,
			&bookingWithData.Customer.City,
			&petName, &petTypeName, &breedName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan booking: %w", err)
		}

		// Set customer data
		bookingWithData.Customer.UserID = booking.UserID

		// Set pet data
		bookingWithData.Pet.PetID = *booking.PetID
		if petName.Valid {
			bookingWithData.Pet.PetName = petName.String
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
func (s *BookingService) GetCompanyCustomers(companyID string) ([]CustomerData, error) {
	query := `
		SELECT DISTINCT
			u.id as user_id,
			u.first_name, u.last_name, u.email, u.phone,
			COALESCE(u.country, '') as country,
			COALESCE(u.state, '') as state,
			COALESCE(u.city, '') as city
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

	var customers []CustomerData
	for rows.Next() {
		var customer CustomerData
		err := rows.Scan(
			&customer.UserID, &customer.FirstName, &customer.LastName,
			&customer.Email, &customer.Phone, &customer.Country,
			&customer.State, &customer.City,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan customer: %w", err)
		}
		customers = append(customers, customer)
	}

	return customers, nil
}

// GetCustomerBookingHistory returns booking history for a specific customer
func (s *BookingService) GetCustomerBookingHistory(companyID, userID string) ([]*BookingWithCustomerData, error) {
	query := `
		SELECT 
			b.id, b.user_id, b.company_id, b.service_id, b.pet_id, b.employee_id,
			b.booking_date, b.booking_time, b.duration, b.status, b.notes,
			b.cancellation_reason, b.created_at, b.updated_at,
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

	var bookings []*BookingWithCustomerData
	for rows.Next() {
		booking := &models.Booking{}
		bookingWithData := &BookingWithCustomerData{Booking: booking}

		err := rows.Scan(
			&booking.ID, &booking.UserID, &booking.CompanyID, &booking.ServiceID,
			&booking.PetID, &booking.EmployeeID, &booking.BookingDate, &booking.BookingTime,
			&booking.Duration, &booking.Status, &booking.Notes, &booking.CancellationReason,
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

// GetBookingsByEmployee returns bookings for a specific employee
func (s *BookingService) GetBookingsByEmployee(employeeID string, startDate, endDate time.Time, status string) ([]models.Booking, error) {
	whereClause := "WHERE employee_id = $1 AND date_time >= $2 AND date_time <= $3"
	args := []interface{}{employeeID, startDate, endDate}
	argIndex := 4

	if status != "" {
		whereClause += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, company_id, service_id, pet_id, employee_id,
			   date_time, duration, price, status, notes, payment_id,
			   created_at, updated_at
		FROM bookings %s
		ORDER BY date_time ASC
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
