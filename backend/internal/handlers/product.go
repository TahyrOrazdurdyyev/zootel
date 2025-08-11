package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	productService  *services.ProductService
	deliveryService *services.DeliveryService
}

func NewProductHandler(productService *services.ProductService, deliveryService *services.DeliveryService) *ProductHandler {
	return &ProductHandler{
		productService:  productService,
		deliveryService: deliveryService,
	}
}

// CreateProductVariant creates a new product variant
func (h *ProductHandler) CreateProductVariant(c *gin.Context) {
	var variant models.ProductVariant
	if err := c.ShouldBindJSON(&variant); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.productService.CreateProductVariant(&variant)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, variant)
}

// GetProductVariants gets all variants for a product
func (h *ProductHandler) GetProductVariants(c *gin.Context) {
	productID := c.Param("productId")

	variants, err := h.productService.GetProductVariants(productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, variants)
}

// GetProductAttributes gets all available product attributes
func (h *ProductHandler) GetProductAttributes(c *gin.Context) {
	attributes, err := h.productService.GetProductAttributes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, attributes)
}

// GetAttributeValues gets values for a specific attribute
func (h *ProductHandler) GetAttributeValues(c *gin.Context) {
	attributeID := c.Param("attributeId")

	values, err := h.productService.GetAttributeValues(attributeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, values)
}

// UpdateProductStock updates product/variant stock
func (h *ProductHandler) UpdateProductStock(c *gin.Context) {
	var request struct {
		ProductID string  `json:"product_id"`
		VariantID *string `json:"variant_id"`
		Quantity  int     `json:"quantity"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.productService.UpdateProductStock(request.ProductID, request.VariantID, request.Quantity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock updated successfully"})
}

// CreatePriceTier creates quantity-based pricing
func (h *ProductHandler) CreatePriceTier(c *gin.Context) {
	var tier models.PriceTier
	if err := c.ShouldBindJSON(&tier); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.productService.CreatePriceTier(&tier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tier)
}

// GetPriceTiers gets pricing tiers for product/variant
func (h *ProductHandler) GetPriceTiers(c *gin.Context) {
	productID := c.Query("product_id")
	variantID := c.Query("variant_id")

	var variantPtr *string
	if variantID != "" {
		variantPtr = &variantID
	}

	tiers, err := h.productService.GetPriceTiers(productID, variantPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tiers)
}

// CalculatePrice calculates price based on quantity
func (h *ProductHandler) CalculatePrice(c *gin.Context) {
	productID := c.Query("product_id")
	variantID := c.Query("variant_id")
	quantityStr := c.Query("quantity")

	quantity, err := strconv.Atoi(quantityStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quantity"})
		return
	}

	var variantPtr *string
	if variantID != "" {
		variantPtr = &variantID
	}

	price, err := h.productService.CalculatePrice(productID, variantPtr, quantity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"price":    price,
		"quantity": quantity,
		"total":    price * float64(quantity),
	})
}

// GetLowStockProducts gets products/variants with low stock
func (h *ProductHandler) GetLowStockProducts(c *gin.Context) {
	companyID := c.Query("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_id is required"})
		return
	}

	items, err := h.productService.GetLowStockProducts(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetDeliveryMethods gets available delivery methods
func (h *ProductHandler) GetDeliveryMethods(c *gin.Context) {
	companyID := c.Query("company_id")

	var companyPtr *string
	if companyID != "" {
		companyPtr = &companyID
	}

	methods, err := h.deliveryService.GetDeliveryMethods(companyPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, methods)
}

// CreateDeliveryMethod creates a new delivery method
func (h *ProductHandler) CreateDeliveryMethod(c *gin.Context) {
	var method models.DeliveryMethod
	if err := c.ShouldBindJSON(&method); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.deliveryService.CreateDeliveryMethod(&method)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, method)
}

// CalculateDeliveryPrice calculates delivery cost
func (h *ProductHandler) CalculateDeliveryPrice(c *gin.Context) {
	var request struct {
		MethodID   string  `json:"method_id"`
		Distance   float64 `json:"distance"`
		OrderTotal float64 `json:"order_total"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	price, err := h.deliveryService.CalculateDeliveryPrice(request.MethodID, request.Distance, request.OrderTotal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	estimatedDate, _ := h.deliveryService.EstimateDeliveryDate(request.MethodID)

	c.JSON(http.StatusOK, gin.H{
		"delivery_cost":           price,
		"estimated_delivery_date": estimatedDate,
	})
}

// GetOrderDeliveryInfo gets delivery information for an order
func (h *ProductHandler) GetOrderDeliveryInfo(c *gin.Context) {
	orderID := c.Param("orderId")

	info, err := h.deliveryService.GetOrderDeliveryInfo(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}

// GetCompanyProducts gets all products for a company
func (h *ProductHandler) GetCompanyProducts(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user's company
	// TODO: Add a method to get company by user ID

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"products": []interface{}{},
		"message":  "Company products endpoint - implementation needed",
	})
}

// CreateProduct creates a new product for a company
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var productData map[string]interface{}
	if err := c.ShouldBindJSON(&productData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Product created successfully - implementation needed",
		"data":    productData,
	})
}

// UpdateProduct updates an existing product
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	productID := c.Param("id")
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Product updated successfully - implementation needed",
		"product_id": productID,
		"data":       updateData,
	})
}

// DeleteProduct deletes a product
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	productID := c.Param("id")
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Product deleted successfully - implementation needed",
		"product_id": productID,
	})
}
