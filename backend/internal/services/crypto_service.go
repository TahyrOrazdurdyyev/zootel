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
	"net/http"
	"os"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

type CryptoService struct {
	db                  *sql.DB
	apiKey              string
	apiURL              string
	notificationService *NotificationService
}

func NewCryptoService(db *sql.DB) *CryptoService {
	apiKey := os.Getenv("NOWPAYMENTS_API_KEY")
	if apiKey == "" {
		apiKey = "your-api-key-here" // Default for development
	}

	apiURL := os.Getenv("NOWPAYMENTS_API_URL")
	if apiURL == "" {
		apiURL = "https://api.nowpayments.io/v1" // Default API URL
	}

	return &CryptoService{
		db:     db,
		apiKey: apiKey,
		apiURL: apiURL,
	}
}

// SetNotificationService sets the notification service for sending notifications
func (s *CryptoService) SetNotificationService(notificationService *NotificationService) {
	s.notificationService = notificationService
}

// GetAvailableCurrencies returns all available crypto currencies from NowPayments
func (s *CryptoService) GetAvailableCurrencies() ([]models.NowPaymentsCurrency, error) {
	url := fmt.Sprintf("%s/currencies", s.apiURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("NowPayments API error: %s", string(body))
	}

	var response models.NowPaymentsCurrenciesResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return response.Currencies, nil
}

// GetAvailableNetworks returns available networks for a specific currency
func (s *CryptoService) GetAvailableNetworks(currency string) ([]string, error) {
	url := fmt.Sprintf("%s/merchant/coins", s.apiURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("NowPayments API error: %s", string(body))
	}

	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	// Extract networks for the specific currency
	currencyData, exists := response[currency]
	if !exists {
		return nil, fmt.Errorf("currency %s not found", currency)
	}

	currencyMap, ok := currencyData.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid currency data format")
	}

	networks, exists := currencyMap["networks"]
	if !exists {
		return nil, fmt.Errorf("no networks found for currency %s", currency)
	}

	networkList, ok := networks.([]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid networks format")
	}

	var result []string
	for _, network := range networkList {
		if networkStr, ok := network.(string); ok {
			result = append(result, networkStr)
		}
	}

	return result, nil
}

// EstimateAmount estimates the amount of crypto needed for a given fiat amount
func (s *CryptoService) EstimateAmount(amount float64, fromCurrency, toCurrency string) (*models.NowPaymentsEstimateResponse, error) {
	url := fmt.Sprintf("%s/estimate?amount=%f&currency_from=%s&currency_to=%s",
		s.apiURL, amount, fromCurrency, toCurrency)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("NowPayments API error: %s", string(body))
	}

	var response models.NowPaymentsEstimateResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// CreatePayment creates a new crypto payment via NowPayments
func (s *CryptoService) CreatePayment(orderID string, amount float64, currency, network string, description string) (*models.NowPaymentsCreatePaymentResponse, error) {
	// First, estimate the crypto amount
	_, err := s.EstimateAmount(amount, "USD", currency)
	if err != nil {
		return nil, fmt.Errorf("failed to estimate amount: %v", err)
	}

	// Create payment request
	paymentReq := models.NowPaymentsCreatePaymentRequest{
		PriceAmount:      amount,
		PriceCurrency:    "USD",
		PayCurrency:      currency,
		OrderID:          orderID,
		OrderDescription: description,
		IPNCallbackURL:   os.Getenv("NOWPAYMENTS_WEBHOOK_URL"), // Set this in your environment
	}

	jsonData, err := json.Marshal(paymentReq)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/payment", s.apiURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("NowPayments API error: %s", string(body))
	}

	var response models.NowPaymentsCreatePaymentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// GetPaymentStatus gets the status of a payment from NowPayments
func (s *CryptoService) GetPaymentStatus(paymentID string) (*models.NowPaymentsPaymentStatusResponse, error) {
	url := fmt.Sprintf("%s/payment/%s", s.apiURL, paymentID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("NowPayments API error: %s", string(body))
	}

	var response models.NowPaymentsPaymentStatusResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// SaveCryptoPayment saves a crypto payment to the database
func (s *CryptoService) SaveCryptoPayment(payment *models.CryptoPayment) error {
	query := `
		INSERT INTO crypto_payments (order_id, payment_id, currency, network, amount, address, status, qr_code, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING id
	`

	var id string
	err := s.db.QueryRow(query,
		payment.OrderID,
		payment.PaymentID,
		payment.Currency,
		payment.Network,
		payment.Amount,
		payment.Address,
		payment.Status,
		payment.QRCode,
		payment.ExpiresAt,
	).Scan(&id)

	if err != nil {
		return err
	}

	payment.ID = id
	return nil
}

// GetCryptoPaymentByID gets a crypto payment by ID
func (s *CryptoService) GetCryptoPaymentByID(id string) (*models.CryptoPayment, error) {
	query := `
		SELECT id, order_id, payment_id, currency, network, amount, address, status, 
		       transaction_hash, qr_code, expires_at, created_at, updated_at
		FROM crypto_payments 
		WHERE id = $1
	`

	payment := &models.CryptoPayment{}
	err := s.db.QueryRow(query, id).Scan(
		&payment.ID, &payment.OrderID, &payment.PaymentID, &payment.Currency,
		&payment.Network, &payment.Amount, &payment.Address, &payment.Status,
		&payment.TransactionHash, &payment.QRCode, &payment.ExpiresAt,
		&payment.CreatedAt, &payment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return payment, nil
}

// GetCryptoPaymentByPaymentID gets a crypto payment by NowPayments payment ID
func (s *CryptoService) GetCryptoPaymentByPaymentID(paymentID string) (*models.CryptoPayment, error) {
	query := `
		SELECT id, order_id, payment_id, currency, network, amount, address, status, 
		       transaction_hash, qr_code, expires_at, created_at, updated_at
		FROM crypto_payments 
		WHERE payment_id = $1
	`

	payment := &models.CryptoPayment{}
	err := s.db.QueryRow(query, paymentID).Scan(
		&payment.ID, &payment.OrderID, &payment.PaymentID, &payment.Currency,
		&payment.Network, &payment.Amount, &payment.Address, &payment.Status,
		&payment.TransactionHash, &payment.QRCode, &payment.ExpiresAt,
		&payment.CreatedAt, &payment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return payment, nil
}

// UpdateCryptoPaymentStatus updates the status of a crypto payment
func (s *CryptoService) UpdateCryptoPaymentStatus(paymentID string, status string, transactionHash string) error {
	query := `
		UPDATE crypto_payments 
		SET status = $1, transaction_hash = $2, updated_at = NOW()
		WHERE payment_id = $3
	`

	_, err := s.db.Exec(query, status, transactionHash, paymentID)
	return err
}

// GetCryptoCurrencies gets all active crypto currencies from database
func (s *CryptoService) GetCryptoCurrencies() ([]models.CryptoCurrency, error) {
	query := `
		SELECT id, code, name, symbol, icon, is_active, min_amount, max_amount, created_at, updated_at
		FROM crypto_currencies 
		WHERE is_active = true
		ORDER BY name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var currencies []models.CryptoCurrency
	for rows.Next() {
		var currency models.CryptoCurrency
		err := rows.Scan(
			&currency.ID, &currency.Code, &currency.Name, &currency.Symbol,
			&currency.Icon, &currency.IsActive, &currency.MinAmount,
			&currency.MaxAmount, &currency.CreatedAt, &currency.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		currencies = append(currencies, currency)
	}

	return currencies, nil
}

// GetCryptoNetworks gets all active networks for a currency
func (s *CryptoService) GetCryptoNetworks(currencyCode string) ([]models.CryptoNetwork, error) {
	query := `
		SELECT id, currency_code, name, code, is_active, min_amount, max_amount, created_at, updated_at
		FROM crypto_networks 
		WHERE currency_code = $1 AND is_active = true
		ORDER BY name
	`

	rows, err := s.db.Query(query, currencyCode)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var networks []models.CryptoNetwork
	for rows.Next() {
		var network models.CryptoNetwork
		err := rows.Scan(
			&network.ID, &network.CurrencyCode, &network.Name, &network.Code,
			&network.IsActive, &network.MinAmount, &network.MaxAmount,
			&network.CreatedAt, &network.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		networks = append(networks, network)
	}

	return networks, nil
}

// VerifyWebhookSignature verifies the webhook signature from NowPayments
func (s *CryptoService) VerifyWebhookSignature(payload []byte, signature string) bool {
	secret := os.Getenv("NOWPAYMENTS_IPN_SECRET")
	if secret == "" {
		return false
	}

	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// ProcessWebhook processes a webhook from NowPayments
func (s *CryptoService) ProcessWebhook(paymentID string, status string, transactionHash string) error {
	// Update payment status in database
	err := s.UpdateCryptoPaymentStatus(paymentID, status, transactionHash)
	if err != nil {
		return err
	}

	// Get the payment to find the order and user
	payment, err := s.GetCryptoPaymentByPaymentID(paymentID)
	if err != nil {
		return err
	}

	// Get user ID from order
	var userID string
	userQuery := `SELECT user_id FROM orders WHERE id = $1`
	err = s.db.QueryRow(userQuery, payment.OrderID).Scan(&userID)
	if err != nil {
		return err
	}

	// Send appropriate notification based on status
	if s.notificationService != nil {
		switch status {
		case "confirmed":
			// Update order status to paid
			updateOrderQuery := `
				UPDATE orders 
				SET status = 'paid', payment_method = 'crypto', updated_at = NOW()
				WHERE id = $1
			`
			_, err = s.db.Exec(updateOrderQuery, payment.OrderID)
			if err != nil {
				return err
			}

			// Send confirmation notification
			s.notificationService.SendCryptoPaymentConfirmedNotification(
				userID,
				payment.OrderID,
				paymentID,
				payment.Currency,
				fmt.Sprintf("%.8f", payment.Amount),
			)

		case "failed", "expired":
			// Send failure notification
			s.notificationService.SendCryptoPaymentFailedNotification(
				userID,
				payment.OrderID,
				paymentID,
				status,
			)
		}
	}

	return nil
}
