package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type MarketingHandler struct {
	marketingService *services.MarketingService
	orderService     *services.OrderService
}

func NewMarketingHandler(marketingService *services.MarketingService, orderService *services.OrderService) *MarketingHandler {
	return &MarketingHandler{
		marketingService: marketingService,
		orderService:     orderService,
	}
}

// CreateCustomerSegment creates a new customer segment
func (h *MarketingHandler) CreateCustomerSegment(c *gin.Context) {
	var segment models.CustomerSegment
	if err := c.ShouldBindJSON(&segment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.marketingService.CreateCustomerSegment(&segment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, segment)
}

// GetCustomerSegments gets all customer segments
func (h *MarketingHandler) GetCustomerSegments(c *gin.Context) {
	segments, err := h.marketingService.GetCustomerSegments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, segments)
}

// ProcessCustomerSegmentation processes automatic customer segmentation
func (h *MarketingHandler) ProcessCustomerSegmentation(c *gin.Context) {
	err := h.marketingService.ProcessCustomerSegmentation()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer segmentation processed successfully"})
}

// ProcessAbandonedCarts processes abandoned cart notifications
func (h *MarketingHandler) ProcessAbandonedCarts(c *gin.Context) {
	err := h.marketingService.ProcessAbandonedCarts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Abandoned cart notifications processed successfully"})
}

// GetCustomerAnalytics gets customer analytics by segments
func (h *MarketingHandler) GetCustomerAnalytics(c *gin.Context) {
	analytics, err := h.marketingService.GetCustomerAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// CreateOrderTemplate creates a template from an order
func (h *MarketingHandler) CreateOrderTemplate(c *gin.Context) {
	var request struct {
		OrderID      string `json:"order_id"`
		TemplateName string `json:"template_name"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (assuming it's set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.orderService.CreateOrderTemplate(userID.(string), request.OrderID, request.TemplateName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Order template created successfully"})
}

// GetOrderTemplates gets user's order templates
func (h *MarketingHandler) GetOrderTemplates(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	templates, err := h.orderService.GetOrderTemplates(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, templates)
}

// CreateOrderFromTemplate creates a new order from a template
func (h *MarketingHandler) CreateOrderFromTemplate(c *gin.Context) {
	templateID := c.Param("templateId")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	cartID, err := h.orderService.CreateOrderFromTemplate(userID.(string), templateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Items added to cart successfully",
		"cart_id": cartID,
	})
}

// ToggleFavoriteTemplate toggles favorite status of a template
func (h *MarketingHandler) ToggleFavoriteTemplate(c *gin.Context) {
	templateID := c.Param("templateId")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.orderService.ToggleFavoriteTemplate(userID.(string), templateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template favorite status updated"})
}

// GetUserOrderHistory gets comprehensive order history for user
func (h *MarketingHandler) GetUserOrderHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	history, err := h.orderService.GetUserOrderHistory(userID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}
