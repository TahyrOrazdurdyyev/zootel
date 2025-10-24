package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type CryptoHandler struct {
	cryptoService *services.CryptoService
}

func NewCryptoHandler(cryptoService *services.CryptoService) *CryptoHandler {
	return &CryptoHandler{
		cryptoService: cryptoService,
	}
}

// GetCryptoCurrencies returns all available crypto currencies
func (h *CryptoHandler) GetCryptoCurrencies(c *gin.Context) {
	currencies, err := h.cryptoService.GetCryptoCurrencies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch crypto currencies",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    currencies,
	})
}

// GetCryptoNetworks returns available networks for a currency
func (h *CryptoHandler) GetCryptoNetworks(c *gin.Context) {
	currencyCode := c.Param("currency")
	if currencyCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Currency code is required",
		})
		return
	}

	networks, err := h.cryptoService.GetCryptoNetworks(currencyCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch networks",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    networks,
	})
}

// EstimateCryptoAmount estimates the amount of crypto needed
func (h *CryptoHandler) EstimateCryptoAmount(c *gin.Context) {
	amountStr := c.Query("amount")
	fromCurrency := c.Query("from_currency")
	toCurrency := c.Query("to_currency")

	if amountStr == "" || fromCurrency == "" || toCurrency == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "amount, from_currency, and to_currency are required",
		})
		return
	}

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid amount",
		})
		return
	}

	estimate, err := h.cryptoService.EstimateAmount(amount, fromCurrency, toCurrency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to estimate amount: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    estimate,
	})
}

// CreateCryptoPayment creates a new crypto payment
func (h *CryptoHandler) CreateCryptoPayment(c *gin.Context) {
	var req models.CreateCryptoPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Get order details (you might want to fetch this from your order service)
	// For now, we'll use a placeholder description
	description := "Payment for order " + req.OrderID

	// Create payment via NowPayments
	paymentResp, err := h.cryptoService.CreatePayment(
		req.OrderID,
		req.Amount,
		req.Currency,
		req.Network,
		description,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create payment: " + err.Error(),
		})
		return
	}

	// Save payment to database
	cryptoPayment := &models.CryptoPayment{
		OrderID:   req.OrderID,
		PaymentID: paymentResp.PaymentID,
		Currency:  paymentResp.PayCurrency,
		Network:   req.Network,
		Amount:    paymentResp.PayAmount,
		Address:   paymentResp.PayAddress,
		Status:    paymentResp.PaymentStatus,
		QRCode:    "",                             // You might want to generate QR code here
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hours expiry
	}

	err = h.cryptoService.SaveCryptoPayment(cryptoPayment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save payment: " + err.Error(),
		})
		return
	}

	// Return response
	response := models.CryptoPaymentResponse{
		PaymentID:      paymentResp.PaymentID,
		Currency:       paymentResp.PayCurrency,
		Network:        req.Network,
		Amount:         paymentResp.PayAmount,
		Address:        paymentResp.PayAddress,
		QRCode:         cryptoPayment.QRCode,
		Status:         paymentResp.PaymentStatus,
		ExpiresAt:      cryptoPayment.ExpiresAt.Format(time.RFC3339),
		TransactionURL: "https://nowpayments.io/payment/?iid=" + paymentResp.PaymentID,
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    response,
	})
}

// GetCryptoPaymentStatus gets the status of a crypto payment
func (h *CryptoHandler) GetCryptoPaymentStatus(c *gin.Context) {
	paymentID := c.Param("payment_id")
	if paymentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Payment ID is required",
		})
		return
	}

	// Get payment from database
	payment, err := h.cryptoService.GetCryptoPaymentByPaymentID(paymentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Payment not found",
		})
		return
	}

	// Get latest status from NowPayments
	statusResp, err := h.cryptoService.GetPaymentStatus(paymentID)
	if err != nil {
		// If we can't get status from NowPayments, return database status
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"payment_id": payment.PaymentID,
				"status":     payment.Status,
				"currency":   payment.Currency,
				"network":    payment.Network,
				"amount":     payment.Amount,
				"address":    payment.Address,
				"expires_at": payment.ExpiresAt.Format(time.RFC3339),
			},
		})
		return
	}

	// Update database with latest status
	err = h.cryptoService.UpdateCryptoPaymentStatus(
		paymentID,
		statusResp.PaymentStatus,
		statusResp.PayinExtraID,
	)
	if err != nil {
		// Log error but don't fail the request
	}

	response := models.CryptoPaymentResponse{
		PaymentID:      statusResp.PaymentID,
		Currency:       statusResp.PayCurrency,
		Network:        statusResp.Network,
		Amount:         statusResp.PayAmount,
		Address:        statusResp.PayAddress,
		QRCode:         payment.QRCode,
		Status:         statusResp.PaymentStatus,
		ExpiresAt:      payment.ExpiresAt.Format(time.RFC3339),
		TransactionURL: "https://nowpayments.io/payment/?iid=" + statusResp.PaymentID,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// GetPaymentMethods returns available payment methods
func (h *CryptoHandler) GetPaymentMethods(c *gin.Context) {
	methods := []models.PaymentMethod{
		{
			Type:     "card",
			Name:     "Credit Card",
			Icon:     "/images/payment-methods/credit-card.svg",
			IsActive: true,
		},
		{
			Type:     "crypto",
			Name:     "Cryptocurrency",
			Icon:     "/images/payment-methods/crypto.svg",
			IsActive: true,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    methods,
	})
}

// WebhookHandler handles webhooks from NowPayments
func (h *CryptoHandler) WebhookHandler(c *gin.Context) {
	// Get the signature from headers
	signature := c.GetHeader("x-nowpayments-sig")
	if signature == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing signature",
		})
		return
	}

	// Read the request body
	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read request body",
		})
		return
	}

	// Verify signature
	if !h.cryptoService.VerifyWebhookSignature(body, signature) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid signature",
		})
		return
	}

	// Parse webhook data
	var webhookData map[string]interface{}
	if err := json.Unmarshal(body, &webhookData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON",
		})
		return
	}

	// Extract payment information
	paymentID, ok := webhookData["payment_id"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing payment_id",
		})
		return
	}

	status, ok := webhookData["payment_status"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing payment_status",
		})
		return
	}

	transactionHash := ""
	if hash, exists := webhookData["transaction_hash"]; exists {
		if hashStr, ok := hash.(string); ok {
			transactionHash = hashStr
		}
	}

	// Process the webhook
	err = h.cryptoService.ProcessWebhook(paymentID, status, transactionHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process webhook: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Webhook processed successfully",
	})
}
