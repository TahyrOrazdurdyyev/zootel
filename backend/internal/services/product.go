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

type ProductService struct {
	db *sql.DB
}

func NewProductService(db *sql.DB) *ProductService {
	return &ProductService{db: db}
}

// CreateProductVariant creates a new product variant
func (s *ProductService) CreateProductVariant(variant *models.ProductVariant) error {
	variant.ID = uuid.New().String()
	variant.CreatedAt = time.Now()
	variant.UpdatedAt = time.Now()

	query := `
		INSERT INTO product_variants (
			id, product_id, variant_name, sku, attributes, price, wholesale_price,
			stock, low_stock_alert, image_url, image_gallery, is_default, is_active,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	_, err := s.db.Exec(query,
		variant.ID, variant.ProductID, variant.VariantName, variant.SKU,
		variant.Attributes, variant.Price, variant.WholesalePrice,
		variant.Stock, variant.LowStockAlert, variant.ImageURL,
		pq.Array(variant.ImageGallery), variant.IsDefault, variant.IsActive,
		variant.CreatedAt, variant.UpdatedAt,
	)
	return err
}

// GetProductVariants gets all variants for a product
func (s *ProductService) GetProductVariants(productID string) ([]*models.ProductVariant, error) {
	query := `
		SELECT id, product_id, variant_name, sku, attributes, price, wholesale_price,
			   stock, low_stock_alert, image_url, image_gallery, is_default, is_active,
			   created_at, updated_at
		FROM product_variants 
		WHERE product_id = $1 AND is_active = true
		ORDER BY is_default DESC, variant_name ASC`

	rows, err := s.db.Query(query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var variants []*models.ProductVariant
	for rows.Next() {
		variant := &models.ProductVariant{}
		err := rows.Scan(
			&variant.ID, &variant.ProductID, &variant.VariantName, &variant.SKU,
			&variant.Attributes, &variant.Price, &variant.WholesalePrice,
			&variant.Stock, &variant.LowStockAlert, &variant.ImageURL,
			pq.Array(&variant.ImageGallery), &variant.IsDefault, &variant.IsActive,
			&variant.CreatedAt, &variant.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		variants = append(variants, variant)
	}

	return variants, nil
}

// GetProductAttributes gets all available attributes
func (s *ProductService) GetProductAttributes() ([]*models.ProductAttribute, error) {
	query := `
		SELECT id, name, display_name, attribute_type, is_required, sort_order, is_active, created_at
		FROM product_attributes 
		WHERE is_active = true
		ORDER BY sort_order ASC, display_name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attributes []*models.ProductAttribute
	for rows.Next() {
		attr := &models.ProductAttribute{}
		err := rows.Scan(
			&attr.ID, &attr.Name, &attr.DisplayName, &attr.AttributeType,
			&attr.IsRequired, &attr.SortOrder, &attr.IsActive, &attr.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		attributes = append(attributes, attr)
	}

	return attributes, nil
}

// GetAttributeValues gets values for a specific attribute
func (s *ProductService) GetAttributeValues(attributeID string) ([]*models.ProductAttributeValue, error) {
	query := `
		SELECT id, attribute_id, value, display_value, sort_order, is_active, created_at
		FROM product_attribute_values 
		WHERE attribute_id = $1 AND is_active = true
		ORDER BY sort_order ASC, display_value ASC`

	rows, err := s.db.Query(query, attributeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var values []*models.ProductAttributeValue
	for rows.Next() {
		val := &models.ProductAttributeValue{}
		err := rows.Scan(
			&val.ID, &val.AttributeID, &val.Value, &val.DisplayValue,
			&val.SortOrder, &val.IsActive, &val.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		values = append(values, val)
	}

	return values, nil
}

// UpdateProductStock updates stock for product or variant
func (s *ProductService) UpdateProductStock(productID string, variantID *string, quantity int) error {
	if variantID != nil {
		// Update variant stock
		query := `UPDATE product_variants SET stock = stock + $1, updated_at = $2 WHERE id = $3`
		_, err := s.db.Exec(query, quantity, time.Now(), *variantID)
		return err
	} else {
		// Update product stock
		query := `UPDATE products SET stock = stock + $1, updated_at = $2 WHERE id = $3`
		_, err := s.db.Exec(query, quantity, time.Now(), productID)
		return err
	}
}

// CreatePriceTier creates quantity-based pricing
func (s *ProductService) CreatePriceTier(tier *models.PriceTier) error {
	tier.ID = uuid.New().String()
	tier.CreatedAt = time.Now()

	query := `
		INSERT INTO price_tiers (
			id, product_id, variant_id, min_quantity, max_quantity,
			price, discount_percentage, tier_name, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := s.db.Exec(query,
		tier.ID, tier.ProductID, tier.VariantID, tier.MinQuantity,
		tier.MaxQuantity, tier.Price, tier.DiscountPercentage,
		tier.TierName, tier.CreatedAt,
	)
	return err
}

// GetPriceTiers gets pricing tiers for product/variant
func (s *ProductService) GetPriceTiers(productID string, variantID *string) ([]*models.PriceTier, error) {
	query := `
		SELECT id, product_id, variant_id, min_quantity, max_quantity,
			   price, discount_percentage, tier_name, created_at
		FROM price_tiers 
		WHERE (product_id = $1 OR $1 IS NULL) 
		  AND (variant_id = $2 OR $2 IS NULL)
		ORDER BY min_quantity ASC`

	rows, err := s.db.Query(query, productID, variantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tiers []*models.PriceTier
	for rows.Next() {
		tier := &models.PriceTier{}
		err := rows.Scan(
			&tier.ID, &tier.ProductID, &tier.VariantID, &tier.MinQuantity,
			&tier.MaxQuantity, &tier.Price, &tier.DiscountPercentage,
			&tier.TierName, &tier.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		tiers = append(tiers, tier)
	}

	return tiers, nil
}

// CalculatePrice calculates price based on quantity and tiers
func (s *ProductService) CalculatePrice(productID string, variantID *string, quantity int) (float64, error) {
	// Get price tiers
	tiers, err := s.GetPriceTiers(productID, variantID)
	if err != nil {
		return 0, err
	}

	// Find applicable tier
	var applicableTier *models.PriceTier
	for _, tier := range tiers {
		if quantity >= tier.MinQuantity {
			if tier.MaxQuantity == nil || quantity <= *tier.MaxQuantity {
				applicableTier = tier
			}
		}
	}

	if applicableTier != nil {
		return applicableTier.Price, nil
	}

	// Fall back to base price
	var basePrice float64
	if variantID != nil {
		err = s.db.QueryRow("SELECT price FROM product_variants WHERE id = $1", *variantID).Scan(&basePrice)
	} else {
		err = s.db.QueryRow("SELECT price FROM products WHERE id = $1", productID).Scan(&basePrice)
	}

	return basePrice, err
}

// GetLowStockProducts gets products/variants with low stock
func (s *ProductService) GetLowStockProducts(companyID string) ([]map[string]interface{}, error) {
	query := `
		SELECT p.id, p.name, p.stock, p.low_stock_alert, 'product' as type
		FROM products p
		WHERE p.company_id = $1 AND p.stock <= p.low_stock_alert AND p.is_active = true
		UNION ALL
		SELECT pv.id, CONCAT(p.name, ' - ', pv.variant_name), pv.stock, pv.low_stock_alert, 'variant' as type
		FROM product_variants pv
		JOIN products p ON pv.product_id = p.id
		WHERE p.company_id = $1 AND pv.stock <= pv.low_stock_alert AND pv.is_active = true
		ORDER BY stock ASC`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []map[string]interface{}
	for rows.Next() {
		var id, name, itemType string
		var stock, lowStockAlert int

		err := rows.Scan(&id, &name, &stock, &lowStockAlert, &itemType)
		if err != nil {
			return nil, err
		}

		items = append(items, map[string]interface{}{
			"id":              id,
			"name":            name,
			"stock":           stock,
			"low_stock_alert": lowStockAlert,
			"type":            itemType,
		})
	}

	return items, nil
}

// GetCompanyPublicProducts gets public products for a specific company
func (s *ProductService) GetCompanyPublicProducts(companyID string, limit, offset int, categoryID string) ([]*models.Product, int, error) {
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
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products %s", whereClause)
	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count products: %w", err)
	}

	// Get products with pagination
	query := fmt.Sprintf(`
		SELECT id, company_id, category_id, name, description, composition, ingredients,
			   nutritional_info, specifications, price, wholesale_price, min_wholesale_quantity,
			   stock, low_stock_alert, image_url, image_gallery, is_active,
			   created_at, updated_at
		FROM products 
		%s
		ORDER BY stock > 0 DESC, name ASC
		LIMIT $%d OFFSET $%d`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query products: %w", err)
	}
	defer rows.Close()

	var products []*models.Product
	for rows.Next() {
		product := &models.Product{}
		err := rows.Scan(
			&product.ID, &product.CompanyID, &product.CategoryID, &product.Name,
			&product.Description, &product.Composition, &product.Ingredients,
			&product.NutritionalInfo, &product.Specifications, &product.Price,
			&product.WholesalePrice, &product.MinWholesaleQuantity, &product.Stock,
			&product.LowStockAlert, &product.ImageURL, pq.Array(&product.ImageGallery),
			&product.IsActive, &product.CreatedAt, &product.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan product: %w", err)
		}
		products = append(products, product)
	}

	return products, total, nil
}
