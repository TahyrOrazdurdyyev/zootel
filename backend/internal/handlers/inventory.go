package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type InventoryHandler struct {
	inventoryService *services.InventoryService
}

func NewInventoryHandler(inventoryService *services.InventoryService) *InventoryHandler {
	return &InventoryHandler{
		inventoryService: inventoryService,
	}
}

// GetCompanyInventory returns all products for a company
func (h *InventoryHandler) GetCompanyInventory(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	// Parse query parameters
	limit := 50
	offset := 0
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	filters := models.InventoryFilters{
		SearchTerm:  stringPtr(c.Query("search")),
		Category:    stringPtr(c.Query("category")),
		StockStatus: stringPtr(c.Query("stock_status")),
		MinPrice:    float64Ptr(c.Query("min_price")),
		MaxPrice:    float64Ptr(c.Query("max_price")),
		Limit:       limit,
		Offset:      offset,
	}

	products, err := h.inventoryService.GetCompanyInventory(companyID, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get inventory: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"inventory": products,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"total":  len(products),
		},
	})
}

// GetProduct returns a single product
func (h *InventoryHandler) GetProduct(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product ID is required"})
		return
	}

	product, err := h.inventoryService.GetProduct(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	// Check if user has access to this product's company
	companyID := c.GetString("company_id")
	if companyID != "" && product.CompanyID != companyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"product": product,
	})
}

// CreateProduct creates a new product
func (h *InventoryHandler) CreateProduct(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data: " + err.Error()})
		return
	}

	product, err := h.inventoryService.CreateProduct(companyID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"product": product,
		"message": "Product created successfully",
	})
}

// UpdateProduct updates an existing product
func (h *InventoryHandler) UpdateProduct(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product ID is required"})
		return
	}

	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	var req models.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data: " + err.Error()})
		return
	}

	// Verify product belongs to company
	product, err := h.inventoryService.GetProduct(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	if product.CompanyID != companyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	updatedProduct, err := h.inventoryService.UpdateProduct(productID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update product: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"product": updatedProduct,
		"message": "Product updated successfully",
	})
}

// DeleteProduct deactivates a product
func (h *InventoryHandler) DeleteProduct(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product ID is required"})
		return
	}

	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	// Verify product belongs to company
	product, err := h.inventoryService.GetProduct(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	if product.CompanyID != companyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	err = h.inventoryService.DeleteProduct(productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete product: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Product deleted successfully",
	})
}

// UpdateStock updates product stock
func (h *InventoryHandler) UpdateStock(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product ID is required"})
		return
	}

	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	var req models.StockUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data: " + err.Error()})
		return
	}

	// Verify product belongs to company
	product, err := h.inventoryService.GetProduct(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	if product.CompanyID != companyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	userID := c.GetString("user_id")
	var userIDPtr *string
	if userID != "" {
		userIDPtr = &userID
	}

	err = h.inventoryService.UpdateStock(productID, companyID, req, userIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update stock: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock updated successfully",
	})
}

// GetInventoryTransactions returns transaction history for a product
func (h *InventoryHandler) GetInventoryTransactions(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "product ID is required"})
		return
	}

	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	// Verify product belongs to company
	product, err := h.inventoryService.GetProduct(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	if product.CompanyID != companyID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	limit := 50
	offset := 0
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	transactions, err := h.inventoryService.GetInventoryTransactions(productID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get transactions: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"transactions": transactions,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"total":  len(transactions),
		},
	})
}

// GetInventoryAlerts returns alerts for a company
func (h *InventoryHandler) GetInventoryAlerts(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	limit := 50
	offset := 0
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	alerts, err := h.inventoryService.GetInventoryAlerts(companyID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get alerts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"alerts":  alerts,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"total":  len(alerts),
		},
	})
}

// MarkAlertAsRead marks an alert as read
func (h *InventoryHandler) MarkAlertAsRead(c *gin.Context) {
	alertID := c.Param("alertId")
	if alertID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "alert ID is required"})
		return
	}

	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	// TODO: Verify alert belongs to company

	err := h.inventoryService.MarkAlertAsRead(alertID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark alert as read: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Alert marked as read",
	})
}

// GetInventoryStats returns inventory statistics for a company
func (h *InventoryHandler) GetInventoryStats(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
		return
	}

	stats, err := h.inventoryService.GetInventoryStats(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get inventory stats: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// Helper functions
func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func float64Ptr(s string) *float64 {
	if s == "" {
		return nil
	}
	if f, err := strconv.ParseFloat(s, 64); err == nil {
		return &f
	}
	return nil
}
