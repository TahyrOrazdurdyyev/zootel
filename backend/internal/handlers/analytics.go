package handlers

import (
	"net/http"
	"strconv"
	"time"

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

// GetRegionalRegistrations returns registration statistics by region for SuperAdmin
func (h *AnalyticsHandler) GetRegionalRegistrations(c *gin.Context) {
	// Parse date parameters
	fromStr := c.DefaultQuery("from", "")
	toStr := c.DefaultQuery("to", "")

	var dateFrom, dateTo time.Time
	var err error

	if fromStr == "" {
		// Default to last 30 days
		dateFrom = time.Now().AddDate(0, 0, -30)
	} else {
		dateFrom, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from date format. Use YYYY-MM-DD"})
			return
		}
	}

	if toStr == "" {
		dateTo = time.Now()
	} else {
		dateTo, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to date format. Use YYYY-MM-DD"})
			return
		}
	}

	stats, err := h.analyticsService.GetRegistrationsByRegion(dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
		"period": gin.H{
			"from": dateFrom.Format("2006-01-02"),
			"to":   dateTo.Format("2006-01-02"),
		},
	})
}

// GetAllUsersPhoneData returns all users with phone data for SuperAdmin
func (h *AnalyticsHandler) GetAllUsersPhoneData(c *gin.Context) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	offset := (page - 1) * pageSize

	users, totalCount, err := h.analyticsService.GetAllUsersWithPhoneData(pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total":       totalCount,
			"total_pages": (totalCount + pageSize - 1) / pageSize,
		},
	})
}

// GetUsersByCountry returns users filtered by country for SuperAdmin
func (h *AnalyticsHandler) GetUsersByCountry(c *gin.Context) {
	country := c.Param("country")
	if country == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Country parameter is required"})
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	offset := (page - 1) * pageSize

	users, totalCount, err := h.analyticsService.GetUsersByCountry(country, pageSize, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
		"country": country,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total":       totalCount,
			"total_pages": (totalCount + pageSize - 1) / pageSize,
		},
	})
}

// GetUserLocationAnalytics returns comprehensive location analytics for SuperAdmin
func (h *AnalyticsHandler) GetUserLocationAnalytics(c *gin.Context) {
	analytics, err := h.analyticsService.GetUserLocationAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}

// GetCompanyCustomerLocationStats returns location statistics for company's customers
func (h *AnalyticsHandler) GetCompanyCustomerLocationStats(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	stats, err := h.analyticsService.GetCompanyCustomerLocationStats(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GetDetailedUserLocationReport returns detailed location report with user info
func (h *AnalyticsHandler) GetDetailedUserLocationReport(c *gin.Context) {
	country := c.Query("country")
	state := c.Query("state")
	city := c.Query("city")
	role := c.Query("role")
	limitStr := c.DefaultQuery("limit", "100")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}
	if limit > 1000 {
		limit = 1000
	}

	users, err := h.analyticsService.GetDetailedUserLocationReport(country, state, city, role, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
		"filters": gin.H{
			"country": country,
			"state":   state,
			"city":    city,
			"role":    role,
			"limit":   limit,
		},
	})
}

// GetLocationTrends returns registration trends by location over time
func (h *AnalyticsHandler) GetLocationTrends(c *gin.Context) {
	periodStr := c.DefaultQuery("period", "30")
	groupBy := c.DefaultQuery("group_by", "day") // day, week, month
	country := c.Query("country")

	period, err := strconv.Atoi(periodStr)
	if err != nil || period <= 0 {
		period = 30
	}
	if period > 365 {
		period = 365
	}

	trends, err := h.analyticsService.GetLocationTrends(period, groupBy, country)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    trends,
		"filters": gin.H{
			"period":   period,
			"group_by": groupBy,
			"country":  country,
		},
	})
}

// GetCohortAnalytics handles cohort analysis requests
func (h *AnalyticsHandler) GetCohortAnalytics(c *gin.Context) {
	_ = c.DefaultQuery("period", "weekly")
	_ = c.DefaultQuery("metric", "retention")
	_ = c.DefaultQuery("timeframe", "30d")

	// Mock data for now - replace with real database queries
	cohortData := map[string]interface{}{
		"cohorts": []map[string]interface{}{
			{
				"period":      "2025-01-01",
				"total_users": 1250,
				"retention_rates": []int{100, 85, 72, 65, 58, 52, 48, 45, 42, 38, 35, 32},
			},
			{
				"period":      "2025-01-08", 
				"total_users": 1180,
				"retention_rates": []int{100, 88, 75, 68, 61, 55, 50, 46, 43, 40, 36, 33},
			},
			{
				"period":      "2025-01-15",
				"total_users": 1320,
				"retention_rates": []int{100, 82, 70, 63, 56, 50, 45, 41, 38, 35, 32, 29},
			},
			{
				"period":      "2025-01-22",
				"total_users": 1450,
				"retention_rates": []int{100, 90, 78, 71, 64, 58, 53, 49, 45, 42, 38, 35},
			},
		},
		"summary": map[string]interface{}{
			"avg_week1_retention":  86,
			"avg_month1_retention": 42,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    cohortData,
	})
}

// GetSegmentAnalytics handles user segmentation requests
func (h *AnalyticsHandler) GetSegmentAnalytics(c *gin.Context) {
	segmentType := c.DefaultQuery("type", "behavior")
	_ = c.DefaultQuery("timeframe", "30d")

	var segments []map[string]interface{}

	switch segmentType {
	case "behavior":
		segments = []map[string]interface{}{
			{
				"name":           "Power Users",
				"description":    "Users with high engagement",
				"user_count":     2450,
				"percentage":     15.2,
				"avg_revenue":    1250,
				"retention_rate": 85,
			},
			{
				"name":           "Regular Users", 
				"description":    "Moderate usage patterns",
				"user_count":     8920,
				"percentage":     55.4,
				"avg_revenue":    420,
				"retention_rate": 65,
			},
			{
				"name":           "Casual Users",
				"description":    "Low engagement users",
				"user_count":     4730,
				"percentage":     29.4,
				"avg_revenue":    180,
				"retention_rate": 35,
			},
		}
	case "demographic":
		segments = []map[string]interface{}{
			{
				"name":           "18-25 Age Group",
				"description":    "Young adults",
				"user_count":     3200,
				"percentage":     19.8,
				"avg_revenue":    380,
				"retention_rate": 58,
			},
			{
				"name":           "26-35 Age Group",
				"description":    "Young professionals",
				"user_count":     6800,
				"percentage":     42.2,
				"avg_revenue":    720,
				"retention_rate": 72,
			},
			{
				"name":           "36-50 Age Group",
				"description":    "Established professionals",
				"user_count":     4900,
				"percentage":     30.4,
				"avg_revenue":    950,
				"retention_rate": 78,
			},
			{
				"name":           "50+ Age Group",
				"description":    "Senior users",
				"user_count":     1200,
				"percentage":     7.6,
				"avg_revenue":    1100,
				"retention_rate": 82,
			},
		}
	case "geographic":
		segments = []map[string]interface{}{
			{
				"name":           "Moscow",
				"description":    "Capital region users",
				"user_count":     5200,
				"percentage":     32.3,
				"avg_revenue":    850,
				"retention_rate": 75,
			},
			{
				"name":           "St. Petersburg",
				"description":    "Northern capital users",
				"user_count":     2800,
				"percentage":     17.4,
				"avg_revenue":    720,
				"retention_rate": 70,
			},
			{
				"name":           "Other Cities",
				"description":    "Regional users",
				"user_count":     8100,
				"percentage":     50.3,
				"avg_revenue":    480,
				"retention_rate": 62,
			},
		}
	default:
		segments = []map[string]interface{}{}
	}

	segmentData := map[string]interface{}{
		"segments": segments,
		"trends": map[string]interface{}{
			"total_segments":    len(segments),
			"avg_segment_size":  calculateAvgSegmentSize(segments),
			"highest_retention": getHighestRetention(segments),
			"total_revenue":     calculateTotalRevenue(segments),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    segmentData,
	})
}

// GetFunnelAnalytics handles conversion funnel requests
func (h *AnalyticsHandler) GetFunnelAnalytics(c *gin.Context) {
	funnelType := c.DefaultQuery("type", "registration")
	_ = c.DefaultQuery("timeframe", "30d")

	var steps []map[string]interface{}
	var overallConversion float64
	var biggestDropoff map[string]interface{}

	switch funnelType {
	case "registration":
		steps = []map[string]interface{}{
			{"name": "Landing Page Visit", "users": 25000},
			{"name": "Sign Up Started", "users": 8500},
			{"name": "Email Verified", "users": 6800},
			{"name": "Profile Completed", "users": 5200},
			{"name": "First Service Booked", "users": 3100},
		}
		overallConversion = 12.4
		biggestDropoff = map[string]interface{}{
			"step": "Landing → Sign Up",
			"rate": 66.0,
		}
	case "booking":
		steps = []map[string]interface{}{
			{"name": "Service Search", "users": 15000},
			{"name": "Service Selected", "users": 9500},
			{"name": "Date/Time Selected", "users": 7200},
			{"name": "Payment Info Added", "users": 5800},
			{"name": "Booking Confirmed", "users": 4900},
		}
		overallConversion = 32.7
		biggestDropoff = map[string]interface{}{
			"step": "Search → Selection",
			"rate": 36.7,
		}
	case "payment":
		steps = []map[string]interface{}{
			{"name": "Checkout Started", "users": 5800},
			{"name": "Payment Method Selected", "users": 5200},
			{"name": "Payment Details Entered", "users": 4800},
			{"name": "Payment Submitted", "users": 4600},
			{"name": "Payment Confirmed", "users": 4500},
		}
		overallConversion = 77.6
		biggestDropoff = map[string]interface{}{
			"step": "Details → Submit",
			"rate": 4.2,
		}
	default:
		steps = []map[string]interface{}{}
		overallConversion = 0
		biggestDropoff = map[string]interface{}{}
	}

	suggestions := []map[string]interface{}{
		{
			"title":       "Optimize Landing Page",
			"description": "Improve call-to-action visibility and reduce form complexity",
		},
		{
			"title":       "Simplify Registration",
			"description": "Reduce required fields and add social login options",
		},
		{
			"title":       "Add Progress Indicators",
			"description": "Show users their progress through the funnel steps",
		},
	}

	funnelData := map[string]interface{}{
		"steps":                   steps,
		"overall_conversion_rate": overallConversion,
		"biggest_dropoff":         biggestDropoff,
		"suggestions":             suggestions,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    funnelData,
	})
}

// Helper functions for analytics calculations
func calculateAvgSegmentSize(segments []map[string]interface{}) int {
	if len(segments) == 0 {
		return 0
	}
	total := 0
	for _, segment := range segments {
		if userCount, ok := segment["user_count"].(int); ok {
			total += userCount
		}
	}
	return total / len(segments)
}

func getHighestRetention(segments []map[string]interface{}) int {
	highest := 0
	for _, segment := range segments {
		if retention, ok := segment["retention_rate"].(int); ok && retention > highest {
			highest = retention
		}
	}
	return highest
}

func calculateTotalRevenue(segments []map[string]interface{}) int {
	total := 0
	for _, segment := range segments {
		if userCount, ok := segment["user_count"].(int); ok {
			if avgRevenue, ok := segment["avg_revenue"].(int); ok {
				total += userCount * avgRevenue
			}
		}
	}
	return total
}

// GetRecentActivity returns recent activity data for the dashboard
func (h *AnalyticsHandler) GetRecentActivity(c *gin.Context) {
	activities, err := h.analyticsService.GetRecentActivity()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activities,
	})
}

// GetKeyMetrics returns key platform metrics for the dashboard
func (h *AnalyticsHandler) GetKeyMetrics(c *gin.Context) {
	metrics, err := h.analyticsService.GetKeyMetrics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}