package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AddonHandler struct {
	addonService services.AddonServiceInterface
}

func NewAddonHandler(addonService services.AddonServiceInterface, db *sql.DB) *AddonHandler {
	return &AddonHandler{
		addonService: addonService,
	}
}

// GetAvailableAddons returns all available addons for SuperAdmin
func (h *AddonHandler) GetAvailableAddons(c *gin.Context) {
	addons, err := h.addonService.GetAvailableAddons()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get available addons"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"addons": addons})
}

// CreateAvailableAddon creates a new available addon (SuperAdmin only)
func (h *AddonHandler) CreateAvailableAddon(c *gin.Context) {
	var addon models.AvailableAddon
	if err := c.ShouldBindJSON(&addon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.addonService.CreateAvailableAddon(&addon); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create addon"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"addon": addon})
}

// UpdateAvailableAddon updates an available addon (SuperAdmin only)
func (h *AddonHandler) UpdateAvailableAddon(c *gin.Context) {
	addonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid addon ID"})
		return
	}

	var addon models.AvailableAddon
	if err := c.ShouldBindJSON(&addon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	addon.ID = addonID
	if err := h.addonService.UpdateAvailableAddon(&addon); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update addon"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"addon": addon})
}

// GetCompanyAddons returns all addons for a specific company
func (h *AddonHandler) GetCompanyAddons(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	addons, err := h.addonService.GetCompanyAddons(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get company addons"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"addons": addons})
}

// GetCompanyAddonSummary returns addon summary for a company
func (h *AddonHandler) GetCompanyAddonSummary(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	summary, err := h.addonService.GetCompanyAddonSummary(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get company addon summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

// AddCompanyAddon adds an addon to a company (SuperAdmin only)
func (h *AddonHandler) AddCompanyAddon(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	var request models.AddonRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure companyID matches URL parameter
	if request.CompanyID != companyID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID mismatch"})
		return
	}

	addon := &models.CompanyAddon{
		CompanyID:  companyID,
		AddonType:  request.AddonType,
		AddonKey:   request.AddonKey,
		AddonValue: request.AddonValue,
		IsActive:   true,
	}

	if err := h.addonService.AddCompanyAddon(addon); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add addon to company"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"addon": addon})
}

// RemoveCompanyAddon removes/deactivates an addon from a company
func (h *AddonHandler) RemoveCompanyAddon(c *gin.Context) {
	companyID := c.Param("companyId")
	addonID, err := strconv.Atoi(c.Param("addonId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid addon ID"})
		return
	}

	if err := h.addonService.RemoveCompanyAddon(companyID, addonID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove addon"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Addon removed successfully"})
}

// CheckCompanyAddon checks if company has specific addon
func (h *AddonHandler) CheckCompanyAddon(c *gin.Context) {
	companyID := c.Param("companyId")
	addonType := c.Query("type")
	addonKey := c.Query("key")

	if companyID == "" || addonType == "" || addonKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	hasAddon, addonValue, err := h.addonService.CheckCompanyAddon(companyID, addonType, addonKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check addon"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_addon":   hasAddon,
		"addon_value": addonValue,
	})
}

// GetAllCompaniesAddonSummary returns addon summary for all companies (SuperAdmin only)
func (h *AddonHandler) GetAllCompaniesAddonSummary(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	summaries, total, err := h.addonService.GetAllCompaniesAddonSummary(page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get companies addon summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summaries": summaries,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}
