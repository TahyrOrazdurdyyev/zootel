package services

import (
	"database/sql"
	"fmt"
	"math/rand"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

// IntegrationServiceInterface defines the integration service interface
type IntegrationServiceInterface interface {
	// Website integration
	EnableWebsiteIntegration(companyID string, request *models.IntegrationFeatureRequest) (*models.APIKeyResponse, error)
	DisableWebsiteIntegration(companyID string) error
	GetCompanyIntegrationSettings(companyID string) (*models.IntegrationSettings, error)
	UpdateIntegrationSettings(companyID string, request *models.IntegrationFeatureRequest) error
	RegenerateAPIKey(companyID string) (*models.APIKeyResponse, error)

	// Permission checks
	CompanyHasWebsiteIntegration(companyID string) (bool, error)
	CheckIntegrationPermission(companyID, featureKey string) (bool, error)
	CheckDomainAccess(companyID, domain string) (bool, error)
	ValidateAPIKey(apiKey string) (*models.Company, error)

	// Integration features
	GetCompanyIntegrationFeatures(companyID string) ([]models.IntegrationFeature, error)

	// Marketplace
	GetMarketplaceEligibility(companyID string) (*models.MarketplaceEligibility, error)
	UpdateMarketplaceVisibility(companyID string, visible bool) error
	CanToggleMarketplaceVisibility(companyID string) (bool, error)

	// Analytics
	GetSourceAnalytics(companyID string, dateFrom, dateTo time.Time) ([]models.SourceAnalytic, error)
	GetCompanySourceSummary(companyID string, days int) (*models.SourceSummary, error)
	RecordWidgetInteraction(companyID, source string) error
}

// IntegrationService handles integration-related business logic
type IntegrationService struct {
	db *sql.DB
}

// NewIntegrationService creates a new integration service
func NewIntegrationService(db *sql.DB) IntegrationServiceInterface {
	return &IntegrationService{db: db}
}

// EnableWebsiteIntegration enables website integration for a company
func (s *IntegrationService) EnableWebsiteIntegration(companyID string, request *models.IntegrationFeatureRequest) (*models.APIKeyResponse, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Generate API key
	apiKey := "zk_" + generateRandomString(32)

	// Update company
	_, err = tx.Exec(`
		UPDATE companies 
		SET website_integration_enabled = true, 
		    api_key = $1, 
		    api_key_created_at = $2,
		    allowed_domains = $3,
		    updated_at = $4
		WHERE id = $5
	`, apiKey, time.Now(), request.AllowedDomains, time.Now(), companyID)

	if err != nil {
		return nil, fmt.Errorf("failed to enable integration: %v", err)
	}

	// Add integration features
	for _, feature := range request.Features {
		_, err = tx.Exec(`
			INSERT INTO company_integration_features (company_id, feature_key, feature_value, is_enabled)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (company_id, feature_key) DO UPDATE SET
				feature_value = EXCLUDED.feature_value,
				is_enabled = EXCLUDED.is_enabled,
				updated_at = CURRENT_TIMESTAMP
		`, companyID, feature, "", true)

		if err != nil {
			return nil, fmt.Errorf("failed to add integration feature: %v", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return &models.APIKeyResponse{
		APIKey:    apiKey,
		CreatedAt: time.Now(),
	}, nil
}

// DisableWebsiteIntegration disables website integration
func (s *IntegrationService) DisableWebsiteIntegration(companyID string) error {
	_, err := s.db.Exec(`
		UPDATE companies 
		SET website_integration_enabled = false,
		    api_key = NULL,
		    api_key_created_at = NULL,
		    publish_to_marketplace = true,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, companyID)

	if err != nil {
		return fmt.Errorf("failed to disable integration: %v", err)
	}

	// Disable all integration features
	_, err = s.db.Exec(`
		UPDATE company_integration_features 
		SET is_enabled = false, updated_at = CURRENT_TIMESTAMP
		WHERE company_id = $1
	`, companyID)

	return err
}

// GetCompanyIntegrationSettings returns integration settings
func (s *IntegrationService) GetCompanyIntegrationSettings(companyID string) (*models.IntegrationSettings, error) {
	settings := &models.IntegrationSettings{}

	err := s.db.QueryRow(`
		SELECT 
			website_integration_enabled,
			COALESCE(api_key, ''),
			COALESCE(api_key_created_at, '1970-01-01'::timestamp),
			COALESCE(allowed_domains, '{}'),
			publish_to_marketplace
		FROM companies 
		WHERE id = $1
	`, companyID).Scan(
		&settings.WebsiteIntegrationEnabled,
		&settings.APIKey,
		&settings.APIKeyCreatedAt,
		&settings.AllowedDomains,
		&settings.PublishToMarketplace,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get integration settings: %v", err)
	}

	return settings, nil
}

// UpdateIntegrationSettings updates integration settings
func (s *IntegrationService) UpdateIntegrationSettings(companyID string, request *models.IntegrationFeatureRequest) error {
	_, err := s.db.Exec(`
		UPDATE companies 
		SET allowed_domains = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, request.AllowedDomains, companyID)

	return err
}

// RegenerateAPIKey generates a new API key
func (s *IntegrationService) RegenerateAPIKey(companyID string) (*models.APIKeyResponse, error) {
	apiKey := "zk_" + generateRandomString(32)
	now := time.Now()

	_, err := s.db.Exec(`
		UPDATE companies 
		SET api_key = $1, api_key_created_at = $2, updated_at = $3
		WHERE id = $4
	`, apiKey, now, now, companyID)

	if err != nil {
		return nil, fmt.Errorf("failed to regenerate API key: %v", err)
	}

	return &models.APIKeyResponse{
		APIKey:    apiKey,
		CreatedAt: now,
	}, nil
}

// CompanyHasWebsiteIntegration checks if company has website integration
func (s *IntegrationService) CompanyHasWebsiteIntegration(companyID string) (bool, error) {
	var hasIntegration bool

	err := s.db.QueryRow(`
		SELECT website_integration_enabled 
		FROM companies 
		WHERE id = $1
	`, companyID).Scan(&hasIntegration)

	if err != nil {
		return false, fmt.Errorf("failed to check integration: %v", err)
	}

	return hasIntegration, nil
}

// CheckIntegrationPermission checks if company has specific feature
func (s *IntegrationService) CheckIntegrationPermission(companyID, featureKey string) (bool, error) {
	var hasPermission bool

	err := s.db.QueryRow(`
		SELECT is_enabled 
		FROM company_integration_features 
		WHERE company_id = $1 AND feature_key = $2
	`, companyID, featureKey).Scan(&hasPermission)

	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to check permission: %v", err)
	}

	return hasPermission, nil
}

// CheckDomainAccess checks if domain is allowed
func (s *IntegrationService) CheckDomainAccess(companyID, domain string) (bool, error) {
	var allowedDomains []string

	err := s.db.QueryRow(`
		SELECT COALESCE(allowed_domains, '{}') 
		FROM companies 
		WHERE id = $1
	`, companyID).Scan(&allowedDomains)

	if err != nil {
		return false, fmt.Errorf("failed to check domain access: %v", err)
	}

	// If no domains specified, allow all
	if len(allowedDomains) == 0 {
		return true, nil
	}

	// Check if domain is in allowed list
	for _, allowed := range allowedDomains {
		if allowed == domain || allowed == "*" {
			return true, nil
		}
	}

	return false, nil
}

// ValidateAPIKey validates API key and returns company
func (s *IntegrationService) ValidateAPIKey(apiKey string) (*models.Company, error) {
	company := &models.Company{}

	err := s.db.QueryRow(`
		SELECT id, name, website_integration_enabled
		FROM companies 
		WHERE api_key = $1 AND website_integration_enabled = true
	`, apiKey).Scan(&company.ID, &company.Name, &company.WebsiteIntegrationEnabled)

	if err != nil {
		return nil, fmt.Errorf("invalid API key: %v", err)
	}

	return company, nil
}

// GetCompanyIntegrationFeatures returns integration features
func (s *IntegrationService) GetCompanyIntegrationFeatures(companyID string) ([]models.IntegrationFeature, error) {
	rows, err := s.db.Query(`
		SELECT feature_key, feature_value, is_enabled, created_at, updated_at
		FROM company_integration_features 
		WHERE company_id = $1
		ORDER BY feature_key
	`, companyID)

	if err != nil {
		return nil, fmt.Errorf("failed to get features: %v", err)
	}
	defer rows.Close()

	var features []models.IntegrationFeature
	for rows.Next() {
		var feature models.IntegrationFeature
		err := rows.Scan(
			&feature.FeatureKey,
			&feature.FeatureValue,
			&feature.IsEnabled,
			&feature.CreatedAt,
			&feature.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan feature: %v", err)
		}
		features = append(features, feature)
	}

	return features, nil
}

// GetMarketplaceEligibility returns marketplace eligibility
func (s *IntegrationService) GetMarketplaceEligibility(companyID string) (*models.MarketplaceEligibility, error) {
	var integrationEnabled bool

	err := s.db.QueryRow(`
		SELECT website_integration_enabled 
		FROM companies 
		WHERE id = $1
	`, companyID).Scan(&integrationEnabled)

	if err != nil {
		return nil, fmt.Errorf("failed to check eligibility: %v", err)
	}

	eligibility := &models.MarketplaceEligibility{
		CanToggle: integrationEnabled,
	}

	if !integrationEnabled {
		eligibility.Reason = "Companies without website integration must remain visible in marketplace"
	}

	return eligibility, nil
}

// UpdateMarketplaceVisibility updates marketplace visibility
func (s *IntegrationService) UpdateMarketplaceVisibility(companyID string, visible bool) error {
	// Check if company can toggle marketplace visibility
	canToggle, err := s.CanToggleMarketplaceVisibility(companyID)
	if err != nil {
		return err
	}

	if !canToggle {
		return fmt.Errorf("marketplace visibility can only be controlled by companies with website integration")
	}

	_, err = s.db.Exec(`
		UPDATE companies 
		SET publish_to_marketplace = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, visible, companyID)

	return err
}

// CanToggleMarketplaceVisibility checks if company can toggle marketplace visibility
func (s *IntegrationService) CanToggleMarketplaceVisibility(companyID string) (bool, error) {
	var integrationEnabled bool

	err := s.db.QueryRow(`
		SELECT website_integration_enabled 
		FROM companies 
		WHERE id = $1
	`, companyID).Scan(&integrationEnabled)

	if err != nil {
		return false, fmt.Errorf("failed to check toggle permission: %v", err)
	}

	return integrationEnabled, nil
}

// GetSourceAnalytics returns source analytics
func (s *IntegrationService) GetSourceAnalytics(companyID string, dateFrom, dateTo time.Time) ([]models.SourceAnalytic, error) {
	rows, err := s.db.Query(`
		SELECT 
			source_type,
			COUNT(*) as interaction_count,
			COUNT(DISTINCT user_id) as unique_users,
			SUM(conversion_value) as total_value,
			DATE(created_at) as date
		FROM source_analytics 
		WHERE company_id = $1 
		AND created_at BETWEEN $2 AND $3
		GROUP BY source_type, DATE(created_at)
		ORDER BY date DESC, source_type
	`, companyID, dateFrom, dateTo)

	if err != nil {
		return nil, fmt.Errorf("failed to get analytics: %v", err)
	}
	defer rows.Close()

	var analytics []models.SourceAnalytic
	for rows.Next() {
		var analytic models.SourceAnalytic
		err := rows.Scan(
			&analytic.SourceType,
			&analytic.InteractionCount,
			&analytic.UniqueUsers,
			&analytic.TotalValue,
			&analytic.Date,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan analytic: %v", err)
		}
		analytics = append(analytics, analytic)
	}

	return analytics, nil
}

// GetCompanySourceSummary returns source summary
func (s *IntegrationService) GetCompanySourceSummary(companyID string, days int) (*models.SourceSummary, error) {
	summary := &models.SourceSummary{}

	err := s.db.QueryRow(`
		SELECT 
			COUNT(*) as total_interactions,
			COUNT(DISTINCT user_id) as unique_visitors,
			COUNT(CASE WHEN action_type = 'booking' THEN 1 END) as bookings,
			COUNT(CASE WHEN action_type = 'purchase' THEN 1 END) as purchases,
			COALESCE(SUM(conversion_value), 0) as total_value
		FROM source_analytics 
		WHERE company_id = $1 
		AND created_at >= CURRENT_DATE - INTERVAL '%d days'
	`, companyID, days).Scan(
		&summary.TotalInteractions,
		&summary.UniqueVisitors,
		&summary.Bookings,
		&summary.Purchases,
		&summary.TotalValue,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get summary: %v", err)
	}

	return summary, nil
}

// RecordWidgetInteraction records widget interaction
func (s *IntegrationService) RecordWidgetInteraction(companyID, source string) error {
	_, err := s.db.Exec(`
		INSERT INTO source_analytics (
			company_id, source_type, action_type, created_at
		) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
	`, companyID, source, "widget_interaction")

	return err
}

// Helper function to generate random string
func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}
