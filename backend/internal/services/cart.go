package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

// CartServiceInterface defines the cart service interface
type CartServiceInterface interface {
	// Cart management
	GetOrCreateCart(userID string) (*models.ShoppingCart, error)
	GetCartByID(cartID string) (*models.ShoppingCart, error)
	AddItemToCart(cartID string, item *models.CartItem) error
	UpdateCartItem(cartID, itemID string, quantity int) error
	RemoveItemFromCart(cartID, itemID string) error
	ClearCart(cartID string) error

	// Cart calculations
	CalculateCartTotal(cartID string) (*models.CartTotal, error)
	ApplyDiscountCode(cartID, discountCode string) error
	RemoveDiscountCode(cartID string) error

	// Saved items (wishlist)
	AddToSavedItems(userID string, item *models.SavedItem) error
	GetSavedItems(userID string) ([]models.SavedItem, error)
	RemoveFromSavedItems(userID, itemID string) error
	MoveToCart(userID, savedItemID string) error

	// Cart abandonment
	MarkCartAsAbandoned(cartID string) error
	GetAbandonedCarts(limit int) ([]models.CartAbandonment, error)
	SendRecoveryEmail(cartID string) error
}

// CartService handles cart-related business logic
type CartService struct {
	db *sql.DB
}

// NewCartService creates a new cart service
func NewCartService(db *sql.DB) CartServiceInterface {
	return &CartService{db: db}
}

// GetOrCreateCart gets existing cart or creates new one
func (s *CartService) GetOrCreateCart(userID string) (*models.ShoppingCart, error) {
	// Try to get existing active cart
	cart := &models.ShoppingCart{}
	err := s.db.QueryRow(`
		SELECT id, user_id, status, expires_at, created_at, updated_at
		FROM shopping_carts 
		WHERE user_id = $1 AND status = 'active'
		ORDER BY created_at DESC
		LIMIT 1
	`, userID).Scan(
		&cart.ID,
		&cart.UserID,
		&cart.Status,
		&cart.ExpiresAt,
		&cart.CreatedAt,
		&cart.UpdatedAt,
	)

	if err == nil {
		return cart, nil
	}

	if err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get cart: %v", err)
	}

	// Create new cart
	err = s.db.QueryRow(`
		INSERT INTO shopping_carts (user_id, status, expires_at, created_at, updated_at)
		VALUES ($1, 'active', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, created_at, updated_at
	`, userID, time.Now().Add(24*time.Hour)).Scan(&cart.ID, &cart.CreatedAt, &cart.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create cart: %v", err)
	}

	cart.UserID = userID
	cart.Status = "active"
	cart.ExpiresAt = time.Now().Add(24 * time.Hour)

	return cart, nil
}

// GetCartByID gets cart by ID
func (s *CartService) GetCartByID(cartID string) (*models.ShoppingCart, error) {
	cart := &models.ShoppingCart{}
	err := s.db.QueryRow(`
		SELECT id, user_id, status, expires_at, created_at, updated_at
		FROM shopping_carts 
		WHERE id = $1
	`, cartID).Scan(
		&cart.ID,
		&cart.UserID,
		&cart.Status,
		&cart.ExpiresAt,
		&cart.CreatedAt,
		&cart.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get cart: %v", err)
	}

	return cart, nil
}

// AddItemToCart adds item to cart
func (s *CartService) AddItemToCart(cartID string, item *models.CartItem) error {
	// Check if item already exists in cart
	var existingID string
	err := s.db.QueryRow(`
		SELECT id FROM cart_items 
		WHERE cart_id = $1 AND item_type = $2 AND item_id = $3
	`, cartID, item.ItemType, item.ItemID).Scan(&existingID)

	if err == nil {
		// Update existing item quantity
		_, err = s.db.Exec(`
			UPDATE cart_items 
			SET quantity = quantity + $1, 
			    total_price = unit_price * (quantity + $1),
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
		`, item.Quantity, existingID)
		return err
	}

	if err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing item: %v", err)
	}

	// Add new item
	_, err = s.db.Exec(`
		INSERT INTO cart_items (
			cart_id, company_id, item_type, item_id, quantity, 
			unit_price, total_price, selected_options, special_instructions,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`, cartID, item.CompanyID, item.ItemType, item.ItemID, item.Quantity,
		item.UnitPrice, item.TotalPrice, item.SelectedOptions, item.SpecialInstructions)

	return err
}

// UpdateCartItem updates cart item quantity
func (s *CartService) UpdateCartItem(cartID, itemID string, quantity int) error {
	if quantity <= 0 {
		return s.RemoveItemFromCart(cartID, itemID)
	}

	_, err := s.db.Exec(`
		UPDATE cart_items 
		SET quantity = $1, 
		    total_price = unit_price * $1,
		    updated_at = CURRENT_TIMESTAMP
		WHERE cart_id = $2 AND id = $3
	`, quantity, cartID, itemID)

	return err
}

// RemoveItemFromCart removes item from cart
func (s *CartService) RemoveItemFromCart(cartID, itemID string) error {
	_, err := s.db.Exec(`
		DELETE FROM cart_items 
		WHERE cart_id = $1 AND id = $2
	`, cartID, itemID)

	return err
}

// ClearCart removes all items from cart
func (s *CartService) ClearCart(cartID string) error {
	_, err := s.db.Exec(`
		DELETE FROM cart_items 
		WHERE cart_id = $1
	`, cartID)

	return err
}

// CalculateCartTotal calculates cart total with discounts
func (s *CartService) CalculateCartTotal(cartID string) (*models.CartTotal, error) {
	total := &models.CartTotal{}

	err := s.db.QueryRow(`
		SELECT 
			COALESCE(SUM(total_price), 0) as subtotal,
			COUNT(*) as item_count
		FROM cart_items 
		WHERE cart_id = $1
	`, cartID).Scan(&total.Subtotal, &total.ItemCount)

	if err != nil {
		return nil, fmt.Errorf("failed to calculate total: %v", err)
	}

	// Calculate discount if any
	// This would be implemented based on discount codes logic
	total.DiscountAmount = 0
	total.TaxAmount = total.Subtotal * 0.1 // Example 10% tax
	total.Total = total.Subtotal - total.DiscountAmount + total.TaxAmount

	return total, nil
}

// ApplyDiscountCode applies discount code to cart
func (s *CartService) ApplyDiscountCode(cartID, discountCode string) error {
	// This would validate and apply discount code
	// For now, just a placeholder
	return nil
}

// RemoveDiscountCode removes discount from cart
func (s *CartService) RemoveDiscountCode(cartID string) error {
	// This would remove applied discount
	// For now, just a placeholder
	return nil
}

// AddToSavedItems adds item to saved items (wishlist)
func (s *CartService) AddToSavedItems(userID string, item *models.SavedItem) error {
	_, err := s.db.Exec(`
		INSERT INTO saved_items (user_id, company_id, item_type, item_id, notes, created_at)
		VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET
			notes = EXCLUDED.notes
	`, userID, item.CompanyID, item.ItemType, item.ItemID, item.Notes)

	return err
}

// GetSavedItems gets user's saved items
func (s *CartService) GetSavedItems(userID string) ([]models.SavedItem, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, company_id, item_type, item_id, notes, created_at
		FROM saved_items 
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)

	if err != nil {
		return nil, fmt.Errorf("failed to get saved items: %v", err)
	}
	defer rows.Close()

	var items []models.SavedItem
	for rows.Next() {
		var item models.SavedItem
		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.CompanyID,
			&item.ItemType,
			&item.ItemID,
			&item.Notes,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan saved item: %v", err)
		}
		items = append(items, item)
	}

	return items, nil
}

// RemoveFromSavedItems removes item from saved items
func (s *CartService) RemoveFromSavedItems(userID, itemID string) error {
	_, err := s.db.Exec(`
		DELETE FROM saved_items 
		WHERE user_id = $1 AND id = $2
	`, userID, itemID)

	return err
}

// MoveToCart moves item from saved items to cart
func (s *CartService) MoveToCart(userID, savedItemID string) error {
	// This would get saved item details and add to cart
	// Then remove from saved items
	// For now, just a placeholder
	return nil
}

// MarkCartAsAbandoned marks cart as abandoned
func (s *CartService) MarkCartAsAbandoned(cartID string) error {
	_, err := s.db.Exec(`
		UPDATE shopping_carts 
		SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, cartID)

	return err
}

// GetAbandonedCarts gets abandoned carts for recovery
func (s *CartService) GetAbandonedCarts(limit int) ([]models.CartAbandonment, error) {
	rows, err := s.db.Query(`
		SELECT id, cart_id, user_id, email, total_value, items_count, 
		       abandoned_at, recovery_email_sent
		FROM cart_abandonment 
		WHERE recovery_email_sent = false
		ORDER BY abandoned_at DESC
		LIMIT $1
	`, limit)

	if err != nil {
		return nil, fmt.Errorf("failed to get abandoned carts: %v", err)
	}
	defer rows.Close()

	var abandonments []models.CartAbandonment
	for rows.Next() {
		var abandonment models.CartAbandonment
		err := rows.Scan(
			&abandonment.ID,
			&abandonment.CartID,
			&abandonment.UserID,
			&abandonment.Email,
			&abandonment.TotalValue,
			&abandonment.ItemsCount,
			&abandonment.AbandonedAt,
			&abandonment.RecoveryEmailSent,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan abandonment: %v", err)
		}
		abandonments = append(abandonments, abandonment)
	}

	return abandonments, nil
}

// SendRecoveryEmail sends cart recovery email
func (s *CartService) SendRecoveryEmail(cartID string) error {
	_, err := s.db.Exec(`
		UPDATE cart_abandonment 
		SET recovery_email_sent = true, recovery_email_sent_at = CURRENT_TIMESTAMP
		WHERE cart_id = $1
	`, cartID)

	return err
}
