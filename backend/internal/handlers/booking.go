package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type BookingHandler struct {
	bookingService *services.BookingService
}

func NewBookingHandler(bookingService *services.BookingService) *BookingHandler {
	return &BookingHandler{bookingService: bookingService}
}

// CreateBooking creates a new booking
func (h *BookingHandler) CreateBooking(c *gin.Context) {
	var req services.BookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	req.UserID = userID.(string)

	booking, err := h.bookingService.CreateBooking(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Booking created successfully",
		"data":    booking,
	})
}

// GetBooking returns a specific booking
func (h *BookingHandler) GetBooking(c *gin.Context) {
	bookingID := c.Param("id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking ID is required"})
		return
	}

	booking, err := h.bookingService.GetBookingByID(bookingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Check if user has access to this booking
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	companyID, _ := c.Get("company_id") // for employees

	canAccess := false
	if userRole == "super_admin" {
		canAccess = true
	} else if userRole == "pet_owner" && booking.UserID == userID.(string) {
		canAccess = true
	} else if userRole == "company_owner" || userRole == "employee" {
		if booking.CompanyID == companyID.(string) {
			canAccess = true
		}
	}

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    booking,
	})
}

// GetUserBookings returns bookings for the authenticated user
func (h *BookingHandler) GetUserBookings(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	bookings, err := h.bookingService.GetBookingsByUser(userID.(string), status, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookings,
	})
}

// GetCompanyBookings returns bookings for a company (for company owners/employees)
func (h *BookingHandler) GetCompanyBookings(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Parse date range
	startDateStr := c.DefaultQuery("start_date", time.Now().Format("2006-01-02"))
	endDateStr := c.DefaultQuery("end_date", time.Now().AddDate(0, 0, 7).Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format"})
		return
	}

	status := c.Query("status")

	bookings, err := h.bookingService.GetBookingsByCompany(companyID, startDate, endDate, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"bookings":   bookings,
			"start_date": startDate,
			"end_date":   endDate,
			"status":     status,
		},
	})
}

// CheckAvailability returns available time slots for a service
func (h *BookingHandler) CheckAvailability(c *gin.Context) {
	serviceID := c.Query("service_id")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "service_id is required"})
		return
	}

	dateStr := c.Query("date")
	if dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date is required"})
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	employeeID := c.Query("employee_id")
	var employeePtr *string
	if employeeID != "" {
		employeePtr = &employeeID
	}

	availability, err := h.bookingService.CheckAvailability(serviceID, date, employeePtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"service_id":   serviceID,
			"date":         date.Format("2006-01-02"),
			"employee_id":  employeeID,
			"availability": availability,
		},
	})
}

// UpdateBooking updates a booking
func (h *BookingHandler) UpdateBooking(c *gin.Context) {
	bookingID := c.Param("id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking ID is required"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// First get the booking to check ownership
	booking, err := h.bookingService.GetBookingByID(bookingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	// Check if user owns this booking or is from the company
	userRole, _ := c.Get("user_role")
	companyID, _ := c.Get("company_id")

	canUpdate := false
	if booking.UserID == userID.(string) {
		canUpdate = true
	} else if userRole == "company_owner" && booking.CompanyID == companyID.(string) {
		canUpdate = true
	} else if userRole == "employee" && booking.CompanyID == companyID.(string) {
		canUpdate = true
	}

	if !canUpdate {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this booking"})
		return
	}

	// Update booking using the service
	updatedBooking, err := h.bookingService.UpdateBooking(bookingID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Booking updated successfully",
		"data":    updatedBooking,
	})
}

// UpdateBookingStatus updates booking status
func (h *BookingHandler) UpdateBookingStatus(c *gin.Context) {
	bookingID := c.Param("id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking ID is required"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
		Notes  string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	validStatuses := []string{"pending", "confirmed", "in_progress", "completed", "cancelled", "rejected", "rescheduled"}
	isValidStatus := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	err := h.bookingService.UpdateBookingStatus(bookingID, req.Status, req.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Booking status updated successfully",
	})
}

// CancelBooking cancels a booking
func (h *BookingHandler) CancelBooking(c *gin.Context) {
	bookingID := c.Param("id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking ID is required"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}

	c.ShouldBindJSON(&req) // Optional body

	err := h.bookingService.UpdateBookingStatus(bookingID, "cancelled", req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Booking cancelled successfully",
	})
}

// RescheduleBooking reschedules a booking to a new time
func (h *BookingHandler) RescheduleBooking(c *gin.Context) {
	bookingID := c.Param("id")
	if bookingID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking ID is required"})
		return
	}

	var req struct {
		NewDateTime time.Time `json:"new_date_time" binding:"required"`
		Reason      string    `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.bookingService.RescheduleBooking(bookingID, req.NewDateTime, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Booking rescheduled successfully",
	})
}

// GetBookingCalendar returns calendar view of bookings
func (h *BookingHandler) GetBookingCalendar(c *gin.Context) {
	companyID := c.Query("company_id")
	employeeID := c.Query("employee_id")

	// Parse date range for calendar view
	yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))
	monthStr := c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month())))

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year"})
		return
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil || month < 1 || month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month"})
		return
	}

	// Get first and last day of the month
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, -1)

	var bookings []models.Booking
	var queryErr error

	if companyID != "" {
		bookingsWithData, err := h.bookingService.GetBookingsByCompany(companyID, startDate, endDate, "")
		if err != nil {
			queryErr = err
		} else {
			// Convert BookingWithCustomerData to Booking
			for _, bwd := range bookingsWithData {
				bookings = append(bookings, *bwd.Booking)
			}
		}
	} else if employeeID != "" {
		bookings, queryErr = h.bookingService.GetBookingsByEmployee(employeeID, startDate, endDate, "")
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Either company_id or employee_id is required"})
		return
	}

	if queryErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": queryErr.Error()})
		return
	}

	// Group bookings by date for calendar view
	calendar := make(map[string][]models.Booking)
	for _, booking := range bookings {
		dateKey := booking.DateTime.Format("2006-01-02")
		calendar[dateKey] = append(calendar[dateKey], booking)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"year":     year,
			"month":    month,
			"calendar": calendar,
			"summary": gin.H{
				"total_bookings":  len(bookings),
				"confirmed_count": h.countBookingsByStatus(bookings, "confirmed"),
				"pending_count":   h.countBookingsByStatus(bookings, "pending"),
				"completed_count": h.countBookingsByStatus(bookings, "completed"),
				"cancelled_count": h.countBookingsByStatus(bookings, "cancelled"),
			},
		},
	})
}

// GetBookingStatistics returns booking statistics
func (h *BookingHandler) GetBookingStatistics(c *gin.Context) {
	companyID := c.Query("company_id")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	if days < 1 || days > 365 {
		days = 30
	}

	stats, err := h.bookingService.GetBookingStatistics(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"period": days,
			"stats":  stats,
		},
	})
}

// GetUpcomingBookings returns upcoming bookings for a user or company
func (h *BookingHandler) GetUpcomingBookings(c *gin.Context) {
	userID, userExists := c.Get("user_id")
	companyID := c.Query("company_id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var bookings []models.Booking
	var err error

	if companyID != "" {
		// Get upcoming bookings for company
		startDate := time.Now()
		endDate := time.Now().AddDate(0, 0, 30) // Next 30 days
		bookingsWithData, queryErr := h.bookingService.GetBookingsByCompany(companyID, startDate, endDate, "confirmed")
		if queryErr != nil {
			err = queryErr
		} else {
			// Convert BookingWithCustomerData to Booking and limit results
			for i, bwd := range bookingsWithData {
				if i >= limit {
					break
				}
				bookings = append(bookings, *bwd.Booking)
			}
		}
	} else if userExists {
		// Get upcoming bookings for user
		bookings, err = h.bookingService.GetUpcomingBookings(userID.(string), limit)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not authenticated or company_id not provided"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookings,
	})
}

// GetCompanyCustomers returns all customers who made bookings/orders with the company
func (h *BookingHandler) GetCompanyCustomers(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	customers, err := h.bookingService.GetCompanyCustomers(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    customers,
		"count":   len(customers),
	})
}

// GetCustomerBookingHistory returns booking history for a specific customer
func (h *BookingHandler) GetCustomerBookingHistory(c *gin.Context) {
	companyID := c.Param("companyId")
	userID := c.Param("userId")

	if companyID == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID and User ID are required"})
		return
	}

	bookings, err := h.bookingService.GetCustomerBookingHistory(companyID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookings,
		"count":   len(bookings),
	})
}

// GetBookingsWithCustomerData returns bookings with full customer data
func (h *BookingHandler) GetBookingsWithCustomerData(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	bookings, err := h.bookingService.GetBookingsByCompany(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bookings,
		"count":   len(bookings),
	})
}

// ProcessAIBooking handles AI-assisted booking with automatic employee assignment
func (h *BookingHandler) ProcessAIBooking(c *gin.Context) {
	var req services.AIBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	req.UserID = userID.(string)

	// Process AI booking request
	response, err := h.bookingService.ProcessAIBookingRequest(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// FindAvailableEmployees returns available employees for a service at a specific time
func (h *BookingHandler) FindAvailableEmployees(c *gin.Context) {
	serviceID := c.Query("service_id")
	dateTimeStr := c.Query("date_time")

	if serviceID == "" || dateTimeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "service_id and date_time are required"})
		return
	}

	dateTime, err := time.Parse(time.RFC3339, dateTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date_time format"})
		return
	}

	employee, err := h.bookingService.FindAvailableEmployee(serviceID, dateTime)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success":  false,
			"message":  "No employees available",
			"error":    err.Error(),
			"employee": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"employee": employee,
	})
}

// GetAlternativeSlots returns alternative time slots when requested time is unavailable
func (h *BookingHandler) GetAlternativeSlots(c *gin.Context) {
	serviceID := c.Query("service_id")
	dateTimeStr := c.Query("date_time")
	daysStr := c.DefaultQuery("days", "14")

	if serviceID == "" || dateTimeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "service_id and date_time are required"})
		return
	}

	dateTime, err := time.Parse(time.RFC3339, dateTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date_time format"})
		return
	}

	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 14 // Default to 2 weeks
	}

	alternatives, err := h.bookingService.FindAlternativeSlots(serviceID, dateTime, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"alternatives": alternatives,
		"count":        len(alternatives),
	})
}

// AutoAssignBooking creates a booking with automatic employee assignment
func (h *BookingHandler) AutoAssignBooking(c *gin.Context) {
	var req services.BookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	req.UserID = userID.(string)

	// Attempt auto-assignment
	result, err := h.bookingService.AutoAssignBooking(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.Success {
		c.JSON(http.StatusCreated, gin.H{
			"success":  true,
			"booking":  result.Booking,
			"employee": result.AssignedEmployee,
			"message":  result.Message,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"success":      false,
			"message":      result.Message,
			"alternatives": result.Alternatives,
		})
	}
}

// ConfirmAlternativeBooking confirms booking for an alternative time slot
func (h *BookingHandler) ConfirmAlternativeBooking(c *gin.Context) {
	var req struct {
		ServiceID  string    `json:"service_id" binding:"required"`
		PetID      string    `json:"pet_id" binding:"required"`
		DateTime   time.Time `json:"date_time" binding:"required"`
		EmployeeID string    `json:"employee_id" binding:"required"`
		Notes      string    `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID and company ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	// Create booking request
	bookingReq := &services.BookingRequest{
		UserID:     userID.(string),
		CompanyID:  companyID.(string),
		ServiceID:  req.ServiceID,
		PetID:      req.PetID,
		EmployeeID: &req.EmployeeID,
		DateTime:   req.DateTime,
		Notes:      req.Notes,
	}

	// Create the booking
	booking, err := h.bookingService.CreateBooking(bookingReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"booking": booking,
		"message": "Alternative booking confirmed",
	})
}

// Helper methods

func (h *BookingHandler) countBookingsByStatus(bookings []models.Booking, status string) int {
	count := 0
	for _, booking := range bookings {
		if booking.Status == status {
			count++
		}
	}
	return count
}

// GetCustomerPetMedicalData returns medical data for a customer's pet
func (h *BookingHandler) GetCustomerPetMedicalData(c *gin.Context) {
	companyID := c.GetString("company_id")
	petID := c.Param("petId")

	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	petData, err := h.bookingService.GetCustomerPetMedicalData(companyID, petID)
	if err != nil {
		if err.Error() == "company does not have access to this pet" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to pet data"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pet medical data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"pet_data": petData,
	})
}

// GetCustomerPetVaccinations returns vaccination data for a customer's pet
func (h *BookingHandler) GetCustomerPetVaccinations(c *gin.Context) {
	companyID := c.GetString("company_id")
	petID := c.Param("petId")

	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	vaccinations, err := h.bookingService.GetCustomerPetVaccinations(companyID, petID)
	if err != nil {
		if err.Error() == "company does not have access to this pet" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to pet vaccinations"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pet vaccinations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"vaccinations": vaccinations,
	})
}

// GetCustomerPetMedications returns medication data for a customer's pet
func (h *BookingHandler) GetCustomerPetMedications(c *gin.Context) {
	companyID := c.GetString("company_id")
	petID := c.Param("petId")

	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	medications, err := h.bookingService.GetCustomerPetMedications(companyID, petID)
	if err != nil {
		if err.Error() == "company does not have access to this pet" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to pet medications"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pet medications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"medications": medications,
	})
}
