package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
)

type AdminService struct {
	db *sql.DB
}

func NewAdminService(db *sql.DB) *AdminService {
	return &AdminService{db: db}
}

// Plan Management
func (s *AdminService) GetPlans() ([]models.Plan, error) {
	query := `
		SELECT id, name, price, features, free_trial_enabled, free_trial_days, 
			   max_employees, templates_access, demo_mode_access, 
			   included_ai_agents, ai_agent_addons, created_at, updated_at
		FROM plans ORDER BY price ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []models.Plan
	for rows.Next() {
		var plan models.Plan
		err := rows.Scan(
			&plan.ID, &plan.Name, &plan.Price, &plan.Features,
			&plan.FreeTrialEnabled, &plan.FreeTrialDays, &plan.MaxEmployees,
			&plan.TemplatesAccess, &plan.DemoModeAccess,
			&plan.IncludedAIAgents, &plan.AIAgentAddons,
			&plan.CreatedAt, &plan.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		plans = append(plans, plan)
	}

	return plans, nil
}

func (s *AdminService) CreatePlan(plan *models.Plan) error {
	plan.ID = uuid.New().String()
	plan.CreatedAt = time.Now()
	plan.UpdatedAt = time.Now()

	query := `
		INSERT INTO plans (id, name, price, features, free_trial_enabled, free_trial_days,
						  max_employees, templates_access, demo_mode_access,
						  included_ai_agents, ai_agent_addons, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`

	_, err := s.db.Exec(query,
		plan.ID, plan.Name, plan.Price, plan.Features,
		plan.FreeTrialEnabled, plan.FreeTrialDays, plan.MaxEmployees,
		plan.TemplatesAccess, plan.DemoModeAccess,
		plan.IncludedAIAgents, plan.AIAgentAddons,
		plan.CreatedAt, plan.UpdatedAt,
	)

	return err
}

func (s *AdminService) UpdatePlan(planID string, plan *models.Plan) error {
	plan.UpdatedAt = time.Now()

	query := `
		UPDATE plans SET name = $2, price = $3, features = $4,
						free_trial_enabled = $5, free_trial_days = $6,
						max_employees = $7, templates_access = $8,
						demo_mode_access = $9, included_ai_agents = $10,
						ai_agent_addons = $11, updated_at = $12
		WHERE id = $1`

	_, err := s.db.Exec(query,
		planID, plan.Name, plan.Price, plan.Features,
		plan.FreeTrialEnabled, plan.FreeTrialDays, plan.MaxEmployees,
		plan.TemplatesAccess, plan.DemoModeAccess,
		plan.IncludedAIAgents, plan.AIAgentAddons, plan.UpdatedAt,
	)

	return err
}

func (s *AdminService) DeletePlan(planID string) error {
	// Check if plan is used by companies
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM companies WHERE plan_id = $1", planID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete plan: %d companies are using this plan", count)
	}

	_, err = s.db.Exec("DELETE FROM plans WHERE id = $1", planID)
	return err
}

// Payment Settings Management

// GetPaymentSettings returns current payment settings
func (s *AdminService) GetPaymentSettings() (*models.PaymentSettings, error) {
	var settings models.PaymentSettings
	err := s.db.QueryRow(`
		SELECT id, stripe_enabled, commission_enabled, commission_percentage,
			   stripe_publishable_key, stripe_secret_key, stripe_webhook_secret,
			   created_at, updated_at
		FROM payment_settings LIMIT 1
	`).Scan(
		&settings.ID, &settings.StripeEnabled, &settings.CommissionEnabled,
		&settings.CommissionPercentage, &settings.StripePublishableKey,
		&settings.StripeSecretKey, &settings.StripeWebhookSecret,
		&settings.CreatedAt, &settings.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Create default settings if none exist
			return s.CreateDefaultPaymentSettings()
		}
		return nil, err
	}

	return &settings, nil
}

// CreateDefaultPaymentSettings creates default payment settings
func (s *AdminService) CreateDefaultPaymentSettings() (*models.PaymentSettings, error) {
	settings := &models.PaymentSettings{
		ID:                   uuid.New().String(),
		StripeEnabled:        false, // Disabled by default
		CommissionEnabled:    true,  // Commission enabled by default
		CommissionPercentage: 10.0,  // 10% default commission
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	_, err := s.db.Exec(`
		INSERT INTO payment_settings (id, stripe_enabled, commission_enabled, commission_percentage,
									 stripe_publishable_key, stripe_secret_key, stripe_webhook_secret,
									 created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, settings.ID, settings.StripeEnabled, settings.CommissionEnabled,
		settings.CommissionPercentage, settings.StripePublishableKey,
		settings.StripeSecretKey, settings.StripeWebhookSecret,
		settings.CreatedAt, settings.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return settings, nil
}

// UpdatePaymentSettings updates payment settings
func (s *AdminService) UpdatePaymentSettings(req *UpdatePaymentSettingsRequest) (*models.PaymentSettings, error) {
	// Get current settings
	currentSettings, err := s.GetPaymentSettings()
	if err != nil {
		return nil, err
	}

	// Update only provided fields
	if req.StripeEnabled != nil {
		currentSettings.StripeEnabled = *req.StripeEnabled
	}
	if req.CommissionEnabled != nil {
		currentSettings.CommissionEnabled = *req.CommissionEnabled
	}
	if req.CommissionPercentage != nil {
		// Validate commission percentage
		if *req.CommissionPercentage < 0 || *req.CommissionPercentage > 100 {
			return nil, fmt.Errorf("commission percentage must be between 0 and 100")
		}
		currentSettings.CommissionPercentage = *req.CommissionPercentage
	}
	if req.StripePublishableKey != nil {
		currentSettings.StripePublishableKey = *req.StripePublishableKey
	}
	if req.StripeSecretKey != nil {
		currentSettings.StripeSecretKey = *req.StripeSecretKey
	}
	if req.StripeWebhookSecret != nil {
		currentSettings.StripeWebhookSecret = *req.StripeWebhookSecret
	}

	currentSettings.UpdatedAt = time.Now()

	// Update in database
	_, err = s.db.Exec(`
		UPDATE payment_settings SET
			stripe_enabled = $2,
			commission_enabled = $3,
			commission_percentage = $4,
			stripe_publishable_key = $5,
			stripe_secret_key = $6,
			stripe_webhook_secret = $7,
			updated_at = $8
		WHERE id = $1
	`, currentSettings.ID, currentSettings.StripeEnabled, currentSettings.CommissionEnabled,
		currentSettings.CommissionPercentage, currentSettings.StripePublishableKey,
		currentSettings.StripeSecretKey, currentSettings.StripeWebhookSecret,
		currentSettings.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return currentSettings, nil
}

// Free Trial Management

// ExtendCompanyFreeTrial extends free trial for a specific company
func (s *AdminService) ExtendCompanyFreeTrial(companyID string, additionalDays int) error {
	if additionalDays <= 0 {
		return fmt.Errorf("additional days must be positive")
	}

	// Get current company trial info
	var currentTrialEnd sql.NullTime
	err := s.db.QueryRow(`
		SELECT trial_ends_at FROM companies WHERE id = $1
	`, companyID).Scan(&currentTrialEnd)

	if err != nil {
		return err
	}

	// Calculate new trial end date
	var newTrialEnd time.Time
	if currentTrialEnd.Valid && currentTrialEnd.Time.After(time.Now()) {
		// Extend from current trial end
		newTrialEnd = currentTrialEnd.Time.AddDate(0, 0, additionalDays)
	} else {
		// Start new trial from now
		newTrialEnd = time.Now().AddDate(0, 0, additionalDays)
	}

	// Update company trial end date
	_, err = s.db.Exec(`
		UPDATE companies SET 
			trial_ends_at = $2, 
			trial_expired = false,
			updated_at = $3
		WHERE id = $1
	`, companyID, newTrialEnd, time.Now())

	return err
}

// GetCompaniesWithExpiredTrials returns companies with expired trials
func (s *AdminService) GetCompaniesWithExpiredTrials() ([]models.Company, error) {
	query := `
		SELECT id, owner_id, name, description, categories, country, state, city, address,
			   phone, email, website, logo_url, media_gallery, business_hours,
			   plan_id, trial_expired, special_partner, manual_enabled_crm, manual_enabled_ai_agents,
			   is_demo, is_active, website_integration_enabled, api_key, publish_to_marketplace,
			   created_at, updated_at
		FROM companies 
		WHERE trial_expired = true OR (trial_ends_at IS NOT NULL AND trial_ends_at < NOW())
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var companies []models.Company
	for rows.Next() {
		var company models.Company
		err := rows.Scan(
			&company.ID, &company.OwnerID, &company.Name, &company.Description,
			&company.Categories, &company.Country, &company.State, &company.City, &company.Address,
			&company.Phone, &company.Email, &company.Website, &company.LogoURL, &company.MediaGallery,
			&company.BusinessHours, &company.PlanID, &company.TrialExpired, &company.SpecialPartner,
			&company.ManualEnabledCRM, &company.ManualEnabledAIAgents, &company.IsDemo, &company.IsActive,
			&company.WebsiteIntegrationEnabled, &company.APIKey, &company.PublishToMarketplace,
			&company.CreatedAt, &company.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		companies = append(companies, company)
	}

	return companies, nil
}

// GetCompaniesOnFreeTrial returns companies currently on free trial
func (s *AdminService) GetCompaniesOnFreeTrial() ([]models.Company, error) {
	query := `
		SELECT id, owner_id, name, description, categories, country, state, city, address,
			   phone, email, website, logo_url, media_gallery, business_hours,
			   plan_id, trial_expired, special_partner, manual_enabled_crm, manual_enabled_ai_agents,
			   is_demo, is_active, website_integration_enabled, api_key, publish_to_marketplace,
			   created_at, updated_at
		FROM companies 
		WHERE trial_ends_at IS NOT NULL AND trial_ends_at > NOW() AND trial_expired = false
		ORDER BY trial_ends_at ASC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var companies []models.Company
	for rows.Next() {
		var company models.Company
		err := rows.Scan(
			&company.ID, &company.OwnerID, &company.Name, &company.Description,
			&company.Categories, &company.Country, &company.State, &company.City, &company.Address,
			&company.Phone, &company.Email, &company.Website, &company.LogoURL, &company.MediaGallery,
			&company.BusinessHours, &company.PlanID, &company.TrialExpired, &company.SpecialPartner,
			&company.ManualEnabledCRM, &company.ManualEnabledAIAgents, &company.IsDemo, &company.IsActive,
			&company.WebsiteIntegrationEnabled, &company.APIKey, &company.PublishToMarketplace,
			&company.CreatedAt, &company.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		companies = append(companies, company)
	}

	return companies, nil
}

// Request structs for admin operations
type UpdatePaymentSettingsRequest struct {
	StripeEnabled        *bool    `json:"stripe_enabled"`
	CommissionEnabled    *bool    `json:"commission_enabled"`
	CommissionPercentage *float64 `json:"commission_percentage"`
	StripePublishableKey *string  `json:"stripe_publishable_key"`
	StripeSecretKey      *string  `json:"stripe_secret_key"`
	StripeWebhookSecret  *string  `json:"stripe_webhook_secret"`
}

// Service Categories Management
func (s *AdminService) GetServiceCategories() ([]models.ServiceCategory, error) {
	query := `SELECT id, name, icon, created_at FROM service_categories ORDER BY name`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.ServiceCategory
	for rows.Next() {
		var category models.ServiceCategory
		err := rows.Scan(&category.ID, &category.Name, &category.Icon, &category.CreatedAt)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

func (s *AdminService) CreateServiceCategory(category *models.ServiceCategory) error {
	category.ID = uuid.New().String()
	category.CreatedAt = time.Now()

	query := `INSERT INTO service_categories (id, name, icon, created_at) VALUES ($1, $2, $3, $4)`
	_, err := s.db.Exec(query, category.ID, category.Name, category.Icon, category.CreatedAt)
	return err
}

func (s *AdminService) UpdateServiceCategory(categoryID string, category *models.ServiceCategory) error {
	query := `UPDATE service_categories SET name = $2, icon = $3 WHERE id = $1`
	_, err := s.db.Exec(query, categoryID, category.Name, category.Icon)
	return err
}

func (s *AdminService) DeleteServiceCategory(categoryID string) error {
	// Check if category is used by services/products
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM services WHERE category_id = $1", categoryID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete category: %d services are using this category", count)
	}

	_, err = s.db.Exec("DELETE FROM service_categories WHERE id = $1", categoryID)
	return err
}

// Pet Types Management
func (s *AdminService) GetPetTypes() ([]models.PetType, error) {
	query := `SELECT id, name, created_at FROM pet_types ORDER BY name`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var petTypes []models.PetType
	for rows.Next() {
		var petType models.PetType
		err := rows.Scan(&petType.ID, &petType.Name, &petType.CreatedAt)
		if err != nil {
			return nil, err
		}
		petTypes = append(petTypes, petType)
	}

	return petTypes, nil
}

func (s *AdminService) CreatePetType(petType *models.PetType) error {
	petType.ID = uuid.New().String()
	petType.CreatedAt = time.Now()

	query := `INSERT INTO pet_types (id, name, created_at) VALUES ($1, $2, $3)`
	_, err := s.db.Exec(query, petType.ID, petType.Name, petType.CreatedAt)
	return err
}

func (s *AdminService) UpdatePetType(petTypeID string, petType *models.PetType) error {
	query := `UPDATE pet_types SET name = $2 WHERE id = $1`
	_, err := s.db.Exec(query, petTypeID, petType.Name)
	return err
}

func (s *AdminService) DeletePetType(petTypeID string) error {
	// Check if pet type is used by pets or breeds
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM pets WHERE pet_type_id = $1", petTypeID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete pet type: %d pets are using this type", count)
	}

	_, err = s.db.Exec("DELETE FROM pet_types WHERE id = $1", petTypeID)
	return err
}

// Breeds Management
func (s *AdminService) GetBreeds() ([]models.Breed, error) {
	query := `SELECT id, name, pet_type_id, created_at FROM breeds ORDER BY name`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var breeds []models.Breed
	for rows.Next() {
		var breed models.Breed
		err := rows.Scan(&breed.ID, &breed.Name, &breed.PetTypeID, &breed.CreatedAt)
		if err != nil {
			return nil, err
		}
		breeds = append(breeds, breed)
	}

	return breeds, nil
}

func (s *AdminService) GetBreedsByPetType(petTypeID string) ([]models.Breed, error) {
	query := `SELECT id, name, pet_type_id, created_at FROM breeds WHERE pet_type_id = $1 ORDER BY name`

	rows, err := s.db.Query(query, petTypeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var breeds []models.Breed
	for rows.Next() {
		var breed models.Breed
		err := rows.Scan(&breed.ID, &breed.Name, &breed.PetTypeID, &breed.CreatedAt)
		if err != nil {
			return nil, err
		}
		breeds = append(breeds, breed)
	}

	return breeds, nil
}

func (s *AdminService) CreateBreed(breed *models.Breed) error {
	breed.ID = uuid.New().String()
	breed.CreatedAt = time.Now()

	query := `INSERT INTO breeds (id, name, pet_type_id, created_at) VALUES ($1, $2, $3, $4)`
	_, err := s.db.Exec(query, breed.ID, breed.Name, breed.PetTypeID, breed.CreatedAt)
	return err
}

func (s *AdminService) UpdateBreed(breedID string, breed *models.Breed) error {
	query := `UPDATE breeds SET name = $2, pet_type_id = $3 WHERE id = $1`
	_, err := s.db.Exec(query, breedID, breed.Name, breed.PetTypeID)
	return err
}

func (s *AdminService) DeleteBreed(breedID string) error {
	// Check if breed is used by pets
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM pets WHERE breed_id = $1", breedID).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return fmt.Errorf("cannot delete breed: %d pets are using this breed", count)
	}

	_, err = s.db.Exec("DELETE FROM breeds WHERE id = $1", breedID)
	return err
}

// Company Management
func (s *AdminService) GetAllCompanies() ([]models.Company, error) {
	query := `
		SELECT c.id, c.owner_id, c.name, c.description, c.categories,
			   c.country, c.state, c.city, c.address, c.phone, c.email,
			   c.website, c.logo_url, c.media_gallery, c.business_hours,
			   c.plan_id, c.trial_expired, c.special_partner,
			   c.manual_enabled_crm, c.manual_enabled_ai_agents,
			   c.is_demo, c.is_active, c.website_integration_enabled,
			   c.api_key, c.publish_to_marketplace, c.created_at, c.updated_at
		FROM companies c
		ORDER BY c.created_at DESC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var companies []models.Company
	for rows.Next() {
		var company models.Company
		err := rows.Scan(
			&company.ID, &company.OwnerID, &company.Name, &company.Description,
			&company.Categories, &company.Country, &company.State, &company.City,
			&company.Address, &company.Phone, &company.Email, &company.Website,
			&company.LogoURL, &company.MediaGallery, &company.BusinessHours,
			&company.PlanID, &company.TrialExpired, &company.SpecialPartner,
			&company.ManualEnabledCRM, &company.ManualEnabledAIAgents,
			&company.IsDemo, &company.IsActive, &company.WebsiteIntegrationEnabled,
			&company.APIKey, &company.PublishToMarketplace,
			&company.CreatedAt, &company.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		companies = append(companies, company)
	}

	return companies, nil
}

func (s *AdminService) ToggleSpecialPartner(companyID string) error {
	query := `UPDATE companies SET special_partner = NOT special_partner WHERE id = $1`
	_, err := s.db.Exec(query, companyID)
	return err
}

func (s *AdminService) ToggleManualCRM(companyID string) error {
	query := `UPDATE companies SET manual_enabled_crm = NOT manual_enabled_crm WHERE id = $1`
	_, err := s.db.Exec(query, companyID)
	return err
}

func (s *AdminService) ToggleManualAI(companyID string) error {
	query := `UPDATE companies SET manual_enabled_ai_agents = NOT manual_enabled_ai_agents WHERE id = $1`
	_, err := s.db.Exec(query, companyID)
	return err
}

func (s *AdminService) BlockCompany(companyID string) error {
	query := `UPDATE companies SET is_active = false WHERE id = $1`
	_, err := s.db.Exec(query, companyID)
	return err
}

func (s *AdminService) UnblockCompany(companyID string) error {
	query := `UPDATE companies SET is_active = true WHERE id = $1`
	_, err := s.db.Exec(query, companyID)
	return err
}

// Global Analytics
func (s *AdminService) GetGlobalAnalytics() (map[string]interface{}, error) {
	analytics := make(map[string]interface{})

	// Total counts
	var totalUsers, totalCompanies, totalBookings, totalOrders int
	var totalRevenue float64

	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'pet_owner'").Scan(&totalUsers)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow("SELECT COUNT(*) FROM companies WHERE is_active = true").Scan(&totalCompanies)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow("SELECT COUNT(*) FROM bookings").Scan(&totalBookings)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&totalOrders)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed'").Scan(&totalRevenue)
	if err != nil {
		return nil, err
	}

	analytics["total_users"] = totalUsers
	analytics["total_companies"] = totalCompanies
	analytics["total_bookings"] = totalBookings
	analytics["total_orders"] = totalOrders
	analytics["total_revenue"] = totalRevenue

	// Recent registrations (last 30 days)
	var recentUsers, recentCompanies int
	err = s.db.QueryRow(`
		SELECT COUNT(*) FROM users 
		WHERE role = 'pet_owner' AND created_at >= NOW() - INTERVAL '30 days'
	`).Scan(&recentUsers)
	if err != nil {
		return nil, err
	}

	err = s.db.QueryRow(`
		SELECT COUNT(*) FROM companies 
		WHERE created_at >= NOW() - INTERVAL '30 days'
	`).Scan(&recentCompanies)
	if err != nil {
		return nil, err
	}

	analytics["recent_users"] = recentUsers
	analytics["recent_companies"] = recentCompanies

	return analytics, nil
}
