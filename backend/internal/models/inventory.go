package models

import (
	"time"
)

// Note: Product model is already defined in models.go

// InventoryTransaction represents a stock movement
type InventoryTransaction struct {
	ID              string    `json:"id" db:"id"`
	ProductID       string    `json:"product_id" db:"product_id"`
	CompanyID       string    `json:"company_id" db:"company_id"`
	TransactionType string    `json:"transaction_type" db:"transaction_type"`
	Quantity        int       `json:"quantity" db:"quantity"`
	PreviousStock   int       `json:"previous_stock" db:"previous_stock"`
	NewStock        int       `json:"new_stock" db:"new_stock"`
	Reason          *string   `json:"reason" db:"reason"`
	Notes           *string   `json:"notes" db:"notes"`
	CreatedBy       *string   `json:"created_by" db:"created_by"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// InventoryAlert represents a stock alert
type InventoryAlert struct {
	ID        string    `json:"id" db:"id"`
	CompanyID string    `json:"company_id" db:"company_id"`
	ProductID string    `json:"product_id" db:"product_id"`
	AlertType string    `json:"alert_type" db:"alert_type"`
	Message   string    `json:"message" db:"message"`
	IsRead    bool      `json:"is_read" db:"is_read"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// ProductWithDetails includes additional information
type ProductWithDetails struct {
	Product
	CompanyName  string `json:"company_name" db:"company_name"`
	CategoryName string `json:"category_name" db:"category_name"`
}

// InventoryTransactionWithDetails includes additional information
type InventoryTransactionWithDetails struct {
	InventoryTransaction
	ProductName   string `json:"product_name" db:"product_name"`
	CreatedByName string `json:"created_by_name" db:"created_by_name"`
}

// InventoryAlertWithDetails includes additional information
type InventoryAlertWithDetails struct {
	InventoryAlert
	ProductName string `json:"product_name" db:"product_name"`
	CompanyName string `json:"company_name" db:"company_name"`
}

// CreateProductRequest represents the request to create a product
type CreateProductRequest struct {
	Name          string   `json:"name" binding:"required"`
	SKU           *string  `json:"sku"`
	Description   *string  `json:"description"`
	Category      string   `json:"category" binding:"required"`
	Price         float64  `json:"price" binding:"required,min=0"`
	Cost          *float64 `json:"cost"`
	InitialStock  int      `json:"initial_stock" binding:"required,min=0"`
	LowStockAlert int      `json:"low_stock_alert" binding:"min=0"`
	Unit          string   `json:"unit"`
	ImageURL      *string  `json:"image_url"`
}

// UpdateProductRequest represents the request to update a product
type UpdateProductRequest struct {
	Name          *string  `json:"name"`
	SKU           *string  `json:"sku"`
	Description   *string  `json:"description"`
	Category      *string  `json:"category"`
	Price         *float64 `json:"price"`
	Cost          *float64 `json:"cost"`
	LowStockAlert *int     `json:"low_stock_alert"`
	Unit          *string  `json:"unit"`
	ImageURL      *string  `json:"image_url"`
	IsActive      *bool    `json:"is_active"`
}

// StockUpdateRequest represents the request to update stock
type StockUpdateRequest struct {
	Type     string  `json:"type" binding:"required,oneof=in out adjustment"`
	Quantity int     `json:"quantity" binding:"required,min=1"`
	Reason   *string `json:"reason"`
	Notes    *string `json:"notes"`
}

// InventoryFilters represents filters for inventory queries
type InventoryFilters struct {
	SearchTerm  *string  `json:"search_term"`
	Category    *string  `json:"category"`
	StockStatus *string  `json:"stock_status"` // "in", "low", "out"
	MinPrice    *float64 `json:"min_price"`
	MaxPrice    *float64 `json:"max_price"`
	IsActive    *bool    `json:"is_active"`
	Limit       int      `json:"limit"`
	Offset      int      `json:"offset"`
}

// InventoryStats represents inventory statistics
type InventoryStats struct {
	TotalProducts     int            `json:"total_products"`
	TotalValue        float64        `json:"total_value"`
	LowStockCount     int            `json:"low_stock_count"`
	OutOfStockCount   int            `json:"out_of_stock_count"`
	CategoryBreakdown map[string]int `json:"category_breakdown"`
}
