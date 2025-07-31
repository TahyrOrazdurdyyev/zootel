package services

import "database/sql"

type OrderService struct {
	db *sql.DB
}

func NewOrderService(db *sql.DB) *OrderService {
	return &OrderService{db: db}
}
