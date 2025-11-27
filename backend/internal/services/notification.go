package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
	"google.golang.org/api/option"
)

type NotificationService struct {
	db              *sql.DB
	firebaseApp     *firebase.App
	messagingClient *messaging.Client
	cronScheduler   *cron.Cron
	emailService    *EmailService
	smsService      *SMSService
}

func NewNotificationService(db *sql.DB, credentialsFile string) *NotificationService {
	service := &NotificationService{
		db:            db,
		cronScheduler: cron.New(),
	}

	// Initialize Firebase Admin SDK
	if credentialsFile != "" {
		ctx := context.Background()
		opt := option.WithCredentialsFile(credentialsFile)
		app, err := firebase.NewApp(ctx, nil, opt)
		if err != nil {
			log.Printf("Error initializing Firebase app: %v", err)
		} else {
			service.firebaseApp = app
			messagingClient, err := app.Messaging(ctx)
			if err != nil {
				log.Printf("Error getting Firebase messaging client: %v", err)
			} else {
				service.messagingClient = messagingClient
				log.Println("Firebase messaging client initialized successfully")
			}
		}
	}

	return service
}

type NotificationPayload struct {
	Type      string                 `json:"type"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data"`
	UserID    string                 `json:"user_id"`
	CompanyID string                 `json:"company_id"`
	BookingID *string                `json:"booking_id,omitempty"`
	OrderID   *string                `json:"order_id,omitempty"`
	ActionURL string                 `json:"action_url,omitempty"`
}

type ScheduleNotificationRequest struct {
	UserID      string                 `json:"user_id" binding:"required"`
	Type        string                 `json:"type" binding:"required"`
	Title       string                 `json:"title" binding:"required"`
	Message     string                 `json:"message" binding:"required"`
	ScheduledAt time.Time              `json:"scheduled_at" binding:"required"`
	Data        map[string]interface{} `json:"data"`
	Methods     []string               `json:"methods"` // email, sms, push
}

// StartNotificationCron starts the cron job for processing scheduled notifications
func (s *NotificationService) StartNotificationCron() {
	// Run every minute to check for pending notifications
	_, err := s.cronScheduler.AddFunc("* * * * *", s.processScheduledNotifications)
	if err != nil {
		log.Printf("Error adding cron job: %v", err)
		return
	}

	s.cronScheduler.Start()
	log.Println("Notification cron scheduler started")
}

// StopNotificationCron stops the cron job
func (s *NotificationService) StopNotificationCron() {
	s.cronScheduler.Stop()
	log.Println("Notification cron scheduler stopped")
}

// ScheduleNotification schedules a notification to be sent later
func (s *NotificationService) ScheduleNotification(req *ScheduleNotificationRequest) error {
	payload := NotificationPayload{
		Type:    req.Type,
		Title:   req.Title,
		Message: req.Message,
		UserID:  req.UserID,
		Data:    req.Data,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	methods := req.Methods
	if len(methods) == 0 {
		methods = []string{"push"} // Default to push notifications
	}

	for _, method := range methods {
		_, err = s.db.Exec(`
			INSERT INTO notification_schedule (
				id, user_id, type, title, message, scheduled_for, 
				notification_method, payload_ser, sent, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, uuid.New().String(), req.UserID, req.Type, req.Title, req.Message,
			req.ScheduledAt, method, string(payloadJSON), false, time.Now())

		if err != nil {
			return err
		}
	}

	return nil
}

// ScheduleBookingNotifications schedules booking-related notifications
func (s *NotificationService) ScheduleBookingNotifications(booking *models.Booking) error {
	// Schedule 24h reminder
	reminderTime := booking.DateTime.Add(-24 * time.Hour)
	if reminderTime.After(time.Now()) {
		err := s.ScheduleNotification(&ScheduleNotificationRequest{
			UserID:      booking.UserID,
			Type:        "client_reminder",
			Title:       "Booking Reminder",
			Message:     fmt.Sprintf("Your appointment is tomorrow at %s", booking.DateTime.Format("15:04")),
			ScheduledAt: reminderTime,
			Data: map[string]interface{}{
				"booking_id":   booking.ID,
				"company_id":   booking.CompanyID,
				"service_name": "Pet Service", // TODO: Get actual service name
			},
			Methods: []string{"push", "email"},
		})
		if err != nil {
			return err
		}
	}

	// Schedule 15m employee reminder
	employeeReminderTime := booking.DateTime.Add(-15 * time.Minute)
	if employeeReminderTime.After(time.Now()) && booking.EmployeeID != nil {
		err := s.ScheduleNotification(&ScheduleNotificationRequest{
			UserID:      *booking.EmployeeID,
			Type:        "employee_reminder",
			Title:       "Upcoming Appointment",
			Message:     fmt.Sprintf("You have an appointment in 15 minutes"),
			ScheduledAt: employeeReminderTime,
			Data: map[string]interface{}{
				"booking_id": booking.ID,
				"company_id": booking.CompanyID,
			},
			Methods: []string{"push"},
		})
		if err != nil {
			return err
		}
	}

	return nil
}

// SendImmediateNotification sends a notification immediately
func (s *NotificationService) SendImmediateNotification(payload *NotificationPayload, methods []string) error {
	if len(methods) == 0 {
		methods = []string{"push"}
	}

	for _, method := range methods {
		switch method {
		case "push":
			err := s.sendPushNotification(payload)
			if err != nil {
				log.Printf("Failed to send push notification: %v", err)
			}
		case "email":
			err := s.sendEmailNotification(payload)
			if err != nil {
				log.Printf("Failed to send email notification: %v", err)
			}
		case "sms":
			err := s.sendSMSNotification(payload)
			if err != nil {
				log.Printf("Failed to send SMS notification: %v", err)
			}
		}
	}

	// Log notification
	payloadJSON, _ := json.Marshal(payload)
	_, err := s.db.Exec(`
		INSERT INTO notification_log (
			id, user_id, type, title, message, payload_ser, 
			notification_method, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, uuid.New().String(), payload.UserID, payload.Type, payload.Title,
		payload.Message, string(payloadJSON), "immediate", "sent", time.Now())

	return err
}

// processScheduledNotifications processes pending notifications (called by cron)
func (s *NotificationService) processScheduledNotifications() {
	// Get notifications that are ready to be sent
	rows, err := s.db.Query(`
		SELECT id, user_id, type, title, message, notification_method, payload_ser
		FROM notification_schedule
		WHERE sent = false 
			AND scheduled_for <= NOW()
			AND (next_retry_at IS NULL OR next_retry_at <= NOW())
		ORDER BY scheduled_for ASC
		LIMIT 100
	`)
	if err != nil {
		log.Printf("Error querying scheduled notifications: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var notificationID, userID, notificationType, title, message, method, payloadStr string

		err := rows.Scan(&notificationID, &userID, &notificationType, &title, &message, &method, &payloadStr)
		if err != nil {
			log.Printf("Error scanning notification: %v", err)
			continue
		}

		// Parse payload
		var payload NotificationPayload
		err = json.Unmarshal([]byte(payloadStr), &payload)
		if err != nil {
			log.Printf("Error parsing notification payload: %v", err)
			continue
		}

		// Send notification
		var sendErr error
		switch method {
		case "push":
			sendErr = s.sendPushNotification(&payload)
		case "email":
			sendErr = s.sendEmailNotification(&payload)
		case "sms":
			sendErr = s.sendSMSNotification(&payload)
		}

		// Update notification status
		if sendErr != nil {
			log.Printf("Failed to send %s notification to user %s: %v", method, userID, sendErr)
			s.handleNotificationFailure(notificationID)
		} else {
			s.markNotificationSent(notificationID)
		}
	}
}

// sendPushNotification sends a push notification via Firebase
func (s *NotificationService) sendPushNotification(payload *NotificationPayload) error {
	if s.messagingClient == nil {
		return fmt.Errorf("Firebase messaging client not initialized")
	}

	// Get user's FCM token
	var fcmToken string
	err := s.db.QueryRow(`
		SELECT fcm_token FROM users WHERE id = $1
	`, payload.UserID).Scan(&fcmToken)

	if err != nil || fcmToken == "" {
		return fmt.Errorf("no FCM token found for user %s", payload.UserID)
	}

	// Prepare message data
	data := make(map[string]string)
	for k, v := range payload.Data {
		data[k] = fmt.Sprintf("%v", v)
	}
	data["type"] = payload.Type
	data["user_id"] = payload.UserID

	// Create Firebase message
	message := &messaging.Message{
		Token: fcmToken,
		Notification: &messaging.Notification{
			Title: payload.Title,
			Body:  payload.Message,
		},
		Data: data,
		Android: &messaging.AndroidConfig{
			Priority: "high",
		},
		APNS: &messaging.APNSConfig{
			Headers: map[string]string{
				"apns-priority": "10",
			},
		},
	}

	// Send message
	ctx := context.Background()
	response, err := s.messagingClient.Send(ctx, message)
	if err != nil {
		return err
	}

	log.Printf("Successfully sent push notification: %s", response)
	return nil
}

// sendEmailNotification sends an email notification
func (s *NotificationService) sendEmailNotification(payload *NotificationPayload) error {
	// Validate UserID
	if payload.UserID == "" {
		return fmt.Errorf("user ID is empty")
	}
	
	// Get user email
	var email string
	err := s.db.QueryRow(`SELECT email FROM users WHERE id = $1`, payload.UserID).Scan(&email)
	if err != nil {
		return fmt.Errorf("failed to get user email: %w", err)
	}

	if s.emailService != nil {
		return s.emailService.SendNotificationEmail(email, payload.Title, payload.Message, payload.Data)
	}

	// Fallback: log email (for demo purposes)
	log.Printf("EMAIL NOTIFICATION: To: %s, Subject: %s, Message: %s", email, payload.Title, payload.Message)
	return nil
}

// sendSMSNotification sends an SMS notification
func (s *NotificationService) sendSMSNotification(payload *NotificationPayload) error {
	// Validate UserID
	if payload.UserID == "" {
		return fmt.Errorf("user ID is empty")
	}
	
	// Get user phone
	var phone string
	err := s.db.QueryRow(`SELECT phone FROM users WHERE id = $1`, payload.UserID).Scan(&phone)
	if err != nil || phone == "" {
		return fmt.Errorf("no phone number found for user %s", payload.UserID)
	}

	if s.smsService != nil {
		return s.smsService.SendSMS(phone, payload.Message)
	}

	// Fallback: log SMS (for demo purposes)
	log.Printf("SMS NOTIFICATION: To: %s, Message: %s", phone, payload.Message)
	return nil
}

// markNotificationSent marks a notification as sent
func (s *NotificationService) markNotificationSent(notificationID string) {
	_, err := s.db.Exec(`
		UPDATE notification_schedule 
		SET sent = true, sent_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, notificationID)

	if err != nil {
		log.Printf("Error marking notification as sent: %v", err)
	}
}

// handleNotificationFailure handles failed notification attempts
func (s *NotificationService) handleNotificationFailure(notificationID string) {
	maxRetries := 3 // Default max retries
	
	// Increment retry count and set next retry time
	_, err := s.db.Exec(`
		UPDATE notification_schedule 
		SET retry_count = retry_count + 1,
			next_retry_at = NOW() + INTERVAL '5 minutes'
		WHERE id = $1 AND retry_count < $2
	`, notificationID, maxRetries)

	if err != nil {
		log.Printf("Error updating notification retry: %v", err)
	}

	// Mark as failed if max retries exceeded
	_, err = s.db.Exec(`
		UPDATE notification_schedule 
		SET sent = true
		WHERE id = $1 AND retry_count >= $2
	`, notificationID, maxRetries)

	if err != nil {
		log.Printf("Error marking notification as failed: %v", err)
	}
}

// GetNotificationHistory returns notification history for a user
func (s *NotificationService) GetNotificationHistory(userID string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT type, title, message, notification_method, sent_at, status
		FROM notification_schedule
		WHERE user_id = $1 AND sent = true
		ORDER BY sent_at DESC
		LIMIT $2
	`

	rows, err := s.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []map[string]interface{}
	for rows.Next() {
		var notificationType, title, message, method, status string
		var sentAt time.Time

		err := rows.Scan(&notificationType, &title, &message, &method, &sentAt, &status)
		if err != nil {
			continue
		}

		notifications = append(notifications, map[string]interface{}{
			"type":    notificationType,
			"title":   title,
			"message": message,
			"method":  method,
			"sent_at": sentAt,
			"status":  status,
		})
	}

	return notifications, nil
}

// UpdateFCMToken updates a user's FCM token for push notifications
func (s *NotificationService) UpdateFCMToken(userID, fcmToken string) error {
	_, err := s.db.Exec(`
		UPDATE users SET fcm_token = $2, updated_at = NOW() WHERE id = $1
	`, userID, fcmToken)

	return err
}

// SendBookingStatusUpdate sends notification for booking status changes
func (s *NotificationService) SendBookingStatusUpdate(booking *models.Booking, newStatus string) error {
	var title, message string

	switch newStatus {
	case "confirmed":
		title = "Booking Confirmed"
		message = "Your booking has been confirmed!"
	case "cancelled":
		title = "Booking Cancelled"
		message = "Your booking has been cancelled."
	case "completed":
		title = "Service Completed"
		message = "Thank you! Please rate your experience."
	default:
		title = "Booking Update"
		message = fmt.Sprintf("Your booking status has been updated to: %s", newStatus)
	}

	payload := &NotificationPayload{
		Type:      "booking_status_update",
		Title:     title,
		Message:   message,
		UserID:    booking.UserID,
		CompanyID: booking.CompanyID,
		BookingID: &booking.ID,
		Data: map[string]interface{}{
			"booking_id": booking.ID,
			"status":     newStatus,
		},
	}

	return s.SendImmediateNotification(payload, []string{"push", "email"})
}

// SendTrialExpiringNotification sends notification when trial is about to expire
func (s *NotificationService) SendTrialExpiringNotification(companyID string, daysLeft int) error {
	// Get company details
	var company models.Company
	query := `
		SELECT id, name, email, owner_id 
		FROM companies 
		WHERE id = $1`

	err := s.db.QueryRow(query, companyID).Scan(
		&company.ID, &company.Name, &company.Email, &company.OwnerID,
	)
	if err != nil {
		return fmt.Errorf("failed to get company: %w", err)
	}

	// Get owner details
	var owner models.User
	ownerQuery := `
		SELECT id, email, first_name, last_name 
		FROM users 
		WHERE id = $1`

	err = s.db.QueryRow(ownerQuery, company.OwnerID).Scan(
		&owner.ID, &owner.Email, &owner.FirstName, &owner.LastName,
	)
	if err != nil {
		return fmt.Errorf("failed to get owner: %w", err)
	}

	// Send via notification system
	payload := &NotificationPayload{
		Type:      "trial_expiring",
		Title:     fmt.Sprintf("Trial expires in %d days", daysLeft),
		Message:   fmt.Sprintf("Your free trial for %s expires in %d days. Upgrade now to continue using all features.", company.Name, daysLeft),
		UserID:    owner.ID,
		CompanyID: company.ID,
		Data: map[string]interface{}{
			"days_left":   daysLeft,
			"company_id":  company.ID,
			"action_type": "upgrade_plan",
		},
	}

	return s.SendImmediateNotification(payload, []string{"push", "email"})
}

// SendTrialExpiredNotification sends notification when trial has expired
func (s *NotificationService) SendTrialExpiredNotification(companyID string) error {
	// Get company details
	var company models.Company
	query := `
		SELECT id, name, email, owner_id 
		FROM companies 
		WHERE id = $1`

	err := s.db.QueryRow(query, companyID).Scan(
		&company.ID, &company.Name, &company.Email, &company.OwnerID,
	)
	if err != nil {
		return fmt.Errorf("failed to get company: %w", err)
	}

	// Get owner details
	var owner models.User
	ownerQuery := `
		SELECT id, email, first_name, last_name 
		FROM users 
		WHERE id = $1`

	err = s.db.QueryRow(ownerQuery, company.OwnerID).Scan(
		&owner.ID, &owner.Email, &owner.FirstName, &owner.LastName,
	)
	if err != nil {
		return fmt.Errorf("failed to get owner: %w", err)
	}

	// Send via notification system
	payload := &NotificationPayload{
		Type:      "trial_expired",
		Title:     "Free trial expired",
		Message:   fmt.Sprintf("Your free trial for %s has expired. Upgrade now to restore full access to your account.", company.Name),
		UserID:    owner.ID,
		CompanyID: company.ID,
		Data: map[string]interface{}{
			"company_id":  company.ID,
			"action_type": "upgrade_plan",
			"priority":    "high",
		},
	}

	return s.SendImmediateNotification(payload, []string{"push", "email"})
}

// SendSubscriptionActivatedNotification sends notification when subscription is activated
func (s *NotificationService) SendSubscriptionActivatedNotification(companyID, planName string) error {
	// Get company details
	var company models.Company
	query := `
		SELECT id, name, email, owner_id 
		FROM companies 
		WHERE id = $1`

	err := s.db.QueryRow(query, companyID).Scan(
		&company.ID, &company.Name, &company.Email, &company.OwnerID,
	)
	if err != nil {
		return fmt.Errorf("failed to get company: %w", err)
	}

	// Get owner details
	var owner models.User
	ownerQuery := `
		SELECT id, email, first_name, last_name 
		FROM users 
		WHERE id = $1`

	err = s.db.QueryRow(ownerQuery, company.OwnerID).Scan(
		&owner.ID, &owner.Email, &owner.FirstName, &owner.LastName,
	)
	if err != nil {
		return fmt.Errorf("failed to get owner: %w", err)
	}

	// Send via notification system
	payload := &NotificationPayload{
		Type:      "subscription_activated",
		Title:     "Subscription activated",
		Message:   fmt.Sprintf("Your %s subscription has been activated. Welcome back to full access!", planName),
		UserID:    owner.ID,
		CompanyID: company.ID,
		Data: map[string]interface{}{
			"company_id": company.ID,
			"plan_name":  planName,
			"priority":   "medium",
		},
	}

	return s.SendImmediateNotification(payload, []string{"push", "email"})
}
