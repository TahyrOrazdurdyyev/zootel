package services

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

type InventoryService struct {
	db *sql.DB
}

func NewInventoryService(db *sql.DB) *InventoryService {
	return &InventoryService{db: db}
}

// GetCompanyInventory returns all products for a company with optional filters
func (s *InventoryService) GetCompanyInventory(companyID string, filters models.InventoryFilters) ([]models.Product, error) {
	query := `
		SELECT id, company_id, category_id, name, description, composition, ingredients, 
		       nutritional_info, specifications, price, cost, wholesale_price, min_wholesale_quantity,
		       stock, low_stock_alert, unit, image_url, image_gallery, is_active, created_at, updated_at
		FROM products 
		WHERE company_id = $1 AND is_active = true
	`
	args := []interface{}{companyID}
	argIndex := 2

	// Add search filter
	if filters.SearchTerm != nil && *filters.SearchTerm != "" {
		query += fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex)
		searchTerm := "%" + *filters.SearchTerm + "%"
		args = append(args, searchTerm)
		argIndex++
	}

	// Add category filter
	if filters.Category != nil && *filters.Category != "" {
		query += fmt.Sprintf(" AND category_id = $%d", argIndex)
		args = append(args, *filters.Category)
		argIndex++
	}

	// Add stock status filter
	if filters.StockStatus != nil && *filters.StockStatus != "" {
		switch *filters.StockStatus {
		case "low":
			query += fmt.Sprintf(" AND stock <= low_stock_alert AND stock > 0")
		case "out":
			query += fmt.Sprintf(" AND stock = 0")
		case "in":
			query += fmt.Sprintf(" AND stock > 0")
		}
	}

	// Add price filters
	if filters.MinPrice != nil {
		query += fmt.Sprintf(" AND price >= $%d", argIndex)
		args = append(args, *filters.MinPrice)
		argIndex++
	}
	if filters.MaxPrice != nil {
		query += fmt.Sprintf(" AND price <= $%d", argIndex)
		args = append(args, *filters.MaxPrice)
		argIndex++
	}

	// Add pagination
	query += fmt.Sprintf(" ORDER BY name LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filters.Limit, filters.Offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query inventory: %w", err)
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		err := rows.Scan(
			&product.ID, &product.CompanyID, &product.CategoryID, &product.Name, &product.Description,
			&product.Composition, &product.Ingredients, &product.NutritionalInfo, &product.Specifications,
			&product.Price, &product.Cost, &product.WholesalePrice, &product.MinWholesaleQuantity,
			&product.Stock, &product.LowStockAlert, &product.Unit, &product.ImageURL, &product.ImageGallery,
			&product.IsActive, &product.CreatedAt, &product.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}
		products = append(products, product)
	}

	return products, nil
}

// GetProduct returns a single product by ID
func (s *InventoryService) GetProduct(productID string) (*models.Product, error) {
	query := `
		SELECT id, company_id, category_id, name, description, composition, ingredients, 
		       nutritional_info, specifications, price, cost, wholesale_price, min_wholesale_quantity,
		       stock, low_stock_alert, unit, image_url, image_gallery, is_active, created_at, updated_at
		FROM products 
		WHERE id = $1
	`

	var product models.Product
	err := s.db.QueryRow(query, productID).Scan(
		&product.ID, &product.CompanyID, &product.CategoryID, &product.Name, &product.Description,
		&product.Composition, &product.Ingredients, &product.NutritionalInfo, &product.Specifications,
		&product.Price, &product.Cost, &product.WholesalePrice, &product.MinWholesaleQuantity,
		&product.Stock, &product.LowStockAlert, &product.Unit, &product.ImageURL, &product.ImageGallery,
		&product.IsActive, &product.CreatedAt, &product.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	return &product, nil
}

// CreateProduct creates a new product
func (s *InventoryService) CreateProduct(companyID string, req models.CreateProductRequest) (*models.Product, error) {
	// Generate SKU if not provided
	sku := req.SKU
	if sku == nil || *sku == "" {
		generatedSKU := fmt.Sprintf("%s-%s-%d", strings.ToUpper(req.Category), strings.ToUpper(req.Name), time.Now().Unix())
		sku = &generatedSKU
	}

	query := `
		INSERT INTO products (company_id, category_id, name, description, price, cost, stock, low_stock_alert, unit, image_url, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
		RETURNING id, company_id, category_id, name, description, composition, ingredients, 
		          nutritional_info, specifications, price, cost, wholesale_price, min_wholesale_quantity,
		          stock, low_stock_alert, unit, image_url, image_gallery, is_active, created_at, updated_at
	`

	var product models.Product
	err := s.db.QueryRow(query,
		companyID, req.Category, req.Name, req.Description, req.Price, req.Cost,
		req.InitialStock, req.LowStockAlert, req.Unit, req.ImageURL,
	).Scan(
		&product.ID, &product.CompanyID, &product.CategoryID, &product.Name, &product.Description,
		&product.Composition, &product.Ingredients, &product.NutritionalInfo, &product.Specifications,
		&product.Price, &product.Cost, &product.WholesalePrice, &product.MinWholesaleQuantity,
		&product.Stock, &product.LowStockAlert, &product.Unit, &product.ImageURL, &product.ImageGallery,
		&product.IsActive, &product.CreatedAt, &product.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create product: %w", err)
	}

	// Create initial stock transaction
	if req.InitialStock > 0 {
		initialStockReason := "Initial stock"
		err = s.createStockTransaction(product.ID, companyID, "in", req.InitialStock, 0, req.InitialStock, &initialStockReason, nil)
		if err != nil {
			// Log error but don't fail the product creation
			fmt.Printf("Warning: failed to create initial stock transaction: %v\n", err)
		}
	}

	return &product, nil
}

// UpdateProduct updates an existing product
func (s *InventoryService) UpdateProduct(productID string, req models.UpdateProductRequest) (*models.Product, error) {
	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}
	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *req.Description)
		argIndex++
	}
	if req.Category != nil {
		updates = append(updates, fmt.Sprintf("category_id = $%d", argIndex))
		args = append(args, *req.Category)
		argIndex++
	}
	if req.Price != nil {
		updates = append(updates, fmt.Sprintf("price = $%d", argIndex))
		args = append(args, *req.Price)
		argIndex++
	}
	if req.Cost != nil {
		updates = append(updates, fmt.Sprintf("cost = $%d", argIndex))
		args = append(args, *req.Cost)
		argIndex++
	}
	if req.LowStockAlert != nil {
		updates = append(updates, fmt.Sprintf("low_stock_alert = $%d", argIndex))
		args = append(args, *req.LowStockAlert)
		argIndex++
	}
	if req.Unit != nil {
		updates = append(updates, fmt.Sprintf("unit = $%d", argIndex))
		args = append(args, *req.Unit)
		argIndex++
	}
	if req.ImageURL != nil {
		updates = append(updates, fmt.Sprintf("image_url = $%d", argIndex))
		args = append(args, *req.ImageURL)
		argIndex++
	}
	if req.IsActive != nil {
		updates = append(updates, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *req.IsActive)
		argIndex++
	}

	if len(updates) == 0 {
		return s.GetProduct(productID)
	}

	updates = append(updates, "updated_at = NOW()")
	args = append(args, productID)

	query := fmt.Sprintf("UPDATE products SET %s WHERE id = $%d", strings.Join(updates, ", "), argIndex)
	_, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update product: %w", err)
	}

	return s.GetProduct(productID)
}

// DeleteProduct deactivates a product (soft delete)
func (s *InventoryService) DeleteProduct(productID string) error {
	query := "UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1"
	_, err := s.db.Exec(query, productID)
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}
	return nil
}

// UpdateStock updates product stock and creates transaction record
func (s *InventoryService) UpdateStock(productID string, companyID string, req models.StockUpdateRequest, userID *string) error {
	// Get current product
	product, err := s.GetProduct(productID)
	if err != nil {
		return fmt.Errorf("failed to get product: %w", err)
	}

	// Calculate new stock
	var newStock int
	previousStock := product.Stock

	switch req.Type {
	case "in":
		newStock = previousStock + req.Quantity
	case "out":
		if previousStock < req.Quantity {
			return fmt.Errorf("insufficient stock: current %d, requested %d", previousStock, req.Quantity)
		}
		newStock = previousStock - req.Quantity
	case "adjustment":
		newStock = req.Quantity
	default:
		return fmt.Errorf("invalid transaction type: %s", req.Type)
	}

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Update product stock
	updateQuery := "UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2"
	_, err = tx.Exec(updateQuery, newStock, productID)
	if err != nil {
		return fmt.Errorf("failed to update stock: %w", err)
	}

	// Create transaction record
	err = s.createStockTransactionTx(tx, productID, companyID, req.Type, req.Quantity, previousStock, newStock, req.Reason, req.Notes, userID)
	if err != nil {
		return fmt.Errorf("failed to create transaction record: %w", err)
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// createStockTransaction creates a stock transaction record
func (s *InventoryService) createStockTransaction(productID, companyID, transactionType string, quantity, previousStock, newStock int, reason *string, notes *string) error {
	query := `
		INSERT INTO inventory_transactions (product_id, company_id, transaction_type, quantity, previous_stock, new_stock, reason, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := s.db.Exec(query, productID, companyID, transactionType, quantity, previousStock, newStock, reason, notes)
	return err
}

// createStockTransactionTx creates a stock transaction record within a transaction
func (s *InventoryService) createStockTransactionTx(tx *sql.Tx, productID, companyID, transactionType string, quantity, previousStock, newStock int, reason *string, notes *string, userID *string) error {
	query := `
		INSERT INTO inventory_transactions (product_id, company_id, transaction_type, quantity, previous_stock, new_stock, reason, notes, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := tx.Exec(query, productID, companyID, transactionType, quantity, previousStock, newStock, reason, notes, userID)
	return err
}

// GetInventoryTransactions returns transaction history for a product
func (s *InventoryService) GetInventoryTransactions(productID string, limit, offset int) ([]models.InventoryTransactionWithDetails, error) {
	query := `
		SELECT t.id, t.product_id, t.company_id, t.transaction_type, t.quantity, 
		       t.previous_stock, t.new_stock, t.reason, t.notes, t.created_by, t.created_at,
		       p.name as product_name, u.first_name || ' ' || u.last_name as created_by_name
		FROM inventory_transactions t
		LEFT JOIN products p ON t.product_id = p.id
		LEFT JOIN users u ON t.created_by = u.id
		WHERE t.product_id = $1
		ORDER BY t.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(query, productID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query transactions: %w", err)
	}
	defer rows.Close()

	var transactions []models.InventoryTransactionWithDetails
	for rows.Next() {
		var transaction models.InventoryTransactionWithDetails
		err := rows.Scan(
			&transaction.ID, &transaction.ProductID, &transaction.CompanyID, &transaction.TransactionType,
			&transaction.Quantity, &transaction.PreviousStock, &transaction.NewStock, &transaction.Reason,
			&transaction.Notes, &transaction.CreatedBy, &transaction.CreatedAt, &transaction.ProductName, &transaction.CreatedByName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}
		transactions = append(transactions, transaction)
	}

	return transactions, nil
}

// GetInventoryAlerts returns unread alerts for a company
func (s *InventoryService) GetInventoryAlerts(companyID string, limit, offset int) ([]models.InventoryAlertWithDetails, error) {
	query := `
		SELECT a.id, a.company_id, a.product_id, a.alert_type, a.message, a.is_read, a.created_at,
		       p.name as product_name, c.name as company_name
		FROM inventory_alerts a
		LEFT JOIN products p ON a.product_id = p.id
		LEFT JOIN companies c ON a.company_id = c.id
		WHERE a.company_id = $1
		ORDER BY a.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(query, companyID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.InventoryAlertWithDetails
	for rows.Next() {
		var alert models.InventoryAlertWithDetails
		err := rows.Scan(
			&alert.ID, &alert.CompanyID, &alert.ProductID, &alert.AlertType, &alert.Message,
			&alert.IsRead, &alert.CreatedAt, &alert.ProductName, &alert.CompanyName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}
		alerts = append(alerts, alert)
	}

	return alerts, nil
}

// MarkAlertAsRead marks an alert as read
func (s *InventoryService) MarkAlertAsRead(alertID string) error {
	query := "UPDATE inventory_alerts SET is_read = true WHERE id = $1"
	_, err := s.db.Exec(query, alertID)
	if err != nil {
		return fmt.Errorf("failed to mark alert as read: %w", err)
	}
	return nil
}

// GetInventoryStats returns inventory statistics for a company
func (s *InventoryService) GetInventoryStats(companyID string) (*models.InventoryStats, error) {
	query := `
		SELECT 
			COUNT(*) as total_products,
			COALESCE(SUM(stock * COALESCE(cost, price * 0.7)), 0) as total_value,
			COUNT(CASE WHEN stock <= low_stock_alert AND stock > 0 THEN 1 END) as low_stock_count,
			COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_count
		FROM products 
		WHERE company_id = $1 AND is_active = true
	`

	var stats models.InventoryStats
	err := s.db.QueryRow(query, companyID).Scan(
		&stats.TotalProducts, &stats.TotalValue, &stats.LowStockCount, &stats.OutOfStockCount,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get inventory stats: %w", err)
	}

	// Get category breakdown
	categoryQuery := `
		SELECT category_id, COUNT(*) 
		FROM products 
		WHERE company_id = $1 AND is_active = true 
		GROUP BY category_id
	`
	categoryRows, err := s.db.Query(categoryQuery, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get category breakdown: %w", err)
	}
	defer categoryRows.Close()

	stats.CategoryBreakdown = make(map[string]int)
	for categoryRows.Next() {
		var categoryID string
		var count int
		err := categoryRows.Scan(&categoryID, &count)
		if err != nil {
			continue
		}
		stats.CategoryBreakdown[categoryID] = count
	}

	return &stats, nil
}
