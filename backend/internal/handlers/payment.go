package handlers

import (
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	paymentService *services.PaymentService
}

func NewPaymentHandler(paymentService *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentService: paymentService}
}

// CreatePaymentIntent creates a Stripe payment intent
func (h *PaymentHandler) CreatePaymentIntent(c *gin.Context) {
	var req services.PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	req.UserID = userID.(string)

	paymentIntent, err := h.paymentService.CreatePaymentIntent(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    paymentIntent,
	})
}

// HandleWebhook processes Stripe webhooks
func (h *PaymentHandler) HandleWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	sigHeader := c.GetHeader("Stripe-Signature")
	if sigHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing Stripe signature"})
		return
	}

	err = h.paymentService.HandleWebhook(payload, sigHeader)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// ProcessRefund handles payment refunds
func (h *PaymentHandler) ProcessRefund(c *gin.Context) {
	var req services.RefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payment, err := h.paymentService.RefundPayment(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Refund processed successfully",
		"data":    payment,
	})
}

// GetUserPayments returns payments for the authenticated user
func (h *PaymentHandler) GetUserPayments(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	payments, err := h.paymentService.GetPaymentsByUser(userID.(string), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    payments,
	})
}

// GetCompanyPayments returns payments for a company
func (h *PaymentHandler) GetCompanyPayments(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Parse date range
	startDateStr := c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	endDateStr := c.DefaultQuery("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format"})
		return
	}

	payments, err := h.paymentService.GetPaymentsByCompany(companyID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"payments":   payments,
			"start_date": startDate,
			"end_date":   endDate,
		},
	})
}

// GetPaymentStatistics returns payment statistics
func (h *PaymentHandler) GetPaymentStatistics(c *gin.Context) {
	companyID := c.Query("company_id")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	if days < 1 || days > 365 {
		days = 30
	}

	stats, err := h.paymentService.GetPaymentStatistics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"period": days,
			"stats":  stats,
		},
	})
}

// GetPayment returns a specific payment
func (h *PaymentHandler) GetPayment(c *gin.Context) {
	paymentID := c.Param("id")
	if paymentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment ID is required"})
		return
	}

	// TODO: Implement GetPaymentByID method in PaymentService
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":      "GetPaymentByID not implemented yet",
		"payment_id": paymentID,
	})
}

// UpdatePaymentStatus manually updates payment status (admin only)
func (h *PaymentHandler) UpdatePaymentStatus(c *gin.Context) {
	paymentID := c.Param("id")
	if paymentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment ID is required"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
		Notes  string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	validStatuses := []string{"pending", "processing", "succeeded", "failed", "canceled", "refunded", "partially_refunded"}
	isValidStatus := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	// TODO: Implement UpdatePaymentStatus method in PaymentService
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":      "UpdatePaymentStatus not implemented yet",
		"payment_id": paymentID,
		"status":     req.Status,
	})
}

// GetPaymentMethods returns saved payment methods for a user
func (h *PaymentHandler) GetPaymentMethods(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// TODO: Implement GetUserPaymentMethods method in PaymentService
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "GetUserPaymentMethods not implemented yet",
		"user_id": userID.(string),
	})
}

// CreateSetupIntent creates a setup intent for saving payment methods
func (h *PaymentHandler) CreateSetupIntent(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// TODO: Implement CreateSetupIntent method in PaymentService
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "CreateSetupIntent not implemented yet",
		"user_id": userID.(string),
	})
}

// ProcessSubscriptionPayment handles recurring subscription payments
func (h *PaymentHandler) ProcessSubscriptionPayment(c *gin.Context) {
	var req struct {
		CompanyID       string `json:"company_id" binding:"required"`
		PlanID          string `json:"plan_id" binding:"required"`
		PaymentMethodID string `json:"payment_method_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// TODO: Implement CreateSubscription method in PaymentService
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":      "CreateSubscription not implemented yet",
		"user_id":    userID.(string),
		"company_id": req.CompanyID,
		"plan_id":    req.PlanID,
	})
}

// ConfirmPayment confirms a payment intent
func (h *PaymentHandler) ConfirmPayment(c *gin.Context) {
	var req struct {
		PaymentIntentID string `json:"payment_intent_id" binding:"required"`
		PaymentMethodID string `json:"payment_method_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Confirm the payment using PaymentService
	payment, err := h.paymentService.ConfirmPayment(req.PaymentIntentID, req.PaymentMethodID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment confirmed successfully",
		"data":    payment,
	})
}

// GetPaymentHistory retrieves payment history for a user
func (h *PaymentHandler) GetPaymentHistory(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	status := c.Query("status")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Get payment history from service
	payments, total, err := h.paymentService.GetPaymentHistory(userID.(string), limit, offset, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"payments": payments,
			"total":    total,
			"limit":    limit,
			"offset":   offset,
		},
	})
}
