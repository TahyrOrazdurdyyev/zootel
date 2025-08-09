package handlers

import (
	"net/http"

	"database/sql"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AddonHandler struct {
	addonService *services.AddonService
	db           *sql.DB
}

func NewAddonHandler(addonService *services.AddonService, db *sql.DB) *AddonHandler {
	return &AddonHandler{
		addonService: addonService,
		db:           db,
	}
}

// GetAvailableAddons returns all available addons for purchase
func (h *AddonHandler) GetAvailableAddons(c *gin.Context) {
	addons, err := h.addonService.GetAvailableAddons()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get available addons"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    addons,
	})
}

// GetCompanyAddons returns all addons purchased by the company
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    addons,
	})
}

// PurchaseAddon handles addon purchase requests
func (h *AddonHandler) PurchaseAddon(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	var request struct {
		AddonType    string `json:"addon_type" binding:"required"`
		AddonKey     string `json:"addon_key" binding:"required"`
		BillingCycle string `json:"billing_cycle" binding:"required"` // monthly, yearly, one_time
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	addon, err := h.addonService.PurchaseAddon(companyID, request.AddonType, request.AddonKey, request.BillingCycle)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    addon,
		"message": "Addon purchase initiated successfully",
	})
}

// CancelAddon handles addon cancellation
func (h *AddonHandler) CancelAddon(c *gin.Context) {
	companyID := c.Param("companyId")
	addonID := c.Param("addonId")

	if companyID == "" || addonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID and Addon ID are required"})
		return
	}

	err := h.addonService.CancelAddon(companyID, addonID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Addon cancelled successfully",
	})
}

// Admin endpoints

// ManuallyEnableAddon allows SuperAdmin to manually enable addons for companies
func (h *AddonHandler) ManuallyEnableAddon(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	var request struct {
		AddonType string `json:"addon_type" binding:"required"`
		AddonKey  string `json:"addon_key" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.addonService.ManuallyEnableAddon(companyID, request.AddonType, request.AddonKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Addon manually enabled successfully",
	})
}

// GetAddonPricing returns pricing information for all addons (Admin only)
func (h *AddonHandler) GetAddonPricing(c *gin.Context) {
	query := `
		SELECT id, addon_type, addon_key, name, description,
		       monthly_price, yearly_price, one_time_price, is_available,
		       created_at, updated_at
		FROM addon_pricing 
		ORDER BY addon_type, name`

	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get addon pricing"})
		return
	}
	defer rows.Close()

	var pricing []map[string]interface{}
	for rows.Next() {
		var item map[string]interface{} = make(map[string]interface{})
		var id, addonType, addonKey, name, description string
		var monthlyPrice, yearlyPrice float64
		var oneTimePrice sql.NullFloat64
		var isAvailable bool
		var createdAt, updatedAt string

		err := rows.Scan(&id, &addonType, &addonKey, &name, &description,
			&monthlyPrice, &yearlyPrice, &oneTimePrice, &isAvailable,
			&createdAt, &updatedAt)
		if err != nil {
			continue
		}

		item["id"] = id
		item["addon_type"] = addonType
		item["addon_key"] = addonKey
		item["name"] = name
		item["description"] = description
		item["monthly_price"] = monthlyPrice
		item["yearly_price"] = yearlyPrice
		if oneTimePrice.Valid {
			item["one_time_price"] = oneTimePrice.Float64
		}
		item["is_available"] = isAvailable
		item["created_at"] = createdAt
		item["updated_at"] = updatedAt

		pricing = append(pricing, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pricing,
	})
}

// UpdateAddonPricing updates pricing for an addon (Admin only)
func (h *AddonHandler) UpdateAddonPricing(c *gin.Context) {
	addonID := c.Param("addonId")
	if addonID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Addon ID is required"})
		return
	}

	var request struct {
		Name         string   `json:"name"`
		Description  string   `json:"description"`
		MonthlyPrice float64  `json:"monthly_price"`
		YearlyPrice  float64  `json:"yearly_price"`
		OneTimePrice *float64 `json:"one_time_price"`
		IsAvailable  bool     `json:"is_available"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE addon_pricing 
		SET name = $2, description = $3, monthly_price = $4, yearly_price = $5,
		    one_time_price = $6, is_available = $7, updated_at = NOW()
		WHERE id = $1`

	_, err := h.db.Exec(query, addonID, request.Name, request.Description,
		request.MonthlyPrice, request.YearlyPrice, request.OneTimePrice, request.IsAvailable)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update addon pricing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Addon pricing updated successfully",
	})
}

// CreateAddonPricing creates new addon pricing (Admin only)
func (h *AddonHandler) CreateAddonPricing(c *gin.Context) {
	var request struct {
		AddonType    string   `json:"addon_type" binding:"required"`
		AddonKey     string   `json:"addon_key" binding:"required"`
		Name         string   `json:"name" binding:"required"`
		Description  string   `json:"description"`
		MonthlyPrice float64  `json:"monthly_price"`
		YearlyPrice  float64  `json:"yearly_price"`
		OneTimePrice *float64 `json:"one_time_price"`
		IsAvailable  bool     `json:"is_available"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		INSERT INTO addon_pricing (
			id, addon_type, addon_key, name, description,
			monthly_price, yearly_price, one_time_price, is_available,
			created_at, updated_at
		) VALUES (
			gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
		) RETURNING id`

	var newID string
	err := h.db.QueryRow(query, request.AddonType, request.AddonKey, request.Name,
		request.Description, request.MonthlyPrice, request.YearlyPrice,
		request.OneTimePrice, request.IsAvailable).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create addon pricing"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    map[string]string{"id": newID},
		"message": "Addon pricing created successfully",
	})
}

// ProcessBilling handles recurring billing for addons (cron job endpoint)
func (h *AddonHandler) ProcessBilling(c *gin.Context) {
	err := h.addonService.ProcessAddonBilling()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process addon billing"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Addon billing processed successfully",
	})
}
