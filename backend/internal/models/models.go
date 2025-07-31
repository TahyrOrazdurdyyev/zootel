package models

import (
	"time"

	"github.com/lib/pq"
)

// User represents a platform user (Pet Owner or Company Owner)
type User struct {
	ID                  string         `json:"id" db:"id"`
	FirebaseUID         string         `json:"firebase_uid" db:"firebase_uid"`
	Email               string         `json:"email" db:"email"`
	FirstName           string         `json:"first_name" db:"first_name"`
	LastName            string         `json:"last_name" db:"last_name"`
	Gender              string         `json:"gender" db:"gender"` // male, female, other
	DateOfBirth         *time.Time     `json:"date_of_birth" db:"date_of_birth"`
	Phone               string         `json:"phone" db:"phone"`
	Address             string         `json:"address" db:"address"`
	Country             string         `json:"country" db:"country"`
	State               string         `json:"state" db:"state"`
	City                string         `json:"city" db:"city"`
	Timezone            string         `json:"timezone" db:"timezone"`
	AvatarURL           string         `json:"avatar_url" db:"avatar_url"`
	EmergencyContact    string         `json:"emergency_contact" db:"emergency_contact"`
	VetContact          string         `json:"vet_contact" db:"vet_contact"`
	NotificationMethods pq.StringArray `json:"notification_methods" db:"notification_methods"`
	MarketingOptIn      bool           `json:"marketing_opt_in" db:"marketing_opt_in"`
	CreatedAt           time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at" db:"updated_at"`
}

// Plan represents subscription plans
type Plan struct {
	ID               string         `json:"id" db:"id"`
	Name             string         `json:"name" db:"name"`
	Price            float64        `json:"price" db:"price"`
	Features         pq.StringArray `json:"features" db:"features"`
	FreeTrialEnabled bool           `json:"free_trial_enabled" db:"free_trial_enabled"`
	FreeTrialDays    int            `json:"free_trial_days" db:"free_trial_days"`
	MaxEmployees     int            `json:"max_employees" db:"max_employees"`
	TemplatesAccess  bool           `json:"templates_access" db:"templates_access"`
	DemoModeAccess   bool           `json:"demo_mode_access" db:"demo_mode_access"`
	IncludedAIAgents pq.StringArray `json:"included_ai_agents" db:"included_ai_agents"`
	AIAgentAddons    pq.StringArray `json:"ai_agent_addons" db:"ai_agent_addons"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
}

// PaymentSettings represents global payment configuration
type PaymentSettings struct {
	ID                   string    `json:"id" db:"id"`
	StripeEnabled        bool      `json:"stripe_enabled" db:"stripe_enabled"`
	CommissionEnabled    bool      `json:"commission_enabled" db:"commission_enabled"`
	CommissionPercentage float64   `json:"commission_percentage" db:"commission_percentage"`
	StripePublishableKey string    `json:"stripe_publishable_key" db:"stripe_publishable_key"`
	StripeSecretKey      string    `json:"stripe_secret_key" db:"stripe_secret_key"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// PetType represents pet species
type PetType struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Breed represents pet breeds
type Breed struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	PetTypeID string    `json:"pet_type_id" db:"pet_type_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Pet represents a user's pet
type Pet struct {
	ID           string         `json:"id" db:"id"`
	UserID       string         `json:"user_id" db:"user_id"`
	Name         string         `json:"name" db:"name"`
	PetTypeID    string         `json:"pet_type_id" db:"pet_type_id"`
	BreedID      string         `json:"breed_id" db:"breed_id"`
	Gender       string         `json:"gender" db:"gender"`
	DateOfBirth  *time.Time     `json:"date_of_birth" db:"date_of_birth"`
	Weight       float64        `json:"weight" db:"weight"`
	MicrochipID  string         `json:"microchip_id" db:"microchip_id"`
	Sterilized   bool           `json:"sterilized" db:"sterilized"`
	PhotoURL     string         `json:"photo_url" db:"photo_url"`
	PhotoGallery pq.StringArray `json:"photo_gallery" db:"photo_gallery"`
	Vaccinations string         `json:"vaccinations" db:"vaccinations"` // JSON string
	Allergies    pq.StringArray `json:"allergies" db:"allergies"`
	Medications  string         `json:"medications" db:"medications"` // JSON string
	SpecialNeeds string         `json:"special_needs" db:"special_needs"`
	VetContact   string         `json:"vet_contact" db:"vet_contact"`
	Notes        string         `json:"notes" db:"notes"`
	CreatedAt    time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at" db:"updated_at"`
}

// Company represents a pet care business
type Company struct {
	ID                    string         `json:"id" db:"id"`
	OwnerID               string         `json:"owner_id" db:"owner_id"`
	Name                  string         `json:"name" db:"name"`
	Description           string         `json:"description" db:"description"`
	Categories            pq.StringArray `json:"categories" db:"categories"`
	Country               string         `json:"country" db:"country"`
	State                 string         `json:"state" db:"state"`
	City                  string         `json:"city" db:"city"`
	Address               string         `json:"address" db:"address"`
	Phone                 string         `json:"phone" db:"phone"`
	Email                 string         `json:"email" db:"email"`
	Website               string         `json:"website" db:"website"`
	LogoURL               string         `json:"logo_url" db:"logo_url"`
	MediaGallery          pq.StringArray `json:"media_gallery" db:"media_gallery"`
	BusinessHours         string         `json:"business_hours" db:"business_hours"` // JSON string
	PlanID                string         `json:"plan_id" db:"plan_id"`
	TrialExpired          bool           `json:"trial_expired" db:"trial_expired"`
	SpecialPartner        bool           `json:"special_partner" db:"special_partner"`
	ManualEnabledCRM      bool           `json:"manual_enabled_crm" db:"manual_enabled_crm"`
	ManualEnabledAIAgents bool           `json:"manual_enabled_ai_agents" db:"manual_enabled_ai_agents"`
	IsDemo                bool           `json:"is_demo" db:"is_demo"`
	IsActive              bool           `json:"is_active" db:"is_active"`
	CreatedAt             time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at" db:"updated_at"`
}

// Employee represents a company employee
type Employee struct {
	ID          string         `json:"id" db:"id"`
	CompanyID   string         `json:"company_id" db:"company_id"`
	Username    string         `json:"username" db:"username"`
	Password    string         `json:"password" db:"password"` // hashed
	FirstName   string         `json:"first_name" db:"first_name"`
	LastName    string         `json:"last_name" db:"last_name"`
	Email       string         `json:"email" db:"email"`
	Phone       string         `json:"phone" db:"phone"`
	Role        string         `json:"role" db:"role"`
	Permissions pq.StringArray `json:"permissions" db:"permissions"`
	IsActive    bool           `json:"is_active" db:"is_active"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at" db:"updated_at"`
}

// ServiceCategory represents service categories
type ServiceCategory struct {
	ID        string    `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Icon      string    `json:"icon" db:"icon"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Service represents a company service
type Service struct {
	ID          string    `json:"id" db:"id"`
	CompanyID   string    `json:"company_id" db:"company_id"`
	CategoryID  string    `json:"category_id" db:"category_id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Price       float64   `json:"price" db:"price"`
	Duration    int       `json:"duration" db:"duration"` // minutes
	ImageURL    string    `json:"image_url" db:"image_url"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Product represents a company product
type Product struct {
	ID            string         `json:"id" db:"id"`
	CompanyID     string         `json:"company_id" db:"company_id"`
	CategoryID    string         `json:"category_id" db:"category_id"`
	Name          string         `json:"name" db:"name"`
	Description   string         `json:"description" db:"description"`
	Price         float64        `json:"price" db:"price"`
	Stock         int            `json:"stock" db:"stock"`
	LowStockAlert int            `json:"low_stock_alert" db:"low_stock_alert"`
	ImageURL      string         `json:"image_url" db:"image_url"`
	ImageGallery  pq.StringArray `json:"image_gallery" db:"image_gallery"`
	IsActive      bool           `json:"is_active" db:"is_active"`
	CreatedAt     time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at" db:"updated_at"`
}

// Booking represents a service booking
type Booking struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	CompanyID  string    `json:"company_id" db:"company_id"`
	ServiceID  string    `json:"service_id" db:"service_id"`
	PetID      string    `json:"pet_id" db:"pet_id"`
	EmployeeID *string   `json:"employee_id" db:"employee_id"`
	DateTime   time.Time `json:"date_time" db:"date_time"`
	Duration   int       `json:"duration" db:"duration"`
	Price      float64   `json:"price" db:"price"`
	Status     string    `json:"status" db:"status"` // pending, confirmed, in_progress, completed, cancelled
	Notes      string    `json:"notes" db:"notes"`
	PaymentID  *string   `json:"payment_id" db:"payment_id"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// Order represents a product order
type Order struct {
	ID              string    `json:"id" db:"id"`
	UserID          string    `json:"user_id" db:"user_id"`
	CompanyID       string    `json:"company_id" db:"company_id"`
	OrderItems      string    `json:"order_items" db:"order_items"` // JSON string
	TotalAmount     float64   `json:"total_amount" db:"total_amount"`
	Status          string    `json:"status" db:"status"` // pending, confirmed, processing, shipped, delivered, cancelled
	ShippingAddress string    `json:"shipping_address" db:"shipping_address"`
	PaymentID       *string   `json:"payment_id" db:"payment_id"`
	TrackingNumber  *string   `json:"tracking_number" db:"tracking_number"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// Chat represents chat conversations
type Chat struct {
	ID            string    `json:"id" db:"id"`
	UserID        string    `json:"user_id" db:"user_id"`
	CompanyID     string    `json:"company_id" db:"company_id"`
	LastMessage   string    `json:"last_message" db:"last_message"`
	LastMessageAt time.Time `json:"last_message_at" db:"last_message_at"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// Message represents chat messages
type Message struct {
	ID          string    `json:"id" db:"id"`
	ChatID      string    `json:"chat_id" db:"chat_id"`
	SenderID    string    `json:"sender_id" db:"sender_id"`
	SenderType  string    `json:"sender_type" db:"sender_type"` // user, employee, ai_agent
	Content     string    `json:"content" db:"content"`
	MessageType string    `json:"message_type" db:"message_type"` // text, image, file
	Metadata    string    `json:"metadata" db:"metadata"`         // JSON string
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// NotificationSchedule represents scheduled notifications
type NotificationSchedule struct {
	ID           string     `json:"id" db:"id"`
	UserID       string     `json:"user_id" db:"user_id"`
	Type         string     `json:"type" db:"type"` // booking_reminder, order_update, follow_up
	Title        string     `json:"title" db:"title"`
	Message      string     `json:"message" db:"message"`
	ScheduledFor time.Time  `json:"scheduled_for" db:"scheduled_for"`
	Sent         bool       `json:"sent" db:"sent"`
	SentAt       *time.Time `json:"sent_at" db:"sent_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
}

// AIAgent represents AI agent configurations
type AIAgent struct {
	ID           string    `json:"id" db:"id"`
	CompanyID    string    `json:"company_id" db:"company_id"`
	Name         string    `json:"name" db:"name"`
	Type         string    `json:"type" db:"type"` // booking_assistant, customer_support, etc.
	SystemPrompt string    `json:"system_prompt" db:"system_prompt"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}
