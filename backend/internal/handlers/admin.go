package handlers

import (
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
	var plan models.Plan
	if err := c.ShouldBindJSON(&plan); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.CreatePlan(&plan); err != nil {
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

// Payment settings
func (h *AdminHandler) GetPaymentSettings(c *gin.Context) {
	settings, err := h.adminService.GetPaymentSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    settings,
	})
}

func (h *AdminHandler) UpdatePaymentSettings(c *gin.Context) {
	var settings models.PaymentSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.UpdatePaymentSettings(&settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Payment settings updated successfully",
	})
}

// Service categories
func (h *AdminHandler) GetServiceCategories(c *gin.Context) {
	categories, err := h.adminService.GetServiceCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

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

	companies, err := h.adminService.GetAllCompanies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Simple pagination
	start := (page - 1) * limit
	end := start + limit

	if start >= len(companies) {
		companies = []models.Company{}
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
