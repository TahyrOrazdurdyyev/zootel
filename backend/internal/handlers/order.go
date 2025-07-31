package handlers

import "zootel-backend/internal/services"

type OrderHandler struct {
	orderService *services.OrderService
}

func NewOrderHandler(orderService *services.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) GetUserOrders(c interface{})     {}
func (h *OrderHandler) CreateOrder(c interface{})       {}
func (h *OrderHandler) GetOrder(c interface{})          {}
func (h *OrderHandler) UpdateOrder(c interface{})       {}
func (h *OrderHandler) CancelOrder(c interface{})       {}
func (h *OrderHandler) GetCompanyOrders(c interface{})  {}
func (h *OrderHandler) UpdateOrderStatus(c interface{}) {}
