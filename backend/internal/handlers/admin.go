package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminService *services.AdminService
}

func NewAdminHandler(adminService *services.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

// Plan management
func (h *AdminHandler) GetPlans(c *gin.Context) {
	plans, err := h.adminService.GetPlans()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    plans,
	})
}

func (h *AdminHandler) CreatePlan(c *gin.Context) {
	fmt.Printf("🔍 CreatePlan called from %s\n", c.ClientIP())
	
	var plan models.Plan
	if err := c.ShouldBindJSON(&plan); err != nil {
		fmt.Printf("❌ JSON binding error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("📝 Plan data received: %+v\n", plan)

	if err := h.adminService.CreatePlan(&plan); err != nil {
		fmt.Printf("❌ CreatePlan service error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Plan created successfully",
		"data":    plan,
	})
}

func (h *AdminHandler) UpdatePlan(c *gin.Context) {
	planID := c.Param("id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan ID is required"})
		return
	}

	var plan models.Plan
	if err := c.ShouldBindJSON(&plan); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.UpdatePlan(planID, &plan); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Plan updated successfully",
	})
}

func (h *AdminHandler) DeletePlan(c *gin.Context) {
	planID := c.Param("id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan ID is required"})
		return
	}

	if err := h.adminService.DeletePlan(planID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Plan deleted successfully",
	})
}

// Addon Pricing handlers
func (h *AdminHandler) GetAddonPricing(c *gin.Context) {
	addons, err := h.adminService.GetAddonPricing()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    addons,
	})
}

func (h *AdminHandler) CreateAddonPricing(c *gin.Context) {
	var addon models.AddonPricing
	if err := c.ShouldBindJSON(&addon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.CreateAddonPricing(&addon); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Addon pricing created successfully",
		"data":    addon,
	})
}

func (h *AdminHandler) UpdateAddonPricing(c *gin.Context) {
	addonID := c.Param("id")
	if addonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Addon ID is required"})
		return
	}

	var addon models.AddonPricing
	if err := c.ShouldBindJSON(&addon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.UpdateAddonPricing(addonID, &addon); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Addon pricing updated successfully",
	})
}

func (h *AdminHandler) DeleteAddonPricing(c *gin.Context) {
	addonID := c.Param("id")
	if addonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Addon ID is required"})
		return
	}

	if err := h.adminService.DeleteAddonPricing(addonID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Addon pricing deleted successfully",
	})
}

// Payment settings
func (h *AdminHandler) GetPaymentSettings(c *gin.Context) {
	settings, err := h.adminService.GetPaymentSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Don't expose sensitive keys in response
	sanitizedSettings := map[string]interface{}{
		"id":                    settings.ID,
		"stripe_enabled":        settings.StripeEnabled,
		"commission_enabled":    settings.CommissionEnabled,
		"commission_percentage": settings.CommissionPercentage,
		"has_stripe_keys":       settings.StripePublishableKey != "" && settings.StripeSecretKey != "",
		"created_at":            settings.CreatedAt,
		"updated_at":            settings.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sanitizedSettings,
	})
}

func (h *AdminHandler) UpdatePaymentSettings(c *gin.Context) {
	var req services.UpdatePaymentSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings, err := h.adminService.UpdatePaymentSettings(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Don't expose sensitive keys in response
	sanitizedSettings := map[string]interface{}{
		"id":                    settings.ID,
		"stripe_enabled":        settings.StripeEnabled,
		"commission_enabled":    settings.CommissionEnabled,
		"commission_percentage": settings.CommissionPercentage,
		"has_stripe_keys":       settings.StripePublishableKey != "" && settings.StripeSecretKey != "",
		"updated_at":            settings.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sanitizedSettings,
		"message": "Payment settings updated successfully",
	})
}

// Service categories
func (h *AdminHandler) GetServiceCategories(c *gin.Context) {
	// Debug logging
	fmt.Printf("🔍 GetServiceCategories called from %s, User-Agent: %s, Referer: %s\n", 
		c.ClientIP(), 
		c.GetHeader("User-Agent"), 
		c.GetHeader("Referer"))
	
	categories, err := h.adminService.GetServiceCategories()
	if err != nil {
		fmt.Printf("❌ GetServiceCategories error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("✅ GetServiceCategories success, returned %d categories\n", len(categories))
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    categories,
	})
}

func (h *AdminHandler) CreateServiceCategory(c *gin.Context) {
	var category models.ServiceCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.CreateServiceCategory(&category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Service category created successfully",
		"data":    category,
	})
}

func (h *AdminHandler) UpdateServiceCategory(c *gin.Context) {
	categoryID := c.Param("id")
	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	var category models.ServiceCategory
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.UpdateServiceCategory(categoryID, &category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Service category updated successfully",
	})
}

func (h *AdminHandler) DeleteServiceCategory(c *gin.Context) {
	categoryID := c.Param("id")
	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	if err := h.adminService.DeleteServiceCategory(categoryID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Service category deleted successfully",
	})
}

// Pet types
func (h *AdminHandler) GetPetTypes(c *gin.Context) {
	petTypes, err := h.adminService.GetPetTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    petTypes,
	})
}

func (h *AdminHandler) CreatePetType(c *gin.Context) {
	var petType models.PetType
	if err := c.ShouldBindJSON(&petType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.CreatePetType(&petType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Pet type created successfully",
		"data":    petType,
	})
}

func (h *AdminHandler) UpdatePetType(c *gin.Context) {
	petTypeID := c.Param("id")
	if petTypeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pet type ID is required"})
		return
	}

	var petType models.PetType
	if err := c.ShouldBindJSON(&petType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.UpdatePetType(petTypeID, &petType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pet type updated successfully",
	})
}

func (h *AdminHandler) DeletePetType(c *gin.Context) {
	petTypeID := c.Param("id")
	if petTypeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pet type ID is required"})
		return
	}

	if err := h.adminService.DeletePetType(petTypeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pet type deleted successfully",
	})
}

// Breeds
func (h *AdminHandler) GetBreeds(c *gin.Context) {
	petTypeID := c.Query("pet_type_id")

	var breeds []models.Breed
	var err error

	if petTypeID != "" {
		breeds, err = h.adminService.GetBreedsByPetType(petTypeID)
	} else {
		breeds, err = h.adminService.GetBreeds()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    breeds,
	})
}

func (h *AdminHandler) CreateBreed(c *gin.Context) {
	var breed models.Breed
	if err := c.ShouldBindJSON(&breed); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.CreateBreed(&breed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Breed created successfully",
		"data":    breed,
	})
}

func (h *AdminHandler) UpdateBreed(c *gin.Context) {
	breedID := c.Param("id")
	if breedID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Breed ID is required"})
		return
	}

	var breed models.Breed
	if err := c.ShouldBindJSON(&breed); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.UpdateBreed(breedID, &breed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Breed updated successfully",
	})
}

func (h *AdminHandler) DeleteBreed(c *gin.Context) {
	breedID := c.Param("id")
	if breedID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Breed ID is required"})
		return
	}

	if err := h.adminService.DeleteBreed(breedID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Breed deleted successfully",
	})
}

// Company management
func (h *AdminHandler) GetAllCompanies(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	companies, err := h.adminService.GetCompanies()
	if err != nil {
		fmt.Printf("[ERROR] GetAllCompanies failed: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Simple pagination
	start := (page - 1) * limit
	end := start + limit

	if start >= len(companies) {
		companies = []models.CompanyDetails{}
	} else if end > len(companies) {
		companies = companies[start:]
	} else {
		companies = companies[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
		},
	})
}

func (h *AdminHandler) ToggleSpecialPartner(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	if err := h.adminService.ToggleSpecialPartner(companyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Special partner status toggled successfully",
	})
}

func (h *AdminHandler) ToggleManualCRM(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	if err := h.adminService.ToggleManualCRM(companyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Manual CRM status toggled successfully",
	})
}

func (h *AdminHandler) ToggleManualAI(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	if err := h.adminService.ToggleManualAI(companyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Manual AI status toggled successfully",
	})
}

func (h *AdminHandler) BlockCompany(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	if err := h.adminService.BlockCompany(companyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company blocked successfully",
	})
}

func (h *AdminHandler) UnblockCompany(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	if err := h.adminService.UnblockCompany(companyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company unblocked successfully",
	})
}

// Global Analytics
func (h *AdminHandler) GetGlobalAnalytics(c *gin.Context) {
	analytics, err := h.adminService.GetGlobalAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// Free Trial Management

// ExtendCompanyFreeTrial extends free trial for a company
func (h *AdminHandler) ExtendCompanyFreeTrial(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	var req struct {
		AdditionalDays int    `json:"additional_days" binding:"required"`
		Reason         string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.AdditionalDays <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Additional days must be positive"})
		return
	}

	err := h.adminService.ExtendCompanyFreeTrial(companyID, req.AdditionalDays)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Free trial extended by %d days", req.AdditionalDays),
	})
}

// GetCompaniesWithExpiredTrials returns companies with expired trials
func (h *AdminHandler) GetCompaniesWithExpiredTrials(c *gin.Context) {
	companies, err := h.adminService.GetCompaniesWithExpiredTrials()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"count":   len(companies),
	})
}

// GetCompaniesOnFreeTrial returns companies currently on free trial
func (h *AdminHandler) GetCompaniesOnFreeTrial(c *gin.Context) {
	companies, err := h.adminService.GetCompaniesOnFreeTrial()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"count":   len(companies),
	})
}

// Demo Management
func (h *AdminHandler) CreateDemoCompany(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Demo company creation endpoint - TODO: integrate with DemoService",
	})
}

func (h *AdminHandler) GetDemoCompanies(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Get demo companies endpoint - TODO: integrate with DemoService",
	})
}

func (h *AdminHandler) DeleteDemoCompany(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Demo company deleted - TODO: integrate with DemoService",
	})
}

// ActivateCompanySubscription activates company after payment
func (h *AdminHandler) ActivateCompanySubscription(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CompanyID    string `json:"company_id"`
		PlanID       string `json:"plan_id"`
		BillingCycle string `json:"billing_cycle"` // "monthly" or "yearly"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.CompanyID == "" || req.PlanID == "" || req.BillingCycle == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	if req.BillingCycle != "monthly" && req.BillingCycle != "yearly" {
		http.Error(w, "Invalid billing cycle", http.StatusBadRequest)
		return
	}

	err := h.adminService.ActivateCompanyAfterPayment(req.CompanyID, req.PlanID, req.BillingCycle)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to activate company: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Company subscription activated successfully",
	})
}

// ProcessExpiredTrials runs the trial expiration check
func (h *AdminHandler) ProcessExpiredTrials(w http.ResponseWriter, r *http.Request) {
	err := h.adminService.CheckAndUpdateExpiredTrials()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to process expired trials: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Expired trials processed successfully",
	})
}

// GetTrialExpiringCompanies returns companies with trials expiring soon
func (h *AdminHandler) GetTrialExpiringCompanies(w http.ResponseWriter, r *http.Request) {
	daysStr := r.URL.Query().Get("days")
	days := 7 // default to 7 days

	if daysStr != "" {
		if parsed, err := strconv.Atoi(daysStr); err == nil && parsed > 0 {
			days = parsed
		}
	}

	companies, err := h.adminService.GetTrialExpiringCompanies(days)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get expiring companies: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"companies": companies,
		"days":      days,
	})
}

// Company management
func (h *AdminHandler) GetCompanies(c *gin.Context) {
	companies, err := h.adminService.GetCompanies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch companies: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"count":   len(companies),
	})
}

// Company Feature Management

// GetCompanyFeatureStatus получает статус функций компании
func (h *AdminHandler) GetCompanyFeatureStatus(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	status, err := h.adminService.GetCompanyFeatureStatus(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get company feature status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    status,
	})
}

// CheckCRMTogglePermission проверяет можно ли переключить CRM
func (h *AdminHandler) CheckCRMTogglePermission(c *gin.Context) {
	companyID := c.Param("id")
	enableStr := c.Query("enable")

	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	enable := enableStr == "true"
	canToggle, reason, err := h.adminService.CanToggleCRM(companyID, enable)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check CRM toggle permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"can_toggle": canToggle,
		"reason":     reason,
	})
}

// CheckAITogglePermission проверяет можно ли переключить AI агентов
func (h *AdminHandler) CheckAITogglePermission(c *gin.Context) {
	companyID := c.Param("id")
	enableStr := c.Query("enable")

	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	enable := enableStr == "true"
	canToggle, reason, err := h.adminService.CanToggleAI(companyID, enable)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check AI toggle permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"can_toggle": canToggle,
		"reason":     reason,
	})
}

// CheckAgentDeactivatePermission проверяет можно ли деактивировать конкретного агента
func (h *AdminHandler) CheckAgentDeactivatePermission(c *gin.Context) {
	companyID := c.Param("id")
	agentKey := c.Param("agentKey")

	if companyID == "" || agentKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID and Agent Key are required"})
		return
	}

	canDeactivate, reason, err := h.adminService.CanDeactivateAgent(companyID, agentKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check agent deactivate permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"can_deactivate": canDeactivate,
		"reason":         reason,
	})
}

// AI Agents Management Endpoints

// GetAllCompaniesAIAgents получает агентов всех компаний
func (h *AdminHandler) GetAllCompaniesAIAgents(c *gin.Context) {
	agentsInfo, err := h.adminService.GetAllCompaniesAIAgents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get companies AI agents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"companies_agents": agentsInfo,
	})
}

// GetCompanyAIAgents получает агентов конкретной компании
func (h *AdminHandler) GetCompanyAIAgents(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	agentsInfo, err := h.adminService.GetCompanyAIAgentsForAdmin(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get company AI agents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"agents_info": agentsInfo,
	})
}

// ActivateAgentForCompany активирует агента для компании
func (h *AdminHandler) ActivateAgentForCompany(c *gin.Context) {
	var req models.AdminActivateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Получаем ID админа из контекста (предполагается, что он установлен в middleware)
	adminID := c.GetString("user_id") // или другой способ получения админ ID
	if adminID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin ID not found"})
		return
	}

	addon, err := h.adminService.ActivateAgentForCompany(
		req.CompanyID, req.AgentKey, req.BillingCycle, adminID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI agent activated successfully",
		"addon":   addon,
	})
}

// DeactivateAgentForCompany деактивирует агента для компании
func (h *AdminHandler) DeactivateAgentForCompany(c *gin.Context) {
	companyID := c.Param("companyId")
	agentKey := c.Param("agentKey")

	if companyID == "" || agentKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID and Agent Key required"})
		return
	}

	adminID := c.GetString("user_id")
	if adminID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin ID not found"})
		return
	}

	err := h.adminService.DeactivateAgentForCompany(companyID, agentKey, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI agent deactivated successfully",
	})
}

// GetAvailableAIAgents получает список всех доступных AI агентов
func (h *AdminHandler) GetAvailableAIAgents(c *gin.Context) {
	agents, err := h.adminService.GetAvailableAIAgents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get available AI agents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"agents":  agents,
	})
}

// UpdateAIAgentPricing обновляет цены AI агента
func (h *AdminHandler) UpdateAIAgentPricing(c *gin.Context) {
	agentKey := c.Param("agentKey")
	if agentKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent key required"})
		return
	}

	var req models.UpdateAgentPricingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate prices
	if req.MonthlyPrice != nil && *req.MonthlyPrice < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Monthly price cannot be negative"})
		return
	}
	if req.YearlyPrice != nil && *req.YearlyPrice < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Yearly price cannot be negative"})
		return
	}
	if req.OneTimePrice != nil && *req.OneTimePrice < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "One-time price cannot be negative"})
		return
	}

	adminID := c.GetString("user_id")
	if adminID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin ID not found"})
		return
	}

	err := h.adminService.UpdateAIAgentPricing(agentKey, &req, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI agent pricing updated successfully",
	})
}

// CreateAIAgent создает нового AI агента
func (h *AdminHandler) CreateAIAgent(c *gin.Context) {
	var req models.CreateAgentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate prices
	if req.MonthlyPrice < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Monthly price cannot be negative"})
		return
	}
	if req.YearlyPrice < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Yearly price cannot be negative"})
		return
	}
	if req.OneTimePrice != nil && *req.OneTimePrice < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "One-time price cannot be negative"})
		return
	}

	// Validate agent key format
	if len(req.AgentKey) < 3 || len(req.AgentKey) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent key must be 3-50 characters"})
		return
	}

	adminID := c.GetString("user_id")
	if adminID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin ID not found"})
		return
	}

	agent, err := h.adminService.CreateAIAgent(&req, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "AI agent created successfully",
		"agent":   agent,
	})
}

// DeleteAIAgent удаляет AI агента
func (h *AdminHandler) DeleteAIAgent(c *gin.Context) {
	agentKey := c.Param("agentKey")
	if agentKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent key required"})
		return
	}

	adminID := c.GetString("user_id")
	if adminID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin ID not found"})
		return
	}

	err := h.adminService.DeleteAIAgent(agentKey, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI agent deleted successfully",
	})
}

// Business Types Management
func (h *AdminHandler) GetBusinessTypes(c *gin.Context) {
	businessTypes, err := h.adminService.GetBusinessTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    businessTypes,
	})
}

func (h *AdminHandler) CreateBusinessType(c *gin.Context) {
	fmt.Printf("🔍 CreateBusinessType called from %s\n", c.ClientIP())
	
	var businessType models.BusinessType
	if err := c.ShouldBindJSON(&businessType); err != nil {
		fmt.Printf("❌ JSON binding error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	fmt.Printf("📦 Business type data: %+v\n", businessType)

	if err := h.adminService.CreateBusinessType(&businessType); err != nil {
		fmt.Printf("❌ Service error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("✅ Business type created successfully: %s\n", businessType.Name)
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Business type created successfully",
		"data":    businessType,
	})
}

func (h *AdminHandler) UpdateBusinessType(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Business type ID required"})
		return
	}

	var businessType models.BusinessType
	if err := c.ShouldBindJSON(&businessType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	businessType.ID = id
	if err := h.adminService.UpdateBusinessType(&businessType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Business type updated successfully",
		"data":    businessType,
	})
}

func (h *AdminHandler) DeleteBusinessType(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Business type ID required"})
		return
	}

	if err := h.adminService.DeleteBusinessType(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Business type deleted successfully",
	})
}
