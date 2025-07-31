package services

import "database/sql"

type BookingService struct {
	db *sql.DB
}

func NewBookingService(db *sql.DB) *BookingService {
	return &BookingService{db: db}
}
