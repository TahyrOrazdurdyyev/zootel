package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type IntegrationHandler struct {
	integrationService services.IntegrationServiceInterface
}

func NewIntegrationHandler(integrationService services.IntegrationServiceInterface) *IntegrationHandler {
	return &IntegrationHandler{integrationService: integrationService}
}

// EnableWebsiteIntegration enables website integration for a company
func (h *IntegrationHandler) EnableWebsiteIntegration(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	var request models.IntegrationFeatureRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.integrationService.EnableWebsiteIntegration(companyID, &request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// DisableWebsiteIntegration disables website integration for a company
func (h *IntegrationHandler) DisableWebsiteIntegration(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	err := h.integrationService.DisableWebsiteIntegration(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Website integration disabled successfully"})
}

// GetIntegrationSettings gets company integration settings
func (h *IntegrationHandler) GetIntegrationSettings(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	settings, err := h.integrationService.GetCompanyIntegrationSettings(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateIntegrationSettings updates company integration settings
func (h *IntegrationHandler) UpdateIntegrationSettings(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	var request models.IntegrationFeatureRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.integrationService.UpdateIntegrationSettings(companyID, &request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Integration settings updated successfully"})
}

// RegenerateAPIKey regenerates API key for a company
func (h *IntegrationHandler) RegenerateAPIKey(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	response, err := h.integrationService.RegenerateAPIKey(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetIntegrationFeatures gets available integration features for a company
func (h *IntegrationHandler) GetIntegrationFeatures(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	features, err := h.integrationService.GetCompanyIntegrationFeatures(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"features": features})
}

// GetMarketplaceEligibility gets marketplace eligibility status
func (h *IntegrationHandler) GetMarketplaceEligibility(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	eligibility, err := h.integrationService.GetMarketplaceEligibility(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, eligibility)
}

// UpdateMarketplaceVisibility updates marketplace visibility setting
func (h *IntegrationHandler) UpdateMarketplaceVisibility(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	var request struct {
		Visible bool `json:"visible"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.integrationService.UpdateMarketplaceVisibility(companyID, request.Visible)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Marketplace visibility updated successfully"})
}

// GetSourceAnalytics gets source analytics for a company
func (h *IntegrationHandler) GetSourceAnalytics(c *gin.Context) {
	var companyID string
	if id, exists := c.Get("company_id"); exists {
		companyID = id.(string)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not found"})
		return
	}

	days := 30 // default
	if daysParam := c.Query("days"); daysParam != "" {
		if parsedDays, err := strconv.Atoi(daysParam); err == nil {
			days = parsedDays
		}
	}

	summary, err := h.integrationService.GetCompanySourceSummary(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// ValidateAPIKey validates an API key (public endpoint)
func (h *IntegrationHandler) ValidateAPIKey(c *gin.Context) {
	apiKey := c.GetHeader("X-API-Key")
	if apiKey == "" {
		apiKey = c.Query("api_key")
	}

	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "API key is required"})
		return
	}

	company, err := h.integrationService.ValidateAPIKey(apiKey)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":      true,
		"company_id": company.ID,
		"company":    company.Name,
	})
}

// CheckDomainAccess checks if a domain has access (public endpoint)
func (h *IntegrationHandler) CheckDomainAccess(c *gin.Context) {
	apiKey := c.GetHeader("X-API-Key")
	domain := c.Query("domain")

	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "API key is required"})
		return
	}

	if domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Domain is required"})
		return
	}

	// First validate API key to get company
	company, err := h.integrationService.ValidateAPIKey(apiKey)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
		return
	}

	// Check domain access
	hasAccess, err := h.integrationService.CheckDomainAccess(company.ID, domain)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_access": hasAccess,
		"domain":     domain,
		"company_id": company.ID,
	})
}

// RecordWidgetInteraction records widget interaction for analytics
func (h *IntegrationHandler) RecordWidgetInteraction(c *gin.Context) {
	apiKey := c.GetHeader("X-API-Key")
	source := c.PostForm("source")

	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "API key is required"})
		return
	}

	// Validate API key to get company
	company, err := h.integrationService.ValidateAPIKey(apiKey)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
		return
	}

	if source == "" {
		source = "widget"
	}

	err = h.integrationService.RecordWidgetInteraction(company.ID, source)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interaction recorded"})
}
