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
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	services, err := h.serviceService.GetCompanyServices(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
		return
	}

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
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	service := &models.Service{
		CompanyID:   companyID,
		Name:        request.Name,
		Description: request.Description,
		CategoryID:  request.CategoryID,
		PetTypes:    request.PetTypes,
		Price:       request.Price,
		Duration:    request.Duration,
		ImageID: func() string {
			if request.ImageID != nil {
				return *request.ImageID
			}
			return ""
		}(),
		AvailableDays:      request.AvailableDays,
		StartTime:          request.StartTime,
		EndTime:            request.EndTime,
		AssignedEmployees:  request.AssignedEmployees,
		MaxBookingsPerSlot: request.MaxBookingsPerSlot,
		BufferTimeBefore:   request.BufferTimeBefore,
		BufferTimeAfter:    request.BufferTimeAfter,
		AdvanceBookingDays: request.AdvanceBookingDays,
		CancellationPolicy: request.CancellationPolicy,
		IsActive:           request.IsActive,
	}

	createdService, err := h.serviceService.CreateService(service)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"service": createdService})
}

// UpdateService updates an existing service
func (h *ServiceHandler) UpdateService(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

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

	// Get existing service
	existingService, err := h.serviceService.GetServiceByID(serviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

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
	}
	if request.AvailableDays != nil {
		existingService.AvailableDays = request.AvailableDays
	}
	if request.StartTime != "" {
		existingService.StartTime = request.StartTime
	}
	if request.EndTime != "" {
		existingService.EndTime = request.EndTime
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

	updatedService, err := h.serviceService.UpdateService(existingService)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"service": updatedService})
}

// DeleteService soft deletes a service
func (h *ServiceHandler) DeleteService(c *gin.Context) {
	serviceID := c.Param("serviceId")
	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	err := h.serviceService.DeleteService(serviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service deleted successfully"})
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
