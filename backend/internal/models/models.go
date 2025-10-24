package models

import (
	"time"

	"github.com/lib/pq"
)

// User represents a platform user (Pet Owner or Company Owner)
type User struct {
	ID          string     `json:"id" db:"id"`
	FirebaseUID string     `json:"firebase_uid" db:"firebase_uid"`
	Email       string     `json:"email" db:"email"`
	FirstName   string     `json:"first_name" db:"first_name"`
	LastName    string     `json:"last_name" db:"last_name"`
	Role        string     `json:"role" db:"role"`     // pet_owner, company_owner, employee, super_admin
	Gender      string     `json:"gender" db:"gender"` // male, female, other
	DateOfBirth *time.Time `json:"date_of_birth" db:"date_of_birth"`
	Phone       string     `json:"phone" db:"phone"`

	// Detailed address information
	Address         string `json:"address" db:"address"`
	ApartmentNumber string `json:"apartment_number" db:"apartment_number"`
	Country         string `json:"country" db:"country"`
	State           string `json:"state" db:"state"`
	City            string `json:"city" db:"city"`
	PostalCode      string `json:"postal_code" db:"postal_code"`
	Timezone        string `json:"timezone" db:"timezone"`

	AvatarURL string `json:"avatar_url" db:"avatar_url"`

	// Emergency contact details
	EmergencyContact         string `json:"emergency_contact" db:"emergency_contact"`
	EmergencyContactName     string `json:"emergency_contact_name" db:"emergency_contact_name"`
	EmergencyContactPhone    string `json:"emergency_contact_phone" db:"emergency_contact_phone"`
	EmergencyContactRelation string `json:"emergency_contact_relation" db:"emergency_contact_relation"`

	// Veterinarian contact details
	VetContact string `json:"vet_contact" db:"vet_contact"`
	VetName    string `json:"vet_name" db:"vet_name"`
	VetClinic  string `json:"vet_clinic" db:"vet_clinic"`
	VetPhone   string `json:"vet_phone" db:"vet_phone"`

	// Notification preferences
	NotificationMethods pq.StringArray `json:"notification_methods" db:"notification_methods"`
	NotificationsPush   bool           `json:"notifications_push" db:"notifications_push"`
	NotificationsSMS    bool           `json:"notifications_sms" db:"notifications_sms"`
	NotificationsEmail  bool           `json:"notifications_email" db:"notifications_email"`
	MarketingOptIn      bool           `json:"marketing_opt_in" db:"marketing_opt_in"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
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
	ID          string     `json:"id" db:"id"`
	UserID      string     `json:"user_id" db:"user_id"`
	Name        string     `json:"name" db:"name"`
	PetTypeID   string     `json:"pet_type_id" db:"pet_type_id"`
	BreedID     string     `json:"breed_id" db:"breed_id"`
	Gender      string     `json:"gender" db:"gender"` // male, female, unknown
	DateOfBirth *time.Time `json:"date_of_birth" db:"date_of_birth"`
	Weight      float64    `json:"weight" db:"weight"`
	MicrochipID string     `json:"microchip_id" db:"microchip_id"`
	Sterilized  bool       `json:"sterilized" db:"sterilized"`

	// Photos
	PhotoURL     string         `json:"photo_url" db:"photo_url"`
	PhotoGallery pq.StringArray `json:"photo_gallery" db:"photo_gallery"`

	// Medical information
	Vaccinations        string         `json:"vaccinations" db:"vaccinations"` // JSON string of VaccinationRecord[]
	Allergies           pq.StringArray `json:"allergies" db:"allergies"`
	Medications         string         `json:"medications" db:"medications"` // JSON string of MedicationRecord[]
	ChronicConditions   pq.StringArray `json:"chronic_conditions" db:"chronic_conditions"`
	SpecialNeeds        string         `json:"special_needs" db:"special_needs"`
	DietaryRestrictions string         `json:"dietary_restrictions" db:"dietary_restrictions"`

	// Veterinarian contacts
	VetContact string `json:"vet_contact" db:"vet_contact"`
	VetName    string `json:"vet_name" db:"vet_name"`
	VetPhone   string `json:"vet_phone" db:"vet_phone"`
	VetClinic  string `json:"vet_clinic" db:"vet_clinic"`

	// Additional notes
	Notes           string `json:"notes" db:"notes"`
	FavoriteToys    string `json:"favorite_toys" db:"favorite_toys"`
	BehaviorNotes   string `json:"behavior_notes" db:"behavior_notes"`
	StressReactions string `json:"stress_reactions" db:"stress_reactions"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Review represents a customer review for a company or service
type Review struct {
	ID          string     `json:"id" db:"id"`
	UserID      string     `json:"user_id" db:"user_id"`
	CompanyID   string     `json:"company_id" db:"company_id"`
	ServiceID   *string    `json:"service_id" db:"service_id"`
	BookingID   *string    `json:"booking_id" db:"booking_id"`
	OrderID     *string    `json:"order_id" db:"order_id"`
	Rating      int        `json:"rating" db:"rating"` // 1-5 stars
	Comment     string     `json:"comment" db:"comment"`
	Photos      []string   `json:"photos" db:"photos"`
	IsAnonymous bool       `json:"is_anonymous" db:"is_anonymous"`
	Status      string     `json:"status" db:"status"`     // pending, approved, rejected
	Response    *string    `json:"response" db:"response"` // Company response
	RespondedAt *time.Time `json:"responded_at" db:"responded_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`

	// Extended information for display
	CustomerInfo *CustomerInfo `json:"customer_info,omitempty"`
	ServiceName  string        `json:"service_name,omitempty"`
	CompanyName  string        `json:"company_name,omitempty"`
}

// ReviewRequest represents a request to create a review
type ReviewRequest struct {
	CompanyID   string   `json:"company_id" binding:"required"`
	ServiceID   *string  `json:"service_id"`
	BookingID   *string  `json:"booking_id"`
	OrderID     *string  `json:"order_id"`
	Rating      int      `json:"rating" binding:"required,min=1,max=5"`
	Comment     string   `json:"comment" binding:"required,min=10,max=1000"`
	Photos      []string `json:"photos"`
	IsAnonymous bool     `json:"is_anonymous"`
}

// ReviewResponse represents a company's response to a review
type ReviewResponse struct {
	ReviewID  string `json:"review_id" binding:"required"`
	Response  string `json:"response" binding:"required,min=10,max=500"`
	CompanyID string `json:"company_id"`
}

// ReviewStats represents review statistics for a company
type ReviewStats struct {
	CompanyID       string      `json:"company_id"`
	TotalReviews    int         `json:"total_reviews"`
	AverageRating   float64     `json:"average_rating"`
	RatingBreakdown map[int]int `json:"rating_breakdown"` // {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}
	RecentReviews   []Review    `json:"recent_reviews"`
}

// ReviewFilter represents filters for getting reviews
type ReviewFilter struct {
	CompanyID string     `json:"company_id"`
	ServiceID *string    `json:"service_id"`
	Rating    *int       `json:"rating"`
	Status    string     `json:"status"`
	UserID    *string    `json:"user_id"`
	DateFrom  *time.Time `json:"date_from"`
	DateTo    *time.Time `json:"date_to"`
	Limit     int        `json:"limit"`
	Offset    int        `json:"offset"`
}

// VaccinationRecord represents pet vaccination records
type VaccinationRecord struct {
	ID               string     `json:"id" db:"id"`
	PetID            string     `json:"pet_id" db:"pet_id"`
	VaccineName      string     `json:"vaccine_name" db:"vaccine_name"`
	DateAdministered time.Time  `json:"date_administered" db:"date_administered"`
	ExpiryDate       *time.Time `json:"expiry_date" db:"expiry_date"`
	VetName          string     `json:"vet_name" db:"vet_name"`
	VetClinic        string     `json:"vet_clinic" db:"vet_clinic"`
	BatchNumber      string     `json:"batch_number" db:"batch_number"`
	Notes            string     `json:"notes" db:"notes"`
	NextDueDate      *time.Time `json:"next_due_date" db:"next_due_date"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// MedicationRecord represents pet medication records
type MedicationRecord struct {
	ID             string     `json:"id" db:"id"`
	PetID          string     `json:"pet_id" db:"pet_id"`
	MedicationName string     `json:"medication_name" db:"medication_name"`
	Dosage         string     `json:"dosage" db:"dosage"`
	Frequency      string     `json:"frequency" db:"frequency"`
	StartDate      time.Time  `json:"start_date" db:"start_date"`
	EndDate        *time.Time `json:"end_date" db:"end_date"`
	PrescribedBy   string     `json:"prescribed_by" db:"prescribed_by"`
	Instructions   string     `json:"instructions" db:"instructions"`
	SideEffects    string     `json:"side_effects" db:"side_effects"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

// PetMedicalHistory represents comprehensive medical history
type PetMedicalHistory struct {
	PetID           string              `json:"pet_id"`
	Vaccinations    []VaccinationRecord `json:"vaccinations"`
	Medications     []MedicationRecord  `json:"medications"`
	LastCheckupDate *time.Time          `json:"last_checkup_date"`
	NextCheckupDate *time.Time          `json:"next_checkup_date"`
	MedicalAlerts   []string            `json:"medical_alerts"`
}

// Company represents pet care businesses
type Company struct {
	ID                        string         `json:"id" db:"id"`
	OwnerID                   string         `json:"owner_id" db:"owner_id"`
	Name                      string         `json:"name" db:"name"`
	Description               string         `json:"description" db:"description"`
	Categories                pq.StringArray `json:"categories" db:"categories"`
	BusinessType              string         `json:"business_type" db:"business_type"` // veterinary, grooming, boarding, training, walking, sitting, pet_taxi, retail, general
	Country                   string         `json:"country" db:"country"`
	State                     string         `json:"state" db:"state"`
	City                      string         `json:"city" db:"city"`
	Address                   string         `json:"address" db:"address"`
	Latitude                  *float64       `json:"latitude" db:"latitude"`
	Longitude                 *float64       `json:"longitude" db:"longitude"`
	Phone                     string         `json:"phone" db:"phone"`
	Email                     string         `json:"email" db:"email"`
	Website                   string         `json:"website" db:"website"`
	LogoURL                   string         `json:"logo_url" db:"logo_url"`
	MediaGallery              pq.StringArray `json:"media_gallery" db:"media_gallery"`
	BusinessHours             string         `json:"business_hours" db:"business_hours"`
	PlanID                    string         `json:"plan_id" db:"plan_id"`
	TrialExpired              bool           `json:"trial_expired" db:"trial_expired"`
	TrialEndsAt               *time.Time     `json:"trial_ends_at" db:"trial_ends_at"`
	SubscriptionExpiresAt     *time.Time     `json:"subscription_expires_at" db:"subscription_expires_at"`
	SubscriptionStatus        string         `json:"subscription_status" db:"subscription_status"` // active, expired, canceled
	SpecialPartner            bool           `json:"special_partner" db:"special_partner"`
	ManualEnabledCRM          bool           `json:"manual_enabled_crm" db:"manual_enabled_crm"`
	ManualEnabledAIAgents     bool           `json:"manual_enabled_ai_agents" db:"manual_enabled_ai_agents"`
	IsDemo                    bool           `json:"is_demo" db:"is_demo"`
	IsActive                  bool           `json:"is_active" db:"is_active"`
	WebsiteIntegrationEnabled bool           `json:"website_integration_enabled" db:"website_integration_enabled"`
	APIKey                    string         `json:"api_key" db:"api_key"`
	PublishToMarketplace      bool           `json:"publish_to_marketplace" db:"publish_to_marketplace"`
	CreatedAt                 time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt                 time.Time      `json:"updated_at" db:"updated_at"`
}

// CompanyDetails представляет расширенную информацию о компании для админ панели
type CompanyDetails struct {
	// Основная информация компании
	ID           string `json:"id" db:"id"`
	Name         string `json:"name" db:"name"`
	Description  string `json:"description" db:"description"`
	BusinessType string `json:"business_type" db:"business_type"`
	Email        string `json:"email" db:"email"`
	Phone        string `json:"phone" db:"phone"`
	Website      string `json:"website" db:"website"`
	LogoURL      string `json:"logo_url" db:"logo_url"`

	// Адрес
	Address    string `json:"address" db:"address"`
	City       string `json:"city" db:"city"`
	State      string `json:"state" db:"state"`
	PostalCode string `json:"postal_code" db:"postal_code"`
	Country    string `json:"country" db:"country"`

	// Статус и активность
	IsActive   bool   `json:"is_active" db:"is_active"`
	IsVerified bool   `json:"is_verified" db:"is_verified"`
	Status     string `json:"status"` // active, trial, trial_expired, inactive, paid

	// Информация о плане
	PlanID    string  `json:"plan_id" db:"plan_id"`
	PlanName  string  `json:"plan_name"`
	PlanPrice float64 `json:"plan_price"`

	// Информация о владельце
	OwnerID        string `json:"owner_id" db:"owner_id"`
	OwnerFirstName string `json:"owner_first_name"`
	OwnerLastName  string `json:"owner_last_name"`
	OwnerEmail     string `json:"owner_email"`

	// Пробный период
	TrialStartDate *time.Time `json:"trial_start_date" db:"trial_start_date"`
	TrialEndDate   *time.Time `json:"trial_end_date" db:"trial_end_date"`

	// Статистика
	TotalBookings  int     `json:"total_bookings"`
	TotalCustomers int     `json:"total_customers"`
	TotalRevenue   float64 `json:"total_revenue"`
	EmployeeCount  int     `json:"employee_count"`

	// Даты
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CompanyFeatureStatus представляет статус функций компании с разделением на оплаченные и бесплатные
type CompanyFeatureStatus struct {
	CompanyID   string `json:"company_id"`
	CompanyName string `json:"company_name"`

	// CRM статус
	ManualCRM  bool `json:"manual_crm"`   // Ручно включен админом
	PaidCRM    bool `json:"paid_crm"`     // Включен в план подписки
	HasPaidCRM bool `json:"has_paid_crm"` // Компания имеет оплаченный CRM

	// AI статус
	ManualAI         bool     `json:"manual_ai"`          // Ручно включен админом
	HasPaidAI        bool     `json:"has_paid_ai"`        // Компания имеет оплаченные AI агенты
	IncludedAIAgents []string `json:"included_ai_agents"` // AI агенты из плана подписки
	AddonAIAgents    []string `json:"addon_ai_agents"`    // AI агенты добавленные как addon'ы

	// Подписка
	SubscriptionStatus string `json:"subscription_status"` // active, expired, canceled
	PlanID             string `json:"plan_id"`
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
	Role        string         `json:"role" db:"role"` // manager, veterinarian, groomer, receptionist, cashier
	Permissions pq.StringArray `json:"permissions" db:"permissions"`
	Department  string         `json:"department" db:"department"` // grooming, medical, reception, management
	HireDate    *time.Time     `json:"hire_date" db:"hire_date"`
	Salary      *float64       `json:"salary" db:"salary"`
	IsActive    bool           `json:"is_active" db:"is_active"`
	LastLogin   *time.Time     `json:"last_login" db:"last_login"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at" db:"updated_at"`

	// Extended info for responses
	CompanyName string `json:"company_name,omitempty"`
}

// EmployeeRole represents predefined employee roles
type EmployeeRole struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Permissions pq.StringArray `json:"permissions"`
	Department  string         `json:"department"`
}

// EmployeePermission represents individual permissions
type EmployeePermission struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"` // bookings, analytics, customers, settings, etc.
}

// EmployeeRequest represents request to create/update employee
type EmployeeRequest struct {
	Username    string     `json:"username" binding:"required"`
	Password    string     `json:"password"`
	FirstName   string     `json:"first_name" binding:"required"`
	LastName    string     `json:"last_name" binding:"required"`
	Email       string     `json:"email" binding:"required,email"`
	Phone       string     `json:"phone"`
	Role        string     `json:"role" binding:"required"`
	Permissions []string   `json:"permissions"`
	Department  string     `json:"department"`
	HireDate    *time.Time `json:"hire_date"`
	Salary      *float64   `json:"salary"`
}

// EmployeeLoginRequest represents employee login request
type EmployeeLoginRequest struct {
	Username  string `json:"username" binding:"required"`
	Password  string `json:"password" binding:"required"`
	CompanyID string `json:"company_id" binding:"required"`
}

// EmployeeSession represents employee session data
type EmployeeSession struct {
	EmployeeID  string    `json:"employee_id"`
	CompanyID   string    `json:"company_id"`
	Username    string    `json:"username"`
	Role        string    `json:"role"`
	Permissions []string  `json:"permissions"`
	Department  string    `json:"department"`
	LoginTime   time.Time `json:"login_time"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// Permission constants
const (
	// Booking permissions
	PermissionViewBookings    = "view_bookings"
	PermissionCreateBookings  = "create_bookings"
	PermissionEditBookings    = "edit_bookings"
	PermissionCancelBookings  = "cancel_bookings"
	PermissionViewAllBookings = "view_all_bookings" // Own vs all company bookings

	// Customer permissions
	PermissionViewCustomers    = "view_customers"
	PermissionEditCustomers    = "edit_customers"
	PermissionViewCustomerData = "view_customer_data" // Personal data access

	// Analytics permissions
	PermissionViewAnalytics = "view_analytics"
	PermissionViewReports   = "view_reports"
	PermissionExportData    = "export_data"

	// Financial permissions
	PermissionViewFinancials  = "view_financials"
	PermissionProcessPayments = "process_payments"
	PermissionIssueRefunds    = "issue_refunds"

	// Employee management
	PermissionViewEmployees   = "view_employees"
	PermissionManageEmployees = "manage_employees"
	PermissionViewSalaries    = "view_salaries"

	// Service management
	PermissionViewServices   = "view_services"
	PermissionManageServices = "manage_services"
	PermissionSetPrices      = "set_prices"

	// Inventory management
	PermissionViewInventory   = "view_inventory"
	PermissionManageInventory = "manage_inventory"

	// System settings
	PermissionViewSettings       = "view_settings"
	PermissionManageSettings     = "manage_settings"
	PermissionManageIntegrations = "manage_integrations"

	// Reviews and ratings
	PermissionViewReviews    = "view_reviews"
	PermissionRespondReviews = "respond_reviews"

	// Special permissions
	PermissionAll      = "all"       // Full access
	PermissionReadOnly = "read_only" // Read-only access
)

// Predefined roles with their permissions
var PredefinedRoles = map[string]EmployeeRole{
	"manager": {
		ID:          "manager",
		Name:        "Менеджер",
		Description: "Полный доступ к управлению компанией",
		Department:  "management",
		Permissions: []string{
			PermissionAll,
		},
	},
	"veterinarian": {
		ID:          "veterinarian",
		Name:        "Ветеринар",
		Description: "Доступ к медицинским функциям и записям",
		Department:  "medical",
		Permissions: []string{
			PermissionViewBookings, PermissionEditBookings, PermissionViewCustomers,
			PermissionViewCustomerData, PermissionViewServices,
		},
	},
	"groomer": {
		ID:          "groomer",
		Name:        "Грумер",
		Description: "Доступ к грумингу и своим записям",
		Department:  "grooming",
		Permissions: []string{
			PermissionViewBookings, PermissionEditBookings, PermissionViewCustomers,
		},
	},
	"receptionist": {
		ID:          "receptionist",
		Name:        "Администратор",
		Description: "Управление записями и клиентами",
		Department:  "reception",
		Permissions: []string{
			PermissionViewBookings, PermissionCreateBookings, PermissionEditBookings,
			PermissionViewCustomers, PermissionEditCustomers, PermissionProcessPayments,
		},
	},
	"cashier": {
		ID:          "cashier",
		Name:        "Кассир",
		Description: "Обработка платежей и продаж",
		Department:  "reception",
		Permissions: []string{
			PermissionViewBookings, PermissionViewCustomers, PermissionProcessPayments,
			PermissionViewInventory,
		},
	},
	"analyst": {
		ID:          "analyst",
		Name:        "Аналитик",
		Description: "Доступ к аналитике и отчетам",
		Department:  "management",
		Permissions: []string{
			PermissionViewAnalytics, PermissionViewReports, PermissionExportData,
			PermissionViewFinancials, PermissionViewBookings, PermissionViewCustomers,
		},
	},
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
	OriginalPrice      *float64       `json:"original_price" db:"original_price"`
	DiscountPercentage *int           `json:"discount_percentage" db:"discount_percentage"`
	IsOnSale           bool           `json:"is_on_sale" db:"is_on_sale"`
	SaleStartDate      *time.Time     `json:"sale_start_date" db:"sale_start_date"`
	SaleEndDate        *time.Time     `json:"sale_end_date" db:"sale_end_date"`
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
	ID                   string         `json:"id" db:"id"`
	CompanyID            string         `json:"company_id" db:"company_id"`
	CategoryID           string         `json:"category_id" db:"category_id"`
	Name                 string         `json:"name" db:"name"`
	Description          string         `json:"description" db:"description"`
	Composition          string         `json:"composition" db:"composition"`
	Ingredients          string         `json:"ingredients" db:"ingredients"`
	NutritionalInfo      string         `json:"nutritional_info" db:"nutritional_info"` // JSON string
	Specifications       string         `json:"specifications" db:"specifications"`     // JSON string
	Price                float64        `json:"price" db:"price"`
	Cost                 *float64       `json:"cost" db:"cost"` // Product cost for inventory
	WholesalePrice       *float64       `json:"wholesale_price" db:"wholesale_price"`
	MinWholesaleQuantity int            `json:"min_wholesale_quantity" db:"min_wholesale_quantity"`
	Stock                int            `json:"stock" db:"stock"`
	LowStockAlert        int            `json:"low_stock_alert" db:"low_stock_alert"`
	Unit                 string         `json:"unit" db:"unit"` // Unit of measurement (piece, kg, etc.)
	ImageURL             string         `json:"image_url" db:"image_url"`
	ImageGallery         pq.StringArray `json:"image_gallery" db:"image_gallery"`
	IsActive             bool           `json:"is_active" db:"is_active"`
	CreatedAt            time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at" db:"updated_at"`
}

// ProductVariant represents product variants (size, color, etc.)
type ProductVariant struct {
	ID             string         `json:"id" db:"id"`
	ProductID      string         `json:"product_id" db:"product_id"`
	VariantName    string         `json:"variant_name" db:"variant_name"`
	SKU            string         `json:"sku" db:"sku"`
	Attributes     string         `json:"attributes" db:"attributes"` // JSON string
	Price          float64        `json:"price" db:"price"`
	WholesalePrice *float64       `json:"wholesale_price" db:"wholesale_price"`
	Stock          int            `json:"stock" db:"stock"`
	LowStockAlert  int            `json:"low_stock_alert" db:"low_stock_alert"`
	ImageURL       string         `json:"image_url" db:"image_url"`
	ImageGallery   pq.StringArray `json:"image_gallery" db:"image_gallery"`
	IsDefault      bool           `json:"is_default" db:"is_default"`
	IsActive       bool           `json:"is_active" db:"is_active"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at" db:"updated_at"`
}

// ProductAttribute represents product attribute types
type ProductAttribute struct {
	ID            string    `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	DisplayName   string    `json:"display_name" db:"display_name"`
	AttributeType string    `json:"attribute_type" db:"attribute_type"`
	IsRequired    bool      `json:"is_required" db:"is_required"`
	SortOrder     int       `json:"sort_order" db:"sort_order"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// ProductAttributeValue represents attribute values
type ProductAttributeValue struct {
	ID           string    `json:"id" db:"id"`
	AttributeID  string    `json:"attribute_id" db:"attribute_id"`
	Value        string    `json:"value" db:"value"`
	DisplayValue string    `json:"display_value" db:"display_value"`
	SortOrder    int       `json:"sort_order" db:"sort_order"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// DeliveryMethod represents delivery options
type DeliveryMethod struct {
	ID                    string    `json:"id" db:"id"`
	CompanyID             *string   `json:"company_id" db:"company_id"`
	Name                  string    `json:"name" db:"name"`
	Description           string    `json:"description" db:"description"`
	MethodType            string    `json:"method_type" db:"method_type"`
	BasePrice             float64   `json:"base_price" db:"base_price"`
	PricePerKm            float64   `json:"price_per_km" db:"price_per_km"`
	FreeDeliveryThreshold *float64  `json:"free_delivery_threshold" db:"free_delivery_threshold"`
	EstimatedDeliveryDays int       `json:"estimated_delivery_days" db:"estimated_delivery_days"`
	IsActive              bool      `json:"is_active" db:"is_active"`
	AvailabilityZones     string    `json:"availability_zones" db:"availability_zones"` // JSON string
	WorkingHours          string    `json:"working_hours" db:"working_hours"`           // JSON string
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time `json:"updated_at" db:"updated_at"`
}

// PriceTier represents quantity-based pricing
type PriceTier struct {
	ID                 string    `json:"id" db:"id"`
	ProductID          *string   `json:"product_id" db:"product_id"`
	VariantID          *string   `json:"variant_id" db:"variant_id"`
	MinQuantity        int       `json:"min_quantity" db:"min_quantity"`
	MaxQuantity        *int      `json:"max_quantity" db:"max_quantity"`
	Price              float64   `json:"price" db:"price"`
	DiscountPercentage *float64  `json:"discount_percentage" db:"discount_percentage"`
	TierName           string    `json:"tier_name" db:"tier_name"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
}

// CustomerSegment represents customer segmentation
type CustomerSegment struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	SegmentType string    `json:"segment_type" db:"segment_type"`
	Criteria    string    `json:"criteria" db:"criteria"` // JSON string
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// CustomerSegmentAssignment represents user segment assignments
type CustomerSegmentAssignment struct {
	ID           string    `json:"id" db:"id"`
	UserID       string    `json:"user_id" db:"user_id"`
	SegmentID    string    `json:"segment_id" db:"segment_id"`
	AssignedAt   time.Time `json:"assigned_at" db:"assigned_at"`
	AutoAssigned bool      `json:"auto_assigned" db:"auto_assigned"`
}

// MarketingCampaign represents marketing campaigns
type MarketingCampaign struct {
	ID                string     `json:"id" db:"id"`
	CompanyID         *string    `json:"company_id" db:"company_id"`
	Name              string     `json:"name" db:"name"`
	CampaignType      string     `json:"campaign_type" db:"campaign_type"`
	TargetSegments    string     `json:"target_segments" db:"target_segments"` // JSON string
	TemplateID        *string    `json:"template_id" db:"template_id"`
	TriggerConditions string     `json:"trigger_conditions" db:"trigger_conditions"` // JSON string
	IsActive          bool       `json:"is_active" db:"is_active"`
	StartDate         *time.Time `json:"start_date" db:"start_date"`
	EndDate           *time.Time `json:"end_date" db:"end_date"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// MarketingEvent represents marketing event tracking
type MarketingEvent struct {
	ID         string    `json:"id" db:"id"`
	CampaignID string    `json:"campaign_id" db:"campaign_id"`
	UserID     string    `json:"user_id" db:"user_id"`
	EventType  string    `json:"event_type" db:"event_type"`
	EventData  string    `json:"event_data" db:"event_data"` // JSON string
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// OrderTemplate represents saved order templates for repeat orders
type OrderTemplate struct {
	ID                 string    `json:"id" db:"id"`
	UserID             string    `json:"user_id" db:"user_id"`
	TemplateName       string    `json:"template_name" db:"template_name"`
	Items              string    `json:"items" db:"items"` // JSON string
	CreatedFromOrderID *string   `json:"created_from_order_id" db:"created_from_order_id"`
	IsFavorite         bool      `json:"is_favorite" db:"is_favorite"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// Enhanced Order model with delivery fields
type Order struct {
	ID                    string         `json:"id" db:"id"`
	UserID                string         `json:"user_id" db:"user_id"`
	CompanyID             string         `json:"company_id" db:"company_id"`
	Status                string         `json:"status" db:"status"`
	TotalAmount           float64        `json:"total_amount" db:"total_amount"`
	PaymentID             *string        `json:"payment_id" db:"payment_id"`
	PaymentStatus         string         `json:"payment_status" db:"payment_status"`
	Items                 pq.StringArray `json:"items" db:"items"` // JSON array
	ShippingAddress       string         `json:"shipping_address" db:"shipping_address"`
	BillingAddress        string         `json:"billing_address" db:"billing_address"`
	DeliveryMethodID      *string        `json:"delivery_method_id" db:"delivery_method_id"`
	DeliveryAddress       string         `json:"delivery_address" db:"delivery_address"` // JSON string
	DeliveryCost          float64        `json:"delivery_cost" db:"delivery_cost"`
	EstimatedDeliveryDate *time.Time     `json:"estimated_delivery_date" db:"estimated_delivery_date"`
	TrackingNumber        string         `json:"tracking_number" db:"tracking_number"`
	DeliveryNotes         string         `json:"delivery_notes" db:"delivery_notes"`
	Notes                 string         `json:"notes" db:"notes"`
	CreatedAt             time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at" db:"updated_at"`
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

// Note: Order model is already defined above with delivery fields

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

// CompanyAddon represents purchased addons for a company
type CompanyAddon struct {
	ID            string     `json:"id" db:"id"`
	CompanyID     string     `json:"company_id" db:"company_id"`
	AddonType     string     `json:"addon_type" db:"addon_type"` // ai_agent, extra_employee, crm_feature
	AddonKey      string     `json:"addon_key" db:"addon_key"`   // agent key or feature key
	Price         float64    `json:"price" db:"price"`
	BillingCycle  string     `json:"billing_cycle" db:"billing_cycle"` // monthly, yearly, one_time
	Status        string     `json:"status" db:"status"`               // active, inactive, cancelled
	AutoRenew     bool       `json:"auto_renew" db:"auto_renew"`
	PurchasedAt   time.Time  `json:"purchased_at" db:"purchased_at"`
	ExpiresAt     *time.Time `json:"expires_at" db:"expires_at"`
	CancelledAt   *time.Time `json:"cancelled_at" db:"cancelled_at"`
	LastBilledAt  *time.Time `json:"last_billed_at" db:"last_billed_at"`
	NextBillingAt *time.Time `json:"next_billing_at" db:"next_billing_at"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

// AddonPricing represents pricing for different addons
type AddonPricing struct {
	ID           string    `json:"id" db:"id"`
	AddonType    string    `json:"addon_type" db:"addon_type"`
	AddonKey     string    `json:"addon_key" db:"addon_key"`
	Name         string    `json:"name" db:"name"`
	Description  string    `json:"description" db:"description"`
	MonthlyPrice float64   `json:"monthly_price" db:"monthly_price"`
	YearlyPrice  float64   `json:"yearly_price" db:"yearly_price"`
	OneTimePrice *float64  `json:"one_time_price" db:"one_time_price"`
	IsAvailable  bool      `json:"is_available" db:"is_available"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// CompanyAIAgent represents an AI agent for a company (from plan or addon)
type CompanyAIAgent struct {
	AgentKey     string     `json:"agent_key"`
	Name         string     `json:"name"`
	Description  string     `json:"description"`
	Source       string     `json:"source"`                  // "plan" or "addon"
	Status       string     `json:"status"`                  // "active", "inactive", "cancelled"
	BillingCycle string     `json:"billing_cycle,omitempty"` // only for addons
	Price        float64    `json:"price,omitempty"`         // only for addons
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`    // only for addons
	PurchasedAt  *time.Time `json:"purchased_at,omitempty"`  // only for addons
}

// CompanyAIAgentsInfo represents complete AI agents info for a company
type CompanyAIAgentsInfo struct {
	CompanyID   string           `json:"company_id"`
	CompanyName string           `json:"company_name"`
	PlanName    string           `json:"plan_name"`
	PlanAgents  []CompanyAIAgent `json:"plan_agents"`
	AddonAgents []CompanyAIAgent `json:"addon_agents"`
}

// AdminActivateAgentRequest represents request to activate agent manually
type AdminActivateAgentRequest struct {
	CompanyID    string `json:"company_id" binding:"required"`
	AgentKey     string `json:"agent_key" binding:"required"`
	BillingCycle string `json:"billing_cycle" binding:"required"` // "monthly", "yearly", "one_time", "free"
}

// AIChatRequest represents a request to AI agent
type AIChatRequest struct {
	CompanyID string                 `json:"company_id" binding:"required"`
	UserID    string                 `json:"user_id"`
	AgentType string                 `json:"agent_type" binding:"required"`
	Message   string                 `json:"message" binding:"required"`
	Context   map[string]interface{} `json:"context,omitempty"`
}

// AIChatResponse represents AI agent response
type AIChatResponse struct {
	AgentKey     string                 `json:"agent_key"`
	Response     string                 `json:"response"`
	Confidence   float64                `json:"confidence"`
	TokensUsed   int                    `json:"tokens_used"`
	ProcessingMs int64                  `json:"processing_ms"`
	Context      map[string]interface{} `json:"context,omitempty"`
}

// UpdateAgentPricingRequest represents request to update agent pricing
type UpdateAgentPricingRequest struct {
	MonthlyPrice *float64 `json:"monthly_price" binding:"required"`
	YearlyPrice  *float64 `json:"yearly_price" binding:"required"`
	OneTimePrice *float64 `json:"one_time_price"`
	IsAvailable  bool     `json:"is_available"`
}

// CreateAgentRequest represents request to create new AI agent
type CreateAgentRequest struct {
	AgentKey     string   `json:"agent_key" binding:"required"`
	Name         string   `json:"name" binding:"required"`
	Description  string   `json:"description" binding:"required"`
	MonthlyPrice float64  `json:"monthly_price" binding:"required"`
	YearlyPrice  float64  `json:"yearly_price" binding:"required"`
	OneTimePrice *float64 `json:"one_time_price"`
	IsAvailable  bool     `json:"is_available"`
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

// Integration additional models
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

// AI Prompts Management Models

// AIPrompt представляет глобальный промпт для AI агента
type AIPrompt struct {
	ID         string    `json:"id" db:"id"`
	AgentKey   string    `json:"agent_key" db:"agent_key"`
	PromptType string    `json:"prompt_type" db:"prompt_type"` // system, user
	Content    string    `json:"content" db:"content"`
	Version    int       `json:"version" db:"version"`
	IsActive   bool      `json:"is_active" db:"is_active"`
	CreatedBy  *string   `json:"created_by" db:"created_by"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// CompanyAIPrompt представляет кастомный промпт компании
type CompanyAIPrompt struct {
	ID         string    `json:"id" db:"id"`
	CompanyID  string    `json:"company_id" db:"company_id"`
	AgentKey   string    `json:"agent_key" db:"agent_key"`
	PromptType string    `json:"prompt_type" db:"prompt_type"` // system, user
	Content    string    `json:"content" db:"content"`
	IsActive   bool      `json:"is_active" db:"is_active"`
	CreatedBy  *string   `json:"created_by" db:"created_by"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// AIPromptUsageLog для аналитики использования промптов
type AIPromptUsageLog struct {
	ID           string    `json:"id" db:"id"`
	CompanyID    *string   `json:"company_id" db:"company_id"`
	AgentKey     string    `json:"agent_key" db:"agent_key"`
	PromptType   string    `json:"prompt_type" db:"prompt_type"`
	PromptSource string    `json:"prompt_source" db:"prompt_source"` // global, company, hardcoded
	UsedAt       time.Time `json:"used_at" db:"used_at"`
}

// PromptRequest для создания/обновления промптов
type PromptRequest struct {
	AgentKey   string `json:"agent_key" binding:"required"`
	PromptType string `json:"prompt_type" binding:"required"`
	Content    string `json:"content" binding:"required"`
}

// PromptResponse для возврата информации о промпте
type PromptResponse struct {
	AIPrompt
	Source    string   `json:"source"`    // global, company, hardcoded
	CanEdit   bool     `json:"can_edit"`  // может ли текущий пользователь редактировать
	Variables []string `json:"variables"` // список переменных в промпте
}

// AgentPromptsInfo для полной информации об агенте
type AgentPromptsInfo struct {
	AgentKey         string         `json:"agent_key"`
	AgentName        string         `json:"agent_name"`
	AgentDescription string         `json:"agent_description"`
	SystemPrompt     PromptResponse `json:"system_prompt"`
	UserPrompt       PromptResponse `json:"user_prompt"`
	HasCustomPrompts bool           `json:"has_custom_prompts"`
}

// Currency represents supported currencies
type Currency struct {
	ID           string    `json:"id" db:"id"`
	Code         string    `json:"code" db:"code"`             // USD, EUR, RUB
	Name         string    `json:"name" db:"name"`             // US Dollar, Euro, Russian Ruble
	Symbol       string    `json:"symbol" db:"symbol"`         // $, €, ₽
	FlagEmoji    string    `json:"flag_emoji" db:"flag_emoji"` // 🇺🇸, 🇪🇺, 🇷🇺
	IsActive     bool      `json:"is_active" db:"is_active"`
	IsBase       bool      `json:"is_base" db:"is_base"`             // Base currency for conversions
	ExchangeRate float64   `json:"exchange_rate" db:"exchange_rate"` // Rate to base currency
	LastUpdated  time.Time `json:"last_updated" db:"last_updated"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// CurrencyConversionRequest represents request for currency conversion
type CurrencyConversionRequest struct {
	FromCurrency string  `json:"from_currency" binding:"required"`
	ToCurrency   string  `json:"to_currency" binding:"required"`
	Amount       float64 `json:"amount" binding:"required,min=0"`
}

// CurrencyConversionResponse represents currency conversion result
type CurrencyConversionResponse struct {
	FromCurrency    string    `json:"from_currency"`
	ToCurrency      string    `json:"to_currency"`
	OriginalAmount  float64   `json:"original_amount"`
	ConvertedAmount float64   `json:"converted_amount"`
	ExchangeRate    float64   `json:"exchange_rate"`
	LastUpdated     time.Time `json:"last_updated"`
}

// ExchangeRateAPIResponse represents response from ExchangeRate API
type ExchangeRateAPIResponse struct {
	Result             string             `json:"result"`
	Documentation      string             `json:"documentation"`
	TermsOfUse         string             `json:"terms_of_use"`
	TimeLastUpdateUnix int64              `json:"time_last_update_unix"`
	TimeLastUpdateUTC  string             `json:"time_last_update_utc"`
	TimeNextUpdateUnix int64              `json:"time_next_update_unix"`
	TimeNextUpdateUTC  string             `json:"time_next_update_utc"`
	BaseCode           string             `json:"base_code"`
	ConversionRates    map[string]float64 `json:"conversion_rates"`
}

// Crypto Payment Models
type CryptoPayment struct {
	ID                string    `json:"id" db:"id"`
	OrderID           string    `json:"order_id" db:"order_id"`
	PaymentID         string    `json:"payment_id" db:"payment_id"` // NowPayments payment ID
	Currency          string    `json:"currency" db:"currency"`     // BTC, ETH, etc.
	Network           string    `json:"network" db:"network"`       // bitcoin, ethereum, etc.
	Amount            float64   `json:"amount" db:"amount"`         // Amount in crypto
	Address           string    `json:"address" db:"address"`       // Wallet address
	Status            string    `json:"status" db:"status"`         // new, confirming, confirmed, expired, failed
	TransactionHash   string    `json:"transaction_hash" db:"transaction_hash"`
	QRCode            string    `json:"qr_code" db:"qr_code"`
	ExpiresAt         time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

type CryptoCurrency struct {
	ID          string  `json:"id" db:"id"`
	Code        string  `json:"code" db:"code"`         // BTC, ETH, USDT
	Name        string  `json:"name" db:"name"`         // Bitcoin, Ethereum, Tether
	Symbol      string  `json:"symbol" db:"symbol"`     // ₿, Ξ, ₮
	Icon        string  `json:"icon" db:"icon"`         // Icon URL
	IsActive    bool    `json:"is_active" db:"is_active"`
	MinAmount   float64 `json:"min_amount" db:"min_amount"`
	MaxAmount   float64 `json:"max_amount" db:"max_amount"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type CryptoNetwork struct {
	ID           string  `json:"id" db:"id"`
	CurrencyCode string  `json:"currency_code" db:"currency_code"`
	Name         string  `json:"name" db:"name"`         // Bitcoin, Ethereum, Polygon
	Code         string  `json:"code" db:"code"`         // bitcoin, ethereum, polygon
	IsActive     bool    `json:"is_active" db:"is_active"`
	MinAmount    float64 `json:"min_amount" db:"min_amount"`
	MaxAmount    float64 `json:"max_amount" db:"max_amount"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// NowPayments API Models
type NowPaymentsCreatePaymentRequest struct {
	PriceAmount      float64 `json:"price_amount"`
	PriceCurrency    string  `json:"price_currency"`
	PayCurrency      string  `json:"pay_currency"`
	OrderID          string  `json:"order_id"`
	OrderDescription string  `json:"order_description"`
	IPNCallbackURL   string  `json:"ipn_callback_url"`
	Case             string  `json:"case,omitempty"`
}

type NowPaymentsCreatePaymentResponse struct {
	PaymentID        string  `json:"payment_id"`
	PaymentStatus    string  `json:"payment_status"`
	PayAddress       string  `json:"pay_address"`
	PriceAmount      float64 `json:"price_amount"`
	PriceCurrency    string  `json:"price_currency"`
	PayAmount        float64 `json:"pay_amount"`
	PayCurrency      string  `json:"pay_currency"`
	OrderID          string  `json:"order_id"`
	OrderDescription string  `json:"order_description"`
	PurchaseID       string  `json:"purchase_id"`
	CreatedAt        string  `json:"created_at"`
	UpdatedAt        string  `json:"updated_at"`
	OutcomeAmount    float64 `json:"outcome_amount"`
	OutcomeCurrency  string  `json:"outcome_currency"`
}

type NowPaymentsCurrenciesResponse struct {
	Currencies []NowPaymentsCurrency `json:"currencies"`
}

type NowPaymentsCurrency struct {
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	IsAvailable bool    `json:"is_available"`
	IsFixedRate bool    `json:"is_fixed_rate"`
	Image       string  `json:"image"`
	MinAmount   float64 `json:"min_amount"`
	MaxAmount   float64 `json:"max_amount"`
}

type NowPaymentsEstimateResponse struct {
	EstimatedAmount float64 `json:"estimated_amount"`
	Currency        string  `json:"currency"`
}

type NowPaymentsPaymentStatusResponse struct {
	PaymentID        string  `json:"payment_id"`
	PaymentStatus    string  `json:"payment_status"`
	PayAddress       string  `json:"pay_address"`
	PriceAmount      float64 `json:"price_amount"`
	PriceCurrency    string  `json:"price_currency"`
	PayAmount        float64 `json:"pay_amount"`
	PayCurrency      string  `json:"pay_currency"`
	OrderID          string  `json:"order_id"`
	OrderDescription string  `json:"order_description"`
	PurchaseID       string  `json:"purchase_id"`
	CreatedAt        string  `json:"created_at"`
	UpdatedAt        string  `json:"updated_at"`
	OutcomeAmount    float64 `json:"outcome_amount"`
	OutcomeCurrency  string  `json:"outcome_currency"`
	PayinExtraID     string  `json:"payin_extra_id"`
	SmartContract    string  `json:"smart_contract"`
	Network          string  `json:"network"`
	NetworkPrecision int     `json:"network_precision"`
	TimeLimit        int     `json:"time_limit"`
	ExpirationAt     string  `json:"expiration_at"`
	IsFixedRate      bool    `json:"is_fixed_rate"`
	IsFeePaidByUser  bool    `json:"is_fee_paid_by_user"`
}

// Frontend Request/Response Models
type CreateCryptoPaymentRequest struct {
	OrderID       string `json:"order_id" binding:"required"`
	Currency      string `json:"currency" binding:"required"`
	Network       string `json:"network" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,min=0"`
}

type CryptoPaymentResponse struct {
	PaymentID      string  `json:"payment_id"`
	Currency       string  `json:"currency"`
	Network        string  `json:"network"`
	Amount         float64 `json:"amount"`
	Address        string  `json:"address"`
	QRCode         string  `json:"qr_code"`
	Status         string  `json:"status"`
	ExpiresAt      string  `json:"expires_at"`
	TransactionURL string  `json:"transaction_url"`
}

type PaymentMethod struct {
	Type     string `json:"type"`     // card, crypto
	Name     string `json:"name"`     // Credit Card, Bitcoin, Ethereum
	Icon     string `json:"icon"`     // Icon URL
	IsActive bool   `json:"is_active"`
}