package services

import (
	"database/sql"
	"fmt"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

// GetCategoriesWithCounts gets service categories with service counts for marketplace
func (s *ServiceService) GetCategoriesWithCounts() ([]*models.ServiceCategory, error) {
	query := `
		SELECT sc.id, sc.name, sc.description, sc.icon, sc.background_image, 
		       sc.created_at, sc.updated_at,
		       COUNT(DISTINCT srv.id) as service_count
		FROM service_categories sc
		LEFT JOIN services srv ON sc.id = srv.category_id 
		    AND srv.is_active = true
		    AND EXISTS (
		        SELECT 1 FROM companies c 
		        WHERE c.id = srv.company_id 
		        AND c.is_active = true 
		        AND c.publish_to_marketplace = true
		    )
		GROUP BY sc.id, sc.name, sc.description, sc.icon, sc.background_image, 
		         sc.created_at, sc.updated_at
		ORDER BY sc.name ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query categories with counts: %w", err)
	}
	defer rows.Close()

	var categories []*models.ServiceCategory
	for rows.Next() {
		category := &models.ServiceCategory{}
		var description, backgroundImage sql.NullString
		var serviceCount int
		err := rows.Scan(
			&category.ID, &category.Name, &description, &category.Icon, &backgroundImage, 
			&category.CreatedAt, &category.UpdatedAt, &serviceCount,
		)
		if err != nil {
			fmt.Printf("❌ Failed to scan category: %v\n", err)
			continue
		}

		if description.Valid {
			category.Description = description.String
		}
		if backgroundImage.Valid {
			category.BackgroundImage = backgroundImage.String
		}
		
		// Add service count to category
		category.ServiceCount = serviceCount

		categories = append(categories, category)
	}

	return categories, nil
}
