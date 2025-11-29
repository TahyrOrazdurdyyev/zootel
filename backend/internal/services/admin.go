package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
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
		SELECT id, name, COALESCE(description, '') as description, 
			   COALESCE(monthly_price, 0) as monthly_price, COALESCE(yearly_price, 0) as yearly_price,
			   features, free_trial_enabled, free_trial_days, 
			   max_employees, COALESCE(templates_access, false) as templates_access, 
			   COALESCE(demo_mode_access, false) as demo_mode_access, 
			   included_ai_agents, COALESCE(ai_agent_addons, '{}') as ai_agent_addons,
			   COALESCE(is_active, true) as is_active, created_at, updated_at
		FROM plans ORDER BY monthly_price ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []models.Plan
	for rows.Next() {
		var plan models.Plan
		err := rows.Scan(
			&plan.ID, &plan.Name, &plan.Description, &plan.MonthlyPrice, &plan.YearlyPrice,
			&plan.Features, &plan.FreeTrialEnabled, &plan.FreeTrialDays, &plan.MaxEmployees,
			&plan.TemplatesAccess, &plan.DemoModeAccess,
			&plan.IncludedAIAgents, &plan.AIAgentAddons, &plan.IsActive,
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
		INSERT INTO plans (id, name, description, monthly_price, yearly_price, features, 
						  free_trial_enabled, free_trial_days, max_employees, 
						  templates_access, demo_mode_access, included_ai_agents, 
						  ai_agent_addons, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`

	_, err := s.db.Exec(query,
		plan.ID, plan.Name, plan.Description, plan.MonthlyPrice, plan.YearlyPrice,
		plan.Features, plan.FreeTrialEnabled, plan.FreeTrialDays, plan.MaxEmployees,
		plan.TemplatesAccess, plan.DemoModeAccess, plan.IncludedAIAgents, 
		plan.AIAgentAddons, plan.IsActive, plan.CreatedAt, plan.UpdatedAt,
	)

	return err
}

func (s *AdminService) UpdatePlan(planID string, plan *models.Plan) error {
	plan.UpdatedAt = time.Now()

	query := `
		UPDATE plans SET name = $2, description = $3, monthly_price = $4, yearly_price = $5,
						features = $6, free_trial_enabled = $7, free_trial_days = $8,
						max_employees = $9, templates_access = $10, demo_mode_access = $11,
						included_ai_agents = $12, ai_agent_addons = $13, is_active = $14,
						updated_at = $15
		WHERE id = $1`

	_, err := s.db.Exec(query,
		planID, plan.Name, plan.Description, plan.MonthlyPrice, plan.YearlyPrice,
		plan.Features, plan.FreeTrialEnabled, plan.FreeTrialDays, plan.MaxEmployees,
		plan.TemplatesAccess, plan.DemoModeAccess, plan.IncludedAIAgents, 
		plan.AIAgentAddons, plan.IsActive, plan.UpdatedAt,
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

// Addon Pricing Management
func (s *AdminService) GetAddonPricing() ([]models.AddonPricing, error) {
	query := `
		SELECT id, addon_type, addon_key, name, description, monthly_price, yearly_price,
			   one_time_price, is_available, created_at, updated_at
		FROM addon_pricing ORDER BY addon_type, name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var addons []models.AddonPricing
	for rows.Next() {
		var addon models.AddonPricing
		err := rows.Scan(
			&addon.ID, &addon.AddonType, &addon.AddonKey, &addon.Name, &addon.Description,
			&addon.MonthlyPrice, &addon.YearlyPrice, &addon.OneTimePrice, &addon.IsAvailable,
			&addon.CreatedAt, &addon.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		addons = append(addons, addon)
	}

	return addons, nil
}

func (s *AdminService) CreateAddonPricing(addon *models.AddonPricing) error {
	addon.ID = uuid.New().String()
	addon.CreatedAt = time.Now()
	addon.UpdatedAt = time.Now()

	query := `
		INSERT INTO addon_pricing (id, addon_type, addon_key, name, description, 
								  monthly_price, yearly_price, one_time_price, 
								  is_available, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err := s.db.Exec(query,
		addon.ID, addon.AddonType, addon.AddonKey, addon.Name, addon.Description,
		addon.MonthlyPrice, addon.YearlyPrice, addon.OneTimePrice, addon.IsAvailable,
		addon.CreatedAt, addon.UpdatedAt,
	)

	return err
}

func (s *AdminService) UpdateAddonPricing(addonID string, addon *models.AddonPricing) error {
	addon.UpdatedAt = time.Now()

	query := `
		UPDATE addon_pricing SET addon_type = $2, addon_key = $3, name = $4, 
								description = $5, monthly_price = $6, yearly_price = $7,
								one_time_price = $8, is_available = $9, updated_at = $10
		WHERE id = $1`

	_, err := s.db.Exec(query,
		addonID, addon.AddonType, addon.AddonKey, addon.Name, addon.Description,
		addon.MonthlyPrice, addon.YearlyPrice, addon.OneTimePrice, addon.IsAvailable,
		addon.UpdatedAt,
	)

	return err
}

func (s *AdminService) DeleteAddonPricing(addonID string) error {
	_, err := s.db.Exec("DELETE FROM addon_pricing WHERE id = $1", addonID)
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
	query := `SELECT id, name, description, icon, background_image, created_at, updated_at FROM service_categories ORDER BY name`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.ServiceCategory
	for rows.Next() {
		var category models.ServiceCategory
		var description, backgroundImage sql.NullString
		err := rows.Scan(&category.ID, &category.Name, &description, &category.Icon, &backgroundImage, &category.CreatedAt, &category.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if description.Valid {
			category.Description = description.String
		}
		if backgroundImage.Valid {
			category.BackgroundImage = backgroundImage.String
		}
		categories = append(categories, category)
	}

	return categories, nil
}

func (s *AdminService) CreateServiceCategory(category *models.ServiceCategory) error {
	category.ID = uuid.New().String()
	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	query := `INSERT INTO service_categories (id, name, description, icon, background_image, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := s.db.Exec(query, category.ID, category.Name, category.Description, category.Icon, category.BackgroundImage, category.CreatedAt, category.UpdatedAt)
	return err
}

func (s *AdminService) UpdateServiceCategory(categoryID string, category *models.ServiceCategory) error {
	category.UpdatedAt = time.Now()
	query := `UPDATE service_categories SET name = $2, description = $3, icon = $4, background_image = $5, updated_at = $6 WHERE id = $1`
	_, err := s.db.Exec(query, categoryID, category.Name, category.Description, category.Icon, category.BackgroundImage, category.UpdatedAt)
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
	// Проверяем, что компания не оплатила CRM в своей подписке
	var hasPaidCRM bool
	checkQuery := `
		SELECT CASE 
			WHEN p.templates_access = true OR c.subscription_status = 'active' 
			THEN true 
			ELSE false 
		END as has_paid_crm
		FROM companies c
		LEFT JOIN plans p ON c.plan_id = p.id
		WHERE c.id = $1`

	err := s.db.QueryRow(checkQuery, companyID).Scan(&hasPaidCRM)
	if err != nil {
		return fmt.Errorf("failed to check company subscription: %w", err)
	}

	// Получаем текущее состояние manual_enabled_crm
	var currentManualEnabled bool
	getCurrentQuery := `SELECT manual_enabled_crm FROM companies WHERE id = $1`
	err = s.db.QueryRow(getCurrentQuery, companyID).Scan(&currentManualEnabled)
	if err != nil {
		return fmt.Errorf("failed to get current manual CRM status: %w", err)
	}

	// Если пытаемся отключить CRM и компания имеет оплаченный доступ - запрещаем
	if currentManualEnabled && hasPaidCRM {
		return fmt.Errorf("cannot disable CRM for company with paid subscription")
	}

	// Разрешаем переключение только если нет конфликта с оплаченной подпиской
	query := `UPDATE companies SET manual_enabled_crm = NOT manual_enabled_crm WHERE id = $1`
	_, err = s.db.Exec(query, companyID)
	return err
}

func (s *AdminService) ToggleManualAI(companyID string) error {
	// Проверяем, что компания не оплатила AI агентов в своей подписке
	var hasPaidAI bool
	checkQuery := `
		SELECT CASE 
			WHEN array_length(p.included_ai_agents, 1) > 0 OR c.subscription_status = 'active' 
			THEN true 
			ELSE false 
		END as has_paid_ai
		FROM companies c
		LEFT JOIN plans p ON c.plan_id = p.id
		WHERE c.id = $1`

	err := s.db.QueryRow(checkQuery, companyID).Scan(&hasPaidAI)
	if err != nil {
		return fmt.Errorf("failed to check company AI subscription: %w", err)
	}

	// Получаем текущее состояние manual_enabled_ai_agents
	var currentManualEnabled bool
	getCurrentQuery := `SELECT manual_enabled_ai_agents FROM companies WHERE id = $1`
	err = s.db.QueryRow(getCurrentQuery, companyID).Scan(&currentManualEnabled)
	if err != nil {
		return fmt.Errorf("failed to get current manual AI status: %w", err)
	}

	// Если пытаемся отключить AI и компания имеет оплаченный доступ - запрещаем
	if currentManualEnabled && hasPaidAI {
		return fmt.Errorf("cannot disable AI agents for company with paid subscription")
	}

	// Разрешаем переключение только если нет конфликта с оплаченной подпиской
	query := `UPDATE companies SET manual_enabled_ai_agents = NOT manual_enabled_ai_agents WHERE id = $1`
	_, err = s.db.Exec(query, companyID)
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

	err := s.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalUsers)
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
		WHERE created_at >= NOW() - INTERVAL '30 days'
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

// CheckAndUpdateExpiredTrials automatically sets trial_expired=true for companies with expired trials
func (s *AdminService) CheckAndUpdateExpiredTrials() error {
	query := `
		UPDATE companies 
		SET trial_expired = true, updated_at = $1
		WHERE trial_ends_at IS NOT NULL 
		AND trial_ends_at < NOW() 
		AND trial_expired = false
		RETURNING id, name, email`

	rows, err := s.db.Query(query, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update expired trials: %w", err)
	}
	defer rows.Close()

	// Log expired companies for monitoring
	for rows.Next() {
		var id, name, email string
		if err := rows.Scan(&id, &name, &email); err != nil {
			continue
		}
		fmt.Printf("Trial expired for company: %s (%s) - %s\n", name, id, email)
	}

	return nil
}

// ActivateCompanyAfterPayment activates a company after successful payment
func (s *AdminService) ActivateCompanyAfterPayment(companyID, planID string, billingCycle string) error {
	var expiresAt time.Time

	// Calculate subscription end date based on billing cycle
	switch billingCycle {
	case "monthly":
		expiresAt = time.Now().AddDate(0, 1, 0)
	case "yearly":
		expiresAt = time.Now().AddDate(1, 0, 0)
	default:
		return fmt.Errorf("invalid billing cycle: %s", billingCycle)
	}

	// Update company: activate subscription, clear trial status
	query := `
		UPDATE companies 
		SET plan_id = $2, 
			trial_expired = false,
			trial_ends_at = NULL,
			subscription_expires_at = $3,
			subscription_status = 'active',
			updated_at = $4
		WHERE id = $1`

	_, err := s.db.Exec(query, companyID, planID, expiresAt, time.Now())
	if err != nil {
		return fmt.Errorf("failed to activate company subscription: %w", err)
	}

	return nil
}

// GetTrialExpiringCompanies returns companies whose trial expires in specified days
func (s *AdminService) GetTrialExpiringCompanies(daysBeforeExpiry int) ([]models.Company, error) {
	futureDate := time.Now().AddDate(0, 0, daysBeforeExpiry)

	query := `
		SELECT id, owner_id, name, description, categories, country, state, city, address,
			   phone, email, website, logo_url, media_gallery, business_hours,
			   plan_id, trial_expired, special_partner, manual_enabled_crm, manual_enabled_ai_agents,
			   is_demo, is_active, website_integration_enabled, api_key, publish_to_marketplace,
			   created_at, updated_at
		FROM companies 
		WHERE trial_ends_at IS NOT NULL 
		AND trial_ends_at <= $1 
		AND trial_ends_at > NOW()
		AND trial_expired = false
		ORDER BY trial_ends_at ASC`

	rows, err := s.db.Query(query, futureDate)
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

// GetCompanies получает список всех компаний с подробной информацией
func (s *AdminService) GetCompanies() ([]models.CompanyDetails, error) {
	log.Printf("🔍 Starting GetCompanies query...")
	
	// Простой запрос для тестирования
	query := `
		SELECT 
			c.id, c.name, c.business_type, COALESCE(c.description, '') as description, 
			c.email, c.phone, c.address, c.city, c.state, c.country,
			c.website, c.logo_url, c.is_active, c.subscription_status,
			c.trial_ends_at, c.subscription_expires_at, c.trial_expired,
			c.created_at, c.updated_at,
			c.plan_id, '' as plan_name, 0 as plan_price,
			'' as owner_id, '' as owner_first_name, 
			'' as owner_last_name, '' as owner_email,
			0 as total_bookings,
			0 as total_customers,
			0 as total_revenue,
			0 as employee_count,
			-- Extended analytics
			COALESCE(c.instagram, '') as instagram,
			COALESCE(c.facebook, '') as facebook,
			c.subscription_activated_at,
			0 as average_check,
			0 as zootel_earnings,
			0 as cancelled_orders,
			0 as refunded_orders,
			0 as average_response_time,
			0 as company_rating,
			0 as total_reviews,
			0 as total_chats,
			NULL as last_login_at,
			0 as profile_completeness,
			0 as weekly_orders,
			0 as monthly_orders,
			0 as quarterly_orders,
			0 as half_year_orders,
			0 as yearly_orders
		FROM companies c
		ORDER BY c.created_at DESC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query companies: %w", err)
	}
	defer rows.Close()

	var companies []models.CompanyDetails
	for rows.Next() {
		var company models.CompanyDetails
		var trialEndsAt, subscriptionExpiresAt, subscriptionActivatedAt, lastLoginAt sql.NullTime

		err := rows.Scan(
			&company.ID, &company.Name, &company.BusinessType, &company.Description,
			&company.Email, &company.Phone, &company.Address, &company.City,
			&company.State, &company.Country, &company.Website,
			&company.LogoURL, &company.IsActive, &company.Status,
			&trialEndsAt, &subscriptionExpiresAt, &company.TrialExpired,
			&company.CreatedAt, &company.UpdatedAt,
			&company.PlanID, &company.PlanName, &company.PlanPrice,
			&company.OwnerID, &company.OwnerFirstName, &company.OwnerLastName, &company.OwnerEmail,
			&company.TotalBookings, &company.TotalCustomers, &company.TotalRevenue,
			&company.EmployeeCount,
			// Extended analytics
			&company.Instagram, &company.Facebook, &subscriptionActivatedAt,
			&company.AverageCheck, &company.ZootelEarnings, &company.CancelledOrders,
			&company.RefundedOrders, &company.AverageResponseTime, &company.CompanyRating,
			&company.TotalReviews, &company.TotalChats, &company.CustomerRequests,
			&lastLoginAt, &company.ProfileCompleteness, &company.WeeklyOrders,
			&company.MonthlyOrders, &company.QuarterlyOrders, &company.HalfYearOrders,
			&company.YearlyOrders,
		)
		if err != nil {
			continue
		}

		// Обрабатываем nullable поля
		if trialEndsAt.Valid {
			company.TrialEndDate = &trialEndsAt.Time
		}
		if subscriptionExpiresAt.Valid {
			company.TrialStartDate = &subscriptionExpiresAt.Time // используем как start date
		}
		if subscriptionActivatedAt.Valid {
			company.SubscriptionActivatedAt = &subscriptionActivatedAt.Time
		}
		if lastLoginAt.Valid {
			company.LastLoginAt = &lastLoginAt.Time
		}

		// Устанавливаем значения по умолчанию для отсутствующих полей
		company.PostalCode = ""
		company.IsVerified = false
		
		// Если статус не определен, используем subscription_status
		if company.Status == "" {
			if company.TrialExpired {
				company.Status = "trial_expired"
			} else if trialEndsAt.Valid && trialEndsAt.Time.After(time.Now()) {
				company.Status = "trial"
			} else {
				company.Status = "active"
			}
		}

		// Определяем статус компании
		company.Status = s.determineCompanyStatus(&company)

		companies = append(companies, company)
	}

	return companies, nil
}

// determineCompanyStatus определяет текущий статус компании
func (s *AdminService) determineCompanyStatus(company *models.CompanyDetails) string {
	if !company.IsActive {
		return "inactive"
	}

	now := time.Now()

	// Если есть пробный период
	if company.TrialEndDate != nil {
		if now.Before(*company.TrialEndDate) {
			return "trial"
		} else if now.After(*company.TrialEndDate) && company.PlanPrice == 0 {
			return "trial_expired"
		}
	}

	if company.PlanPrice > 0 {
		return "paid"
	}

	return "active"
}

// AI Agents Management

// GetAllCompaniesAIAgents получает агентов всех компаний для админ панели
func (s *AdminService) GetAllCompaniesAIAgents() ([]models.CompanyAIAgentsInfo, error) {
	// Получаем все компании
	companies, err := s.GetCompanies()
	if err != nil {
		return nil, err
	}

	var result []models.CompanyAIAgentsInfo
	for _, company := range companies {
		agentsInfo, err := s.getCompanyAIAgentsForAdmin(company.ID)
		if err != nil {
			continue // Пропускаем компании с ошибками
		}
		result = append(result, *agentsInfo)
	}

	return result, nil
}

// GetCompanyAIAgentsForAdmin получает агентов конкретной компании для админ панели
func (s *AdminService) GetCompanyAIAgentsForAdmin(companyID string) (*models.CompanyAIAgentsInfo, error) {
	return s.getCompanyAIAgentsForAdmin(companyID)
}

func (s *AdminService) getCompanyAIAgentsForAdmin(companyID string) (*models.CompanyAIAgentsInfo, error) {
	// Получаем агентов из тарифа
	var companyName, planName string
	var includedAgents pq.StringArray
	query := `
		SELECT c.name, p.name, p.included_ai_agents 
		FROM companies c 
		JOIN plans p ON c.plan_id = p.id 
		WHERE c.id = $1
	`
	err := s.db.QueryRow(query, companyID).Scan(&companyName, &planName, &includedAgents)
	if err != nil {
		return nil, fmt.Errorf("failed to get company plan details: %w", err)
	}

	// Получаем купленных агентов
	addonQuery := `
		SELECT ca.addon_key, ca.status, ca.billing_cycle, ca.price, ca.expires_at, ca.purchased_at,
		       ap.name, ap.description
		FROM company_addons ca
		LEFT JOIN addon_pricing ap ON ca.addon_key = ap.addon_key AND ap.addon_type = 'ai_agent'
		WHERE ca.company_id = $1 AND ca.addon_type = 'ai_agent'
		ORDER BY ca.purchased_at DESC
	`

	rows, err := s.db.Query(addonQuery, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query addon agents: %w", err)
	}
	defer rows.Close()

	var addonAgents []models.CompanyAIAgent
	for rows.Next() {
		var agent models.CompanyAIAgent
		var name, description sql.NullString

		err := rows.Scan(
			&agent.AgentKey, &agent.Status, &agent.BillingCycle, &agent.Price,
			&agent.ExpiresAt, &agent.PurchasedAt, &name, &description,
		)
		if err != nil {
			continue
		}

		agent.Name = name.String
		agent.Description = description.String
		agent.Source = "addon"

		addonAgents = append(addonAgents, agent)
	}

	// Формируем информацию об агентах из плана
	var planAgents []models.CompanyAIAgent
	for _, agentKey := range includedAgents {
		// Получаем информацию об агенте из pricing
		var name, description string
		agentQuery := `SELECT name, description FROM addon_pricing WHERE addon_key = $1 AND addon_type = 'ai_agent' LIMIT 1`
		err := s.db.QueryRow(agentQuery, agentKey).Scan(&name, &description)
		if err != nil {
			name = agentKey
			description = "Agent included in plan"
		}

		planAgents = append(planAgents, models.CompanyAIAgent{
			AgentKey:    agentKey,
			Name:        name,
			Description: description,
			Source:      "plan",
			Status:      "active",
		})
	}

	return &models.CompanyAIAgentsInfo{
		CompanyID:   companyID,
		PlanName:    planName,
		PlanAgents:  planAgents,
		AddonAgents: addonAgents,
	}, nil
}

// ActivateAgentForCompany активирует агента для компании (админом)
func (s *AdminService) ActivateAgentForCompany(companyID, agentKey, billingCycle, adminID string) (*models.CompanyAddon, error) {
	// Проверяем существование агента в pricing
	var count int
	checkQuery := `SELECT COUNT(*) FROM addon_pricing WHERE addon_key = $1 AND addon_type = 'ai_agent' AND is_available = true`
	err := s.db.QueryRow(checkQuery, agentKey).Scan(&count)
	if err != nil {
		return nil, fmt.Errorf("failed to check agent existence: %w", err)
	}
	if count == 0 {
		return nil, fmt.Errorf("agent not found or not available: %s", agentKey)
	}

	// Проверяем, нет ли уже активного агента
	var existingCount int
	existsQuery := `
		SELECT COUNT(*) FROM company_addons 
		WHERE company_id = $1 AND addon_type = 'ai_agent' AND addon_key = $2 AND status = 'active'
	`
	err = s.db.QueryRow(existsQuery, companyID, agentKey).Scan(&existingCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing agent: %w", err)
	}
	if existingCount > 0 {
		return nil, fmt.Errorf("agent already active for this company")
	}

	// Получаем цены из pricing
	var monthlyPrice, yearlyPrice float64
	var oneTimePrice sql.NullFloat64
	priceQuery := `SELECT monthly_price, yearly_price, one_time_price FROM addon_pricing WHERE addon_key = $1 AND addon_type = 'ai_agent'`
	err = s.db.QueryRow(priceQuery, agentKey).Scan(&monthlyPrice, &yearlyPrice, &oneTimePrice)
	if err != nil {
		return nil, fmt.Errorf("failed to get agent pricing: %w", err)
	}

	// Определяем цену и срок действия
	var price float64
	var expiresAt *time.Time
	var nextBillingAt *time.Time

	switch billingCycle {
	case "monthly":
		price = monthlyPrice
		expiry := time.Now().AddDate(0, 1, 0)
		expiresAt = &expiry
		nextBilling := time.Now().AddDate(0, 1, 0)
		nextBillingAt = &nextBilling
	case "yearly":
		price = yearlyPrice
		expiry := time.Now().AddDate(1, 0, 0)
		expiresAt = &expiry
		nextBilling := time.Now().AddDate(1, 0, 0)
		nextBillingAt = &nextBilling
	case "one_time":
		if oneTimePrice.Valid {
			price = oneTimePrice.Float64
		} else {
			price = 0.0
		}
	case "free":
		price = 0.0
	default:
		return nil, fmt.Errorf("invalid billing cycle: %s", billingCycle)
	}

	// Создаем запись об активации
	addon := &models.CompanyAddon{
		ID:            uuid.New().String(),
		CompanyID:     companyID,
		AddonType:     "ai_agent",
		AddonKey:      agentKey,
		Price:         price,
		BillingCycle:  billingCycle,
		Status:        "active",
		AutoRenew:     billingCycle == "monthly" || billingCycle == "yearly",
		PurchasedAt:   time.Now(),
		ExpiresAt:     expiresAt,
		NextBillingAt: nextBillingAt,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Сохраняем в базу
	insertQuery := `
		INSERT INTO company_addons (
			id, company_id, addon_type, addon_key, price, billing_cycle, status,
			auto_renew, purchased_at, expires_at, next_billing_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err = s.db.Exec(insertQuery,
		addon.ID, addon.CompanyID, addon.AddonType, addon.AddonKey, addon.Price,
		addon.BillingCycle, addon.Status, addon.AutoRenew, addon.PurchasedAt,
		addon.ExpiresAt, addon.NextBillingAt, addon.CreatedAt, addon.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to save addon: %w", err)
	}

	// Логируем активацию
	s.logAdminAction(adminID, "activate_ai_agent", "company_addon", addon.ID, map[string]interface{}{
		"company_id":    companyID,
		"agent_key":     agentKey,
		"billing_cycle": billingCycle,
		"price":         price,
	})

	return addon, nil
}

// DeactivateAgentForCompany деактивирует агента для компании
func (s *AdminService) DeactivateAgentForCompany(companyID, agentKey, adminID string) error {
	// Проверяем, включен ли агент в подписку компании
	var isIncludedInPlan bool
	checkPlanQuery := `
		SELECT CASE 
			WHEN p.included_ai_agents @> ARRAY[$2] 
			THEN true 
			ELSE false 
		END as is_in_plan
		FROM companies c
		LEFT JOIN plans p ON c.plan_id = p.id
		WHERE c.id = $1
	`

	err := s.db.QueryRow(checkPlanQuery, companyID, agentKey).Scan(&isIncludedInPlan)
	if err != nil {
		return fmt.Errorf("failed to check if agent is included in plan: %w", err)
	}

	// Если агент включен в план подписки - запрещаем отключение
	if isIncludedInPlan {
		return fmt.Errorf("cannot deactivate AI agent '%s' - it's included in company's subscription plan", agentKey)
	}

	// Деактивируем агента (только если он был добавлен вручную как addon)
	query := `
		UPDATE company_addons 
		SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
		WHERE company_id = $1 AND addon_type = 'ai_agent' AND addon_key = $2 AND status = 'active'
	`

	result, err := s.db.Exec(query, companyID, agentKey)
	if err != nil {
		return fmt.Errorf("failed to deactivate agent: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("agent not found or already inactive (cannot deactivate agents from subscription plan)")
	}

	// Логируем деактивацию
	s.logAdminAction(adminID, "deactivate_ai_agent", "company_addon", "", map[string]interface{}{
		"company_id": companyID,
		"agent_key":  agentKey,
	})

	return nil
}

// GetAvailableAIAgents получает список всех доступных AI агентов
func (s *AdminService) GetAvailableAIAgents() ([]models.AddonPricing, error) {
	query := `
		SELECT id, addon_type, addon_key, name, description, 
		       monthly_price, yearly_price, one_time_price, is_available,
		       created_at, updated_at
		FROM addon_pricing 
		WHERE addon_type = 'ai_agent'
		ORDER BY name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query AI agents: %w", err)
	}
	defer rows.Close()

	var agents []models.AddonPricing
	for rows.Next() {
		var agent models.AddonPricing
		err := rows.Scan(
			&agent.ID, &agent.AddonType, &agent.AddonKey, &agent.Name,
			&agent.Description, &agent.MonthlyPrice, &agent.YearlyPrice,
			&agent.OneTimePrice, &agent.IsAvailable, &agent.CreatedAt, &agent.UpdatedAt,
		)
		if err != nil {
			continue
		}
		agents = append(agents, agent)
	}

	return agents, nil
}

// UpdateAIAgentPricing обновляет цены AI агента
func (s *AdminService) UpdateAIAgentPricing(agentKey string, req *models.UpdateAgentPricingRequest, adminID string) error {
	// Проверяем существование агента
	var count int
	checkQuery := `SELECT COUNT(*) FROM addon_pricing WHERE addon_key = $1 AND addon_type = 'ai_agent'`
	err := s.db.QueryRow(checkQuery, agentKey).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check agent existence: %w", err)
	}
	if count == 0 {
		return fmt.Errorf("AI agent not found: %s", agentKey)
	}

	// Обновляем цены
	updateQuery := `
		UPDATE addon_pricing 
		SET monthly_price = $2, yearly_price = $3, one_time_price = $4, 
		    is_available = $5, updated_at = NOW()
		WHERE addon_key = $1 AND addon_type = 'ai_agent'
	`

	_, err = s.db.Exec(updateQuery, agentKey, req.MonthlyPrice, req.YearlyPrice,
		req.OneTimePrice, req.IsAvailable)
	if err != nil {
		return fmt.Errorf("failed to update agent pricing: %w", err)
	}

	// Логируем изменение цен
	s.logAdminAction(adminID, "update_ai_agent_pricing", "addon_pricing", agentKey, map[string]interface{}{
		"agent_key":      agentKey,
		"monthly_price":  req.MonthlyPrice,
		"yearly_price":   req.YearlyPrice,
		"one_time_price": req.OneTimePrice,
		"is_available":   req.IsAvailable,
	})

	return nil
}

// CreateAIAgent создает нового AI агента с ценами
func (s *AdminService) CreateAIAgent(req *models.CreateAgentRequest, adminID string) (*models.AddonPricing, error) {
	// Проверяем, что агент с таким ключом не существует
	var count int
	checkQuery := `SELECT COUNT(*) FROM addon_pricing WHERE addon_key = $1 AND addon_type = 'ai_agent'`
	err := s.db.QueryRow(checkQuery, req.AgentKey).Scan(&count)
	if err != nil {
		return nil, fmt.Errorf("failed to check agent existence: %w", err)
	}
	if count > 0 {
		return nil, fmt.Errorf("AI agent with key '%s' already exists", req.AgentKey)
	}

	// Создаем агента
	agent := &models.AddonPricing{
		ID:           uuid.New().String(),
		AddonType:    "ai_agent",
		AddonKey:     req.AgentKey,
		Name:         req.Name,
		Description:  req.Description,
		MonthlyPrice: req.MonthlyPrice,
		YearlyPrice:  req.YearlyPrice,
		OneTimePrice: req.OneTimePrice,
		IsAvailable:  req.IsAvailable,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	insertQuery := `
		INSERT INTO addon_pricing (
			id, addon_type, addon_key, name, description, 
			monthly_price, yearly_price, one_time_price, is_available,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err = s.db.Exec(insertQuery,
		agent.ID, agent.AddonType, agent.AddonKey, agent.Name, agent.Description,
		agent.MonthlyPrice, agent.YearlyPrice, agent.OneTimePrice, agent.IsAvailable,
		agent.CreatedAt, agent.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create AI agent: %w", err)
	}

	// Логируем создание агента
	s.logAdminAction(adminID, "create_ai_agent", "addon_pricing", agent.ID, map[string]interface{}{
		"agent_key":     req.AgentKey,
		"name":          req.Name,
		"monthly_price": req.MonthlyPrice,
		"yearly_price":  req.YearlyPrice,
	})

	return agent, nil
}

// DeleteAIAgent удаляет AI агента (делает недоступным)
func (s *AdminService) DeleteAIAgent(agentKey string, adminID string) error {
	// Проверяем существование агента
	var count int
	checkQuery := `SELECT COUNT(*) FROM addon_pricing WHERE addon_key = $1 AND addon_type = 'ai_agent'`
	err := s.db.QueryRow(checkQuery, agentKey).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check agent existence: %w", err)
	}
	if count == 0 {
		return fmt.Errorf("AI agent not found: %s", agentKey)
	}

	// Делаем агента недоступным вместо удаления
	updateQuery := `
		UPDATE addon_pricing 
		SET is_available = false, updated_at = NOW()
		WHERE addon_key = $1 AND addon_type = 'ai_agent'
	`

	_, err = s.db.Exec(updateQuery, agentKey)
	if err != nil {
		return fmt.Errorf("failed to disable agent: %w", err)
	}

	// Деактивируем агента у всех компаний
	deactivateQuery := `
		UPDATE company_addons 
		SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
		WHERE addon_type = 'ai_agent' AND addon_key = $1 AND status = 'active'
	`

	s.db.Exec(deactivateQuery, agentKey) // Игнорируем ошибки деактивации

	// Логируем удаление агента
	s.logAdminAction(adminID, "delete_ai_agent", "addon_pricing", agentKey, map[string]interface{}{
		"agent_key": agentKey,
	})

	return nil
}

// Helper method для логирования действий админа
func (s *AdminService) logAdminAction(adminID, action, resourceType, resourceID string, details map[string]interface{}) {
	logQuery := `
		INSERT INTO admin_activity_log (id, admin_id, action, resource_type, resource_id, details, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	detailsJSON, _ := json.Marshal(details)

	s.db.Exec(logQuery,
		uuid.New().String(), adminID, action, resourceType, resourceID,
		string(detailsJSON), time.Now(),
	)
}

// GetCompanyFeatureStatus получает статус функций компании с разделением на оплаченные и бесплатные
func (s *AdminService) GetCompanyFeatureStatus(companyID string) (*models.CompanyFeatureStatus, error) {
	query := `
		SELECT 
			c.id, c.name, c.manual_enabled_crm, c.manual_enabled_ai_agents,
			c.subscription_status, c.plan_id,
			p.templates_access, p.included_ai_agents,
			CASE 
				WHEN c.subscription_status = 'active' AND p.templates_access = true 
				THEN true 
				ELSE false 
			END as has_paid_crm,
			CASE 
				WHEN c.subscription_status = 'active' AND array_length(p.included_ai_agents, 1) > 0 
				THEN true 
				ELSE false 
			END as has_paid_ai
		FROM companies c
		LEFT JOIN plans p ON c.plan_id = p.id
		WHERE c.id = $1
	`

	var status models.CompanyFeatureStatus
	var includedAgents pq.StringArray

	err := s.db.QueryRow(query, companyID).Scan(
		&status.CompanyID, &status.CompanyName, &status.ManualCRM, &status.ManualAI,
		&status.SubscriptionStatus, &status.PlanID,
		&status.PaidCRM, &includedAgents,
		&status.HasPaidCRM, &status.HasPaidAI,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get company feature status: %w", err)
	}

	status.IncludedAIAgents = []string(includedAgents)

	// Получаем список активных addon агентов
	addonQuery := `
		SELECT addon_key 
		FROM company_addons 
		WHERE company_id = $1 AND addon_type = 'ai_agent' AND status = 'active'
	`

	rows, err := s.db.Query(addonQuery, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get addon agents: %w", err)
	}
	defer rows.Close()

	var addonAgents []string
	for rows.Next() {
		var agentKey string
		if err := rows.Scan(&agentKey); err != nil {
			continue
		}
		addonAgents = append(addonAgents, agentKey)
	}
	status.AddonAIAgents = addonAgents

	return &status, nil
}

// CanToggleCRM проверяет можно ли переключить CRM для компании
func (s *AdminService) CanToggleCRM(companyID string, enable bool) (bool, string, error) {
	status, err := s.GetCompanyFeatureStatus(companyID)
	if err != nil {
		return false, "", err
	}

	// Если пытаемся отключить CRM и он оплачен - запрещаем
	if !enable && status.HasPaidCRM {
		return false, "Cannot disable CRM - company has paid subscription with CRM access", nil
	}

	// Если включаем CRM - всегда разрешаем
	if enable {
		return true, "CRM can be enabled manually", nil
	}

	// Если отключаем и CRM не оплачен - разрешаем
	return true, "CRM can be disabled", nil
}

// CanToggleAI проверяет можно ли переключить AI агентов для компании
func (s *AdminService) CanToggleAI(companyID string, enable bool) (bool, string, error) {
	status, err := s.GetCompanyFeatureStatus(companyID)
	if err != nil {
		return false, "", err
	}

	// Если пытаемся отключить AI и в плане есть AI агенты - запрещаем
	if !enable && status.HasPaidAI {
		return false, "Cannot disable AI agents - company has paid subscription with AI agents", nil
	}

	// Если включаем AI - всегда разрешаем
	if enable {
		return true, "AI agents can be enabled manually", nil
	}

	// Если отключаем и AI не оплачен - разрешаем
	return true, "AI agents can be disabled", nil
}

// CanDeactivateAgent проверяет можно ли деактивировать конкретного AI агента
func (s *AdminService) CanDeactivateAgent(companyID, agentKey string) (bool, string, error) {
	status, err := s.GetCompanyFeatureStatus(companyID)
	if err != nil {
		return false, "", err
	}

	// Проверяем, включен ли агент в план подписки
	for _, includedAgent := range status.IncludedAIAgents {
		if includedAgent == agentKey {
			return false, fmt.Sprintf("Cannot deactivate agent '%s' - it's included in subscription plan", agentKey), nil
		}
	}

	// Проверяем, есть ли агент в addon'ах
	for _, addonAgent := range status.AddonAIAgents {
		if addonAgent == agentKey {
			return true, fmt.Sprintf("Agent '%s' can be deactivated (manually added addon)", agentKey), nil
		}
	}

	return false, fmt.Sprintf("Agent '%s' not found or not active", agentKey), nil
}

// Business Types Management
func (s *AdminService) GetBusinessTypes() ([]models.BusinessType, error) {
	query := `
		SELECT id, name, description, is_active, sort_order, created_at, updated_at
		FROM business_types 
		ORDER BY sort_order ASC, name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query business types: %w", err)
	}
	defer rows.Close()

	var businessTypes []models.BusinessType
	for rows.Next() {
		var bt models.BusinessType
		err := rows.Scan(
			&bt.ID, &bt.Name, &bt.Description, &bt.IsActive, 
			&bt.SortOrder, &bt.CreatedAt, &bt.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan business type: %w", err)
		}
		businessTypes = append(businessTypes, bt)
	}

	return businessTypes, nil
}

func (s *AdminService) GetActiveBusinessTypes() ([]models.BusinessType, error) {
	query := `
		SELECT id, name, description, is_active, sort_order, created_at, updated_at
		FROM business_types 
		WHERE is_active = true
		ORDER BY sort_order ASC, name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active business types: %w", err)
	}
	defer rows.Close()

	var businessTypes []models.BusinessType
	for rows.Next() {
		var bt models.BusinessType
		err := rows.Scan(
			&bt.ID, &bt.Name, &bt.Description, &bt.IsActive, 
			&bt.SortOrder, &bt.CreatedAt, &bt.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan business type: %w", err)
		}
		businessTypes = append(businessTypes, bt)
	}

	return businessTypes, nil
}

func (s *AdminService) CreateBusinessType(bt *models.BusinessType) error {
	bt.ID = uuid.New().String()
	bt.CreatedAt = time.Now()
	bt.UpdatedAt = time.Now()

	query := `
		INSERT INTO business_types (id, name, description, is_active, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := s.db.Exec(query, bt.ID, bt.Name, bt.Description, bt.IsActive, bt.SortOrder, bt.CreatedAt, bt.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create business type: %w", err)
	}

	return nil
}

func (s *AdminService) UpdateBusinessType(bt *models.BusinessType) error {
	bt.UpdatedAt = time.Now()

	query := `
		UPDATE business_types 
		SET name = $2, description = $3, is_active = $4, sort_order = $5, updated_at = $6
		WHERE id = $1`

	result, err := s.db.Exec(query, bt.ID, bt.Name, bt.Description, bt.IsActive, bt.SortOrder, bt.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to update business type: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("business type not found")
	}

	return nil
}

func (s *AdminService) DeleteBusinessType(id string) error {
	query := `DELETE FROM business_types WHERE id = $1`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete business type: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("business type not found")
	}

	return nil
}
