package handlers

import (
	"log"
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type CurrencyHandler struct {
	currencyService *services.CurrencyService
}

func NewCurrencyHandler(currencyService *services.CurrencyService) *CurrencyHandler {
	return &CurrencyHandler{
		currencyService: currencyService,
	}
}

// GetCurrencies returns all active currencies
func (h *CurrencyHandler) GetCurrencies(c *gin.Context) {
	currencies, err := h.currencyService.GetActiveCurrencies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch currencies",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    currencies,
	})
}

// GetAllCurrencies returns all currencies (admin only)
func (h *CurrencyHandler) GetAllCurrencies(c *gin.Context) {
	log.Printf("🔍 GetAllCurrencies called from %s", c.ClientIP())
	
	currencies, err := h.currencyService.GetAllCurrencies()
	if err != nil {
		log.Printf("❌ GetAllCurrencies failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch currencies",
		})
		return
	}

	log.Printf("✅ GetAllCurrencies success, returned %d currencies", len(currencies))
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    currencies,
	})
}

// GetCurrency returns currency by code
func (h *CurrencyHandler) GetCurrency(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Currency code is required",
		})
		return
	}

	currency, err := h.currencyService.GetCurrencyByCode(code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Currency not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    currency,
	})
}

// ConvertCurrency converts amount between currencies
func (h *CurrencyHandler) ConvertCurrency(c *gin.Context) {
	var req models.CurrencyConversionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Validate amount
	if req.Amount < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Amount must be positive",
		})
		return
	}

	result, err := h.currencyService.ConvertCurrency(req.FromCurrency, req.ToCurrency, req.Amount)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

// UpdateExchangeRates updates exchange rates from API
func (h *CurrencyHandler) UpdateExchangeRates(c *gin.Context) {
	err := h.currencyService.UpdateExchangeRates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update exchange rates: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Exchange rates updated successfully",
	})
}

// CreateCurrency creates a new currency (admin only)
func (h *CurrencyHandler) CreateCurrency(c *gin.Context) {
	var currency models.Currency
	if err := c.ShouldBindJSON(&currency); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	// Validate required fields
	if currency.Code == "" || currency.Name == "" || currency.Symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Code, name, and symbol are required",
		})
		return
	}

	err := h.currencyService.CreateCurrency(&currency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create currency: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    currency,
	})
}

// UpdateCurrency updates currency (admin only)
func (h *CurrencyHandler) UpdateCurrency(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Currency code is required",
		})
		return
	}

	var currency models.Currency
	if err := c.ShouldBindJSON(&currency); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	currency.Code = code // Ensure code matches URL parameter

	err := h.currencyService.UpdateCurrency(&currency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update currency: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    currency,
	})
}

// DeleteCurrency deletes currency (admin only)
func (h *CurrencyHandler) DeleteCurrency(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Currency code is required",
		})
		return
	}

	err := h.currencyService.DeleteCurrency(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete currency: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Currency deleted successfully",
	})
}

// SetBaseCurrency sets a currency as base (admin only)
func (h *CurrencyHandler) SetBaseCurrency(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Currency code is required",
		})
		return
	}

	err := h.currencyService.SetBaseCurrency(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to set base currency: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Base currency updated successfully",
	})
}

// ToggleCurrencyStatus toggles currency active status (admin only)
func (h *CurrencyHandler) ToggleCurrencyStatus(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Currency code is required",
		})
		return
	}

	// Get current currency
	currency, err := h.currencyService.GetCurrencyByCode(code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Currency not found",
		})
		return
	}

	// Toggle status
	currency.IsActive = !currency.IsActive

	err = h.currencyService.UpdateCurrency(currency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update currency status: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    currency,
	})
}
