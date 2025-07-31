package handlers

import "zootel-backend/internal/services"

type BookingHandler struct {
	bookingService *services.BookingService
}

func NewBookingHandler(bookingService *services.BookingService) *BookingHandler {
	return &BookingHandler{bookingService: bookingService}
}

func (h *BookingHandler) GetUserBookings(c interface{})     {}
func (h *BookingHandler) CreateBooking(c interface{})       {}
func (h *BookingHandler) GetBooking(c interface{})          {}
func (h *BookingHandler) UpdateBooking(c interface{})       {}
func (h *BookingHandler) CancelBooking(c interface{})       {}
func (h *BookingHandler) CheckAvailability(c interface{})   {}
func (h *BookingHandler) GetCompanyBookings(c interface{})  {}
func (h *BookingHandler) UpdateBookingStatus(c interface{}) {}
