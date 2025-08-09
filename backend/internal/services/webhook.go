package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
)

type WebhookService struct {
	db            *sql.DB
	httpClient    *http.Client
	cronScheduler *cron.Cron
}

func NewWebhookService(db *sql.DB) *WebhookService {
	return &WebhookService{
		db:            db,
		httpClient:    &http.Client{Timeout: 30 * time.Second},
		cronScheduler: cron.New(),
	}
}

type WebhookEvent struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	CompanyID  string                 `json:"company_id"`
	Data       map[string]interface{} `json:"data"`
	Timestamp  time.Time              `json:"timestamp"`
	WebhookURL string                 `json:"webhook_url,omitempty"`
	Signature  string                 `json:"signature,omitempty"`
}

type WebhookConfig struct {
	CompanyID  string    `json:"company_id"`
	WebhookURL string    `json:"webhook_url"`
	EventTypes []string  `json:"event_types"`
	Secret     string    `json:"secret"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// StartWebhookProcessor starts the cron job for processing failed webhooks
func (s *WebhookService) StartWebhookProcessor() {
	// Run every 5 minutes to retry failed webhooks
	_, err := s.cronScheduler.AddFunc("*/5 * * * *", s.processFailedWebhooks)
	if err != nil {
		log.Printf("Error adding webhook cron job: %v", err)
		return
	}

	s.cronScheduler.Start()
	log.Println("Webhook processor started")
}

// StopWebhookProcessor stops the webhook processor
func (s *WebhookService) StopWebhookProcessor() {
	s.cronScheduler.Stop()
	log.Println("Webhook processor stopped")
}

// TriggerBookingCreated triggers booking.created webhook
func (s *WebhookService) TriggerBookingCreated(booking *models.Booking) error {
	eventData := map[string]interface{}{
		"booking_id":  booking.ID,
		"user_id":     booking.UserID,
		"company_id":  booking.CompanyID,
		"service_id":  booking.ServiceID,
		"pet_id":      booking.PetID,
		"employee_id": booking.EmployeeID,
		"date_time":   booking.DateTime,
		"duration":    booking.Duration,
		"price":       booking.Price,
		"status":      booking.Status,
		"notes":       booking.Notes,
		"created_at":  booking.CreatedAt,
	}

	return s.triggerWebhook("booking.created", booking.CompanyID, eventData)
}

// TriggerPaymentSucceeded triggers payment.succeeded webhook
func (s *WebhookService) TriggerPaymentSucceeded(payment *models.Payment) error {
	eventData := map[string]interface{}{
		"payment_id":               payment.ID,
		"user_id":                  payment.UserID,
		"company_id":               payment.CompanyID,
		"booking_id":               payment.BookingID,
		"order_id":                 payment.OrderID,
		"stripe_payment_intent_id": payment.StripePaymentIntentID,
		"amount":                   payment.Amount,
		"currency":                 payment.Currency,
		"status":                   payment.Status,
		"commission_amount":        payment.CommissionAmount,
		"created_at":               payment.CreatedAt,
	}

	return s.triggerWebhook("payment.succeeded", payment.CompanyID, eventData)
}

// TriggerProfileCompleted triggers profile_completed webhook
func (s *WebhookService) TriggerProfileCompleted(userID, companyID string, profileData map[string]interface{}) error {
	eventData := map[string]interface{}{
		"user_id":      userID,
		"company_id":   companyID,
		"profile_data": profileData,
		"completed_at": time.Now(),
	}

	return s.triggerWebhook("profile_completed", companyID, eventData)
}

// TriggerOrderCreated triggers order.created webhook
func (s *WebhookService) TriggerOrderCreated(order *models.Order) error {
	eventData := map[string]interface{}{
		"order_id":     order.ID,
		"user_id":      order.UserID,
		"company_id":   order.CompanyID,
		"total_amount": order.TotalAmount,
		"status":       order.Status,
		"items":        order.Items,
		"created_at":   order.CreatedAt,
	}

	return s.triggerWebhook("order.created", order.CompanyID, eventData)
}

// TriggerBookingStatusChanged triggers booking.status_changed webhook
func (s *WebhookService) TriggerBookingStatusChanged(booking *models.Booking, oldStatus string) error {
	eventData := map[string]interface{}{
		"booking_id": booking.ID,
		"user_id":    booking.UserID,
		"company_id": booking.CompanyID,
		"old_status": oldStatus,
		"new_status": booking.Status,
		"changed_at": time.Now(),
	}

	return s.triggerWebhook("booking.status_changed", booking.CompanyID, eventData)
}

// triggerWebhook is the main method for triggering webhooks
func (s *WebhookService) triggerWebhook(eventType, companyID string, eventData map[string]interface{}) error {
	// Get webhook configurations for this company and event type
	configs, err := s.getWebhookConfigs(companyID, eventType)
	if err != nil {
		return err
	}

	if len(configs) == 0 {
		// No webhooks configured for this event type
		return nil
	}

	// Create webhook event
	event := &WebhookEvent{
		ID:        uuid.New().String(),
		Type:      eventType,
		CompanyID: companyID,
		Data:      eventData,
		Timestamp: time.Now(),
	}

	// Queue webhook for each configured endpoint
	for _, config := range configs {
		if !config.IsActive {
			continue
		}

		event.WebhookURL = config.WebhookURL
		event.Signature = s.generateSignature(event, config.Secret)

		err := s.queueWebhook(event)
		if err != nil {
			log.Printf("Failed to queue webhook for company %s: %v", companyID, err)
		}
	}

	return nil
}

// queueWebhook queues a webhook for delivery
func (s *WebhookService) queueWebhook(event *WebhookEvent) error {
	eventDataJSON, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(`
		INSERT INTO webhook_events (
			id, company_id, event_type, event_data, webhook_url,
			status, attempt_count, max_attempts, next_attempt_at,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, event.ID, event.CompanyID, event.Type, string(eventDataJSON),
		event.WebhookURL, "pending", 0, 3, time.Now(),
		time.Now(), time.Now())

	if err != nil {
		return err
	}

	// Try to send immediately
	go s.sendWebhook(event)

	return nil
}

// sendWebhook sends a webhook to the configured URL
func (s *WebhookService) sendWebhook(event *WebhookEvent) {
	eventJSON, err := json.Marshal(event)
	if err != nil {
		s.markWebhookFailed(event.ID, fmt.Sprintf("JSON marshal error: %v", err))
		return
	}

	req, err := http.NewRequest("POST", event.WebhookURL, bytes.NewBuffer(eventJSON))
	if err != nil {
		s.markWebhookFailed(event.ID, fmt.Sprintf("Request creation error: %v", err))
		return
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Zootel-Webhook/1.0")
	req.Header.Set("X-Zootel-Event", event.Type)
	req.Header.Set("X-Zootel-Delivery", event.ID)
	req.Header.Set("X-Zootel-Timestamp", fmt.Sprintf("%d", event.Timestamp.Unix()))

	if event.Signature != "" {
		req.Header.Set("X-Zootel-Signature", event.Signature)
	}

	// Send request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.handleWebhookFailure(event.ID, 0, fmt.Sprintf("HTTP error: %v", err))
		return
	}
	defer resp.Body.Close()

	// Read response body
	responseBody, _ := io.ReadAll(resp.Body)

	// Check response status
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		s.markWebhookSent(event.ID, resp.StatusCode, string(responseBody))
		log.Printf("Webhook %s sent successfully to %s", event.ID, event.WebhookURL)
	} else {
		s.handleWebhookFailure(event.ID, resp.StatusCode, string(responseBody))
		log.Printf("Webhook %s failed with status %d: %s", event.ID, resp.StatusCode, string(responseBody))
	}
}

// processFailedWebhooks processes failed webhooks for retry
func (s *WebhookService) processFailedWebhooks() {
	rows, err := s.db.Query(`
		SELECT id, company_id, event_type, event_data, webhook_url, attempt_count
		FROM webhook_events
		WHERE status IN ('pending', 'failed', 'retrying')
			AND next_attempt_at <= NOW()
			AND attempt_count < max_attempts
		ORDER BY created_at ASC
		LIMIT 50
	`)
	if err != nil {
		log.Printf("Error querying failed webhooks: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, companyID, eventType, eventDataStr, webhookURL string
		var attemptCount int

		err := rows.Scan(&id, &companyID, &eventType, &eventDataStr, &webhookURL, &attemptCount)
		if err != nil {
			continue
		}

		// Parse event data
		var eventData map[string]interface{}
		json.Unmarshal([]byte(eventDataStr), &eventData)

		// Create webhook event
		event := &WebhookEvent{
			ID:         id,
			Type:       eventType,
			CompanyID:  companyID,
			Data:       eventData,
			WebhookURL: webhookURL,
			Timestamp:  time.Now(),
		}

		// Update attempt count
		s.incrementWebhookAttempt(id)

		// Retry sending
		go s.sendWebhook(event)
	}
}

// Webhook configuration management

// CreateWebhookConfig creates a new webhook configuration
func (s *WebhookService) CreateWebhookConfig(companyID, webhookURL, secret string, eventTypes []string) error {
	eventTypesJSON, err := json.Marshal(eventTypes)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(`
		INSERT INTO webhook_configs (
			id, company_id, webhook_url, event_types, secret, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, uuid.New().String(), companyID, webhookURL, string(eventTypesJSON),
		secret, true, time.Now(), time.Now())

	return err
}

// GetWebhookConfigs returns webhook configurations for a company
func (s *WebhookService) GetWebhookConfigs(companyID string) ([]WebhookConfig, error) {
	rows, err := s.db.Query(`
		SELECT id, company_id, webhook_url, event_types, secret, is_active, created_at, updated_at
		FROM webhook_configs
		WHERE company_id = $1
		ORDER BY created_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []WebhookConfig
	for rows.Next() {
		var config WebhookConfig
		var id, eventTypesStr string

		err := rows.Scan(&id, &config.CompanyID, &config.WebhookURL, &eventTypesStr,
			&config.Secret, &config.IsActive, &config.CreatedAt, &config.UpdatedAt)
		if err != nil {
			continue
		}

		// Parse event types
		json.Unmarshal([]byte(eventTypesStr), &config.EventTypes)

		configs = append(configs, config)
	}

	return configs, nil
}

// UpdateWebhookConfig updates a webhook configuration
func (s *WebhookService) UpdateWebhookConfig(configID, webhookURL, secret string, eventTypes []string, isActive bool) error {
	eventTypesJSON, err := json.Marshal(eventTypes)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(`
		UPDATE webhook_configs 
		SET webhook_url = $2, event_types = $3, secret = $4, is_active = $5, updated_at = $6
		WHERE id = $1
	`, configID, webhookURL, string(eventTypesJSON), secret, isActive, time.Now())

	return err
}

// DeleteWebhookConfig deletes a webhook configuration
func (s *WebhookService) DeleteWebhookConfig(configID string) error {
	_, err := s.db.Exec("DELETE FROM webhook_configs WHERE id = $1", configID)
	return err
}

// GetWebhookDeliveries returns webhook delivery history
func (s *WebhookService) GetWebhookDeliveries(companyID string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT id, event_type, webhook_url, status, attempt_count, 
			   response_code, created_at, last_attempt_at
		FROM webhook_events
		WHERE company_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := s.db.Query(query, companyID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deliveries []map[string]interface{}
	for rows.Next() {
		var id, eventType, webhookURL, status string
		var attemptCount, responseCode int
		var createdAt, lastAttemptAt time.Time

		err := rows.Scan(&id, &eventType, &webhookURL, &status, &attemptCount,
			&responseCode, &createdAt, &lastAttemptAt)
		if err != nil {
			continue
		}

		deliveries = append(deliveries, map[string]interface{}{
			"id":              id,
			"event_type":      eventType,
			"webhook_url":     webhookURL,
			"status":          status,
			"attempt_count":   attemptCount,
			"response_code":   responseCode,
			"created_at":      createdAt,
			"last_attempt_at": lastAttemptAt,
		})
	}

	return deliveries, nil
}

// Helper methods

func (s *WebhookService) getWebhookConfigs(companyID, eventType string) ([]WebhookConfig, error) {
	rows, err := s.db.Query(`
		SELECT id, company_id, webhook_url, event_types, secret, is_active, created_at, updated_at
		FROM webhook_configs
		WHERE company_id = $1 AND is_active = true
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []WebhookConfig
	for rows.Next() {
		var config WebhookConfig
		var id, eventTypesStr string

		err := rows.Scan(&id, &config.CompanyID, &config.WebhookURL, &eventTypesStr,
			&config.Secret, &config.IsActive, &config.CreatedAt, &config.UpdatedAt)
		if err != nil {
			continue
		}

		// Parse event types
		var eventTypes []string
		json.Unmarshal([]byte(eventTypesStr), &eventTypes)
		config.EventTypes = eventTypes

		// Check if this config listens for the specific event type
		for _, et := range eventTypes {
			if et == eventType || et == "*" {
				configs = append(configs, config)
				break
			}
		}
	}

	return configs, nil
}

func (s *WebhookService) generateSignature(event *WebhookEvent, secret string) string {
	if secret == "" {
		return ""
	}

	eventJSON, _ := json.Marshal(event)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(eventJSON)
	return "sha256=" + hex.EncodeToString(h.Sum(nil))
}

func (s *WebhookService) markWebhookSent(eventID string, responseCode int, responseBody string) {
	_, err := s.db.Exec(`
		UPDATE webhook_events 
		SET status = 'sent', response_code = $2, response_body = $3, 
			last_attempt_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, eventID, responseCode, responseBody)

	if err != nil {
		log.Printf("Error marking webhook as sent: %v", err)
	}
}

func (s *WebhookService) markWebhookFailed(eventID, errorMsg string) {
	_, err := s.db.Exec(`
		UPDATE webhook_events 
		SET status = 'failed', response_body = $2, last_attempt_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`, eventID, errorMsg)

	if err != nil {
		log.Printf("Error marking webhook as failed: %v", err)
	}
}

func (s *WebhookService) handleWebhookFailure(eventID string, responseCode int, responseBody string) {
	// Increment attempt count and set next retry time
	nextRetry := time.Now().Add(5 * time.Minute) // 5 minute delay between retries

	_, err := s.db.Exec(`
		UPDATE webhook_events 
		SET status = 'retrying', attempt_count = attempt_count + 1,
			response_code = $2, response_body = $3, last_attempt_at = NOW(),
			next_attempt_at = $4, updated_at = NOW()
		WHERE id = $1 AND attempt_count < max_attempts
	`, eventID, responseCode, responseBody, nextRetry)

	if err != nil {
		log.Printf("Error updating webhook retry: %v", err)
	}

	// Mark as permanently failed if max attempts reached
	_, err = s.db.Exec(`
		UPDATE webhook_events 
		SET status = 'failed', updated_at = NOW()
		WHERE id = $1 AND attempt_count >= max_attempts
	`, eventID)

	if err != nil {
		log.Printf("Error marking webhook as permanently failed: %v", err)
	}
}

func (s *WebhookService) incrementWebhookAttempt(eventID string) {
	_, err := s.db.Exec(`
		UPDATE webhook_events 
		SET attempt_count = attempt_count + 1, status = 'retrying', updated_at = NOW()
		WHERE id = $1
	`, eventID)

	if err != nil {
		log.Printf("Error incrementing webhook attempt: %v", err)
	}
}
