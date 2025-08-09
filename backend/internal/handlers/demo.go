package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type DemoHandler struct {
	demoService *services.DemoService
}

func NewDemoHandler(demoService *services.DemoService) *DemoHandler {
	return &DemoHandler{demoService: demoService}
}

func (h *DemoHandler) CreateDemoCompany(c *gin.Context) {
	var req services.DemoCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	company, err := h.demoService.CreateDemoCompany(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Demo company created successfully",
		"data":    company,
	})
}

func (h *DemoHandler) GetDemoCompanies(c *gin.Context) {
	companies, err := h.demoService.GetAllDemoCompanies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
	})
}

func (h *DemoHandler) DeleteDemoCompany(c *gin.Context) {
	companyID := c.Param("id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	if err := h.demoService.DeleteDemoCompany(companyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Demo company deleted successfully",
	})
}

func (h *DemoHandler) ResetDemoData(c *gin.Context) {
	if err := h.demoService.ResetDemoData(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "All demo data has been reset successfully",
	})
}

func (h *DemoHandler) GetDemoStats(c *gin.Context) {
	stats, err := h.demoService.GetDemoCompanyStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
