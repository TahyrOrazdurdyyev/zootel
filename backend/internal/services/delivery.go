package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
)

type DeliveryService struct {
	db *sql.DB
}

func NewDeliveryService(db *sql.DB) *DeliveryService {
	return &DeliveryService{db: db}
}

// GetDeliveryMethods gets available delivery methods
func (s *DeliveryService) GetDeliveryMethods(companyID *string) ([]*models.DeliveryMethod, error) {
	query := `
		SELECT id, company_id, name, description, method_type, base_price,
			   price_per_km, free_delivery_threshold, estimated_delivery_days,
			   is_active, availability_zones, working_hours, created_at, updated_at
		FROM delivery_methods 
		WHERE (company_id = $1 OR company_id IS NULL) AND is_active = true
		ORDER BY base_price ASC`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var methods []*models.DeliveryMethod
	for rows.Next() {
		method := &models.DeliveryMethod{}
		err := rows.Scan(
			&method.ID, &method.CompanyID, &method.Name, &method.Description,
			&method.MethodType, &method.BasePrice, &method.PricePerKm,
			&method.FreeDeliveryThreshold, &method.EstimatedDeliveryDays,
			&method.IsActive, &method.AvailabilityZones, &method.WorkingHours,
			&method.CreatedAt, &method.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		methods = append(methods, method)
	}

	return methods, nil
}

// CreateDeliveryMethod creates a new delivery method for company
func (s *DeliveryService) CreateDeliveryMethod(method *models.DeliveryMethod) error {
	method.ID = uuid.New().String()
	method.CreatedAt = time.Now()
	method.UpdatedAt = time.Now()

	query := `
		INSERT INTO delivery_methods (
			id, company_id, name, description, method_type, base_price,
			price_per_km, free_delivery_threshold, estimated_delivery_days,
			is_active, availability_zones, working_hours, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	_, err := s.db.Exec(query,
		method.ID, method.CompanyID, method.Name, method.Description,
		method.MethodType, method.BasePrice, method.PricePerKm,
		method.FreeDeliveryThreshold, method.EstimatedDeliveryDays,
		method.IsActive, method.AvailabilityZones, method.WorkingHours,
		method.CreatedAt, method.UpdatedAt,
	)
	return err
}

// CalculateDeliveryPrice calculates delivery cost
func (s *DeliveryService) CalculateDeliveryPrice(methodID string, distance float64, orderTotal float64) (float64, error) {
	method := &models.DeliveryMethod{}
	query := `
		SELECT base_price, price_per_km, free_delivery_threshold
		FROM delivery_methods 
		WHERE id = $1 AND is_active = true`

	err := s.db.QueryRow(query, methodID).Scan(
		&method.BasePrice, &method.PricePerKm, &method.FreeDeliveryThreshold,
	)
	if err != nil {
		return 0, fmt.Errorf("delivery method not found: %w", err)
	}

	// Check if free delivery applies
	if method.FreeDeliveryThreshold != nil && orderTotal >= *method.FreeDeliveryThreshold {
		return 0, nil
	}

	// Calculate price
	totalPrice := method.BasePrice + (distance * method.PricePerKm)
	return totalPrice, nil
}

// EstimateDeliveryDate estimates delivery date
func (s *DeliveryService) EstimateDeliveryDate(methodID string) (*time.Time, error) {
	var days int
	query := `SELECT estimated_delivery_days FROM delivery_methods WHERE id = $1`

	err := s.db.QueryRow(query, methodID).Scan(&days)
	if err != nil {
		return nil, err
	}

	// Add business days (skip weekends)
	deliveryDate := s.addBusinessDays(time.Now(), days)
	return &deliveryDate, nil
}

// addBusinessDays adds business days to a date (skips weekends)
func (s *DeliveryService) addBusinessDays(start time.Time, days int) time.Time {
	current := start
	added := 0

	for added < days {
		current = current.AddDate(0, 0, 1)
		// Skip weekends
		if current.Weekday() != time.Saturday && current.Weekday() != time.Sunday {
			added++
		}
	}

	return current
}

// UpdateDeliveryTracking updates order tracking information
func (s *DeliveryService) UpdateDeliveryTracking(orderID, trackingNumber string, status string) error {
	query := `
		UPDATE orders 
		SET tracking_number = $2, status = $3, updated_at = $4
		WHERE id = $1`

	_, err := s.db.Exec(query, orderID, trackingNumber, status, time.Now())
	return err
}

// GetOrderDeliveryInfo gets delivery information for an order
func (s *DeliveryService) GetOrderDeliveryInfo(orderID string) (map[string]interface{}, error) {
	query := `
		SELECT o.delivery_method_id, o.delivery_address, o.delivery_cost,
			   o.estimated_delivery_date, o.tracking_number, o.delivery_notes,
			   dm.name as method_name, dm.method_type
		FROM orders o
		LEFT JOIN delivery_methods dm ON o.delivery_method_id = dm.id
		WHERE o.id = $1`

	var methodID, deliveryAddress, trackingNumber, deliveryNotes sql.NullString
	var methodName, methodType sql.NullString
	var deliveryCost float64
	var estimatedDate sql.NullTime

	err := s.db.QueryRow(query, orderID).Scan(
		&methodID, &deliveryAddress, &deliveryCost, &estimatedDate,
		&trackingNumber, &deliveryNotes, &methodName, &methodType,
	)
	if err != nil {
		return nil, err
	}

	result := map[string]interface{}{
		"delivery_cost": deliveryCost,
	}

	if methodID.Valid {
		result["delivery_method_id"] = methodID.String
	}
	if deliveryAddress.Valid {
		var addr map[string]interface{}
		json.Unmarshal([]byte(deliveryAddress.String), &addr)
		result["delivery_address"] = addr
	}
	if estimatedDate.Valid {
		result["estimated_delivery_date"] = estimatedDate.Time
	}
	if trackingNumber.Valid {
		result["tracking_number"] = trackingNumber.String
	}
	if deliveryNotes.Valid {
		result["delivery_notes"] = deliveryNotes.String
	}
	if methodName.Valid {
		result["method_name"] = methodName.String
		result["method_type"] = methodType.String
	}

	return result, nil
}
