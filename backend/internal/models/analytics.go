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
	UserID                   string     `json:"user_id"`
	FirstName                string     `json:"first_name"`
	LastName                 string     `json:"last_name"`
	Email                    string     `json:"email"`
	Phone                    string     `json:"phone"`
	Gender                   string     `json:"gender"`
	DateOfBirth              *time.Time `json:"date_of_birth"`
	Address                  string     `json:"address"`
	ApartmentNumber          string     `json:"apartment_number"`
	Country                  string     `json:"country"`
	State                    string     `json:"state"`
	City                     string     `json:"city"`
	PostalCode               string     `json:"postal_code"`
	EmergencyContactName     string     `json:"emergency_contact_name"`
	EmergencyContactPhone    string     `json:"emergency_contact_phone"`
	EmergencyContactRelation string     `json:"emergency_contact_relation"`
}

type PetData struct {
	PetID               string     `json:"pet_id"`
	PetName             string     `json:"pet_name"`
	PetType             string     `json:"pet_type"`
	Breed               string     `json:"breed"`
	Gender              string     `json:"gender"`
	DateOfBirth         *time.Time `json:"date_of_birth"`
	Weight              float64    `json:"weight"`
	MicrochipID         string     `json:"microchip_id"`
	Sterilized          bool       `json:"sterilized"`
	ChronicConditions   []string   `json:"chronic_conditions"`
	Allergies           []string   `json:"allergies"`
	DietaryRestrictions string     `json:"dietary_restrictions"`
	SpecialNeeds        string     `json:"special_needs"`
	VetName             string     `json:"vet_name"`
	VetPhone            string     `json:"vet_phone"`
	VetClinic           string     `json:"vet_clinic"`
	BehaviorNotes       string     `json:"behavior_notes"`
	StressReactions     string     `json:"stress_reactions"`
	FavoriteToys        string     `json:"favorite_toys"`
}

type BookingWithCustomerData struct {
	*Booking
	Customer CustomerData `json:"customer"`
	Pet      PetData      `json:"pet"`
}

// New Location Analytics Models

// LocationAnalyticsResponse is the main response for SuperAdmin location analytics
type LocationAnalyticsResponse struct {
	TotalStats          *LocationStats          `json:"total_stats"`
	RoleBreakdown       []LocationRoleBreakdown `json:"role_breakdown"`
	TopCountries        []CountryStats          `json:"top_countries"`
	RecentRegistrations []UserRegistrationData  `json:"recent_registrations"`
}

// LocationStats provides overall location statistics
type LocationStats struct {
	TotalUsers        int `json:"total_users"`
	UsersWithLocation int `json:"users_with_location"`
	UniqueCountries   int `json:"unique_countries"`
	UniqueStates      int `json:"unique_states"`
	UniqueCities      int `json:"unique_cities"`
}

// LocationRoleBreakdown shows user role distribution by location
type LocationRoleBreakdown struct {
	Country string `json:"country"`
	State   string `json:"state"`
	Role    string `json:"role"`
	Count   int    `json:"count"`
}

// CountryStats provides detailed statistics for each country
type CountryStats struct {
	Country             string `json:"country"`
	TotalUsers          int    `json:"total_users"`
	PetOwners           int    `json:"pet_owners"`
	Companies           int    `json:"companies"`
	RecentRegistrations int    `json:"recent_registrations"`
}

// CompanyLocationStats provides location analytics for companies
type CompanyLocationStats struct {
	TotalCustomers        int             `json:"total_customers"`
	CustomersWithLocation int             `json:"customers_with_location"`
	UniqueCountries       int             `json:"unique_countries"`
	UniqueStates          int             `json:"unique_states"`
	UniqueCities          int             `json:"unique_cities"`
	TopCountries          []LocationCount `json:"top_countries"`
	TopCities             []LocationCount `json:"top_cities"`
}

// LocationCount represents count data for specific locations
type LocationCount struct {
	Location string  `json:"location"`
	Count    int     `json:"count"`
	Bookings int     `json:"bookings"`
	Revenue  float64 `json:"revenue"`
}

// LocationTrendData represents registration trends by location over time
type LocationTrendData struct {
	Period        string `json:"period"`
	Country       string `json:"country"`
	Role          string `json:"role"`
	Registrations int    `json:"registrations"`
}
