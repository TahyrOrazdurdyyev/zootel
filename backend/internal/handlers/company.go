package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type CompanyHandler struct {
	companyService *services.CompanyService
	userService    *services.UserService
	serviceService *services.ServiceService
	productService *services.ProductService
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
	categories, err := h.serviceService.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"categories": categories,
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

// Company profile management
func (h *CompanyHandler) GetCompanyProfile(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"company": company,
	})
}

func (h *CompanyHandler) UpdateCompanyProfile(c *gin.Context) {
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

	company, err := h.userService.GetCompanyByOwner(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
		return
	}

	err = h.companyService.UpdateCompanyProfile(company.ID, updateData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company profile updated successfully",
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	updateData := map[string]interface{}{
		"business_type": request.BusinessType,
	}

	err = h.companyService.UpdateCompanyProfile(company.ID, updateData)
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

// GetBusinessTypes returns available business types
func (h *CompanyHandler) GetBusinessTypes(c *gin.Context) {
	businessTypes := []map[string]string{
		{"value": "veterinary", "label": "Veterinary Clinic", "description": "Medical services for animals"},
		{"value": "grooming", "label": "Grooming Salon", "description": "Pet grooming and beauty services"},
		{"value": "boarding", "label": "Pet Hotel", "description": "Temporary pet accommodation"},
		{"value": "training", "label": "Pet Training", "description": "Training and behavior modification"},
		{"value": "walking", "label": "Dog Walking", "description": "Dog walking services"},
		{"value": "sitting", "label": "Pet Sitting", "description": "Pet care at home"},
		{"value": "pet_taxi", "label": "Pet Transportation", "description": "Pet transportation services"},
		{"value": "retail", "label": "Pet Store", "description": "Pet products and supplies"},
		{"value": "general", "label": "General Services", "description": "Comprehensive pet services"},
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"business_types": businessTypes,
	})
}
