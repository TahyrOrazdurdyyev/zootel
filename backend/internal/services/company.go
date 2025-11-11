package services

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/lib/pq"
)

type CompanyService struct {
	db *sql.DB
}

func NewCompanyService(db *sql.DB) *CompanyService {
	return &CompanyService{db: db}
}

// GetPublicCompanies gets companies for marketplace with filtering
func (s *CompanyService) GetPublicCompanies(limit, offset int, category, city, country, search string) ([]*models.Company, int, error) {
	var conditions []string
	var args []interface{}
	argIndex := 1

	// Base condition - only active companies
	conditions = append(conditions, "c.is_active = true")

	// Add filters
	if category != "" {
		conditions = append(conditions, fmt.Sprintf("$%d = ANY(c.categories)", argIndex))
		args = append(args, category)
		argIndex++
	}

	if city != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(c.city) = LOWER($%d)", argIndex))
		args = append(args, city)
		argIndex++
	}

	if country != "" {
		conditions = append(conditions, fmt.Sprintf("LOWER(c.country) = LOWER($%d)", argIndex))
		args = append(args, country)
		argIndex++
	}

	if search != "" {
		searchCondition := fmt.Sprintf(`(
			LOWER(c.name) LIKE LOWER($%d) OR 
			LOWER(c.description) LIKE LOWER($%d) OR 
			LOWER(c.city) LIKE LOWER($%d)
		)`, argIndex, argIndex, argIndex)
		conditions = append(conditions, searchCondition)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	whereClause := "WHERE " + strings.Join(conditions, " AND ")

	// Count total results
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM companies c 
		%s`, whereClause)

	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count companies: %w", err)
	}

	// Get companies with pagination
	query := fmt.Sprintf(`
		SELECT c.id, c.name, c.description, c.city, c.country, c.address,
			   c.latitude, c.longitude, c.phone, c.email, c.website,
			   c.logo_url, c.media_gallery, c.categories,
			   COUNT(DISTINCT s.id) as service_count,
			   COUNT(DISTINCT p.id) as product_count,
			   AVG(r.rating) as avg_rating,
			   COUNT(DISTINCT r.id) as review_count
		FROM companies c
		LEFT JOIN services s ON c.id = s.company_id AND s.is_active = true
		LEFT JOIN products p ON c.id = p.company_id AND p.is_active = true
		LEFT JOIN reviews r ON c.id = r.company_id
		%s
		GROUP BY c.id, c.name, c.description, c.city, c.country, c.address,
				 c.latitude, c.longitude, c.phone, c.email, c.website,
				 c.logo_url, c.media_gallery, c.categories
		ORDER BY avg_rating DESC NULLS LAST, service_count + product_count DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIndex, argIndex+1)

	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query companies: %w", err)
	}
	defer rows.Close()

	var companies []*models.Company
	for rows.Next() {
		company := &models.Company{}
		var serviceCount, productCount, reviewCount int
		var avgRating sql.NullFloat64

		err := rows.Scan(
			&company.ID, &company.Name, &company.Description, &company.City,
			&company.Country, &company.Address, &company.Latitude, &company.Longitude,
			&company.Phone, &company.Email, &company.Website, &company.LogoURL,
			pq.Array(&company.MediaGallery), pq.Array(&company.Categories),
			&serviceCount, &productCount, &avgRating, &reviewCount,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan company: %w", err)
		}

		// Add computed fields (you might want to add these to your Company model)
		// company.ServiceCount = serviceCount
		// company.ProductCount = productCount
		// company.AvgRating = avgRating.Float64
		// company.ReviewCount = reviewCount

		companies = append(companies, company)
	}

	return companies, total, nil
}

// GetPublicCompanyProfile gets detailed public profile for a company
func (s *CompanyService) GetPublicCompanyProfile(companyID string) (map[string]interface{}, error) {
	query := `
		SELECT c.id, c.name, c.description, c.city, c.country, c.state, c.address,
			   c.latitude, c.longitude, c.phone, c.email, c.website,
			   c.logo_url, c.media_gallery, c.categories, c.business_hours,
			   COUNT(DISTINCT s.id) as service_count,
			   COUNT(DISTINCT p.id) as product_count,
			   AVG(r.rating) as avg_rating,
			   COUNT(DISTINCT r.id) as review_count,
			   c.created_at
		FROM companies c
		LEFT JOIN services s ON c.id = s.company_id AND s.is_active = true
		LEFT JOIN products p ON c.id = p.company_id AND p.is_active = true
		LEFT JOIN reviews r ON c.id = r.company_id
		WHERE c.id = $1 AND c.is_active = true
		GROUP BY c.id`

	row := s.db.QueryRow(query, companyID)

	var company models.Company
	var serviceCount, productCount, reviewCount int
	var avgRating sql.NullFloat64

	err := row.Scan(
		&company.ID, &company.Name, &company.Description, &company.City,
		&company.Country, &company.State, &company.Address, &company.Latitude,
		&company.Longitude, &company.Phone, &company.Email, &company.Website,
		&company.LogoURL, pq.Array(&company.MediaGallery), pq.Array(&company.Categories),
		&company.BusinessHours, &serviceCount, &productCount, &avgRating,
		&reviewCount, &company.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("company not found")
		}
		return nil, fmt.Errorf("failed to get company: %w", err)
	}

	// Get recent reviews
	recentReviews, _ := s.getRecentReviews(companyID, 5)

	// Build response
	result := map[string]interface{}{
		"id":             company.ID,
		"name":           company.Name,
		"description":    company.Description,
		"city":           company.City,
		"country":        company.Country,
		"state":          company.State,
		"address":        company.Address,
		"latitude":       company.Latitude,
		"longitude":      company.Longitude,
		"phone":          company.Phone,
		"email":          company.Email,
		"website":        company.Website,
		"logo_url":       company.LogoURL,
		"media_gallery":  company.MediaGallery,
		"categories":     company.Categories,
		"business_hours": company.BusinessHours,
		"service_count":  serviceCount,
		"product_count":  productCount,
		"avg_rating":     avgRating.Float64,
		"review_count":   reviewCount,
		"recent_reviews": recentReviews,
		"created_at":     company.CreatedAt,
	}

	return result, nil
}

// getRecentReviews gets recent reviews for a company
func (s *CompanyService) getRecentReviews(companyID string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT r.id, r.rating, r.comment, r.created_at,
			   u.first_name, u.last_name
		FROM reviews r
		JOIN users u ON r.user_id = u.id
		WHERE r.company_id = $1
		ORDER BY r.created_at DESC
		LIMIT $2`

	rows, err := s.db.Query(query, companyID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []map[string]interface{}
	for rows.Next() {
		var review map[string]interface{}
		var id, comment, firstName, lastName string
		var rating int
		var createdAt time.Time

		err := rows.Scan(&id, &rating, &comment, &createdAt, &firstName, &lastName)
		if err != nil {
			continue
		}

		review = map[string]interface{}{
			"id":            id,
			"rating":        rating,
			"comment":       comment,
			"created_at":    createdAt,
			"customer_name": firstName + " " + lastName,
		}

		reviews = append(reviews, review)
	}

	return reviews, nil
}

// GlobalSearch performs search across companies, services, and products
func (s *CompanyService) GlobalSearch(query, searchType string, limit, offset int) (map[string]interface{}, error) {
	results := map[string]interface{}{
		"companies": []interface{}{},
		"services":  []interface{}{},
		"products":  []interface{}{},
		"total":     0,
	}

	searchPattern := "%" + strings.ToLower(query) + "%"

	if searchType == "all" || searchType == "companies" {
		companies, err := s.searchCompanies(searchPattern, limit)
		if err == nil {
			results["companies"] = companies
		}
	}

	if searchType == "all" || searchType == "services" {
		services, err := s.searchServices(searchPattern, limit)
		if err == nil {
			results["services"] = services
		}
	}

	if searchType == "all" || searchType == "products" {
		products, err := s.searchProducts(searchPattern, limit)
		if err == nil {
			results["products"] = products
		}
	}

	return results, nil
}

// searchCompanies searches companies by name and description
func (s *CompanyService) searchCompanies(pattern string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT id, name, description, city, country, logo_url, 
			   COUNT(DISTINCT s.id) as service_count
		FROM companies c
		LEFT JOIN services s ON c.id = s.company_id AND s.is_active = true
		WHERE c.is_active = true AND (
			LOWER(c.name) LIKE $1 OR 
			LOWER(c.description) LIKE $1 OR
			LOWER(c.city) LIKE $1
		)
		GROUP BY c.id, c.name, c.description, c.city, c.country, c.logo_url
		ORDER BY c.name
		LIMIT $2`

	rows, err := s.db.Query(query, pattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var companies []map[string]interface{}
	for rows.Next() {
		var id, name, description, city, country, logoURL string
		var serviceCount int

		err := rows.Scan(&id, &name, &description, &city, &country, &logoURL, &serviceCount)
		if err != nil {
			continue
		}

		companies = append(companies, map[string]interface{}{
			"id":            id,
			"name":          name,
			"description":   description,
			"city":          city,
			"country":       country,
			"logo_url":      logoURL,
			"service_count": serviceCount,
			"type":          "company",
		})
	}

	return companies, nil
}

// searchServices searches services by name and description
func (s *CompanyService) searchServices(pattern string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT s.id, s.name, s.description, s.price, s.image_url,
			   c.id as company_id, c.name as company_name, c.city, c.logo_url
		FROM services s
		JOIN companies c ON s.company_id = c.id
		WHERE s.is_active = true AND c.is_active = true AND (
			LOWER(s.name) LIKE $1 OR 
			LOWER(s.description) LIKE $1
		)
		ORDER BY s.name
		LIMIT $2`

	rows, err := s.db.Query(query, pattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []map[string]interface{}
	for rows.Next() {
		var serviceID, name, description, imageURL string
		var companyID, companyName, city, companyLogo string
		var price float64

		err := rows.Scan(&serviceID, &name, &description, &price, &imageURL,
			&companyID, &companyName, &city, &companyLogo)
		if err != nil {
			continue
		}

		services = append(services, map[string]interface{}{
			"id":           serviceID,
			"name":         name,
			"description":  description,
			"price":        price,
			"image_url":    imageURL,
			"company_id":   companyID,
			"company_name": companyName,
			"company_city": city,
			"company_logo": companyLogo,
			"type":         "service",
		})
	}

	return services, nil
}

// searchProducts searches products by name and description
func (s *CompanyService) searchProducts(pattern string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock,
			   c.id as company_id, c.name as company_name, c.city, c.logo_url
		FROM products p
		JOIN companies c ON p.company_id = c.id
		WHERE p.is_active = true AND c.is_active = true AND (
			LOWER(p.name) LIKE $1 OR 
			LOWER(p.description) LIKE $1
		)
		ORDER BY p.name
		LIMIT $2`

	rows, err := s.db.Query(query, pattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []map[string]interface{}
	for rows.Next() {
		var productID, name, description, imageURL string
		var companyID, companyName, city, companyLogo string
		var price float64
		var stock int

		err := rows.Scan(&productID, &name, &description, &price, &imageURL, &stock,
			&companyID, &companyName, &city, &companyLogo)
		if err != nil {
			continue
		}

		products = append(products, map[string]interface{}{
			"id":           productID,
			"name":         name,
			"description":  description,
			"price":        price,
			"image_url":    imageURL,
			"stock":        stock,
			"company_id":   companyID,
			"company_name": companyName,
			"company_city": city,
			"company_logo": companyLogo,
			"type":         "product",
		})
	}

	return products, nil
}

// UpdateCompanyProfile updates company profile data
func (s *CompanyService) UpdateCompanyProfile(companyID string, updateData map[string]interface{}) error {
	// Build dynamic update query
	var setParts []string
	var args []interface{}
	argIndex := 1

	allowedFields := map[string]string{
		"name":           "name",
		"description":    "description",
		"business_type":  "business_type",
		"address":        "address",
		"city":           "city",
		"state":          "state",
		"country":        "country",
		"latitude":       "latitude",
		"longitude":      "longitude",
		"phone":          "phone",
		"email":          "email",
		"website":        "website",
		"business_hours": "business_hours",
		"categories":     "categories",
	}

	for field, value := range updateData {
		if dbField, allowed := allowedFields[field]; allowed {
			setParts = append(setParts, fmt.Sprintf("%s = $%d", dbField, argIndex))
			args = append(args, value)
			argIndex++
		}
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no valid fields to update")
	}

	// Add updated_at
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	// Add company ID for WHERE clause
	args = append(args, companyID)

	query := fmt.Sprintf(`
		UPDATE companies 
		SET %s 
		WHERE id = $%d`,
		strings.Join(setParts, ", "), argIndex)

	_, err := s.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update company: %w", err)
	}

	return nil
}

// CreateCompany creates a new company
func (s *CompanyService) CreateCompany(ownerID string, companyData map[string]interface{}) (*models.Company, error) {
	company := &models.Company{
		OwnerID:     ownerID,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Set company fields from data
	if name, ok := companyData["name"].(string); ok {
		company.Name = name
	}
	if description, ok := companyData["description"].(string); ok {
		company.Description = description
	}
	if businessType, ok := companyData["business_type"].(string); ok {
		company.BusinessType = businessType
	}
	if address, ok := companyData["address"].(string); ok {
		company.Address = address
	}
	if country, ok := companyData["country"].(string); ok {
		company.Country = country
	}
	if state, ok := companyData["state"].(string); ok {
		company.State = state
	}
	if city, ok := companyData["city"].(string); ok {
		company.City = city
	}
	if phone, ok := companyData["phone"].(string); ok {
		company.Phone = phone
	}
	if email, ok := companyData["email"].(string); ok {
		company.Email = email
	}
	if website, ok := companyData["website"].(string); ok {
		company.Website = website
	}

	// Insert company into database
	query := `
		INSERT INTO companies (
			owner_id, name, description, business_type, address, 
			country, state, city, phone, email, website, 
			is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id`

	err := s.db.QueryRow(query,
		company.OwnerID, company.Name, company.Description, company.BusinessType,
		company.Address, company.Country, company.State, company.City,
		company.Phone, company.Email, company.Website,
		company.IsActive, company.CreatedAt, company.UpdatedAt,
	).Scan(&company.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to create company: %w", err)
	}

	return company, nil
}
