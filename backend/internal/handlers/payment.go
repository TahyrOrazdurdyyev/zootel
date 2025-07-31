package handlers

import "zootel-backend/internal/services"

type PaymentHandler struct {
	paymentService *services.PaymentService
}

func NewPaymentHandler(paymentService *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentService: paymentService}
}

func (h *PaymentHandler) CreatePaymentIntent(c interface{}) {}
func (h *PaymentHandler) ConfirmPayment(c interface{})      {}
func (h *PaymentHandler) GetPaymentHistory(c interface{})   {}
func (h *PaymentHandler) StripeWebhook(c interface{})       {}
