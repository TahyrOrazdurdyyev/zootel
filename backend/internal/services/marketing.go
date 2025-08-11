package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type MarketingService struct {
	db                  *sql.DB
	notificationService *NotificationService
}

func NewMarketingService(db *sql.DB, notificationService *NotificationService) *MarketingService {
	return &MarketingService{
		db:                  db,
		notificationService: notificationService,
	}
}

// CreateCustomerSegment creates a new customer segment
func (s *MarketingService) CreateCustomerSegment(segment *models.CustomerSegment) error {
	segment.ID = uuid.New().String()
	segment.CreatedAt = time.Now()
	segment.UpdatedAt = time.Now()

	query := `
		INSERT INTO customer_segments (
			id, name, description, segment_type, criteria, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := s.db.Exec(query,
		segment.ID, segment.Name, segment.Description, segment.SegmentType,
		segment.Criteria, segment.IsActive, segment.CreatedAt, segment.UpdatedAt,
	)
	return err
}

// GetCustomerSegments gets all customer segments
func (s *MarketingService) GetCustomerSegments() ([]*models.CustomerSegment, error) {
	query := `
		SELECT id, name, description, segment_type, criteria, is_active, created_at, updated_at
		FROM customer_segments 
		WHERE is_active = true
		ORDER BY name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var segments []*models.CustomerSegment
	for rows.Next() {
		segment := &models.CustomerSegment{}
		err := rows.Scan(
			&segment.ID, &segment.Name, &segment.Description, &segment.SegmentType,
			&segment.Criteria, &segment.IsActive, &segment.CreatedAt, &segment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		segments = append(segments, segment)
	}

	return segments, nil
}

// AssignCustomerToSegment assigns customer to segment
func (s *MarketingService) AssignCustomerToSegment(userID, segmentID string, autoAssigned bool) error {
	query := `
		INSERT INTO customer_segment_assignments (id, user_id, segment_id, assigned_at, auto_assigned)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, segment_id) DO UPDATE SET
			assigned_at = $4, auto_assigned = $5`

	_, err := s.db.Exec(query,
		uuid.New().String(), userID, segmentID, time.Now(), autoAssigned,
	)
	return err
}

// ProcessCustomerSegmentation automatically assigns customers to segments
func (s *MarketingService) ProcessCustomerSegmentation() error {
	// Get all active segments
	segments, err := s.GetCustomerSegments()
	if err != nil {
		return err
	}

	for _, segment := range segments {
		err = s.processSegment(segment)
		if err != nil {
			fmt.Printf("Error processing segment %s: %v\n", segment.Name, err)
		}
	}

	return nil
}

// processSegment processes a specific segment
func (s *MarketingService) processSegment(segment *models.CustomerSegment) error {
	var criteria map[string]interface{}
	err := json.Unmarshal([]byte(segment.Criteria), &criteria)
	if err != nil {
		return fmt.Errorf("invalid criteria: %w", err)
	}

	switch segment.SegmentType {
	case "activity":
		return s.processActivitySegment(segment.ID, criteria)
	case "purchase_volume":
		return s.processPurchaseVolumeSegment(segment.ID, criteria)
	case "pet_type":
		return s.processPetTypeSegment(segment.ID, criteria)
	case "loyalty":
		return s.processLoyaltySegment(segment.ID, criteria)
	}

	return nil
}

// processActivitySegment assigns users based on activity
func (s *MarketingService) processActivitySegment(segmentID string, criteria map[string]interface{}) error {
	minOrders, ok := criteria["min_orders"].(float64)
	if !ok {
		minOrders = 1
	}

	daysPeriod, ok := criteria["days_period"].(float64)
	if !ok {
		daysPeriod = 30
	}

	query := `
		SELECT u.id
		FROM users u
		JOIN orders o ON u.id = o.user_id
		WHERE o.created_at >= NOW() - INTERVAL '%d days'
		GROUP BY u.id
		HAVING COUNT(o.id) >= $1`

	formattedQuery := fmt.Sprintf(query, int(daysPeriod))
	rows, err := s.db.Query(formattedQuery, int(minOrders))
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		err := rows.Scan(&userID)
		if err != nil {
			continue
		}
		s.AssignCustomerToSegment(userID, segmentID, true)
	}

	return nil
}

// processPurchaseVolumeSegment assigns users based on purchase volume
func (s *MarketingService) processPurchaseVolumeSegment(segmentID string, criteria map[string]interface{}) error {
	minAmount, ok := criteria["min_amount"].(float64)
	if !ok {
		minAmount = 100
	}

	daysPeriod, ok := criteria["days_period"].(float64)
	if !ok {
		daysPeriod = 90
	}

	query := `
		SELECT u.id
		FROM users u
		JOIN orders o ON u.id = o.user_id
		WHERE o.created_at >= NOW() - INTERVAL '%d days'
		GROUP BY u.id
		HAVING SUM(o.total_amount) >= $1`

	formattedQuery := fmt.Sprintf(query, int(daysPeriod))
	rows, err := s.db.Query(formattedQuery, minAmount)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		err := rows.Scan(&userID)
		if err != nil {
			continue
		}
		s.AssignCustomerToSegment(userID, segmentID, true)
	}

	return nil
}

// processPetTypeSegment assigns users based on pet types
func (s *MarketingService) processPetTypeSegment(segmentID string, criteria map[string]interface{}) error {
	petTypes, ok := criteria["pet_types"].([]interface{})
	if !ok {
		return fmt.Errorf("pet_types not specified in criteria")
	}

	petTypeIDs := make([]string, len(petTypes))
	for i, pt := range petTypes {
		petTypeIDs[i] = pt.(string)
	}

	query := `
		SELECT DISTINCT u.id
		FROM users u
		JOIN pets p ON u.id = p.user_id
		WHERE p.pet_type_id = ANY($1)`

	rows, err := s.db.Query(query, pq.Array(petTypeIDs))
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		err := rows.Scan(&userID)
		if err != nil {
			continue
		}
		s.AssignCustomerToSegment(userID, segmentID, true)
	}

	return nil
}

// processLoyaltySegment assigns users based on loyalty metrics
func (s *MarketingService) processLoyaltySegment(segmentID string, criteria map[string]interface{}) error {
	minMonths, ok := criteria["min_months"].(float64)
	if !ok {
		minMonths = 6
	}

	minOrders, ok := criteria["min_orders"].(float64)
	if !ok {
		minOrders = 5
	}

	query := `
		SELECT u.id
		FROM users u
		JOIN orders o ON u.id = o.user_id
		WHERE u.created_at <= NOW() - INTERVAL '%d months'
		GROUP BY u.id
		HAVING COUNT(o.id) >= $1`

	formattedQuery := fmt.Sprintf(query, int(minMonths))
	rows, err := s.db.Query(formattedQuery, int(minOrders))
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		err := rows.Scan(&userID)
		if err != nil {
			continue
		}
		s.AssignCustomerToSegment(userID, segmentID, true)
	}

	return nil
}

// ProcessAbandonedCarts finds and processes abandoned carts
func (s *MarketingService) ProcessAbandonedCarts() error {
	// Find carts abandoned for more than 1 hour
	query := `
		SELECT DISTINCT sc.user_id, sc.id, u.email, u.first_name
		FROM shopping_carts sc
		JOIN users u ON sc.user_id = u.id
		WHERE sc.status = 'active'
		  AND sc.updated_at < NOW() - INTERVAL '1 hour'
		  AND sc.updated_at > NOW() - INTERVAL '7 days'
		  AND NOT EXISTS (
			  SELECT 1 FROM marketing_events me 
			  WHERE me.user_id = sc.user_id 
			    AND me.event_type = 'abandoned_cart_sent' 
			    AND me.created_at > NOW() - INTERVAL '24 hours'
		  )`

	rows, err := s.db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID, cartID, email, firstName string
		err := rows.Scan(&userID, &cartID, &email, &firstName)
		if err != nil {
			continue
		}

		// Send abandoned cart notification
		err = s.sendAbandonedCartNotification(userID, cartID, email, firstName)
		if err != nil {
			fmt.Printf("Failed to send abandoned cart notification to %s: %v\n", email, err)
		}

		// Log the event
		s.logMarketingEvent(nil, userID, "abandoned_cart_sent", map[string]interface{}{
			"cart_id": cartID,
			"email":   email,
		})
	}

	return nil
}

// sendAbandonedCartNotification sends notification for abandoned cart
func (s *MarketingService) sendAbandonedCartNotification(userID, cartID, email, firstName string) error {
	// Get cart items for personalization
	cartItems, err := s.getCartItems(cartID)
	if err != nil {
		return err
	}

	// Create notification payload
	payload := &NotificationPayload{
		Type:    "abandoned_cart",
		Title:   "You left items in your cart",
		Message: fmt.Sprintf("Hi %s! You have %d items waiting in your cart. Complete your purchase now!", firstName, len(cartItems)),
		UserID:  userID,
		Data: map[string]interface{}{
			"cart_id":    cartID,
			"item_count": len(cartItems),
			"action_url": fmt.Sprintf("/cart?cart_id=%s", cartID),
		},
	}

	return s.notificationService.SendImmediateNotification(payload, []string{"email", "push"})
}

// getCartItems gets items in a cart
func (s *MarketingService) getCartItems(cartID string) ([]map[string]interface{}, error) {
	query := `
		SELECT ci.item_id, ci.item_type, ci.quantity, ci.unit_price
		FROM cart_items ci
		WHERE ci.cart_id = $1`

	rows, err := s.db.Query(query, cartID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []map[string]interface{}
	for rows.Next() {
		var itemID, itemType string
		var quantity int
		var unitPrice float64

		err := rows.Scan(&itemID, &itemType, &quantity, &unitPrice)
		if err != nil {
			continue
		}

		items = append(items, map[string]interface{}{
			"item_id":    itemID,
			"item_type":  itemType,
			"quantity":   quantity,
			"unit_price": unitPrice,
		})
	}

	return items, nil
}

// logMarketingEvent logs a marketing event
func (s *MarketingService) logMarketingEvent(campaignID *string, userID, eventType string, data map[string]interface{}) error {
	eventData, _ := json.Marshal(data)

	query := `
		INSERT INTO marketing_events (id, campaign_id, user_id, event_type, event_data, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := s.db.Exec(query,
		uuid.New().String(), campaignID, userID, eventType, string(eventData), time.Now(),
	)
	return err
}

// GetCustomerAnalytics gets customer analytics by segments
func (s *MarketingService) GetCustomerAnalytics() (map[string]interface{}, error) {
	// Segment distribution
	segmentQuery := `
		SELECT cs.name, COUNT(csa.user_id) as customer_count
		FROM customer_segments cs
		LEFT JOIN customer_segment_assignments csa ON cs.id = csa.segment_id
		WHERE cs.is_active = true
		GROUP BY cs.id, cs.name
		ORDER BY customer_count DESC`

	segmentRows, err := s.db.Query(segmentQuery)
	if err != nil {
		return nil, err
	}
	defer segmentRows.Close()

	segments := make([]map[string]interface{}, 0)
	for segmentRows.Next() {
		var name string
		var count int
		err := segmentRows.Scan(&name, &count)
		if err != nil {
			continue
		}
		segments = append(segments, map[string]interface{}{
			"segment": name,
			"count":   count,
		})
	}

	// Marketing events summary
	eventsQuery := `
		SELECT event_type, COUNT(*) as event_count
		FROM marketing_events
		WHERE created_at >= NOW() - INTERVAL '30 days'
		GROUP BY event_type
		ORDER BY event_count DESC`

	eventsRows, err := s.db.Query(eventsQuery)
	if err != nil {
		return nil, err
	}
	defer eventsRows.Close()

	events := make([]map[string]interface{}, 0)
	for eventsRows.Next() {
		var eventType string
		var count int
		err := eventsRows.Scan(&eventType, &count)
		if err != nil {
			continue
		}
		events = append(events, map[string]interface{}{
			"event_type": eventType,
			"count":      count,
		})
	}

	return map[string]interface{}{
		"segments": segments,
		"events":   events,
	}, nil
}
