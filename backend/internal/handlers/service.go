package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// cleanTimeFormat extracts HH:MM:SS from various time formats
func cleanTimeFormat(timeStr string) string {
	// Handle formats like "0000-01-01T10:00:00Z:00" or "10:00:00" or "10:00"
	if strings.Contains(timeStr, "T") {
		// Extract time part after T
		parts := strings.Split(timeStr, "T")
		if len(parts) > 1 {
			timePart := parts[1]
			// Remove Z and anything after
			if strings.Contains(timePart, "Z") {
				timePart = strings.Split(timePart, "Z")[0]
			}
			// Remove extra :00 at the end if present
			if strings.HasSuffix(timePart, ":00:00") {
				timePart = strings.TrimSuffix(timePart, ":00")
			}
			return timePart
		}
	}

	// Handle HH:MM format - add :00 for seconds
	if len(timeStr) == 5 && strings.Count(timeStr, ":") == 1 {
		return timeStr + ":00"
	}

	// Already in correct format
	return timeStr
}

type ServiceHandler struct {
	serviceService *services.ServiceService
}

func NewServiceHandler(serviceService *services.ServiceService) *ServiceHandler {
	return &ServiceHandler{
		serviceService: serviceService,
	}
}

// GetCompanyServices gets all services for a company
func (h *ServiceHandler) GetCompanyServices(c *gin.Context) {
	fmt.Printf("🔍 GetCompanyServices called from %s\n", c.ClientIP())

	// Get company ID from middleware context
	companyID := c.GetString("company_id")
	if companyID == "" {
		fmt.Printf("❌ Company ID not found in context\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID not found in context"})
		return
	}

	fmt.Printf("📝 Getting services for company: %s\n", companyID)

	services, err := h.serviceService.GetCompanyServices(companyID)
	if err != nil {
		fmt.Printf("❌ GetCompanyServices service error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
		return
	}

	fmt.Printf("✅ GetCompanyServices success, returned %d services\n", len(services))
	c.JSON(http.StatusOK, gin.H{"services": services})
}

// GetServiceByID gets a specific service by ID
func (h *ServiceHandler) GetServiceByID(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	service, err := h.serviceService.GetServiceByID(serviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"service": service})
}

// CreateService creates a new service
func (h *ServiceHandler) CreateService(c *gin.Context) {
	fmt.Printf("🔍 CreateService called from %s\n", c.ClientIP())

	companyID := c.GetString("company_id")
	if companyID == "" {
		fmt.Printf("❌ Company ID not found in context\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	fmt.Printf("📝 Company ID: %s\n", companyID)

	var request struct {
		Name               string   `json:"name" binding:"required"`
		Description        string   `json:"description"`
		CategoryID         string   `json:"category_id" binding:"required"`
		PetTypes           []string `json:"pet_types"`
		Price              float64  `json:"price" binding:"required,min=0"`
		Duration           int      `json:"duration" binding:"required,min=1"`
		ImageID            *string  `json:"image_id"`
		AvailableDays      []string `json:"available_days"`
		StartTime          string   `json:"start_time"`
		EndTime            string   `json:"end_time"`
		AssignedEmployees  []string `json:"assigned_employees"`
		MaxBookingsPerSlot int      `json:"max_bookings_per_slot"`
		BufferTimeBefore   int      `json:"buffer_time_before"`
		BufferTimeAfter    int      `json:"buffer_time_after"`
		AdvanceBookingDays int      `json:"advance_booking_days"`
		CancellationPolicy string   `json:"cancellation_policy"`
		IsActive           bool     `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Printf("❌ JSON binding error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("📦 Service data received: %+v\n", request)

	service := &models.Service{
		CompanyID:   companyID,
		Name:        request.Name,
		Description: request.Description,
		CategoryID:  request.CategoryID,
		PetTypes: func() []string {
			if len(request.PetTypes) == 0 {
				return []string{"dog"} // Default to dog if no pet types selected
			}
			return request.PetTypes
		}(),
		Price:    request.Price,
		Duration: request.Duration,
		ImageID: func() string {
			if request.ImageID != nil {
				return *request.ImageID
			}
			return ""
		}(),
		ImageURL: func() string {
			if request.ImageID != nil && *request.ImageID != "" {
				// Generate image URL from image ID
				return fmt.Sprintf("/uploads/temp/%s", *request.ImageID)
			}
			return ""
		}(),
		AvailableDays: func() []string {
			if len(request.AvailableDays) == 0 {
				return []string{"monday", "tuesday", "wednesday", "thursday", "friday"} // Default weekdays
			}
			return request.AvailableDays
		}(),
		StartTime: func() string {
			if request.StartTime == "" {
				return "09:00:00" // Default start time
			}
			return request.StartTime
		}(),
		EndTime: func() string {
			if request.EndTime == "" {
				return "17:00:00" // Default end time
			}
			return request.EndTime
		}(),
		AssignedEmployees: request.AssignedEmployees,
		MaxBookingsPerSlot: func() int {
			if request.MaxBookingsPerSlot <= 0 {
				return 1 // Default to 1 booking per slot
			}
			return request.MaxBookingsPerSlot
		}(),
		BufferTimeBefore: request.BufferTimeBefore,
		BufferTimeAfter:  request.BufferTimeAfter,
		AdvanceBookingDays: func() int {
			if request.AdvanceBookingDays <= 0 {
				return 30 // Default to 30 days advance booking
			}
			return request.AdvanceBookingDays
		}(),
		CancellationPolicy: func() string {
			if request.CancellationPolicy == "" {
				return "Cancellation allowed up to 24 hours before appointment" // Default policy
			}
			return request.CancellationPolicy
		}(),
		IsActive: true, // Always create services as active
	}

	createdService, err := h.serviceService.CreateService(service)
	if err != nil {
		fmt.Printf("❌ CreateService service error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service"})
		return
	}

	fmt.Printf("✅ Service created successfully: %s\n", createdService.Name)

	c.JSON(http.StatusCreated, gin.H{"service": createdService})
}

// UpdateService updates an existing service
func (h *ServiceHandler) UpdateService(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	fmt.Printf("🔍 UpdateService called for service: %s\n", serviceID)

	// Get company ID from middleware context
	companyID := c.GetString("company_id")
	if companyID == "" {
		fmt.Printf("❌ Company ID not found in context\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID not found in context"})
		return
	}

	fmt.Printf("📝 Company ID: %s\n", companyID)

	var request struct {
		Name               string   `json:"name"`
		Description        string   `json:"description"`
		CategoryID         string   `json:"category_id"`
		PetTypes           []string `json:"pet_types"`
		Price              float64  `json:"price" binding:"min=0"`
		Duration           int      `json:"duration" binding:"min=1"`
		ImageID            *string  `json:"image_id"`
		AvailableDays      []string `json:"available_days"`
		StartTime          string   `json:"start_time"`
		EndTime            string   `json:"end_time"`
		AssignedEmployees  []string `json:"assigned_employees"`
		MaxBookingsPerSlot int      `json:"max_bookings_per_slot"`
		BufferTimeBefore   int      `json:"buffer_time_before"`
		BufferTimeAfter    int      `json:"buffer_time_after"`
		AdvanceBookingDays int      `json:"advance_booking_days"`
		CancellationPolicy string   `json:"cancellation_policy"`
		IsActive           *bool    `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing service (allow inactive services for editing)
	existingService, err := h.serviceService.GetServiceByIDForEdit(serviceID, companyID)
	if err != nil {
		fmt.Printf("❌ Service not found: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	fmt.Printf("✅ Service found for editing: %s\n", existingService.Name)

	// Update fields
	if request.Name != "" {
		existingService.Name = request.Name
	}
	if request.Description != "" {
		existingService.Description = request.Description
	}
	if request.CategoryID != "" {
		existingService.CategoryID = request.CategoryID
	}
	if request.PetTypes != nil {
		existingService.PetTypes = request.PetTypes
	}
	if request.Price > 0 {
		existingService.Price = request.Price
	}
	if request.Duration > 0 {
		existingService.Duration = request.Duration
	}
	if request.ImageID != nil {
		existingService.ImageID = *request.ImageID
		// Update ImageURL based on new ImageID
		if *request.ImageID != "" {
			existingService.ImageURL = fmt.Sprintf("/uploads/temp/%s", *request.ImageID)
			fmt.Printf("🖼️ Updated ImageURL: %s from ImageID: %s\n", existingService.ImageURL, *request.ImageID)
		} else {
			existingService.ImageURL = ""
			fmt.Printf("🖼️ Cleared ImageURL (empty ImageID)\n")
		}
	}
	if request.AvailableDays != nil {
		existingService.AvailableDays = request.AvailableDays
	}
	if request.StartTime != "" {
		// Clean time format: extract HH:MM from various formats
		cleanTime := cleanTimeFormat(request.StartTime)
		existingService.StartTime = cleanTime
		fmt.Printf("🕐 StartTime: %s -> %s\n", request.StartTime, cleanTime)
	}
	if request.EndTime != "" {
		// Clean time format: extract HH:MM from various formats
		cleanTime := cleanTimeFormat(request.EndTime)
		existingService.EndTime = cleanTime
		fmt.Printf("🕐 EndTime: %s -> %s\n", request.EndTime, cleanTime)
	}
	if request.AssignedEmployees != nil {
		existingService.AssignedEmployees = request.AssignedEmployees
	}
	if request.MaxBookingsPerSlot > 0 {
		existingService.MaxBookingsPerSlot = request.MaxBookingsPerSlot
	}
	if request.BufferTimeBefore >= 0 {
		existingService.BufferTimeBefore = request.BufferTimeBefore
	}
	if request.BufferTimeAfter >= 0 {
		existingService.BufferTimeAfter = request.BufferTimeAfter
	}
	if request.AdvanceBookingDays >= 0 {
		existingService.AdvanceBookingDays = request.AdvanceBookingDays
	}
	if request.CancellationPolicy != "" {
		existingService.CancellationPolicy = request.CancellationPolicy
	}
	if request.IsActive != nil {
		existingService.IsActive = *request.IsActive
	}

	fmt.Printf("🔄 Calling serviceService.UpdateService...\n")
	updatedService, err := h.serviceService.UpdateService(existingService)
	if err != nil {
		fmt.Printf("❌ UpdateService service error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service"})
		return
	}

	fmt.Printf("✅ Service updated successfully: %s\n", updatedService.Name)
	c.JSON(http.StatusOK, gin.H{"service": updatedService})
}

// DeleteService intelligently deletes or deactivates a service based on booking history
func (h *ServiceHandler) DeleteService(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	fmt.Printf("🔍 DeleteService called for service: %s\n", serviceID)

	// Check if service has bookings
	bookingCount, err := h.serviceService.GetServiceBookingCount(serviceID)
	if err != nil {
		fmt.Printf("❌ Failed to check booking count: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check service booking history"})
		return
	}

	fmt.Printf("📊 Service %s has %d bookings\n", serviceID, bookingCount)

	// Get action type from query parameter (default to smart)
	actionType := c.DefaultQuery("action", "smart")

	if actionType == "force_delete" {
		// Force delete (admin only - could add admin check here)
		err = h.serviceService.HardDeleteService(serviceID)
		if err != nil {
			fmt.Printf("❌ Failed to force delete service: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
			return
		}
		fmt.Printf("🗑️ Service %s force deleted\n", serviceID)
		c.JSON(http.StatusOK, gin.H{
			"message": "Service permanently deleted",
			"action":  "deleted",
		})
		return
	}

	if bookingCount > 0 {
		// Has bookings - only deactivate
		err = h.serviceService.DeactivateService(serviceID)
		if err != nil {
			fmt.Printf("❌ Failed to deactivate service: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate service"})
			return
		}
		fmt.Printf("👁️‍🗨️ Service %s deactivated (has %d bookings)\n", serviceID, bookingCount)
		c.JSON(http.StatusOK, gin.H{
			"message":       "Service deactivated successfully",
			"action":        "deactivated",
			"booking_count": bookingCount,
		})
	} else {
		// No bookings - permanently delete
		err = h.serviceService.HardDeleteService(serviceID)
		if err != nil {
			fmt.Printf("❌ Failed to delete service: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
			return
		}
		fmt.Printf("🗑️ Service %s permanently deleted (no bookings)\n", serviceID)
		c.JSON(http.StatusOK, gin.H{
			"message": "Service permanently deleted",
			"action":  "deleted",
		})
	}
}

// GetServiceAvailability gets available time slots for a service
func (h *ServiceHandler) GetServiceAvailability(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	availability, err := h.serviceService.GetServiceAvailability(serviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch availability"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"availability": availability})
}

// UpdateServiceAvailability updates service availability settings
func (h *ServiceHandler) UpdateServiceAvailability(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	var request struct {
		AvailableDays      []string `json:"available_days"`
		StartTime          string   `json:"start_time"`
		EndTime            string   `json:"end_time"`
		MaxBookingsPerSlot int      `json:"max_bookings_per_slot"`
		BufferTimeBefore   int      `json:"buffer_time_before"`
		BufferTimeAfter    int      `json:"buffer_time_after"`
		BlackoutDates      []string `json:"blackout_dates"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	availabilityData := map[string]interface{}{
		"available_days":        request.AvailableDays,
		"start_time":            request.StartTime,
		"end_time":              request.EndTime,
		"max_bookings_per_slot": request.MaxBookingsPerSlot,
		"buffer_time_before":    request.BufferTimeBefore,
		"buffer_time_after":     request.BufferTimeAfter,
		"blackout_dates":        request.BlackoutDates,
	}

	err := h.serviceService.UpdateServiceAvailability(serviceID, availabilityData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update availability"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service availability updated successfully"})
}

// AssignEmployeeToService assigns an employee to a service
func (h *ServiceHandler) AssignEmployeeToService(c *gin.Context) {
	serviceID := c.Param("serviceId")
	employeeID := c.Param("employeeId")

	if serviceID == "" || employeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID and Employee ID are required"})
		return
	}

	err := h.serviceService.AssignEmployeeToService(serviceID, employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign employee to service"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee assigned to service successfully"})
}

// RemoveEmployeeFromService removes an employee from a service
func (h *ServiceHandler) RemoveEmployeeFromService(c *gin.Context) {
	serviceID := c.Param("serviceId")
	employeeID := c.Param("employeeId")

	if serviceID == "" || employeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID and Employee ID are required"})
		return
	}

	err := h.serviceService.RemoveEmployeeFromService(serviceID, employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove employee from service"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee removed from service successfully"})
}

// GetServiceCategories gets all service categories
func (h *ServiceHandler) GetServiceCategories(c *gin.Context) {
	categories, err := h.serviceService.GetServiceCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// UploadServiceImage handles service image uploads
func (h *ServiceHandler) UploadServiceImage(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	// Get the uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Validate file type
	if !strings.HasPrefix(header.Header.Get("Content-Type"), "image/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only image files are allowed"})
		return
	}

	// Validate file size (5MB limit)
	if header.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 5MB"})
		return
	}

	// For now, we'll use a simple approach - generate a unique filename
	// In a real implementation, you'd integrate with a proper file storage service
	fileID := uuid.New().String()
	fileName := fmt.Sprintf("%s_%s", fileID, header.Filename)

	// Create uploads directory if it doesn't exist
	uploadsDir := "./uploads/services"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Save file to disk
	filePath := filepath.Join(uploadsDir, fileName)
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update service with image information
	imageURL, err := h.serviceService.UploadServiceImage(serviceID, fileID)
	if err != nil {
		// Clean up the uploaded file if database update fails
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service with image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Image uploaded successfully",
		"image_id":  fileID,
		"image_url": imageURL,
	})
}

// DeleteServiceImage handles service image deletion
func (h *ServiceHandler) DeleteServiceImage(c *gin.Context) {
	serviceID := c.Param("serviceId")
	imageID := c.Param("imageId")

	if serviceID == "" || imageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID and Image ID are required"})
		return
	}

	err := h.serviceService.DeleteServiceImage(serviceID, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Also delete the physical file
	filePath := filepath.Join("./uploads/services", fmt.Sprintf("%s_*", imageID))
	matches, _ := filepath.Glob(filePath)
	for _, match := range matches {
		os.Remove(match)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

// GetPublicServices gets publicly available services for marketplace
func (h *ServiceHandler) GetPublicServices(c *gin.Context) {
	// Query parameters
	category := c.Query("category")
	petType := c.Query("pet_type")
	location := c.Query("location")
	priceMin := c.Query("price_min")
	priceMax := c.Query("price_max")
	sortBy := c.Query("sort_by")

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	filters := map[string]interface{}{
		"category":  category,
		"pet_type":  petType,
		"location":  location,
		"price_min": priceMin,
		"price_max": priceMax,
		"sort_by":   sortBy,
		"page":      page,
		"limit":     limit,
	}

	services, total, err := h.serviceService.GetPublicServices(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"services": services,
		"pagination": gin.H{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + limit - 1) / limit,
		},
	})
}

// GetActiveDiscountServices gets services with active discounts
func (h *ServiceHandler) GetActiveDiscountServices(c *gin.Context) {
	services, err := h.serviceService.GetActiveDiscountServices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"services": services,
		"count":    len(services),
	})
}

// ExpireOutdatedSales expires sales that have passed their end date (admin only)
func (h *ServiceHandler) ExpireOutdatedSales(c *gin.Context) {
	err := h.serviceService.ExpireOutdatedSales()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Outdated sales expired successfully"})
}

// GetServiceBookingCount gets the number of bookings for a service
func (h *ServiceHandler) GetServiceBookingCount(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	fmt.Printf("🔍 GetServiceBookingCount called for service: %s\n", serviceID)

	count, err := h.serviceService.GetServiceBookingCount(serviceID)
	if err != nil {
		fmt.Printf("❌ GetServiceBookingCount error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get booking count"})
		return
	}

	fmt.Printf("✅ Service %s has %d bookings\n", serviceID, count)
	c.JSON(http.StatusOK, gin.H{
		"service_id":    serviceID,
		"booking_count": count,
		"can_delete":    count == 0,
	})
}
