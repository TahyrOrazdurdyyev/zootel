package services

import (
	"fmt"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

// SendCryptoPaymentCreatedNotification sends notification when crypto payment is created
func (s *NotificationService) SendCryptoPaymentCreatedNotification(userID, orderID, paymentID, currency, amount string) error {
	// Get user details
	var user models.User
	query := `
		SELECT id, first_name, last_name, email 
		FROM users 
		WHERE id = $1
	`
	err := s.db.QueryRow(query, userID).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email,
	)
	if err != nil {
		return fmt.Errorf("failed to get user details: %v", err)
	}

	// Create notification payload
	payload := &NotificationPayload{
		Type:    "crypto_payment_created",
		Title:   "Crypto Payment Created",
		Message: fmt.Sprintf("Please send %s %s to complete your payment", amount, currency),
		Data: map[string]interface{}{
			"payment_id": paymentID,
			"currency":   currency,
			"amount":     amount,
		},
		UserID:    userID,
		OrderID:   &orderID,
		ActionURL: fmt.Sprintf("/payment/crypto/%s", paymentID),
	}

	// Send notification
	return s.SendImmediateNotification(payload, []string{"push", "email"})
}

// SendCryptoPaymentConfirmedNotification sends notification when crypto payment is confirmed
func (s *NotificationService) SendCryptoPaymentConfirmedNotification(userID, orderID, paymentID, currency, amount string) error {
	// Get user details
	var user models.User
	query := `
		SELECT id, first_name, last_name, email 
		FROM users 
		WHERE id = $1
	`
	err := s.db.QueryRow(query, userID).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email,
	)
	if err != nil {
		return fmt.Errorf("failed to get user details: %v", err)
	}

	// Create notification payload
	payload := &NotificationPayload{
		Type:    "crypto_payment_confirmed",
		Title:   "Payment Confirmed",
		Message: fmt.Sprintf("Your payment of %s %s has been confirmed!", amount, currency),
		Data: map[string]interface{}{
			"payment_id": paymentID,
			"currency":   currency,
			"amount":     amount,
		},
		UserID:    userID,
		OrderID:   &orderID,
		ActionURL: "/orders",
	}

	// Send notification
	return s.SendImmediateNotification(payload, []string{"push", "email"})
}

// SendCryptoPaymentFailedNotification sends notification when crypto payment fails
func (s *NotificationService) SendCryptoPaymentFailedNotification(userID, orderID, paymentID, reason string) error {
	// Get user details
	var user models.User
	query := `
		SELECT id, first_name, last_name, email 
		FROM users 
		WHERE id = $1
	`
	err := s.db.QueryRow(query, userID).Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Email,
	)
	if err != nil {
		return fmt.Errorf("failed to get user details: %v", err)
	}

	// Create notification payload
	payload := &NotificationPayload{
		Type:    "crypto_payment_failed",
		Title:   "Payment Failed",
		Message: fmt.Sprintf("Your crypto payment failed: %s", reason),
		Data: map[string]interface{}{
			"payment_id": paymentID,
			"reason":     reason,
		},
		UserID:    userID,
		OrderID:   &orderID,
		ActionURL: "/cart",
	}

	// Send notification
	return s.SendImmediateNotification(payload, []string{"push", "email"})
}
