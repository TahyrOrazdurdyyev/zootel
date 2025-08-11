package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
)

type OrderService struct {
	db *sql.DB
}

func NewOrderService(db *sql.DB) *OrderService {
	return &OrderService{db: db}
}

// CreateOrderTemplate creates a template from an order for repeat purchases
func (s *OrderService) CreateOrderTemplate(userID, orderID, templateName string) error {
	// Verify user owns the order
	var orderUserID string
	err := s.db.QueryRow("SELECT user_id FROM orders WHERE id = $1", orderID).Scan(&orderUserID)
	if err != nil {
		return fmt.Errorf("order not found: %w", err)
	}

	if orderUserID != userID {
		return fmt.Errorf("unauthorized: order belongs to different user")
	}

	// Get order items
	items, err := s.getOrderItems(orderID)
	if err != nil {
		return fmt.Errorf("failed to get order items: %w", err)
	}

	// Create template items
	templateItems := make([]map[string]interface{}, len(items))
	for i, item := range items {
		templateItems[i] = map[string]interface{}{
			"product_id": item["product_id"],
			"variant_id": item["variant_id"],
			"quantity":   item["quantity"],
			"item_type":  item["item_type"],
		}
	}

	itemsJSON, err := json.Marshal(templateItems)
	if err != nil {
		return fmt.Errorf("failed to serialize items: %w", err)
	}

	template := &models.OrderTemplate{
		ID:                 uuid.New().String(),
		UserID:             userID,
		TemplateName:       templateName,
		Items:              string(itemsJSON),
		CreatedFromOrderID: &orderID,
		IsFavorite:         false,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	query := `
		INSERT INTO order_templates (
			id, user_id, template_name, items, created_from_order_id,
			is_favorite, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err = s.db.Exec(query,
		template.ID, template.UserID, template.TemplateName, template.Items,
		template.CreatedFromOrderID, template.IsFavorite,
		template.CreatedAt, template.UpdatedAt,
	)

	return err
}

// GetOrderTemplates gets user's order templates
func (s *OrderService) GetOrderTemplates(userID string) ([]*models.OrderTemplate, error) {
	query := `
		SELECT id, user_id, template_name, items, created_from_order_id,
			   is_favorite, created_at, updated_at
		FROM order_templates
		WHERE user_id = $1
		ORDER BY is_favorite DESC, created_at DESC`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []*models.OrderTemplate
	for rows.Next() {
		template := &models.OrderTemplate{}
		err := rows.Scan(
			&template.ID, &template.UserID, &template.TemplateName,
			&template.Items, &template.CreatedFromOrderID, &template.IsFavorite,
			&template.CreatedAt, &template.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// CreateOrderFromTemplate creates a new order from a template
func (s *OrderService) CreateOrderFromTemplate(userID, templateID string) (string, error) {
	// Get template
	template := &models.OrderTemplate{}
	query := `
		SELECT id, user_id, template_name, items
		FROM order_templates
		WHERE id = $1 AND user_id = $2`

	err := s.db.QueryRow(query, templateID, userID).Scan(
		&template.ID, &template.UserID, &template.TemplateName, &template.Items,
	)
	if err != nil {
		return "", fmt.Errorf("template not found: %w", err)
	}

	// Parse template items
	var items []map[string]interface{}
	err = json.Unmarshal([]byte(template.Items), &items)
	if err != nil {
		return "", fmt.Errorf("invalid template items: %w", err)
	}

	// Get or create user's cart
	cartService := NewCartService(s.db) // Assuming we have access to cart service
	cart, err := cartService.GetOrCreateCart(userID)
	if err != nil {
		return "", fmt.Errorf("failed to get cart: %w", err)
	}

	// Add items to cart
	for _, item := range items {
		cartItem := &models.CartItem{
			ID:        uuid.New().String(),
			CartID:    cart.ID,
			ItemType:  item["item_type"].(string),
			ItemID:    item["product_id"].(string),
			Quantity:  int(item["quantity"].(float64)),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Get current price
		if item["variant_id"] != nil {
			// Handle variant pricing
			variantID := item["variant_id"].(string)
			err = s.db.QueryRow("SELECT price FROM product_variants WHERE id = $1", variantID).Scan(&cartItem.UnitPrice)
		} else {
			// Handle product pricing
			err = s.db.QueryRow("SELECT price FROM products WHERE id = $1", cartItem.ItemID).Scan(&cartItem.UnitPrice)
		}

		if err != nil {
			continue // Skip items that no longer exist
		}

		cartItem.TotalPrice = cartItem.UnitPrice * float64(cartItem.Quantity)

		// Add to cart
		err = cartService.AddItemToCart(cart.ID, cartItem)
		if err != nil {
			fmt.Printf("Failed to add item to cart: %v\n", err)
		}
	}

	return cart.ID, nil
}

// ToggleFavoriteTemplate toggles favorite status of a template
func (s *OrderService) ToggleFavoriteTemplate(userID, templateID string) error {
	query := `
		UPDATE order_templates 
		SET is_favorite = NOT is_favorite, updated_at = $3
		WHERE id = $1 AND user_id = $2`

	_, err := s.db.Exec(query, templateID, userID, time.Now())
	return err
}

// GetUserOrderHistory gets comprehensive order history for user
func (s *OrderService) GetUserOrderHistory(userID string, limit, offset int) (map[string]interface{}, error) {
	// Get orders
	ordersQuery := `
		SELECT id, company_id, status, total_amount, delivery_cost,
			   estimated_delivery_date, tracking_number, created_at
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := s.db.Query(ordersQuery, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := make([]map[string]interface{}, 0)
	for rows.Next() {
		var order map[string]interface{}
		var id, companyID, status, trackingNumber sql.NullString
		var totalAmount, deliveryCost float64
		var estimatedDate sql.NullTime
		var createdAt time.Time

		err := rows.Scan(&id, &companyID, &status, &totalAmount, &deliveryCost,
			&estimatedDate, &trackingNumber, &createdAt)
		if err != nil {
			continue
		}

		order = map[string]interface{}{
			"id":            id.String,
			"company_id":    companyID.String,
			"status":        status.String,
			"total_amount":  totalAmount,
			"delivery_cost": deliveryCost,
			"created_at":    createdAt,
		}

		if estimatedDate.Valid {
			order["estimated_delivery_date"] = estimatedDate.Time
		}
		if trackingNumber.Valid {
			order["tracking_number"] = trackingNumber.String
		}

		orders = append(orders, order)
	}

	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM orders WHERE user_id = $1`
	err = s.db.QueryRow(countQuery, userID).Scan(&totalCount)
	if err != nil {
		return nil, err
	}

	// Get order statistics
	statsQuery := `
		SELECT 
			COUNT(*) as total_orders,
			SUM(total_amount) as total_spent,
			AVG(total_amount) as avg_order_value,
			MAX(created_at) as last_order_date
		FROM orders 
		WHERE user_id = $1 AND status = 'completed'`

	var stats map[string]interface{}
	var totalOrders int
	var totalSpent, avgOrderValue float64
	var lastOrderDate sql.NullTime

	err = s.db.QueryRow(statsQuery, userID).Scan(&totalOrders, &totalSpent, &avgOrderValue, &lastOrderDate)
	if err == nil {
		stats = map[string]interface{}{
			"total_orders":    totalOrders,
			"total_spent":     totalSpent,
			"avg_order_value": avgOrderValue,
		}
		if lastOrderDate.Valid {
			stats["last_order_date"] = lastOrderDate.Time
		}
	}

	return map[string]interface{}{
		"orders":      orders,
		"total_count": totalCount,
		"statistics":  stats,
	}, nil
}

// getOrderItems gets items for an order
func (s *OrderService) getOrderItems(orderID string) ([]map[string]interface{}, error) {
	// This is a simplified version - you'd need to implement proper order items tracking
	// For now, we'll assume items are stored in a JSON field or separate table
	query := `
		SELECT items FROM orders WHERE id = $1`

	var itemsJSON string
	err := s.db.QueryRow(query, orderID).Scan(&itemsJSON)
	if err != nil {
		return nil, err
	}

	var items []map[string]interface{}
	err = json.Unmarshal([]byte(itemsJSON), &items)
	if err != nil {
		return nil, err
	}

	return items, nil
}
