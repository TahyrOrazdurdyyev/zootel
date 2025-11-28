package services

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type ServiceService struct {
	db *sql.DB
}

func NewServiceService(db *sql.DB) *ServiceService {
	return &ServiceService{db: db}
}

// GetCompanyServices retrieves services for a specific company
func (s *ServiceService) GetCompanyServices(companyID string) ([]*models.Service, error) {
	query := `
		SELECT id, company_id, category_id, name, description, price, duration,
		       image_url, image_id, pet_types, available_days, start_time, end_time,
		       assigned_employees, max_bookings_per_slot, buffer_time_before,
		       buffer_time_after, advance_booking_days, cancellation_policy,
		       is_active, created_at, updated_at
		FROM services 
		WHERE company_id = $1 
		ORDER BY created_at DESC`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query services: %w", err)
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		service := &models.Service{}
		err := rows.Scan(
			&service.ID, &service.CompanyID, &service.CategoryID, &service.Name,
			&service.Description, &service.Price, &service.Duration, &service.ImageURL,
			&service.ImageID, &service.PetTypes, &service.AvailableDays,
			&service.StartTime, &service.EndTime, &service.AssignedEmployees,
			&service.MaxBookingsPerSlot, &service.BufferTimeBefore, &service.BufferTimeAfter,
			&service.AdvanceBookingDays, &service.CancellationPolicy, &service.IsActive,
			&service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan service: %w", err)
		}
		services = append(services, service)
	}

	return services, nil
}

// GetServicesByCompany retrieves services by company ID
func (s *ServiceService) GetServicesByCompany(companyID string) ([]*models.Service, error) {
	query := `
		SELECT id, company_id, category_id, name, description, price, original_price,
		       discount_percentage, is_on_sale, sale_start_date, sale_end_date, duration,
		       image_url, image_id, pet_types, available_days, start_time, end_time,
		       assigned_employees, max_bookings_per_slot, buffer_time_before,
		       buffer_time_after, advance_booking_days, cancellation_policy,
		       is_active, created_at, updated_at
		FROM services 
		WHERE company_id = $1 
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query services: %w", err)
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		service := &models.Service{}
		err := rows.Scan(
			&service.ID, &service.CompanyID, &service.CategoryID, &service.Name,
			&service.Description, &service.Price, &service.OriginalPrice,
			&service.DiscountPercentage, &service.IsOnSale, &service.SaleStartDate, &service.SaleEndDate,
			&service.Duration, &service.ImageURL, &service.ImageID, pq.Array(&service.PetTypes),
			pq.Array(&service.AvailableDays), &service.StartTime, &service.EndTime,
			pq.Array(&service.AssignedEmployees), &service.MaxBookingsPerSlot,
			&service.BufferTimeBefore, &service.BufferTimeAfter, &service.AdvanceBookingDays,
			&service.CancellationPolicy, &service.IsActive, &service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan service: %w", err)
		}
		services = append(services, service)
	}

	return services, nil
}

// GetServiceByID retrieves a service by ID
func (s *ServiceService) GetServiceByID(serviceID string) (*models.Service, error) {
	service := &models.Service{}

	query := `
		SELECT id, company_id, category_id, name, description, price, original_price,
		       discount_percentage, is_on_sale, sale_start_date, sale_end_date, duration,
		       image_url, image_id, pet_types, available_days, start_time, end_time,
		       assigned_employees, max_bookings_per_slot, buffer_time_before,
		       buffer_time_after, advance_booking_days, cancellation_policy,
		       is_active, created_at, updated_at
		FROM services 
		WHERE id = $1 AND is_active = true
	`

	err := s.db.QueryRow(query, serviceID).Scan(
		&service.ID, &service.CompanyID, &service.CategoryID, &service.Name,
		&service.Description, &service.Price, &service.OriginalPrice,
		&service.DiscountPercentage, &service.IsOnSale, &service.SaleStartDate, &service.SaleEndDate,
		&service.Duration, &service.ImageURL, &service.ImageID, pq.Array(&service.PetTypes),
		pq.Array(&service.AvailableDays), &service.StartTime, &service.EndTime,
		pq.Array(&service.AssignedEmployees), &service.MaxBookingsPerSlot,
		&service.BufferTimeBefore, &service.BufferTimeAfter, &service.AdvanceBookingDays,
		&service.CancellationPolicy, &service.IsActive, &service.CreatedAt, &service.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get service: %w", err)
	}

	return service, nil
}

// GetServiceByIDForEdit retrieves a service by ID for editing (allows inactive services)
func (s *ServiceService) GetServiceByIDForEdit(serviceID, companyID string) (*models.Service, error) {
	service := &models.Service{}

	query := `
		SELECT id, company_id, category_id, name, description, price, original_price,
		       discount_percentage, is_on_sale, sale_start_date, sale_end_date, duration,
		       image_url, image_id, pet_types, available_days, start_time, end_time,
		       assigned_employees, max_bookings_per_slot, buffer_time_before,
		       buffer_time_after, advance_booking_days, cancellation_policy,
		       is_active, created_at, updated_at
		FROM services 
		WHERE id = $1 AND company_id = $2`

	err := s.db.QueryRow(query, serviceID, companyID).Scan(
		&service.ID, &service.CompanyID, &service.CategoryID, &service.Name,
		&service.Description, &service.Price, &service.OriginalPrice,
		&service.DiscountPercentage, &service.IsOnSale, &service.SaleStartDate, &service.SaleEndDate,
		&service.Duration, &service.ImageURL, &service.ImageID, &service.PetTypes,
		&service.AvailableDays, &service.StartTime, &service.EndTime,
		&service.AssignedEmployees, &service.MaxBookingsPerSlot,
		&service.BufferTimeBefore, &service.BufferTimeAfter, &service.AdvanceBookingDays,
		&service.CancellationPolicy, &service.IsActive, &service.CreatedAt, &service.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get service: %w", err)
	}

	return service, nil
}

// GetPublicServices retrieves publicly available services for marketplace
func (s *ServiceService) GetPublicServices(filters map[string]interface{}) ([]*models.Service, int, error) {
	baseQuery := `
		SELECT s.id, s.company_id, s.category_id, s.name, s.description, s.price, s.original_price,
		       s.discount_percentage, s.is_on_sale, s.sale_start_date, s.sale_end_date, s.duration,
		       s.image_url, s.image_id, s.pet_types, s.available_days, s.start_time, s.end_time,
		       s.assigned_employees, s.max_bookings_per_slot, s.buffer_time_before,
		       s.buffer_time_after, s.advance_booking_days, s.cancellation_policy,
		       s.is_active, s.created_at, s.updated_at
		FROM services s
		JOIN companies c ON s.company_id = c.id
		WHERE s.is_active = true AND c.is_active = true AND c.publish_to_marketplace = true`

	countQuery := `
		SELECT COUNT(*)
		FROM services s
		JOIN companies c ON s.company_id = c.id
		WHERE s.is_active = true AND c.is_active = true AND c.publish_to_marketplace = true`

	args := []interface{}{}
	argIndex := 1

	// Add filters
	if categoryID, ok := filters["category_id"].(string); ok && categoryID != "" {
		baseQuery += fmt.Sprintf(" AND s.category_id = $%d", argIndex)
		countQuery += fmt.Sprintf(" AND s.category_id = $%d", argIndex)
		args = append(args, categoryID)
		argIndex++
	}

	if petType, ok := filters["pet_type"].(string); ok && petType != "" {
		baseQuery += fmt.Sprintf(" AND $%d = ANY(s.pet_types)", argIndex)
		countQuery += fmt.Sprintf(" AND $%d = ANY(s.pet_types)", argIndex)
		args = append(args, petType)
		argIndex++
	}

	if location, ok := filters["location"].(string); ok && location != "" {
		baseQuery += fmt.Sprintf(" AND c.city ILIKE $%d", argIndex)
		countQuery += fmt.Sprintf(" AND c.city ILIKE $%d", argIndex)
		args = append(args, "%"+location+"%")
		argIndex++
	}

	// Get total count
	var totalCount int
	err := s.db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %w", err)
	}

	// Add pagination
	limit := 20
	offset := 0
	if l, ok := filters["limit"].(int); ok && l > 0 {
		limit = l
	}
	if o, ok := filters["offset"].(int); ok && o >= 0 {
		offset = o
	}

	baseQuery += " ORDER BY s.created_at DESC"
	baseQuery += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	rows, err := s.db.Query(baseQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query public services: %w", err)
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		service := &models.Service{}
		
		// Initialize arrays to avoid nil pointer issues
		service.PetTypes = pq.StringArray{}
		service.AvailableDays = pq.StringArray{}
		service.AssignedEmployees = pq.StringArray{}
		
		err := rows.Scan(
			&service.ID, &service.CompanyID, &service.CategoryID, &service.Name,
			&service.Description, &service.Price, &service.OriginalPrice,
			&service.DiscountPercentage, &service.IsOnSale, &service.SaleStartDate, &service.SaleEndDate,
			&service.Duration, &service.ImageURL, &service.ImageID, pq.Array(&service.PetTypes),
			pq.Array(&service.AvailableDays), &service.StartTime, &service.EndTime,
			pq.Array(&service.AssignedEmployees), &service.MaxBookingsPerSlot,
			&service.BufferTimeBefore, &service.BufferTimeAfter, &service.AdvanceBookingDays,
			&service.CancellationPolicy, &service.IsActive, &service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("❌ Failed to scan service %s: %v\n", service.ID, err)
			continue // Skip this service instead of failing completely
		}
		services = append(services, service)
	}

	return services, totalCount, nil
}

// CreateService creates a new service
func (s *ServiceService) CreateService(service *models.Service) (*models.Service, error) {
	service.ID = uuid.New().String()
	service.CreatedAt = time.Now()
	service.UpdatedAt = time.Now()

	// Calculate discount price if on sale
	if service.IsOnSale && service.DiscountPercentage != nil && service.OriginalPrice != nil {
		discountAmount := (*service.OriginalPrice) * (float64(*service.DiscountPercentage) / 100.0)
		service.Price = (*service.OriginalPrice) - discountAmount
	}

	query := `
		INSERT INTO services (
			id, company_id, category_id, name, description, price, original_price,
			discount_percentage, is_on_sale, sale_start_date, sale_end_date, duration,
			image_url, image_id, pet_types, available_days, start_time, end_time,
			assigned_employees, max_bookings_per_slot, buffer_time_before,
			buffer_time_after, advance_booking_days, cancellation_policy,
			is_active, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
		)
	`

	_, err := s.db.Exec(query,
		service.ID, service.CompanyID, service.CategoryID, service.Name,
		service.Description, service.Price, service.OriginalPrice,
		service.DiscountPercentage, service.IsOnSale, service.SaleStartDate, service.SaleEndDate,
		service.Duration, service.ImageURL, service.ImageID, pq.Array(service.PetTypes),
		pq.Array(service.AvailableDays), service.StartTime, service.EndTime,
		pq.Array(service.AssignedEmployees), service.MaxBookingsPerSlot,
		service.BufferTimeBefore, service.BufferTimeAfter, service.AdvanceBookingDays,
		service.CancellationPolicy, service.IsActive, service.CreatedAt, service.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create service: %w", err)
	}

	return service, nil
}

// UpdateService updates a service
func (s *ServiceService) UpdateService(service *models.Service) (*models.Service, error) {
	service.UpdatedAt = time.Now()

	// Generate ImageURL from ImageID if ImageID is provided
	if service.ImageID != "" && service.ImageURL == "" {
		service.ImageURL = fmt.Sprintf("https://zootel.shop/uploads/temp/%s", service.ImageID)
		fmt.Printf("🖼️ Generated ImageURL: %s from ImageID: %s\n", service.ImageURL, service.ImageID)
	}

	fmt.Printf("📝 Updating service: %s (ID: %s)\n", service.Name, service.ID)
	fmt.Printf("🖼️ ImageID: %s, ImageURL: %s\n", service.ImageID, service.ImageURL)

	// Calculate discount price if on sale
	if service.IsOnSale && service.DiscountPercentage != nil && service.OriginalPrice != nil {
		discountAmount := (*service.OriginalPrice) * (float64(*service.DiscountPercentage) / 100.0)
		service.Price = (*service.OriginalPrice) - discountAmount
	}

	query := `
		UPDATE services SET
			category_id = $2, name = $3, description = $4, price = $5, original_price = $6,
			discount_percentage = $7, is_on_sale = $8, sale_start_date = $9, sale_end_date = $10,
			duration = $11, image_url = $12, image_id = $13, pet_types = $14, available_days = $15,
			start_time = $16, end_time = $17, assigned_employees = $18, max_bookings_per_slot = $19,
			buffer_time_before = $20, buffer_time_after = $21, advance_booking_days = $22,
			cancellation_policy = $23, is_active = $24, updated_at = $25
		WHERE id = $1
	`

	_, err := s.db.Exec(query,
		service.ID, service.CategoryID, service.Name, service.Description,
		service.Price, service.OriginalPrice, service.DiscountPercentage, service.IsOnSale,
		service.SaleStartDate, service.SaleEndDate, service.Duration, service.ImageURL,
		service.ImageID, service.PetTypes, service.AvailableDays,
		service.StartTime, service.EndTime, service.AssignedEmployees,
		service.MaxBookingsPerSlot, service.BufferTimeBefore, service.BufferTimeAfter,
		service.AdvanceBookingDays, service.CancellationPolicy, service.IsActive, service.UpdatedAt)

	if err != nil {
		fmt.Printf("❌ Database update error: %v\n", err)
		return nil, fmt.Errorf("failed to update service: %w", err)
	}

	fmt.Printf("✅ Service updated in database successfully\n")

	return service, nil
}

// DeleteService deletes a service
func (s *ServiceService) DeleteService(serviceID string) error {
	// First check if service has active bookings
	var bookingCount int
	checkQuery := `SELECT COUNT(*) FROM bookings WHERE service_id = $1 AND status IN ('pending', 'confirmed', 'in_progress')`
	err := s.db.QueryRow(checkQuery, serviceID).Scan(&bookingCount)
	if err != nil {
		return fmt.Errorf("failed to check active bookings: %w", err)
	}

	if bookingCount > 0 {
		return fmt.Errorf("cannot delete service with active bookings")
	}

	// Soft delete by setting is_active to false
	query := `UPDATE services SET is_active = false, updated_at = $2 WHERE id = $1`
	result, err := s.db.Exec(query, serviceID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to delete service: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("service not found")
	}

	return nil
}

// GetServiceAvailability gets service availability
func (s *ServiceService) GetServiceAvailability(serviceID string) (interface{}, error) {
	// Get service details for availability calculation
	service, err := s.GetServiceByID(serviceID)
	if err != nil {
		return nil, err
	}

	// Get assigned employees
	employeeQuery := `
		SELECT id, name, work_schedule 
		FROM employees 
		WHERE id = ANY($1) AND is_active = true`

	rows, err := s.db.Query(employeeQuery, pq.Array(service.AssignedEmployees))
	if err != nil {
		return nil, fmt.Errorf("failed to get employees: %w", err)
	}
	defer rows.Close()

	employees := []map[string]interface{}{}
	for rows.Next() {
		var id, name, schedule string
		if err := rows.Scan(&id, &name, &schedule); err != nil {
			continue
		}
		employees = append(employees, map[string]interface{}{
			"id":            id,
			"name":          name,
			"work_schedule": schedule,
		})
	}

	return map[string]interface{}{
		"service_id":            service.ID,
		"available_days":        service.AvailableDays,
		"start_time":            service.StartTime,
		"end_time":              service.EndTime,
		"duration":              service.Duration,
		"max_bookings_per_slot": service.MaxBookingsPerSlot,
		"buffer_time_before":    service.BufferTimeBefore,
		"buffer_time_after":     service.BufferTimeAfter,
		"advance_booking_days":  service.AdvanceBookingDays,
		"assigned_employees":    employees,
	}, nil
}

// UpdateServiceAvailability updates service availability
func (s *ServiceService) UpdateServiceAvailability(serviceID string, availability interface{}) error {
	availMap, ok := availability.(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid availability data format")
	}

	query := `
		UPDATE services SET
			available_days = $2,
			start_time = $3,
			end_time = $4,
			max_bookings_per_slot = $5,
			buffer_time_before = $6,
			buffer_time_after = $7,
			advance_booking_days = $8,
			updated_at = $9
		WHERE id = $1`

	_, err := s.db.Exec(
		query,
		serviceID,
		pq.Array(availMap["available_days"]),
		availMap["start_time"],
		availMap["end_time"],
		availMap["max_bookings_per_slot"],
		availMap["buffer_time_before"],
		availMap["buffer_time_after"],
		availMap["advance_booking_days"],
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to update service availability: %w", err)
	}

	return nil
}

// AssignEmployeeToService assigns an employee to a service
func (s *ServiceService) AssignEmployeeToService(serviceID, employeeID string) error {
	// Get current assigned employees
	service, err := s.GetServiceByID(serviceID)
	if err != nil {
		return err
	}

	// Check if employee is already assigned
	for _, id := range service.AssignedEmployees {
		if id == employeeID {
			return fmt.Errorf("employee already assigned to service")
		}
	}

	// Add employee to the list
	newEmployees := append(service.AssignedEmployees, employeeID)

	query := `UPDATE services SET assigned_employees = $2, updated_at = $3 WHERE id = $1`
	_, err = s.db.Exec(query, serviceID, pq.Array(newEmployees), time.Now())
	if err != nil {
		return fmt.Errorf("failed to assign employee: %w", err)
	}

	return nil
}

// RemoveEmployeeFromService removes an employee from a service
func (s *ServiceService) RemoveEmployeeFromService(serviceID, employeeID string) error {
	// Get current assigned employees
	service, err := s.GetServiceByID(serviceID)
	if err != nil {
		return err
	}

	// Remove employee from the list
	newEmployees := []string{}
	for _, id := range service.AssignedEmployees {
		if id != employeeID {
			newEmployees = append(newEmployees, id)
		}
	}

	query := `UPDATE services SET assigned_employees = $2, updated_at = $3 WHERE id = $1`
	_, err = s.db.Exec(query, serviceID, pq.Array(newEmployees), time.Now())
	if err != nil {
		return fmt.Errorf("failed to remove employee: %w", err)
	}

	return nil
}

// GetServiceCategories gets all service categories
func (s *ServiceService) GetServiceCategories() ([]*models.ServiceCategory, error) {
	query := `
		SELECT id, name, description, icon_name, created_at, updated_at
		FROM service_categories 
		ORDER BY name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query service categories: %w", err)
	}
	defer rows.Close()

	var categories []*models.ServiceCategory
	for rows.Next() {
		category := &models.ServiceCategory{}
		err := rows.Scan(
			&category.ID, &category.Name, &category.Description,
			&category.IconName, &category.CreatedAt, &category.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan service category: %w", err)
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// GetServiceBookingCount returns the number of bookings for a service
func (s *ServiceService) GetServiceBookingCount(serviceID string) (int, error) {
	query := `
		SELECT COUNT(*) 
		FROM bookings 
		WHERE service_id = $1`

	var count int
	err := s.db.QueryRow(query, serviceID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get booking count: %w", err)
	}

	return count, nil
}

// DeactivateService sets a service as inactive (soft delete)
func (s *ServiceService) DeactivateService(serviceID string) error {
	query := `
		UPDATE services 
		SET is_active = false, updated_at = NOW() 
		WHERE id = $1`

	result, err := s.db.Exec(query, serviceID)
	if err != nil {
		return fmt.Errorf("failed to deactivate service: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("service not found")
	}

	return nil
}

// HardDeleteService permanently deletes a service from database
func (s *ServiceService) HardDeleteService(serviceID string) error {
	// Start a transaction to ensure data integrity
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete related records first (if any)
	// Note: We should only call this when there are no bookings

	// TODO: Delete service images when service_images table exists
	// _, err = tx.Exec("DELETE FROM service_images WHERE service_id = $1", serviceID)
	// if err != nil {
	//     return fmt.Errorf("failed to delete service images: %w", err)
	// }

	// Delete the service
	result, err := tx.Exec("DELETE FROM services WHERE id = $1", serviceID)
	if err != nil {
		return fmt.Errorf("failed to delete service: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("service not found")
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// UploadServiceImage uploads an image for a service
func (s *ServiceService) UploadServiceImage(serviceID string, file interface{}) (string, error) {
	// This would typically be handled by the UploadService
	// For now, we'll update the service with the uploaded image ID

	// Validate that service exists
	_, err := s.GetServiceByID(serviceID)
	if err != nil {
		return "", fmt.Errorf("service not found: %w", err)
	}

	// In a real implementation, file would be processed by UploadService
	// For now, we expect file to be the file ID from a previous upload
	var imageID string
	var imageURL string

	if fileID, ok := file.(string); ok {
		imageID = fileID
		// Generate URL based on file ID (this would typically come from UploadService)
		imageURL = fmt.Sprintf("/uploads/services/%s", fileID)
	} else {
		return "", fmt.Errorf("invalid file data")
	}

	// Update service with new image
	query := `UPDATE services SET image_id = $2, image_url = $3, updated_at = $4 WHERE id = $1`
	_, err = s.db.Exec(query, serviceID, imageID, imageURL, time.Now())
	if err != nil {
		return "", fmt.Errorf("failed to update service image: %w", err)
	}

	return imageURL, nil
}

// DeleteServiceImage deletes an image for a service
func (s *ServiceService) DeleteServiceImage(serviceID, imageID string) error {
	// Validate that service exists
	service, err := s.GetServiceByID(serviceID)
	if err != nil {
		return fmt.Errorf("service not found: %w", err)
	}

	// Check if the image belongs to this service
	if service.ImageID != imageID {
		return fmt.Errorf("image does not belong to this service")
	}

	// Clear image from service
	query := `UPDATE services SET image_id = '', image_url = '', updated_at = $2 WHERE id = $1`
	_, err = s.db.Exec(query, serviceID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to remove service image: %w", err)
	}

	// Note: In a real implementation, you would also delete the actual file
	// This would be handled by the UploadService or file storage service

	return nil
}

// ExpireOutdatedSales expires sales that have passed their end date
func (s *ServiceService) ExpireOutdatedSales() error {
	query := `
		UPDATE services 
		SET is_on_sale = false, 
		    price = COALESCE(original_price, price),
		    updated_at = CURRENT_TIMESTAMP
		WHERE is_on_sale = true 
		  AND sale_end_date IS NOT NULL 
		  AND sale_end_date < CURRENT_TIMESTAMP
	`

	result, err := s.db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to expire outdated sales: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		fmt.Printf("Expired %d outdated sales\n", rowsAffected)
	}

	return nil
}

// GetActiveDiscountServices returns services with active discounts
func (s *ServiceService) GetActiveDiscountServices() ([]*models.Service, error) {
	query := `
		SELECT id, company_id, category_id, name, description, price, original_price,
		       discount_percentage, is_on_sale, sale_start_date, sale_end_date, duration,
		       image_url, image_id, pet_types, available_days, start_time, end_time,
		       assigned_employees, max_bookings_per_slot, buffer_time_before,
		       buffer_time_after, advance_booking_days, cancellation_policy,
		       is_active, created_at, updated_at
		FROM services 
		WHERE is_on_sale = true 
		  AND is_active = true
		  AND (sale_end_date IS NULL OR sale_end_date > CURRENT_TIMESTAMP)
		  AND (sale_start_date IS NULL OR sale_start_date <= CURRENT_TIMESTAMP)
		ORDER BY discount_percentage DESC, created_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query discount services: %w", err)
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		service := &models.Service{}
		err := rows.Scan(
			&service.ID, &service.CompanyID, &service.CategoryID, &service.Name,
			&service.Description, &service.Price, &service.OriginalPrice,
			&service.DiscountPercentage, &service.IsOnSale, &service.SaleStartDate, &service.SaleEndDate,
			&service.Duration, &service.ImageURL, &service.ImageID, pq.Array(&service.PetTypes),
			pq.Array(&service.AvailableDays), &service.StartTime, &service.EndTime,
			pq.Array(&service.AssignedEmployees), &service.MaxBookingsPerSlot,
			&service.BufferTimeBefore, &service.BufferTimeAfter, &service.AdvanceBookingDays,
			&service.CancellationPolicy, &service.IsActive, &service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan discount service: %w", err)
		}
		services = append(services, service)
	}

	return services, nil
}

// GetCompanyPublicServices gets public services for a specific company
func (s *ServiceService) GetCompanyPublicServices(companyID string, limit, offset int, categoryID string) ([]*models.Service, int, error) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	// Base conditions
	conditions = append(conditions, "company_id = $1", "is_active = true")
	args = append(args, companyID)
	argIndex++

	// Add category filter if provided
	if categoryID != "" {
		conditions = append(conditions, fmt.Sprintf("category_id = $%d", argIndex))
		args = append(args, categoryID)
		argIndex++
	}

	whereClause := "WHERE " + strings.Join(conditions, " AND ")

	// Count total results
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM services %s", whereClause)
	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count services: %w", err)
	}

	// Get services with pagination
	query := fmt.Sprintf(`
		SELECT id, company_id, category_id, name, description, price, original_price,
			   discount_percentage, is_on_sale, sale_start_date, sale_end_date, duration,
			   image_url, image_id, pet_types, available_days, start_time, end_time,
			   assigned_employees, max_bookings_per_slot, buffer_time_before,
			   buffer_time_after, advance_booking_days, cancellation_policy,
			   is_active, created_at, updated_at
		FROM services 
		%s
		ORDER BY is_on_sale DESC, discount_percentage DESC NULLS LAST, name ASC
		LIMIT $%d OFFSET $%d`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query services: %w", err)
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		service := &models.Service{}
		err := rows.Scan(
			&service.ID, &service.CompanyID, &service.CategoryID, &service.Name,
			&service.Description, &service.Price, &service.OriginalPrice,
			&service.DiscountPercentage, &service.IsOnSale, &service.SaleStartDate, &service.SaleEndDate,
			&service.Duration, &service.ImageURL, &service.ImageID, pq.Array(&service.PetTypes),
			pq.Array(&service.AvailableDays), &service.StartTime, &service.EndTime,
			pq.Array(&service.AssignedEmployees), &service.MaxBookingsPerSlot,
			&service.BufferTimeBefore, &service.BufferTimeAfter, &service.AdvanceBookingDays,
			&service.CancellationPolicy, &service.IsActive, &service.CreatedAt, &service.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan service: %w", err)
		}
		services = append(services, service)
	}

	return services, total, nil
}

// GetAllCategories gets all service categories
func (s *ServiceService) GetAllCategories() ([]*models.ServiceCategory, error) {
	query := `
		SELECT id, name, description, icon, background_image, created_at, updated_at
		FROM service_categories 
		ORDER BY name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query categories: %w", err)
	}
	defer rows.Close()

	var categories []*models.ServiceCategory
	for rows.Next() {
		category := &models.ServiceCategory{}
		var description, backgroundImage sql.NullString
		err := rows.Scan(
			&category.ID, &category.Name, &description, &category.Icon, &backgroundImage, &category.CreatedAt, &category.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		if description.Valid {
			category.Description = description.String
		}
		if backgroundImage.Valid {
			category.BackgroundImage = backgroundImage.String
		}
		categories = append(categories, category)
	}

	return categories, nil
}
