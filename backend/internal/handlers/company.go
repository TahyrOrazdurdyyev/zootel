package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type CompanyHandler struct {
	companyService *services.CompanyService
	userService    *services.UserService
	serviceService *services.ServiceService
	productService *services.ProductService
	adminService   *services.AdminService
}

func NewCompanyHandler(companyService *services.CompanyService, userService *services.UserService) *CompanyHandler {
	return &CompanyHandler{
		companyService: companyService,
		userService:    userService,
	}
}

// SetServices sets additional services after initialization
func (h *CompanyHandler) SetServices(serviceService *services.ServiceService, productService *services.ProductService) {
	h.serviceService = serviceService
	h.productService = productService
}

// SetAdminService sets admin service for business types
func (h *CompanyHandler) SetAdminService(adminService *services.AdminService) {
	h.adminService = adminService
}

// GetPublicCompanies gets all active companies for marketplace
func (h *CompanyHandler) GetPublicCompanies(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	category := c.Query("category")
	city := c.Query("city")
	country := c.Query("country")
	search := c.Query("search")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	if limit > 100 {
		limit = 100
	}

	companies, total, err := h.companyService.GetPublicCompanies(limit, offset, category, city, country, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"companies": companies,
		"total":     total,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"total":  total,
		},
	})
}

// GetPublicCompany gets a single company's public profile
func (h *CompanyHandler) GetPublicCompany(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	company, err := h.companyService.GetPublicCompanyProfile(companyID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"company": company,
	})
}

// GetPublicServices gets public services for a company
func (h *CompanyHandler) GetPublicServices(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	categoryID := c.Query("category_id")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	if limit > 100 {
		limit = 100
	}

	services, total, err := h.serviceService.GetCompanyPublicServices(companyID, limit, offset, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"services": services,
		"total":    total,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"total":  total,
		},
	})
}

// GetPublicProducts gets public products for a company
func (h *CompanyHandler) GetPublicProducts(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	categoryID := c.Query("category_id")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	if limit > 100 {
		limit = 100
	}

	products, total, err := h.productService.GetCompanyPublicProducts(companyID, limit, offset, categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"products": products,
		"total":    total,
		"pagination": gin.H{
			"limit":  limit,
			"offset": offset,
			"total":  total,
		},
	})
}

// GetServiceCategories gets all service categories
func (h *CompanyHandler) GetServiceCategories(c *gin.Context) {
	fmt.Printf("🔍 CompanyHandler.GetServiceCategories called from %s\n", c.ClientIP())

	categories, err := h.serviceService.GetAllCategories()
	if err != nil {
		fmt.Printf("❌ CompanyHandler.GetServiceCategories error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("✅ CompanyHandler.GetServiceCategories success, returned %d categories\n", len(categories))
	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"categories": categories,
	})
}

// GetMarketplaceData gets combined data for marketplace (services + products)
func (h *CompanyHandler) GetMarketplaceData(c *gin.Context) {
	fmt.Printf("🔍 GetMarketplaceData called from %s\n", c.ClientIP())

	// Get services
	services, _, err := h.serviceService.GetPublicServices(map[string]interface{}{
		"limit": 50,
		"page":  1,
	})
	if err != nil {
		fmt.Printf("❌ Failed to get services: %v\n", err)
		services = []*models.Service{}
	}

	// Get products (if productService is available)
	var products []interface{}
	if h.productService != nil {
		// This would need to be implemented in productService
		products = []interface{}{}
	}

	// Combine services and products into listings
	var listings []interface{}

	// Add services to listings (convert to interface{} slice)
	for _, service := range services {
		listings = append(listings, service)
	}

	// Add products to listings
	listings = append(listings, products...)

	fmt.Printf("✅ GetMarketplaceData success, returned %d listings (%d services, %d products)\n",
		len(listings), len(services), len(products))

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"listings": listings,
		"total":    len(listings),
	})
}

// Search performs global search across companies, services, and products
func (h *CompanyHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	searchType := c.DefaultQuery("type", "all") // all, companies, services, products

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	if limit > 100 {
		limit = 100
	}

	results, err := h.companyService.GlobalSearch(query, searchType, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"results": results,
		"query":   query,
		"type":    searchType,
	})
}

func (h *CompanyHandler) UploadLogo(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload logo endpoint"})
}

func (h *CompanyHandler) UploadMedia(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload media endpoint"})
}

// GetCompanyTrialStatus gets trial status for authenticated company
func (h *CompanyHandler) GetCompanyTrialStatus(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	company, err := h.userService.GetCompanyByOwner(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	var daysLeft int
	if company.TrialEndsAt != nil && !company.TrialExpired {
		timeLeft := company.TrialEndsAt.Sub(time.Now())
		daysLeft = int(timeLeft.Hours() / 24)
		if daysLeft < 0 {
			daysLeft = 0
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":                 true,
		"trial_expired":           company.TrialExpired,
		"days_left":               daysLeft,
		"subscription_status":     company.SubscriptionStatus,
		"subscription_expires_at": company.SubscriptionExpiresAt,
	})
}

// UpdateBusinessType updates the business type of a company
func (h *CompanyHandler) UpdateBusinessType(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var request struct {
		BusinessType string `json:"business_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Printf("❌ Business type binding error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("📋 Business type request: %+v\n", request)

	// Validate business type
	validTypes := []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi", "retail", "general"}
	isValid := false
	for _, validType := range validTypes {
		if request.BusinessType == validType {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid business type"})
		return
	}

	company, err := h.userService.GetCompanyByOwner(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	err = h.companyService.UpdateBusinessType(company.ID, request.BusinessType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"message":       "Business type updated successfully",
		"business_type": request.BusinessType,
	})
}

// GetBusinessTypes returns available business types from database
func (h *CompanyHandler) GetBusinessTypes(c *gin.Context) {
	// Get active business types from admin service
	businessTypes, err := h.adminService.GetActiveBusinessTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to the format expected by frontend
	var formattedTypes []map[string]string
	for _, bt := range businessTypes {
		formattedTypes = append(formattedTypes, map[string]string{
			"value":       bt.Name,
			"label":       bt.Name,
			"description": bt.Description,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"business_types": formattedTypes,
	})
}

// RegisterCompany creates a new company for authenticated user
func (h *CompanyHandler) RegisterCompany(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("user_role")
	if !exists || userRole != "company_owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only company owners can register companies"})
		return
	}

	var req struct {
		Name         string `json:"name" binding:"required"`
		BusinessType string `json:"business_type" binding:"required"`
		Description  string `json:"description"`
		Address      string `json:"address"`
		Country      string `json:"country"`
		State        string `json:"state"`
		City         string `json:"city"`
		Phone        string `json:"phone"`
		Email        string `json:"email"`
		Website      string `json:"website"`
		TaxID        string `json:"tax_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already has a company
	existingCompany, _ := h.userService.GetCompanyByOwner(userID.(string))
	if existingCompany != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already has a company"})
		return
	}

	// Prepare company data
	companyData := map[string]interface{}{
		"name":          req.Name,
		"business_type": req.BusinessType,
		"description":   req.Description,
		"address":       req.Address,
		"country":       req.Country,
		"state":         req.State,
		"city":          req.City,
		"phone":         req.Phone,
		"email":         req.Email,
		"website":       req.Website,
	}

	// Create company
	company, err := h.companyService.CreateCompany(userID.(string), companyData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create company", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Company registered successfully",
		"data":    company,
	})
}

// GetCompanyProfile returns the company profile for editing
func (h *CompanyHandler) GetCompanyProfile(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	company, err := h.companyService.GetCompanyByID(companyID)
	if err != nil {
		fmt.Printf("Error getting company profile: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"company": company,
	})
}

// UpdateCompanyProfile updates the company profile
func (h *CompanyHandler) UpdateCompanyProfile(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	var updateData models.Company
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data", "details": err.Error()})
		return
	}

	// Set the company ID from context
	updateData.ID = companyID

	updatedCompany, err := h.companyService.UpdateCompanyProfile(updateData)
	if err != nil {
		fmt.Printf("Error updating company profile: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company profile updated successfully",
		"company": updatedCompany,
	})
}
