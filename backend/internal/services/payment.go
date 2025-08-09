package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
)

type PaymentService struct {
	db              *sql.DB
	paymentSettings *models.PaymentSettings
	stripeSecretKey string
	webhookSecret   string
}

func NewPaymentService(db *sql.DB) *PaymentService {
	service := &PaymentService{
		db: db,
	}
	// Load payment settings on initialization
	service.loadPaymentSettings()
	return service
}

// loadPaymentSettings loads current payment settings from database
func (s *PaymentService) loadPaymentSettings() error {
	settings := &models.PaymentSettings{}
	err := s.db.QueryRow(`
		SELECT id, stripe_enabled, commission_enabled, commission_percentage, 
			   stripe_publishable_key, stripe_secret_key, stripe_webhook_secret, 
			   created_at, updated_at
		FROM payment_settings LIMIT 1
	`).Scan(
		&settings.ID, &settings.StripeEnabled, &settings.CommissionEnabled,
		&settings.CommissionPercentage, &settings.StripePublishableKey,
		&settings.StripeSecretKey, &settings.StripeWebhookSecret,
		&settings.CreatedAt, &settings.UpdatedAt,
	)

	if err != nil && err != sql.ErrNoRows {
		return err
	}

	// If no settings exist, create default ones
	if err == sql.ErrNoRows {
		defaultSettings := &models.PaymentSettings{
			ID:                   uuid.New().String(),
			StripeEnabled:        false, // Disabled by default until keys are set
			CommissionEnabled:    true,  // Commission enabled by default
			CommissionPercentage: 10.0,  // 10% default commission
			CreatedAt:            time.Now(),
			UpdatedAt:            time.Now(),
		}

		_, err = s.db.Exec(`
			INSERT INTO payment_settings (id, stripe_enabled, commission_enabled, commission_percentage, 
										 stripe_publishable_key, stripe_secret_key, stripe_webhook_secret, 
										 created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, defaultSettings.ID, defaultSettings.StripeEnabled, defaultSettings.CommissionEnabled,
			defaultSettings.CommissionPercentage, defaultSettings.StripePublishableKey,
			defaultSettings.StripeSecretKey, defaultSettings.StripeWebhookSecret,
			defaultSettings.CreatedAt, defaultSettings.UpdatedAt)

		if err != nil {
			return err
		}
		settings = defaultSettings
	}

	s.paymentSettings = settings
	s.stripeSecretKey = settings.StripeSecretKey
	s.webhookSecret = settings.StripeWebhookSecret

	return nil
}

type PaymentRequest struct {
	UserID      string                 `json:"user_id" binding:"required"`
	CompanyID   string                 `json:"company_id" binding:"required"`
	BookingID   *string                `json:"booking_id"`
	OrderID     *string                `json:"order_id"`
	Amount      float64                `json:"amount" binding:"required"`
	Currency    string                 `json:"currency" binding:"required"`
	Description string                 `json:"description"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type PaymentIntentResponse struct {
	PaymentIntentID string `json:"payment_intent_id"`
	ClientSecret    string `json:"client_secret"`
	Status          string `json:"status"`
	Amount          int64  `json:"amount"`
	Currency        string `json:"currency"`
	OfflineMode     bool   `json:"offline_mode"`    // Indicates if payment is offline
	OfflineMessage  string `json:"offline_message"` // Message for offline payments
}

type RefundRequest struct {
	PaymentID string  `json:"payment_id" binding:"required"`
	Amount    float64 `json:"amount" binding:"required"`
	Reason    string  `json:"reason"`
}

// CreatePaymentIntent creates a payment intent with commission and escrow logic
func (s *PaymentService) CreatePaymentIntent(req *PaymentRequest) (*PaymentIntentResponse, error) {
	// Reload settings to get latest configuration
	if err := s.loadPaymentSettings(); err != nil {
		return nil, err
	}

	// Calculate commission and amounts
	var commissionAmount, platformAmount, companyAmount float64
	if s.paymentSettings.CommissionEnabled {
		commissionAmount = req.Amount * (s.paymentSettings.CommissionPercentage / 100.0)
		platformAmount = req.Amount                   // Full amount goes to platform initially
		companyAmount = req.Amount - commissionAmount // Amount to transfer to company later
	} else {
		commissionAmount = 0
		platformAmount = req.Amount
		companyAmount = req.Amount
	}

	// Create payment record
	payment := &models.Payment{
		ID:                    uuid.New().String(),
		UserID:                req.UserID,
		CompanyID:             &req.CompanyID,
		BookingID:             req.BookingID,
		OrderID:               req.OrderID,
		StripePaymentIntentID: uuid.New().String(), // Placeholder for now
		Amount:                req.Amount,
		Currency:              req.Currency,
		Status:                "pending",
		CommissionAmount:      commissionAmount,
		PlatformAmount:        platformAmount,
		CompanyAmount:         companyAmount,
		PaymentMethodType:     "card", // Default
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	// Store payment in database
	_, err := s.db.Exec(`
		INSERT INTO payments (id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
							 amount, currency, status, commission_amount, platform_amount, company_amount,
							 payment_method_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`, payment.ID, payment.UserID, payment.CompanyID, payment.BookingID,
		payment.OrderID, payment.StripePaymentIntentID, payment.Amount,
		payment.Currency, payment.Status, payment.CommissionAmount,
		payment.PlatformAmount, payment.CompanyAmount, payment.PaymentMethodType,
		payment.CreatedAt, payment.UpdatedAt)

	if err != nil {
		return nil, err
	}

	response := &PaymentIntentResponse{
		PaymentIntentID: payment.StripePaymentIntentID,
		Status:          payment.Status,
		Amount:          int64(payment.Amount * 100),
		Currency:        payment.Currency,
	}

	// Check if Stripe is enabled
	if s.paymentSettings.StripeEnabled && s.stripeSecretKey != "" {
		// TODO: Create actual Stripe payment intent when SDK is available
		response.ClientSecret = "placeholder_client_secret"
		response.OfflineMode = false
	} else {
		// Offline mode
		response.ClientSecret = ""
		response.OfflineMode = true
		response.OfflineMessage = "Онлайн-оплата временно недоступна. Пожалуйста, произведите оплату наличными или переводом. После оплаты свяжитесь с нами для подтверждения."
	}

	return response, nil
}

// TransferToCompany transfers payment from platform to company after service completion
func (s *PaymentService) TransferToCompany(paymentID string, reason string) error {
	// Get payment details
	var payment models.Payment
	err := s.db.QueryRow(`
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, platform_amount, company_amount,
			   transferred_at, payment_method_type, created_at, updated_at
		FROM payments WHERE id = $1
	`, paymentID).Scan(
		&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
		&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
		&payment.Currency, &payment.Status, &payment.CommissionAmount,
		&payment.PlatformAmount, &payment.CompanyAmount, &payment.TransferredAt,
		&payment.PaymentMethodType, &payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		return err
	}

	// Check if already transferred
	if payment.TransferredAt != nil {
		return fmt.Errorf("payment already transferred to company")
	}

	// Check if payment is succeeded
	if payment.Status != "succeeded" {
		return fmt.Errorf("cannot transfer payment with status: %s", payment.Status)
	}

	// For now, just mark as transferred (TODO: implement actual Stripe transfer)
	now := time.Now()
	_, err = s.db.Exec(`
		UPDATE payments SET transferred_at = $2, updated_at = $3 WHERE id = $1
	`, paymentID, now, now)

	if err != nil {
		return err
	}

	// TODO: When Stripe is enabled, implement actual transfer to company's connected account
	// Example: stripe.Transfer.New(&stripe.TransferParams{...})

	return nil
}

// GetPaymentSettings returns current payment settings
func (s *PaymentService) GetPaymentSettings() (*models.PaymentSettings, error) {
	if err := s.loadPaymentSettings(); err != nil {
		return nil, err
	}
	return s.paymentSettings, nil
}

// UpdatePaymentSettings updates payment settings (admin only)
func (s *PaymentService) UpdatePaymentSettings(settings *models.PaymentSettings) error {
	settings.UpdatedAt = time.Now()

	_, err := s.db.Exec(`
		UPDATE payment_settings SET 
			stripe_enabled = $2,
			commission_enabled = $3,
			commission_percentage = $4,
			stripe_publishable_key = $5,
			stripe_secret_key = $6,
			stripe_webhook_secret = $7,
			updated_at = $8
		WHERE id = $1
	`, settings.ID, settings.StripeEnabled, settings.CommissionEnabled,
		settings.CommissionPercentage, settings.StripePublishableKey,
		settings.StripeSecretKey, settings.StripeWebhookSecret, settings.UpdatedAt)

	if err != nil {
		return err
	}

	// Reload settings
	return s.loadPaymentSettings()
}

// MarkServiceCompleted marks a booking/order as completed and triggers payment transfer
func (s *PaymentService) MarkServiceCompleted(bookingID, orderID *string, reason string) error {
	var paymentID string
	var query string
	var args []interface{}

	if bookingID != nil {
		query = "SELECT id FROM payments WHERE booking_id = $1 AND status = 'succeeded' AND transferred_at IS NULL"
		args = []interface{}{*bookingID}
	} else if orderID != nil {
		query = "SELECT id FROM payments WHERE order_id = $1 AND status = 'succeeded' AND transferred_at IS NULL"
		args = []interface{}{*orderID}
	} else {
		return fmt.Errorf("either booking_id or order_id must be provided")
	}

	err := s.db.QueryRow(query, args...).Scan(&paymentID)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("no transferable payment found")
		}
		return err
	}

	return s.TransferToCompany(paymentID, reason)
}

// HandleWebhook processes payment webhooks (placeholder implementation)
func (s *PaymentService) HandleWebhook(payload []byte, sigHeader string) error {
	// TODO: Implement Stripe webhook handling when SDK is available
	return fmt.Errorf("Stripe webhook functionality is currently disabled")
}

// RefundPayment processes a refund (placeholder implementation)
func (s *PaymentService) RefundPayment(req *RefundRequest) (*models.Refund, error) {
	// TODO: Implement Stripe refund when SDK is available

	// Get payment
	var payment models.Payment
	err := s.db.QueryRow(`
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, platform_amount, company_amount,
			   transferred_at, payment_method_type, created_at, updated_at
		FROM payments WHERE id = $1
	`, req.PaymentID).Scan(
		&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
		&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
		&payment.Currency, &payment.Status, &payment.CommissionAmount,
		&payment.PlatformAmount, &payment.CompanyAmount, &payment.TransferredAt,
		&payment.PaymentMethodType, &payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Create refund record
	refundRecord := &models.Refund{
		ID:             uuid.New().String(),
		PaymentID:      payment.ID,
		StripeRefundID: uuid.New().String(), // Placeholder
		Amount:         req.Amount,
		Reason:         req.Reason,
		Status:         "pending",
		CreatedAt:      time.Now(),
	}

	// Store refund record
	_, err = s.db.Exec(`
		INSERT INTO refunds (id, payment_id, stripe_refund_id, amount, reason, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, refundRecord.ID, refundRecord.PaymentID, refundRecord.StripeRefundID,
		refundRecord.Amount, refundRecord.Reason, refundRecord.Status, refundRecord.CreatedAt)

	if err != nil {
		return nil, err
	}

	return refundRecord, nil
}

// GetPaymentsByUser retrieves payments for a user
func (s *PaymentService) GetPaymentsByUser(userID string, days int) ([]models.Payment, error) {
	var payments []models.Payment

	query := `
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, platform_amount, company_amount,
			   transferred_at, payment_method_type, created_at, updated_at
		FROM payments WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var payment models.Payment
		err := rows.Scan(
			&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
			&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
			&payment.Currency, &payment.Status, &payment.CommissionAmount,
			&payment.PlatformAmount, &payment.CompanyAmount, &payment.TransferredAt,
			&payment.PaymentMethodType, &payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	return payments, nil
}

// GetPaymentsByCompany retrieves payments for a company
func (s *PaymentService) GetPaymentsByCompany(companyID string, days int) ([]models.Payment, error) {
	var payments []models.Payment

	query := `
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, platform_amount, company_amount,
			   transferred_at, payment_method_type, created_at, updated_at
		FROM payments WHERE company_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var payment models.Payment
		err := rows.Scan(
			&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
			&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
			&payment.Currency, &payment.Status, &payment.CommissionAmount,
			&payment.PlatformAmount, &payment.CompanyAmount, &payment.TransferredAt,
			&payment.PaymentMethodType, &payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	return payments, nil
}

// GetPaymentStatistics returns payment statistics
func (s *PaymentService) GetPaymentStatistics(companyID string, days int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Basic placeholder statistics - TODO: implement real stats
	stats["total_payments"] = 0
	stats["successful_payments"] = 0
	stats["failed_payments"] = 0
	stats["refunded_payments"] = 0
	stats["total_amount"] = 0.0
	stats["total_commission"] = 0.0
	stats["pending_transfers"] = 0
	stats["transferred_amount"] = 0.0
	stats["success_rate"] = 0.0
	stats["refund_rate"] = 0.0
	stats["average_payment_amount"] = 0.0

	return stats, nil
}

// Additional methods needed by handlers
func (s *PaymentService) GetPaymentByID(paymentID string) (*models.Payment, error) {
	var payment models.Payment
	err := s.db.QueryRow(`
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, platform_amount, company_amount,
			   transferred_at, payment_method_type, created_at, updated_at
		FROM payments WHERE id = $1
	`, paymentID).Scan(
		&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
		&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
		&payment.Currency, &payment.Status, &payment.CommissionAmount,
		&payment.PlatformAmount, &payment.CompanyAmount, &payment.TransferredAt,
		&payment.PaymentMethodType, &payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

func (s *PaymentService) UpdatePaymentStatus(paymentID, status string) error {
	_, err := s.db.Exec(`
		UPDATE payments SET status = $2, updated_at = $3 WHERE id = $1
	`, paymentID, status, time.Now())
	return err
}

func (s *PaymentService) GetUserPaymentMethods(userID string) ([]map[string]interface{}, error) {
	// TODO: Implement when Stripe is available
	return []map[string]interface{}{}, nil
}

func (s *PaymentService) CreateSetupIntent(userID string) (map[string]interface{}, error) {
	// TODO: Implement when Stripe is available
	return map[string]interface{}{
		"setup_intent_id": "placeholder",
		"client_secret":   "placeholder",
		"offline_mode":    !s.paymentSettings.StripeEnabled,
	}, nil
}

func (s *PaymentService) CreateSubscription(userID, priceID, paymentMethodID string) (map[string]interface{}, error) {
	// TODO: Implement when Stripe is available
	return map[string]interface{}{
		"subscription_id": "placeholder",
		"status":          "offline",
		"offline_mode":    !s.paymentSettings.StripeEnabled,
	}, nil
}

func (s *PaymentService) ConfirmPayment(paymentIntentID, paymentMethodID, userID string) (*models.Payment, error) {
	// TODO: Implement Stripe payment confirmation when SDK is available
	return nil, fmt.Errorf("Stripe functionality is currently disabled")
}

func (s *PaymentService) GetPaymentHistory(userID string, limit, offset int, status string) ([]models.Payment, int, error) {
	var payments []models.Payment
	var totalCount int

	// Build query conditions
	whereClause := "WHERE user_id = $1"
	args := []interface{}{userID}
	argIndex := 2

	if status != "" {
		whereClause += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM payments %s", whereClause)
	err := s.db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// Get payments with pagination
	query := fmt.Sprintf(`
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, platform_amount, company_amount,
			   transferred_at, payment_method_type, created_at, updated_at
		FROM payments %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var payment models.Payment
		err := rows.Scan(
			&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
			&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
			&payment.Currency, &payment.Status, &payment.CommissionAmount,
			&payment.PlatformAmount, &payment.CompanyAmount, &payment.TransferredAt,
			&payment.PaymentMethodType, &payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		payments = append(payments, payment)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, err
	}

	return payments, totalCount, nil
}
