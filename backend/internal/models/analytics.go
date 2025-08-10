package models

import "time"

// Regional Analytics Models
type RegionalRegistration struct {
	Country     string    `json:"country"`
	State       string    `json:"state"`
	City        string    `json:"city"`
	Count       int       `json:"count"`
	LatestDate  time.Time `json:"latest_date"`
	PhonePrefix string    `json:"phone_prefix"`
}

type UserRegistrationData struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Phone     string    `json:"phone"`
	Country   string    `json:"country"`
	State     string    `json:"state"`
	City      string    `json:"city"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type RegionalStats struct {
	TotalUsers          int                    `json:"total_users"`
	CountryStats        []RegionalRegistration `json:"country_stats"`
	StateStats          []RegionalRegistration `json:"state_stats"`
	CityStats           []RegionalRegistration `json:"city_stats"`
	PhonePrefixStats    []RegionalRegistration `json:"phone_prefix_stats"`
	RecentRegistrations []UserRegistrationData `json:"recent_registrations"`
}

// Customer Data Models for Companies
type CustomerData struct {
	UserID    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Country   string `json:"country"`
	State     string `json:"state"`
	City      string `json:"city"`
}

type PetData struct {
	PetID   string `json:"pet_id"`
	PetName string `json:"pet_name"`
	PetType string `json:"pet_type"`
	Breed   string `json:"breed"`
}

type BookingWithCustomerData struct {
	*Booking
	Customer CustomerData `json:"customer"`
	Pet      PetData      `json:"pet"`
}
