package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	paymentService *services.PaymentService
}

func NewPaymentHandler(paymentService *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentService: paymentService}
}

func (h *PaymentHandler) CreatePaymentIntent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create payment intent endpoint"})
}

func (h *PaymentHandler) ConfirmPayment(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Confirm payment endpoint"})
}

func (h *PaymentHandler) GetPaymentHistory(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get payment history endpoint"})
}

func (h *PaymentHandler) StripeWebhook(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Stripe webhook endpoint"})
}
