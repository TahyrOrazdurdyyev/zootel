package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

// AddonServiceInterface defines the addon service interface
type AddonServiceInterface interface {
	// Available addons management
	GetAvailableAddons() ([]models.AvailableAddon, error)
	CreateAvailableAddon(addon *models.AvailableAddon) error
	UpdateAvailableAddon(addon *models.AvailableAddon) error
	DeleteAvailableAddon(id int) error

	// Company addons management
	GetCompanyAddons(companyID string) ([]models.CompanyAddon, error)
	GetCompanyAddonSummary(companyID string) (*models.CompanyAddonSummary, error)
	AddCompanyAddon(addon *models.CompanyAddon) error
	RemoveCompanyAddon(companyID string, addonID int) error
	UpdateCompanyAddon(addon *models.CompanyAddon) error
	CheckCompanyAddon(companyID, addonType, addonKey string) (bool, string, error)

	// Admin functions
	GetAllCompaniesAddonSummary(page, limit int, search string) ([]models.CompanyAddonSummary, int, error)
}

// AddonService handles addon-related business logic
type AddonService struct {
	db *sql.DB
}

// NewAddonService creates a new addon service
func NewAddonService(db *sql.DB) AddonServiceInterface {
	return &AddonService{db: db}
}

// GetAvailableAddons returns all available addons
func (s *AddonService) GetAvailableAddons() ([]models.AvailableAddon, error) {
	query := `
		SELECT id, name, description, price, type, is_active, created_at, updated_at
		FROM available_addons 
		WHERE is_active = true 
		ORDER BY name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query available addons: %v", err)
	}
	defer rows.Close()

	var addons []models.AvailableAddon
	for rows.Next() {
		var addon models.AvailableAddon
		err := rows.Scan(
			&addon.ID,
			&addon.Name,
			&addon.Description,
			&addon.Price,
			&addon.Type,
			&addon.IsActive,
			&addon.CreatedAt,
			&addon.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan addon: %v", err)
		}
		addons = append(addons, addon)
	}

	return addons, nil
}

// CreateAvailableAddon creates a new available addon
func (s *AddonService) CreateAvailableAddon(addon *models.AvailableAddon) error {
	query := `
		INSERT INTO available_addons (name, description, price, type, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	now := time.Now()
	addon.CreatedAt = now
	addon.UpdatedAt = now
	addon.IsActive = true

	err := s.db.QueryRow(query,
		addon.Name,
		addon.Description,
		addon.Price,
		addon.Type,
		addon.IsActive,
		addon.CreatedAt,
		addon.UpdatedAt,
	).Scan(&addon.ID)

	if err != nil {
		return fmt.Errorf("failed to create available addon: %v", err)
	}

	return nil
}

// UpdateAvailableAddon updates an existing available addon
func (s *AddonService) UpdateAvailableAddon(addon *models.AvailableAddon) error {
	query := `
		UPDATE available_addons 
		SET name = $1, description = $2, price = $3, type = $4, is_active = $5, updated_at = $6
		WHERE id = $7
	`

	addon.UpdatedAt = time.Now()

	result, err := s.db.Exec(query,
		addon.Name,
		addon.Description,
		addon.Price,
		addon.Type,
		addon.IsActive,
		addon.UpdatedAt,
		addon.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update available addon: %v", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("addon not found")
	}

	return nil
}

// DeleteAvailableAddon soft-deletes an available addon
func (s *AddonService) DeleteAvailableAddon(id int) error {
	query := `UPDATE available_addons SET is_active = false, updated_at = $1 WHERE id = $2`

	result, err := s.db.Exec(query, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to delete available addon: %v", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("addon not found")
	}

	return nil
}

// GetCompanyAddons returns all addons for a company
func (s *AddonService) GetCompanyAddons(companyID string) ([]models.CompanyAddon, error) {
	query := `
		SELECT id, company_id, addon_type, addon_key, addon_value, is_active, created_at, updated_at
		FROM company_addons 
		WHERE company_id = $1 AND is_active = true
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query company addons: %v", err)
	}
	defer rows.Close()

	var addons []models.CompanyAddon
	for rows.Next() {
		var addon models.CompanyAddon
		err := rows.Scan(
			&addon.ID,
			&addon.CompanyID,
			&addon.AddonType,
			&addon.AddonKey,
			&addon.AddonValue,
			&addon.IsActive,
			&addon.CreatedAt,
			&addon.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan company addon: %v", err)
		}
		addons = append(addons, addon)
	}

	return addons, nil
}

// GetCompanyAddonSummary returns addon summary for a company
func (s *AddonService) GetCompanyAddonSummary(companyID string) (*models.CompanyAddonSummary, error) {
	query := `
		SELECT 
			c.id as company_id,
			c.name as company_name,
			COUNT(ca.id) as total_addons,
			COUNT(CASE WHEN ca.is_active = true THEN 1 END) as active_addons,
			COALESCE(SUM(CASE WHEN ca.is_active = true AND aa.price IS NOT NULL THEN aa.price ELSE 0 END), 0) as total_cost
		FROM companies c
		LEFT JOIN company_addons ca ON c.id = ca.company_id
		LEFT JOIN available_addons aa ON ca.addon_type = aa.type
		WHERE c.id = $1
		GROUP BY c.id, c.name
	`

	var summary models.CompanyAddonSummary
	err := s.db.QueryRow(query, companyID).Scan(
		&summary.CompanyID,
		&summary.CompanyName,
		&summary.TotalAddons,
		&summary.ActiveAddons,
		&summary.TotalCost,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get company addon summary: %v", err)
	}

	return &summary, nil
}

// AddCompanyAddon adds an addon to a company
func (s *AddonService) AddCompanyAddon(addon *models.CompanyAddon) error {
	// Check if addon already exists
	existingQuery := `
		SELECT id FROM company_addons 
		WHERE company_id = $1 AND addon_type = $2 AND addon_key = $3 AND is_active = true
	`

	var existingID int
	err := s.db.QueryRow(existingQuery, addon.CompanyID, addon.AddonType, addon.AddonKey).Scan(&existingID)
	if err == nil {
		return fmt.Errorf("addon already exists for this company")
	}

	// Insert new addon
	query := `
		INSERT INTO company_addons (company_id, addon_type, addon_key, addon_value, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	now := time.Now()
	addon.CreatedAt = now
	addon.UpdatedAt = now
	addon.IsActive = true

	err = s.db.QueryRow(query,
		addon.CompanyID,
		addon.AddonType,
		addon.AddonKey,
		addon.AddonValue,
		addon.IsActive,
		addon.CreatedAt,
		addon.UpdatedAt,
	).Scan(&addon.ID)

	if err != nil {
		return fmt.Errorf("failed to add company addon: %v", err)
	}

	return nil
}

// RemoveCompanyAddon deactivates an addon for a company
func (s *AddonService) RemoveCompanyAddon(companyID string, addonID int) error {
	query := `
		UPDATE company_addons 
		SET is_active = false, updated_at = $1 
		WHERE id = $2 AND company_id = $3
	`

	result, err := s.db.Exec(query, time.Now(), addonID, companyID)
	if err != nil {
		return fmt.Errorf("failed to remove company addon: %v", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("addon not found or already inactive")
	}

	return nil
}

// UpdateCompanyAddon updates an existing company addon
func (s *AddonService) UpdateCompanyAddon(addon *models.CompanyAddon) error {
	query := `
		UPDATE company_addons 
		SET addon_value = $1, updated_at = $2
		WHERE id = $3 AND company_id = $4
	`

	addon.UpdatedAt = time.Now()

	result, err := s.db.Exec(query,
		addon.AddonValue,
		addon.UpdatedAt,
		addon.ID,
		addon.CompanyID,
	)

	if err != nil {
		return fmt.Errorf("failed to update company addon: %v", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("addon not found")
	}

	return nil
}

// CheckCompanyAddon checks if company has specific addon
func (s *AddonService) CheckCompanyAddon(companyID, addonType, addonKey string) (bool, string, error) {
	query := `
		SELECT addon_value FROM company_addons 
		WHERE company_id = $1 AND addon_type = $2 AND addon_key = $3 AND is_active = true
	`

	var addonValue string
	err := s.db.QueryRow(query, companyID, addonType, addonKey).Scan(&addonValue)
	if err == sql.ErrNoRows {
		return false, "", nil
	}
	if err != nil {
		return false, "", fmt.Errorf("failed to check company addon: %v", err)
	}

	return true, addonValue, nil
}

// GetAllCompaniesAddonSummary returns addon summary for all companies (admin function)
func (s *AddonService) GetAllCompaniesAddonSummary(page, limit int, search string) ([]models.CompanyAddonSummary, int, error) {
	offset := (page - 1) * limit

	// Count total
	countQuery := `
		SELECT COUNT(DISTINCT c.id) 
		FROM companies c
		WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%')
	`

	var total int
	err := s.db.QueryRow(countQuery, search).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count companies: %v", err)
	}

	// Get summaries
	query := `
		SELECT 
			c.id as company_id,
			c.name as company_name,
			COUNT(ca.id) as total_addons,
			COUNT(CASE WHEN ca.is_active = true THEN 1 END) as active_addons,
			COALESCE(SUM(CASE WHEN ca.is_active = true AND aa.price IS NOT NULL THEN aa.price ELSE 0 END), 0) as total_cost
		FROM companies c
		LEFT JOIN company_addons ca ON c.id = ca.company_id
		LEFT JOIN available_addons aa ON ca.addon_type = aa.type
		WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%')
		GROUP BY c.id, c.name
		ORDER BY c.name
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(query, search, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query companies addon summary: %v", err)
	}
	defer rows.Close()

	var summaries []models.CompanyAddonSummary
	for rows.Next() {
		var summary models.CompanyAddonSummary
		err := rows.Scan(
			&summary.CompanyID,
			&summary.CompanyName,
			&summary.TotalAddons,
			&summary.ActiveAddons,
			&summary.TotalCost,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan company addon summary: %v", err)
		}
		summaries = append(summaries, summary)
	}

	return summaries, total, nil
}
