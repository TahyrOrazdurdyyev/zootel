package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
)

type AddonService struct {
	db             *sql.DB
	paymentService *PaymentService
}

func NewAddonService(db *sql.DB, paymentService *PaymentService) *AddonService {
	return &AddonService{
		db:             db,
		paymentService: paymentService,
	}
}

// GetAvailableAddons returns all available addons with pricing
func (s *AddonService) GetAvailableAddons() ([]*models.AddonPricing, error) {
	query := `
		SELECT id, addon_type, addon_key, name, description, 
		       monthly_price, yearly_price, one_time_price, is_available,
		       created_at, updated_at
		FROM addon_pricing 
		WHERE is_available = true
		ORDER BY addon_type, name`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query available addons: %w", err)
	}
	defer rows.Close()

	var addons []*models.AddonPricing
	for rows.Next() {
		addon := &models.AddonPricing{}
		err := rows.Scan(
			&addon.ID, &addon.AddonType, &addon.AddonKey, &addon.Name,
			&addon.Description, &addon.MonthlyPrice, &addon.YearlyPrice,
			&addon.OneTimePrice, &addon.IsAvailable, &addon.CreatedAt, &addon.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan addon: %w", err)
		}
		addons = append(addons, addon)
	}

	return addons, nil
}

// GetCompanyAddons returns all addons purchased by a company
func (s *AddonService) GetCompanyAddons(companyID string) ([]*models.CompanyAddon, error) {
	query := `
		SELECT ca.id, ca.company_id, ca.addon_type, ca.addon_key, ca.price,
		       ca.billing_cycle, ca.status, ca.auto_renew, ca.purchased_at,
		       ca.expires_at, ca.cancelled_at, ca.last_billed_at, ca.next_billing_at,
		       ca.created_at, ca.updated_at,
		       ap.name, ap.description
		FROM company_addons ca
		LEFT JOIN addon_pricing ap ON ca.addon_key = ap.addon_key AND ca.addon_type = ap.addon_type
		WHERE ca.company_id = $1
		ORDER BY ca.created_at DESC`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query company addons: %w", err)
	}
	defer rows.Close()

	var addons []*models.CompanyAddon
	for rows.Next() {
		addon := &models.CompanyAddon{}
		var name, description sql.NullString

		err := rows.Scan(
			&addon.ID, &addon.CompanyID, &addon.AddonType, &addon.AddonKey,
			&addon.Price, &addon.BillingCycle, &addon.Status, &addon.AutoRenew,
			&addon.PurchasedAt, &addon.ExpiresAt, &addon.CancelledAt,
			&addon.LastBilledAt, &addon.NextBillingAt, &addon.CreatedAt, &addon.UpdatedAt,
			&name, &description,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan company addon: %w", err)
		}

		addons = append(addons, addon)
	}

	return addons, nil
}

// PurchaseAddon handles addon purchase with payment integration
func (s *AddonService) PurchaseAddon(companyID, addonType, addonKey, billingCycle string) (*models.CompanyAddon, error) {
	// Get addon pricing
	pricing, err := s.getAddonPricing(addonType, addonKey)
	if err != nil {
		return nil, fmt.Errorf("addon not found: %w", err)
	}

	if !pricing.IsAvailable {
		return nil, fmt.Errorf("addon is not available for purchase")
	}

	// Check if company already has this addon
	exists, err := s.companyHasAddon(companyID, addonType, addonKey)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("company already has this addon")
	}

	// Determine price based on billing cycle
	var price float64
	var expiresAt *time.Time
	var nextBillingAt *time.Time

	switch billingCycle {
	case "monthly":
		price = pricing.MonthlyPrice
		expiry := time.Now().AddDate(0, 1, 0)
		expiresAt = &expiry
		nextBilling := time.Now().AddDate(0, 1, 0)
		nextBillingAt = &nextBilling
	case "yearly":
		price = pricing.YearlyPrice
		expiry := time.Now().AddDate(1, 0, 0)
		expiresAt = &expiry
		nextBilling := time.Now().AddDate(1, 0, 0)
		nextBillingAt = &nextBilling
	case "one_time":
		if pricing.OneTimePrice == nil {
			return nil, fmt.Errorf("one-time purchase not available for this addon")
		}
		price = *pricing.OneTimePrice
		// One-time purchases don't expire
	default:
		return nil, fmt.Errorf("invalid billing cycle")
	}

	// Check payment settings
	paymentSettings, err := s.paymentService.GetPaymentSettings()
	if err != nil {
		return nil, fmt.Errorf("failed to get payment settings: %w", err)
	}

	// Create addon record
	addon := &models.CompanyAddon{
		ID:            uuid.New().String(),
		CompanyID:     companyID,
		AddonType:     addonType,
		AddonKey:      addonKey,
		Price:         price,
		BillingCycle:  billingCycle,
		Status:        "pending",
		AutoRenew:     billingCycle != "one_time",
		PurchasedAt:   time.Now(),
		ExpiresAt:     expiresAt,
		NextBillingAt: nextBillingAt,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Handle payment based on stripe_enabled setting
	if paymentSettings.StripeEnabled {
		// Process payment through Stripe
		paymentIntent, err := s.paymentService.CreatePaymentIntent(&models.PaymentRequest{
			UserID:      companyID, // Company acts as user for billing
			Amount:      price,
			Currency:    "usd",
			Description: fmt.Sprintf("Addon: %s (%s)", pricing.Name, billingCycle),
			Metadata: map[string]string{
				"addon_id":   addon.ID,
				"addon_type": addonType,
				"addon_key":  addonKey,
			},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create payment intent: %w", err)
		}

		// Store payment intent ID for later confirmation
		addon.Status = "pending_payment"
		// You would store payment_intent_id in metadata or separate field
	} else {
		// Payment disabled - activate addon immediately
		addon.Status = "active"
		now := time.Now()
		addon.LastBilledAt = &now

		// Apply addon to company immediately
		err = s.activateAddonForCompany(companyID, addonType, addonKey)
		if err != nil {
			return nil, fmt.Errorf("failed to activate addon: %w", err)
		}
	}

	// Save addon to database
	err = s.saveCompanyAddon(addon)
	if err != nil {
		return nil, fmt.Errorf("failed to save addon: %w", err)
	}

	return addon, nil
}

// ActivateAddon activates a paid addon (called after successful payment)
func (s *AddonService) ActivateAddon(addonID string) error {
	// Get addon
	addon, err := s.getCompanyAddonByID(addonID)
	if err != nil {
		return err
	}

	// Update status to active
	query := `UPDATE company_addons SET status = 'active', last_billed_at = $2, updated_at = $3 WHERE id = $1`
	_, err = s.db.Exec(query, addonID, time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to activate addon: %w", err)
	}

	// Apply addon to company
	return s.activateAddonForCompany(addon.CompanyID, addon.AddonType, addon.AddonKey)
}

// ManuallyEnableAddon allows SuperAdmin to manually enable addons for companies
func (s *AddonService) ManuallyEnableAddon(companyID, addonType, addonKey string) error {
	// Check if company already has this addon
	exists, err := s.companyHasAddon(companyID, addonType, addonKey)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("company already has this addon")
	}

	// Create free addon record
	addon := &models.CompanyAddon{
		ID:           uuid.New().String(),
		CompanyID:    companyID,
		AddonType:    addonType,
		AddonKey:     addonKey,
		Price:        0, // Free for manual enablement
		BillingCycle: "manual",
		Status:       "active",
		AutoRenew:    false,
		PurchasedAt:  time.Now(),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	now := time.Now()
	addon.LastBilledAt = &now

	// Save addon
	err = s.saveCompanyAddon(addon)
	if err != nil {
		return fmt.Errorf("failed to save manual addon: %w", err)
	}

	// Apply addon to company
	return s.activateAddonForCompany(companyID, addonType, addonKey)
}

// CancelAddon cancels a company addon
func (s *AddonService) CancelAddon(companyID, addonID string) error {
	// Verify addon belongs to company
	addon, err := s.getCompanyAddonByID(addonID)
	if err != nil {
		return err
	}
	if addon.CompanyID != companyID {
		return fmt.Errorf("addon does not belong to company")
	}

	// Update status to cancelled
	now := time.Now()
	query := `UPDATE company_addons SET status = 'cancelled', cancelled_at = $2, auto_renew = false, updated_at = $3 WHERE id = $1`
	_, err = s.db.Exec(query, addonID, now, now)
	if err != nil {
		return fmt.Errorf("failed to cancel addon: %w", err)
	}

	// Remove addon from company (if immediate cancellation)
	return s.deactivateAddonForCompany(companyID, addon.AddonType, addon.AddonKey)
}

// ProcessAddonBilling processes recurring billing for addons
func (s *AddonService) ProcessAddonBilling() error {
	// Find addons due for billing
	query := `
		SELECT id FROM company_addons 
		WHERE status = 'active' 
		AND auto_renew = true 
		AND next_billing_at <= $1
		AND billing_cycle IN ('monthly', 'yearly')`

	rows, err := s.db.Query(query, time.Now())
	if err != nil {
		return fmt.Errorf("failed to query addons for billing: %w", err)
	}
	defer rows.Close()

	var addonIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		addonIDs = append(addonIDs, id)
	}

	// Process each addon
	for _, addonID := range addonIDs {
		err := s.processAddonRenewal(addonID)
		if err != nil {
			fmt.Printf("Failed to process addon renewal %s: %v\n", addonID, err)
			// Continue with other addons
		}
	}

	return nil
}

// Helper methods

func (s *AddonService) getAddonPricing(addonType, addonKey string) (*models.AddonPricing, error) {
	query := `
		SELECT id, addon_type, addon_key, name, description,
		       monthly_price, yearly_price, one_time_price, is_available,
		       created_at, updated_at
		FROM addon_pricing 
		WHERE addon_type = $1 AND addon_key = $2`

	pricing := &models.AddonPricing{}
	err := s.db.QueryRow(query, addonType, addonKey).Scan(
		&pricing.ID, &pricing.AddonType, &pricing.AddonKey, &pricing.Name,
		&pricing.Description, &pricing.MonthlyPrice, &pricing.YearlyPrice,
		&pricing.OneTimePrice, &pricing.IsAvailable, &pricing.CreatedAt, &pricing.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("addon pricing not found")
		}
		return nil, fmt.Errorf("failed to get addon pricing: %w", err)
	}

	return pricing, nil
}

func (s *AddonService) companyHasAddon(companyID, addonType, addonKey string) (bool, error) {
	query := `SELECT COUNT(*) FROM company_addons WHERE company_id = $1 AND addon_type = $2 AND addon_key = $3 AND status IN ('active', 'pending_payment')`

	var count int
	err := s.db.QueryRow(query, companyID, addonType, addonKey).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check existing addon: %w", err)
	}

	return count > 0, nil
}

func (s *AddonService) saveCompanyAddon(addon *models.CompanyAddon) error {
	query := `
		INSERT INTO company_addons (
			id, company_id, addon_type, addon_key, price, billing_cycle,
			status, auto_renew, purchased_at, expires_at, last_billed_at,
			next_billing_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	_, err := s.db.Exec(
		query, addon.ID, addon.CompanyID, addon.AddonType, addon.AddonKey,
		addon.Price, addon.BillingCycle, addon.Status, addon.AutoRenew,
		addon.PurchasedAt, addon.ExpiresAt, addon.LastBilledAt,
		addon.NextBillingAt, addon.CreatedAt, addon.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to insert company addon: %w", err)
	}

	return nil
}

func (s *AddonService) getCompanyAddonByID(addonID string) (*models.CompanyAddon, error) {
	query := `
		SELECT id, company_id, addon_type, addon_key, price, billing_cycle,
		       status, auto_renew, purchased_at, expires_at, cancelled_at,
		       last_billed_at, next_billing_at, created_at, updated_at
		FROM company_addons WHERE id = $1`

	addon := &models.CompanyAddon{}
	err := s.db.QueryRow(query, addonID).Scan(
		&addon.ID, &addon.CompanyID, &addon.AddonType, &addon.AddonKey,
		&addon.Price, &addon.BillingCycle, &addon.Status, &addon.AutoRenew,
		&addon.PurchasedAt, &addon.ExpiresAt, &addon.CancelledAt,
		&addon.LastBilledAt, &addon.NextBillingAt, &addon.CreatedAt, &addon.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("addon not found")
		}
		return nil, fmt.Errorf("failed to get addon: %w", err)
	}

	return addon, nil
}

func (s *AddonService) activateAddonForCompany(companyID, addonType, addonKey string) error {
	switch addonType {
	case "ai_agent":
		return s.enableAIAgentForCompany(companyID, addonKey)
	case "crm_feature":
		return s.enableCRMFeatureForCompany(companyID, addonKey)
	case "extra_employee":
		return s.increaseEmployeeLimitForCompany(companyID, 1)
	default:
		return fmt.Errorf("unknown addon type: %s", addonType)
	}
}

func (s *AddonService) deactivateAddonForCompany(companyID, addonType, addonKey string) error {
	switch addonType {
	case "ai_agent":
		return s.disableAIAgentForCompany(companyID, addonKey)
	case "crm_feature":
		return s.disableCRMFeatureForCompany(companyID, addonKey)
	case "extra_employee":
		return s.decreaseEmployeeLimitForCompany(companyID, 1)
	default:
		return fmt.Errorf("unknown addon type: %s", addonType)
	}
}

func (s *AddonService) enableAIAgentForCompany(companyID, agentKey string) error {
	// Add to manual_enabled_ai_agents array
	query := `
		UPDATE companies 
		SET manual_enabled_ai_agents = array_append(manual_enabled_ai_agents, $2),
		    updated_at = $3
		WHERE id = $1 
		AND NOT ($2 = ANY(manual_enabled_ai_agents))`

	_, err := s.db.Exec(query, companyID, agentKey, time.Now())
	return err
}

func (s *AddonService) disableAIAgentForCompany(companyID, agentKey string) error {
	// Remove from manual_enabled_ai_agents array
	query := `
		UPDATE companies 
		SET manual_enabled_ai_agents = array_remove(manual_enabled_ai_agents, $2),
		    updated_at = $3
		WHERE id = $1`

	_, err := s.db.Exec(query, companyID, agentKey, time.Now())
	return err
}

func (s *AddonService) enableCRMFeatureForCompany(companyID, featureKey string) error {
	// Enable CRM features
	query := `UPDATE companies SET manual_enabled_crm = true, updated_at = $2 WHERE id = $1`
	_, err := s.db.Exec(query, companyID, time.Now())
	return err
}

func (s *AddonService) disableCRMFeatureForCompany(companyID, featureKey string) error {
	// This should check if company still has active CRM addons before disabling
	query := `UPDATE companies SET manual_enabled_crm = false, updated_at = $2 WHERE id = $1`
	_, err := s.db.Exec(query, companyID, time.Now())
	return err
}

func (s *AddonService) increaseEmployeeLimitForCompany(companyID string, count int) error {
	// This would require a new field like extra_employee_slots in companies table
	query := `
		UPDATE companies 
		SET extra_employee_slots = COALESCE(extra_employee_slots, 0) + $2,
		    updated_at = $3
		WHERE id = $1`
	_, err := s.db.Exec(query, companyID, count, time.Now())
	return err
}

func (s *AddonService) decreaseEmployeeLimitForCompany(companyID string, count int) error {
	query := `
		UPDATE companies 
		SET extra_employee_slots = GREATEST(COALESCE(extra_employee_slots, 0) - $2, 0),
		    updated_at = $3
		WHERE id = $1`
	_, err := s.db.Exec(query, companyID, count, time.Now())
	return err
}

func (s *AddonService) processAddonRenewal(addonID string) error {
	addon, err := s.getCompanyAddonByID(addonID)
	if err != nil {
		return err
	}

	// Check payment settings
	paymentSettings, err := s.paymentService.GetPaymentSettings()
	if err != nil {
		return fmt.Errorf("failed to get payment settings: %w", err)
	}

	if paymentSettings.StripeEnabled {
		// Process payment for renewal
		_, err := s.paymentService.CreatePaymentIntent(&models.PaymentRequest{
			UserID:      addon.CompanyID,
			Amount:      addon.Price,
			Currency:    "usd",
			Description: fmt.Sprintf("Addon Renewal: %s", addon.AddonKey),
			Metadata: map[string]string{
				"addon_id": addon.ID,
				"type":     "renewal",
			},
		})
		if err != nil {
			return fmt.Errorf("failed to process renewal payment: %w", err)
		}
	} else {
		// Payment disabled - automatically renew
		var nextBilling time.Time
		if addon.BillingCycle == "monthly" {
			nextBilling = time.Now().AddDate(0, 1, 0)
		} else if addon.BillingCycle == "yearly" {
			nextBilling = time.Now().AddDate(1, 0, 0)
		}

		query := `
			UPDATE company_addons 
			SET last_billed_at = $2, next_billing_at = $3, updated_at = $4
			WHERE id = $1`

		_, err := s.db.Exec(query, addon.ID, time.Now(), nextBilling, time.Now())
		if err != nil {
			return fmt.Errorf("failed to update addon billing: %w", err)
		}
	}

	return nil
}
