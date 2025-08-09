package services

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/paymentintent"
	"github.com/stripe/stripe-go/refund"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/webhook"
	// "github.com/stripe/stripe-go/v76"
	// "github.com/stripe/stripe-go/v76/customer"
	// "github.com/stripe/stripe-go/v76/paymentintent"
	// "github.com/stripe/stripe-go/v76/refund"
	// "github.com/stripe/stripe-go/v76/webhook"
)

type PaymentService struct {
	db                *sql.DB
	stripeSecretKey   string
	webhookSecret     string
	commissionEnabled bool
	commissionRate    float64
}

func NewPaymentService(db *sql.DB, stripeSecretKey, webhookSecret string) *PaymentService {
	// stripe.Key = stripeSecretKey

	return &PaymentService{
		db:              db,
		stripeSecretKey: stripeSecretKey,
		webhookSecret:   webhookSecret,
	}
}

type PaymentRequest struct {
	UserID      string            `json:"user_id" binding:"required"`
	CompanyID   string            `json:"company_id" binding:"required"`
	BookingID   *string           `json:"booking_id"`
	OrderID     *string           `json:"order_id"`
	Amount      float64           `json:"amount" binding:"required"`
	Currency    string            `json:"currency"`
	Description string            `json:"description"`
	Metadata    map[string]string `json:"metadata"`
}

type PaymentIntentResponse struct {
	PaymentIntentID string `json:"payment_intent_id"`
	ClientSecret    string `json:"client_secret"`
	Status          string `json:"status"`
	Amount          int64  `json:"amount"`
	Currency        string `json:"currency"`
}

type RefundRequest struct {
	PaymentID string   `json:"payment_id" binding:"required"`
	Amount    *float64 `json:"amount"` // Optional, full refund if not specified
	Reason    string   `json:"reason"`
}

// Initialize loads commission settings from database
func (s *PaymentService) Initialize() error {
	var settings models.PaymentSettings
	err := s.db.QueryRow(`
		SELECT commission_enabled, commission_percentage
		FROM payment_settings LIMIT 1
	`).Scan(&settings.CommissionEnabled, &settings.CommissionPercentage)

	if err != nil && err != sql.ErrNoRows {
		return err
	}

	s.commissionEnabled = settings.CommissionEnabled
	s.commissionRate = settings.CommissionPercentage / 100.0

	return nil
}

// CreatePaymentIntent creates a Stripe payment intent
func (s *PaymentService) CreatePaymentIntent(req *PaymentRequest) (*PaymentIntentResponse, error) {
	if req.Currency == "" {
		req.Currency = "usd"
	}

	// Convert amount to cents for Stripe
	amountCents := int64(req.Amount * 100)

	// Calculate commission if enabled
	var applicationFee int64
	if s.commissionEnabled {
		applicationFee = int64(req.Amount * s.commissionRate * 100)
	}

	// Get or create customer
	customerID, err := s.getOrCreateStripeCustomer(req.UserID)
	if err != nil {
		return nil, err
	}

	// Create payment intent
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amountCents),
		Currency: stripe.String(req.Currency),
		Customer: stripe.String(customerID),
		Metadata: req.Metadata,
	}

	if req.Description != "" {
		params.Description = stripe.String(req.Description)
	}

	if applicationFee > 0 {
		params.ApplicationFeeAmount = stripe.Int64(applicationFee)
	}

	// Set connected account (company's Stripe account) if available
	// This would require company Stripe account setup
	// params.TransferData = &stripe.PaymentIntentTransferDataParams{
	//     Destination: stripe.String(companyStripeAccountID),
	// }

	pi, err := paymentintent.New(params)
	if err != nil {
		return nil, err
	}

	// Store payment in database
	payment := &models.Payment{
		ID:                    uuid.New().String(),
		UserID:                req.UserID,
		CompanyID:             req.CompanyID,
		BookingID:             req.BookingID,
		OrderID:               req.OrderID,
		StripePaymentIntentID: pi.ID,
		Amount:                req.Amount,
		Currency:              req.Currency,
		Status:                string(pi.Status),
		CommissionAmount:      float64(applicationFee) / 100.0,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	_, err = s.db.Exec(`
		INSERT INTO payments (
			id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			amount, currency, status, commission_amount, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, payment.ID, payment.UserID, payment.CompanyID, payment.BookingID,
		payment.OrderID, payment.StripePaymentIntentID, payment.Amount,
		payment.Currency, payment.Status, payment.CommissionAmount,
		payment.CreatedAt, payment.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &PaymentIntentResponse{
		PaymentIntentID: pi.ID,
		ClientSecret:    pi.ClientSecret,
		Status:          string(pi.Status),
		Amount:          pi.Amount,
		Currency:        string(pi.Currency),
	}, nil
}

// HandleWebhook processes Stripe webhooks
func (s *PaymentService) HandleWebhook(payload []byte, sigHeader string) error {
	event, err := webhook.ConstructEvent(payload, sigHeader, s.webhookSecret)
	if err != nil {
		return fmt.Errorf("webhook signature verification failed: %v", err)
	}

	switch event.Type {
	case "payment_intent.succeeded":
		return s.handlePaymentIntentSucceeded(event.Data.Object)
	case "payment_intent.payment_failed":
		return s.handlePaymentIntentFailed(event.Data.Object)
	case "payment_intent.canceled":
		return s.handlePaymentIntentCanceled(event.Data.Object)
	case "charge.dispute.created":
		return s.handleChargeDispute(event.Data.Object)
	default:
		fmt.Printf("Unhandled webhook event type: %s\n", event.Type)
	}

	return nil
}

// RefundPayment processes a refund
func (s *PaymentService) RefundPayment(req *RefundRequest) (*models.Payment, error) {
	// Get payment from database
	var payment models.Payment
	err := s.db.QueryRow(`
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, created_at, updated_at
		FROM payments WHERE id = $1
	`, req.PaymentID).Scan(
		&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
		&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
		&payment.Currency, &payment.Status, &payment.CommissionAmount,
		&payment.CreatedAt, &payment.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if payment.Status != "succeeded" {
		return nil, fmt.Errorf("cannot refund payment with status: %s", payment.Status)
	}

	// Calculate refund amount
	refundAmount := payment.Amount
	if req.Amount != nil {
		refundAmount = *req.Amount
		if refundAmount > payment.Amount {
			return nil, fmt.Errorf("refund amount cannot exceed original amount")
		}
	}

	// Create Stripe refund
	refundParams := &stripe.RefundParams{
		PaymentIntent: stripe.String(payment.StripePaymentIntentID),
		Amount:        stripe.Int64(int64(refundAmount * 100)),
	}

	if req.Reason != "" {
		refundParams.Reason = stripe.String(req.Reason)
	}

	stripeRefund, err := refund.New(refundParams)
	if err != nil {
		return nil, err
	}

	// Update payment status and create refund record
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Update payment status
	newStatus := "refunded"
	if refundAmount < payment.Amount {
		newStatus = "partially_refunded"
	}

	_, err = tx.Exec(`
		UPDATE payments SET status = $2, updated_at = $3 WHERE id = $1
	`, payment.ID, newStatus, time.Now())
	if err != nil {
		return nil, err
	}

	// Create refund record
	refundRecord := &models.Refund{
		ID:             uuid.New().String(),
		PaymentID:      payment.ID,
		StripeRefundID: stripeRefund.ID,
		Amount:         refundAmount,
		Reason:         req.Reason,
		Status:         string(stripeRefund.Status),
		CreatedAt:      time.Now(),
	}

	_, err = tx.Exec(`
		INSERT INTO refunds (id, payment_id, stripe_refund_id, amount, reason, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, refundRecord.ID, refundRecord.PaymentID, refundRecord.StripeRefundID,
		refundRecord.Amount, refundRecord.Reason, refundRecord.Status, refundRecord.CreatedAt)
	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	payment.Status = newStatus
	payment.UpdatedAt = time.Now()

	return &payment, nil
}

// GetPaymentsByUser returns payments for a user
func (s *PaymentService) GetPaymentsByUser(userID string, limit int) ([]models.Payment, error) {
	query := `
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, created_at, updated_at
		FROM payments 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2
	`

	rows, err := s.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var payment models.Payment
		err := rows.Scan(
			&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
			&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
			&payment.Currency, &payment.Status, &payment.CommissionAmount,
			&payment.CreatedAt, &payment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	return payments, nil
}

// GetPaymentsByCompany returns payments for a company
func (s *PaymentService) GetPaymentsByCompany(companyID string, startDate, endDate time.Time) ([]models.Payment, error) {
	query := `
		SELECT id, user_id, company_id, booking_id, order_id, stripe_payment_intent_id,
			   amount, currency, status, commission_amount, created_at, updated_at
		FROM payments 
		WHERE company_id = $1 AND created_at >= $2 AND created_at <= $3
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, companyID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var payment models.Payment
		err := rows.Scan(
			&payment.ID, &payment.UserID, &payment.CompanyID, &payment.BookingID,
			&payment.OrderID, &payment.StripePaymentIntentID, &payment.Amount,
			&payment.Currency, &payment.Status, &payment.CommissionAmount,
			&payment.CreatedAt, &payment.UpdatedAt,
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

	whereClause := ""
	args := []interface{}{}

	if companyID != "" {
		whereClause = "WHERE company_id = $1"
		args = append(args, companyID)

		if days > 0 {
			whereClause += " AND created_at >= NOW() - INTERVAL '" + strconv.Itoa(days) + " days'"
		}
	} else if days > 0 {
		whereClause = "WHERE created_at >= NOW() - INTERVAL '" + strconv.Itoa(days) + " days'"
	}

	query := fmt.Sprintf(`
		SELECT 
			COUNT(*) as total_payments,
			COALESCE(SUM(amount), 0) as total_amount,
			COALESCE(SUM(commission_amount), 0) as total_commission,
			COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
			COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
			COUNT(*) FILTER (WHERE status = 'refunded') as refunded_payments
		FROM payments %s
	`, whereClause)

	var totalPayments, successfulPayments, failedPayments, refundedPayments int
	var totalAmount, totalCommission float64

	err := s.db.QueryRow(query, args...).Scan(
		&totalPayments, &totalAmount, &totalCommission,
		&successfulPayments, &failedPayments, &refundedPayments,
	)
	if err != nil {
		return nil, err
	}

	stats["total_payments"] = totalPayments
	stats["total_amount"] = totalAmount
	stats["total_commission"] = totalCommission
	stats["successful_payments"] = successfulPayments
	stats["failed_payments"] = failedPayments
	stats["refunded_payments"] = refundedPayments

	// Calculate rates
	if totalPayments > 0 {
		stats["success_rate"] = float64(successfulPayments) / float64(totalPayments) * 100
		stats["refund_rate"] = float64(refundedPayments) / float64(totalPayments) * 100
		stats["average_payment_amount"] = totalAmount / float64(totalPayments)
	} else {
		stats["success_rate"] = 0.0
		stats["refund_rate"] = 0.0
		stats["average_payment_amount"] = 0.0
	}

	return stats, nil
}

// Helper methods

func (s *PaymentService) getOrCreateStripeCustomer(userID string) (string, error) {
	// Check if user already has a Stripe customer ID
	var stripeCustomerID string
	err := s.db.QueryRow(`
		SELECT stripe_customer_id FROM users WHERE id = $1
	`, userID).Scan(&stripeCustomerID)

	if err == nil && stripeCustomerID != "" {
		return stripeCustomerID, nil
	}

	// Get user details
	var user models.User
	err = s.db.QueryRow(`
		SELECT id, email, first_name, last_name FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName)
	if err != nil {
		return "", err
	}

	// Create Stripe customer
	params := &stripe.CustomerParams{
		Email: stripe.String(user.Email),
		Name:  stripe.String(fmt.Sprintf("%s %s", user.FirstName, user.LastName)),
		Metadata: map[string]string{
			"user_id": user.ID,
		},
	}

	customer, err := customer.New(params)
	if err != nil {
		return "", err
	}

	// Update user with Stripe customer ID
	_, err = s.db.Exec(`
		UPDATE users SET stripe_customer_id = $2 WHERE id = $1
	`, userID, customer.ID)
	if err != nil {
		return "", err
	}

	return customer.ID, nil
}

func (s *PaymentService) handlePaymentIntentSucceeded(object map[string]interface{}) error {
	paymentIntentID := object["id"].(string)

	// Update payment status
	_, err := s.db.Exec(`
		UPDATE payments SET status = 'succeeded', updated_at = $2 
		WHERE stripe_payment_intent_id = $1
	`, paymentIntentID, time.Now())

	if err != nil {
		return err
	}

	// Update related booking/order status
	return s.updateRelatedEntitiesStatus(paymentIntentID, "paid")
}

func (s *PaymentService) handlePaymentIntentFailed(object map[string]interface{}) error {
	paymentIntentID := object["id"].(string)

	// Update payment status
	_, err := s.db.Exec(`
		UPDATE payments SET status = 'failed', updated_at = $2 
		WHERE stripe_payment_intent_id = $1
	`, paymentIntentID, time.Now())

	if err != nil {
		return err
	}

	// Update related booking/order status
	return s.updateRelatedEntitiesStatus(paymentIntentID, "payment_failed")
}

func (s *PaymentService) handlePaymentIntentCanceled(object map[string]interface{}) error {
	paymentIntentID := object["id"].(string)

	// Update payment status
	_, err := s.db.Exec(`
		UPDATE payments SET status = 'canceled', updated_at = $2 
		WHERE stripe_payment_intent_id = $1
	`, paymentIntentID, time.Now())

	return err
}

func (s *PaymentService) handleChargeDispute(object map[string]interface{}) error {
	// Handle charge disputes
	chargeID := object["charge"].(string)

	// TODO: Implement dispute handling logic
	fmt.Printf("Charge dispute created for charge: %s\n", chargeID)

	return nil
}

func (s *PaymentService) updateRelatedEntitiesStatus(paymentIntentID, status string) error {
	// Get payment details
	var bookingID, orderID sql.NullString
	err := s.db.QueryRow(`
		SELECT booking_id, order_id FROM payments 
		WHERE stripe_payment_intent_id = $1
	`, paymentIntentID).Scan(&bookingID, &orderID)

	if err != nil {
		return err
	}

	// Update booking if exists
	if bookingID.Valid {
		_, err = s.db.Exec(`
			UPDATE bookings SET payment_status = $2, updated_at = $3 
			WHERE id = $1
		`, bookingID.String, status, time.Now())
		if err != nil {
			return err
		}
	}

	// Update order if exists
	if orderID.Valid {
		_, err = s.db.Exec(`
			UPDATE orders SET payment_status = $2, updated_at = $3 
			WHERE id = $1
		`, orderID.String, status, time.Now())
		if err != nil {
			return err
		}
	}

	return nil
}

// ConfirmPayment confirms a payment intent and creates a payment record
func (s *PaymentService) ConfirmPayment(paymentIntentID, paymentMethodID, userID string) (*models.Payment, error) {
	// Get payment intent from Stripe
	pi, err := paymentintent.Get(paymentIntentID, nil)
	if err != nil {
		return nil, err
	}

	// Verify the payment intent belongs to the user (via metadata or customer)
	if pi.Customer != nil {
		// Get customer to verify user
		customer, err := customer.Get(*pi.Customer, nil)
		if err != nil {
			return nil, err
		}

		if customer.Metadata["user_id"] != userID {
			return nil, fmt.Errorf("payment intent does not belong to user")
		}
	}

	// Create payment record in database
	payment := &models.Payment{
		ID:                uuid.New().String(),
		UserID:            userID,
		Amount:            float64(pi.Amount) / 100, // Convert from cents
		Currency:          string(pi.Currency),
		Status:            string(pi.Status),
		StripePaymentID:   pi.ID,
		PaymentMethodType: "card", // Default, could be enhanced
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	// Extract additional data from metadata if available
	if companyID, ok := pi.Metadata["company_id"]; ok {
		payment.CompanyID = &companyID
	}
	if bookingID, ok := pi.Metadata["booking_id"]; ok {
		payment.BookingID = &bookingID
	}
	if orderID, ok := pi.Metadata["order_id"]; ok {
		payment.OrderID = &orderID
	}

	// Insert payment record
	_, err = s.db.Exec(`
		INSERT INTO payments (id, user_id, company_id, booking_id, order_id, amount, currency, 
							 status, stripe_payment_id, payment_method_type, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, payment.ID, payment.UserID, payment.CompanyID, payment.BookingID, payment.OrderID,
		payment.Amount, payment.Currency, payment.Status, payment.StripePaymentID,
		payment.PaymentMethodType, payment.CreatedAt, payment.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return payment, nil
}

// GetPaymentHistory retrieves payment history for a user with pagination
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
		SELECT id, user_id, company_id, booking_id, order_id, amount, currency,
			   status, stripe_payment_id, payment_method_type, created_at, updated_at
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
			&payment.OrderID, &payment.Amount, &payment.Currency, &payment.Status,
			&payment.StripePaymentID, &payment.PaymentMethodType,
			&payment.CreatedAt, &payment.UpdatedAt,
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
