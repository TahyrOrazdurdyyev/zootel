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
	Role                string         `json:"role" db:"role"`     // pet_owner, company_owner, employee, super_admin
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
	StripeWebhookSecret  string    `json:"stripe_webhook_secret" db:"stripe_webhook_secret"`
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
	ID                        string         `json:"id" db:"id"`
	OwnerID                   string         `json:"owner_id" db:"owner_id"`
	Name                      string         `json:"name" db:"name"`
	Description               string         `json:"description" db:"description"`
	Categories                pq.StringArray `json:"categories" db:"categories"`
	Country                   string         `json:"country" db:"country"`
	State                     string         `json:"state" db:"state"`
	City                      string         `json:"city" db:"city"`
	Address                   string         `json:"address" db:"address"`
	Phone                     string         `json:"phone" db:"phone"`
	Email                     string         `json:"email" db:"email"`
	Website                   string         `json:"website" db:"website"`
	LogoURL                   string         `json:"logo_url" db:"logo_url"`
	MediaGallery              pq.StringArray `json:"media_gallery" db:"media_gallery"`
	BusinessHours             string         `json:"business_hours" db:"business_hours"` // JSON string
	PlanID                    string         `json:"plan_id" db:"plan_id"`
	TrialExpired              bool           `json:"trial_expired" db:"trial_expired"`
	SpecialPartner            bool           `json:"special_partner" db:"special_partner"`
	ManualEnabledCRM          bool           `json:"manual_enabled_crm" db:"manual_enabled_crm"`
	ManualEnabledAIAgents     bool           `json:"manual_enabled_ai_agents" db:"manual_enabled_ai_agents"`
	IsDemo                    bool           `json:"is_demo" db:"is_demo"`
	IsActive                  bool           `json:"is_active" db:"is_active"`
	WebsiteIntegrationEnabled bool           `json:"website_integration_enabled" db:"website_integration_enabled"`
	APIKey                    string         `json:"api_key,omitempty" db:"api_key"`
	PublishToMarketplace      bool           `json:"publish_to_marketplace" db:"publish_to_marketplace"`
	CreatedAt                 time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt                 time.Time      `json:"updated_at" db:"updated_at"`
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
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Icon        string    `json:"icon" db:"icon"`
	IconName    string    `json:"icon_name" db:"icon_name"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Service represents a company service
type Service struct {
	ID                 string         `json:"id" db:"id"`
	CompanyID          string         `json:"company_id" db:"company_id"`
	CategoryID         string         `json:"category_id" db:"category_id"`
	Name               string         `json:"name" db:"name"`
	Description        string         `json:"description" db:"description"`
	Price              float64        `json:"price" db:"price"`
	Duration           int            `json:"duration" db:"duration"` // minutes
	ImageURL           string         `json:"image_url" db:"image_url"`
	ImageID            string         `json:"image_id" db:"image_id"`
	PetTypes           pq.StringArray `json:"pet_types" db:"pet_types"`
	AvailableDays      pq.StringArray `json:"available_days" db:"available_days"`
	StartTime          string         `json:"start_time" db:"start_time"`
	EndTime            string         `json:"end_time" db:"end_time"`
	AssignedEmployees  pq.StringArray `json:"assigned_employees" db:"assigned_employees"`
	MaxBookingsPerSlot int            `json:"max_bookings_per_slot" db:"max_bookings_per_slot"`
	BufferTimeBefore   int            `json:"buffer_time_before" db:"buffer_time_before"`
	BufferTimeAfter    int            `json:"buffer_time_after" db:"buffer_time_after"`
	AdvanceBookingDays int            `json:"advance_booking_days" db:"advance_booking_days"`
	CancellationPolicy string         `json:"cancellation_policy" db:"cancellation_policy"`
	IsActive           bool           `json:"is_active" db:"is_active"`
	CreatedAt          time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at" db:"updated_at"`
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
	PetID      *string   `json:"pet_id" db:"pet_id"`
	EmployeeID *string   `json:"employee_id" db:"employee_id"`
	DateTime   time.Time `json:"date_time" db:"date_time"`
	Duration   int       `json:"duration" db:"duration"` // in minutes
	Price      float64   `json:"price" db:"price"`
	Status     string    `json:"status" db:"status"` // pending, confirmed, in_progress, completed, cancelled, rejected
	Notes      *string   `json:"notes" db:"notes"`
	PaymentID  *string   `json:"payment_id" db:"payment_id"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`

	// Extended information for company views
	CustomerInfo *CustomerInfo `json:"customer_info,omitempty"`
	PetInfo      *PetInfo      `json:"pet_info,omitempty"`
	ServiceName  string        `json:"service_name,omitempty"`
	EmployeeName string        `json:"employee_name,omitempty"`
}

// CustomerInfo contains customer details for company views
type CustomerInfo struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

// PetInfo contains pet details for company views
type PetInfo struct {
	Name      string `json:"name"`
	Gender    string `json:"gender"`
	PetType   string `json:"pet_type"`
	BreedName string `json:"breed_name"`
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

// AvailableAddon represents addons available for purchase
type AvailableAddon struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Price       float64   `json:"price" db:"price"`
	Type        string    `json:"type" db:"type"` // ai_agent, feature, storage, etc.
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CompanyAddon represents addons assigned to companies
type CompanyAddon struct {
	ID         int       `json:"id" db:"id"`
	CompanyID  string    `json:"company_id" db:"company_id"`
	AddonType  string    `json:"addon_type" db:"addon_type"`
	AddonKey   string    `json:"addon_key" db:"addon_key"`
	AddonValue string    `json:"addon_value" db:"addon_value"`
	IsActive   bool      `json:"is_active" db:"is_active"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// AddonRequest represents request to add addon to company
type AddonRequest struct {
	CompanyID  string `json:"company_id" binding:"required"`
	AddonType  string `json:"addon_type" binding:"required"`
	AddonKey   string `json:"addon_key" binding:"required"`
	AddonValue string `json:"addon_value" binding:"required"`
}

// CompanyAddonSummary represents addon summary for a company
type CompanyAddonSummary struct {
	CompanyID    string  `json:"company_id" db:"company_id"`
	CompanyName  string  `json:"company_name" db:"company_name"`
	TotalAddons  int     `json:"total_addons" db:"total_addons"`
	ActiveAddons int     `json:"active_addons" db:"active_addons"`
	TotalCost    float64 `json:"total_cost" db:"total_cost"`
}

// Integration models
type IntegrationFeatureRequest struct {
	AllowedDomains []string `json:"allowed_domains"`
	Features       []string `json:"features"`
}

type APIKeyResponse struct {
	APIKey    string    `json:"api_key"`
	CreatedAt time.Time `json:"created_at"`
}

type IntegrationSettings struct {
	WebsiteIntegrationEnabled bool      `json:"website_integration_enabled"`
	APIKey                    string    `json:"api_key,omitempty"`
	APIKeyCreatedAt           time.Time `json:"api_key_created_at"`
	AllowedDomains            []string  `json:"allowed_domains"`
	PublishToMarketplace      bool      `json:"publish_to_marketplace"`
}

type IntegrationFeature struct {
	FeatureKey   string    `json:"feature_key"`
	FeatureValue string    `json:"feature_value"`
	IsEnabled    bool      `json:"is_enabled"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type MarketplaceEligibility struct {
	CanToggle bool   `json:"can_toggle"`
	Reason    string `json:"reason,omitempty"`
}

type SourceAnalytic struct {
	SourceType       string    `json:"source_type"`
	InteractionCount int       `json:"interaction_count"`
	UniqueUsers      int       `json:"unique_users"`
	TotalValue       float64   `json:"total_value"`
	Date             time.Time `json:"date"`
}

type SourceSummary struct {
	TotalInteractions int     `json:"total_interactions"`
	UniqueVisitors    int     `json:"unique_visitors"`
	Bookings          int     `json:"bookings"`
	Purchases         int     `json:"purchases"`
	TotalValue        float64 `json:"total_value"`
}

// Cart models
type ShoppingCart struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	SessionID string    `json:"session_id" db:"session_id"`
	Status    string    `json:"status" db:"status"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type CartItem struct {
	ID                  string    `json:"id" db:"id"`
	CartID              string    `json:"cart_id" db:"cart_id"`
	CompanyID           string    `json:"company_id" db:"company_id"`
	ItemType            string    `json:"item_type" db:"item_type"`
	ItemID              string    `json:"item_id" db:"item_id"`
	Quantity            int       `json:"quantity" db:"quantity"`
	UnitPrice           float64   `json:"unit_price" db:"unit_price"`
	TotalPrice          float64   `json:"total_price" db:"total_price"`
	SelectedOptions     string    `json:"selected_options" db:"selected_options"`
	SpecialInstructions string    `json:"special_instructions" db:"special_instructions"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
}

type CartTotal struct {
	Subtotal       float64 `json:"subtotal"`
	DiscountAmount float64 `json:"discount_amount"`
	TaxAmount      float64 `json:"tax_amount"`
	Total          float64 `json:"total"`
	ItemCount      int     `json:"item_count"`
}

type SavedItem struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	CompanyID string    `json:"company_id" db:"company_id"`
	ItemType  string    `json:"item_type" db:"item_type"`
	ItemID    string    `json:"item_id" db:"item_id"`
	Notes     string    `json:"notes" db:"notes"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type CartAbandonment struct {
	ID                  string     `json:"id" db:"id"`
	CartID              string     `json:"cart_id" db:"cart_id"`
	UserID              string     `json:"user_id" db:"user_id"`
	Email               string     `json:"email" db:"email"`
	TotalValue          float64    `json:"total_value" db:"total_value"`
	ItemsCount          int        `json:"items_count" db:"items_count"`
	AbandonedAt         time.Time  `json:"abandoned_at" db:"abandoned_at"`
	RecoveryEmailSent   bool       `json:"recovery_email_sent" db:"recovery_email_sent"`
	RecoveryEmailSentAt *time.Time `json:"recovery_email_sent_at" db:"recovery_email_sent_at"`
}

// Payment represents a payment transaction
type Payment struct {
	ID                    string     `json:"id" db:"id"`
	UserID                string     `json:"user_id" db:"user_id"`
	CompanyID             *string    `json:"company_id" db:"company_id"`
	BookingID             *string    `json:"booking_id" db:"booking_id"`
	OrderID               *string    `json:"order_id" db:"order_id"`
	StripePaymentIntentID string     `json:"stripe_payment_intent_id" db:"stripe_payment_intent_id"`
	Amount                float64    `json:"amount" db:"amount"`
	Currency              string     `json:"currency" db:"currency"`
	Status                string     `json:"status" db:"status"` // pending, succeeded, failed, canceled, refunded, partially_refunded
	CommissionAmount      float64    `json:"commission_amount" db:"commission_amount"`
	PlatformAmount        float64    `json:"platform_amount" db:"platform_amount"` // Amount held by platform (with commission)
	CompanyAmount         float64    `json:"company_amount" db:"company_amount"`   // Amount to be transferred to company
	TransferredAt         *time.Time `json:"transferred_at" db:"transferred_at"`   // When money was transferred to company
	PaymentMethodType     string     `json:"payment_method_type" db:"payment_method_type"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at" db:"updated_at"`
}

// Refund represents payment refunds
type Refund struct {
	ID             string    `json:"id" db:"id"`
	PaymentID      string    `json:"payment_id" db:"payment_id"`
	StripeRefundID string    `json:"stripe_refund_id" db:"stripe_refund_id"`
	Amount         float64   `json:"amount" db:"amount"`
	Reason         string    `json:"reason" db:"reason"`
	Status         string    `json:"status" db:"status"` // pending, succeeded, failed
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// FileUpload represents uploaded files
type FileUpload struct {
	ID           string    `json:"id" db:"id"`
	OriginalName string    `json:"original_name" db:"original_name"`
	FileName     string    `json:"file_name" db:"file_name"`
	FilePath     string    `json:"file_path" db:"file_path"`
	FileSize     int64     `json:"file_size" db:"file_size"`
	MimeType     string    `json:"mime_type" db:"mime_type"`
	Purpose      string    `json:"purpose" db:"purpose"`         // avatar, pet, service, gallery, etc.
	EntityType   string    `json:"entity_type" db:"entity_type"` // user, pet, service, company
	EntityID     string    `json:"entity_id" db:"entity_id"`
	UploaderID   string    `json:"uploader_id" db:"uploader_id"`
	UploaderType string    `json:"uploader_type" db:"uploader_type"` // user, employee
	IsPublic     bool      `json:"is_public" db:"is_public"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}
