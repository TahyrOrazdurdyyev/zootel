package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct {
	analyticsService *services.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

// GetGlobalDashboard returns comprehensive dashboard metrics for SuperAdmin
func (h *AnalyticsHandler) GetGlobalDashboard(c *gin.Context) {
	dashboard, err := h.analyticsService.GetGlobalDashboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    dashboard,
	})
}

// GetRevenueTrends returns revenue trends over specified time period
func (h *AnalyticsHandler) GetRevenueTrends(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	// Get company ID from context if available
	companyID := ""
	if cid, exists := c.Get("company_id"); exists {
		companyID = cid.(string)
	}

	trends, err := h.analyticsService.GetRevenueTrends(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"trends": trends,
			"period": days,
		},
	})
}

// GetUserRegistrationTrends returns user registration trends
func (h *AnalyticsHandler) GetUserRegistrationTrends(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	trends, err := h.analyticsService.GetUserRegistrationTrends(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"trends": trends,
			"period": days,
		},
	})
}

// GetBookingTrends returns booking trends over time
func (h *AnalyticsHandler) GetBookingTrends(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	trends, err := h.analyticsService.GetBookingTrends(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"trends": trends,
			"period": days,
		},
	})
}

// GetUserSegmentation returns user segmentation analysis
func (h *AnalyticsHandler) GetUserSegmentation(c *gin.Context) {
	segmentation, err := h.analyticsService.GetUserSegmentation()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    segmentation,
	})
}

// GetRepeatOrdersAnalytics returns repeat orders analytics for a company
func (h *AnalyticsHandler) GetRepeatOrdersAnalytics(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		if id, exists := c.Get("company_id"); exists {
			companyID = id.(string)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	analytics, err := h.analyticsService.GetRepeatOrdersAnalytics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// GetCancellationAnalytics returns cancellation analytics for a company
func (h *AnalyticsHandler) GetCancellationAnalytics(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		if id, exists := c.Get("company_id"); exists {
			companyID = id.(string)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	analytics, err := h.analyticsService.GetCancellationAnalytics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// GetRefundAnalytics returns refund analytics for a company
func (h *AnalyticsHandler) GetRefundAnalytics(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		if id, exists := c.Get("company_id"); exists {
			companyID = id.(string)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	analytics, err := h.analyticsService.GetRefundAnalytics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// GetTeamWorkloadAnalytics returns team workload analytics for a company
func (h *AnalyticsHandler) GetTeamWorkloadAnalytics(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		if id, exists := c.Get("company_id"); exists {
			companyID = id.(string)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	analytics, err := h.analyticsService.GetTeamWorkloadAnalytics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// GetAverageCheckTrends returns average check trends for a company
func (h *AnalyticsHandler) GetAverageCheckTrends(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		if id, exists := c.Get("company_id"); exists {
			companyID = id.(string)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	analytics, err := h.analyticsService.GetAverageCheckTrends(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// GetCustomerSegmentationAnalytics returns customer segmentation analytics for a company
func (h *AnalyticsHandler) GetCustomerSegmentationAnalytics(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		if id, exists := c.Get("company_id"); exists {
			companyID = id.(string)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	analytics, err := h.analyticsService.GetCustomerSegmentationAnalytics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// GetTopPerformingCompanies returns top companies by performance metrics
func (h *AnalyticsHandler) GetTopPerformingCompanies(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 100 {
		limit = 10
	}

	companies, err := h.analyticsService.GetTopPerformingCompanies(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
	})
}

// GetServiceCategoryPerformance returns performance metrics by service category
func (h *AnalyticsHandler) GetServiceCategoryPerformance(c *gin.Context) {
	performance, err := h.analyticsService.GetServiceCategoryPerformance()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    performance,
	})
}

// GetCompanyAnalytics returns detailed analytics for a specific company
func (h *AnalyticsHandler) GetCompanyAnalytics(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	analytics, err := h.analyticsService.GetCompanyAnalytics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"analytics":  analytics,
			"period":     days,
			"company_id": companyID,
		},
	})
}

// GetPetTypePopularity returns popularity statistics for different pet types
func (h *AnalyticsHandler) GetPetTypePopularity(c *gin.Context) {
	popularity, err := h.analyticsService.GetPetTypePopularity()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    popularity,
	})
}

// GetCohortAnalysis returns user cohort analysis
func (h *AnalyticsHandler) GetCohortAnalysis(c *gin.Context) {
	months, _ := strconv.Atoi(c.DefaultQuery("months", "12"))
	if months < 1 || months > 24 {
		months = 12
	}

	cohorts, err := h.analyticsService.GetCohortAnalysis(months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"cohorts": cohorts,
			"period":  months,
		},
	})
}

// GetGeographicDistribution returns geographic distribution of users and companies
func (h *AnalyticsHandler) GetGeographicDistribution(c *gin.Context) {
	distribution, err := h.analyticsService.GetGeographicDistribution()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    distribution,
	})
}

// TrackEvent records an analytics event
func (h *AnalyticsHandler) TrackEvent(c *gin.Context) {
	var req services.TrackEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user context if not provided
	if req.UserID == "" {
		if userID, exists := c.Get("user_id"); exists {
			req.UserID = userID.(string)
		}
	}

	if req.CompanyID == "" {
		if companyID, exists := c.Get("company_id"); exists {
			req.CompanyID = companyID.(string)
		}
	}

	err := h.analyticsService.TrackEvent(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Event tracked successfully",
	})
}

// GetAnalyticsOverview returns a quick overview for dashboard
func (h *AnalyticsHandler) GetAnalyticsOverview(c *gin.Context) {
	// Get multiple analytics endpoints in one call for dashboard
	dashboard, err := h.analyticsService.GetGlobalDashboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get recent trends (last 7 days) - use empty company ID for global
	revenueTrends, _ := h.analyticsService.GetRevenueTrends("", 7)
	userTrends, _ := h.analyticsService.GetUserRegistrationTrends(7)
	bookingTrends, _ := h.analyticsService.GetBookingTrends(7)

	// Get segmentation
	segmentation, _ := h.analyticsService.GetUserSegmentation()

	// Get top companies (top 5)
	topCompanies, _ := h.analyticsService.GetTopPerformingCompanies(5)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"dashboard":         dashboard,
			"revenue_trends":    revenueTrends,
			"user_trends":       userTrends,
			"booking_trends":    bookingTrends,
			"user_segmentation": segmentation,
			"top_companies":     topCompanies,
		},
	})
}

// GetGlobalRevenueTrends returns global revenue trends
func (h *AnalyticsHandler) GetGlobalRevenueTrends(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	trends, err := h.analyticsService.GetRevenueTrends("", days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    trends,
	})
}

// GetGlobalRegistrationTrends returns global user registration trends
func (h *AnalyticsHandler) GetGlobalRegistrationTrends(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	trends, err := h.analyticsService.GetUserRegistrationTrends(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    trends,
	})
}

// GetGlobalUserSegmentation returns global user segmentation
func (h *AnalyticsHandler) GetGlobalUserSegmentation(c *gin.Context) {
	segmentation, err := h.analyticsService.GetUserSegmentation()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    segmentation,
	})
}
