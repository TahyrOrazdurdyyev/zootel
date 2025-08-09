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

type DemoService struct {
	db *sql.DB
}

func NewDemoService(db *sql.DB) *DemoService {
	return &DemoService{db: db}
}

type DemoCompanyRequest struct {
	Name        string   `json:"name" binding:"required"`
	Category    string   `json:"category" binding:"required"`
	City        string   `json:"city" binding:"required"`
	Country     string   `json:"country"`
	State       string   `json:"state"`
	Description string   `json:"description"`
	Categories  []string `json:"categories"`
}

// CreateDemoCompany creates a complete demo company with sample data
func (s *DemoService) CreateDemoCompany(req *DemoCompanyRequest) (*models.Company, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Create demo user (company owner)
	demoUser := &models.User{
		ID:          uuid.New().String(),
		FirebaseUID: "demo-" + uuid.New().String(),
		Email:       fmt.Sprintf("demo.%s@zootel.demo", uuid.New().String()[:8]),
		FirstName:   "Demo",
		LastName:    "Owner",
		Role:        "company_owner",
		Phone:       "+1234567890",
		Country:     req.Country,
		State:       req.State,
		City:        req.City,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if req.Country == "" {
		demoUser.Country = "United States"
	}

	_, err = tx.Exec(`
		INSERT INTO users (
			id, firebase_uid, email, first_name, last_name, role, phone,
			country, state, city, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		demoUser.ID, demoUser.FirebaseUID, demoUser.Email, demoUser.FirstName,
		demoUser.LastName, demoUser.Role, demoUser.Phone, demoUser.Country,
		demoUser.State, demoUser.City, demoUser.CreatedAt, demoUser.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// 2. Create demo company
	company := &models.Company{
		ID:          uuid.New().String(),
		OwnerID:     demoUser.ID,
		Name:        req.Name,
		Description: req.Description,
		Categories:  req.Categories,
		Country:     demoUser.Country,
		State:       demoUser.State,
		City:        demoUser.City,
		Phone:       "+1234567890",
		Email:       demoUser.Email,
		IsDemo:      true,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if company.Description == "" {
		company.Description = fmt.Sprintf("Demo %s company showcasing Zootel platform capabilities", req.Category)
	}

	if len(company.Categories) == 0 {
		company.Categories = []string{req.Category}
	}

	// Set business hours
	businessHours := map[string]interface{}{
		"monday":    map[string]string{"open": "09:00", "close": "18:00"},
		"tuesday":   map[string]string{"open": "09:00", "close": "18:00"},
		"wednesday": map[string]string{"open": "09:00", "close": "18:00"},
		"thursday":  map[string]string{"open": "09:00", "close": "18:00"},
		"friday":    map[string]string{"open": "09:00", "close": "18:00"},
		"saturday":  map[string]string{"open": "10:00", "close": "16:00"},
		"sunday":    map[string]string{"open": "10:00", "close": "16:00"},
	}
	businessHoursJSON, _ := json.Marshal(businessHours)
	company.BusinessHours = string(businessHoursJSON)

	_, err = tx.Exec(`
		INSERT INTO companies (
			id, owner_id, name, description, categories, country, state, city,
			phone, email, business_hours, is_demo, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
		company.ID, company.OwnerID, company.Name, company.Description,
		pq.Array(company.Categories), company.Country, company.State, company.City,
		company.Phone, company.Email, company.BusinessHours, company.IsDemo,
		company.IsActive, company.CreatedAt, company.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// 3. Create demo employees
	if err := s.createDemoEmployees(tx, company.ID); err != nil {
		return nil, err
	}

	// 4. Create demo services based on category
	if err := s.createDemoServices(tx, company.ID, req.Category); err != nil {
		return nil, err
	}

	// 5. Create demo products
	if err := s.createDemoProducts(tx, company.ID, req.Category); err != nil {
		return nil, err
	}

	// 6. Create sample bookings and orders
	if err := s.createSampleBookingsAndOrders(tx, company.ID, demoUser.ID); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return company, nil
}

func (s *DemoService) createDemoEmployees(tx *sql.Tx, companyID string) error {
	employees := []struct {
		Username    string
		FirstName   string
		LastName    string
		Role        string
		Permissions []string
	}{
		{
			Username:    "manager01",
			FirstName:   "Alice",
			LastName:    "Johnson",
			Role:        "manager",
			Permissions: []string{"manage_bookings", "manage_inventory", "view_analytics"},
		},
		{
			Username:    "employee01",
			FirstName:   "Bob",
			LastName:    "Smith",
			Role:        "employee",
			Permissions: []string{"manage_bookings", "view_inventory"},
		},
		{
			Username:    "vet01",
			FirstName:   "Dr. Sarah",
			LastName:    "Wilson",
			Role:        "veterinarian",
			Permissions: []string{"manage_bookings", "medical_records"},
		},
	}

	for _, emp := range employees {
		employeeID := uuid.New().String()
		_, err := tx.Exec(`
			INSERT INTO employees (
				id, company_id, username, password, first_name, last_name,
				role, permissions, is_active, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			employeeID, companyID, emp.Username, "demo-password-hash",
			emp.FirstName, emp.LastName, emp.Role, pq.Array(emp.Permissions),
			true, time.Now(), time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *DemoService) createDemoServices(tx *sql.Tx, companyID, category string) error {
	var services []struct {
		Name        string
		Description string
		Price       float64
		Duration    int
		PetTypes    []string
	}

	switch category {
	case "veterinary":
		services = []struct {
			Name        string
			Description string
			Price       float64
			Duration    int
			PetTypes    []string
		}{
			{"Health Checkup", "Complete physical examination", 75.00, 30, []string{"dog", "cat", "bird"}},
			{"Vaccination", "Standard vaccination protocol", 45.00, 15, []string{"dog", "cat", "rabbit"}},
			{"Dental Cleaning", "Professional dental care", 120.00, 60, []string{"dog", "cat"}},
			{"Surgery Consultation", "Pre-surgical consultation", 150.00, 45, []string{"dog", "cat", "bird"}},
			{"Emergency Care", "24/7 emergency veterinary care", 200.00, 90, []string{"dog", "cat", "bird", "rabbit"}},
		}
	case "grooming":
		services = []struct {
			Name        string
			Description string
			Price       float64
			Duration    int
			PetTypes    []string
		}{
			{"Basic Grooming", "Bath, brush, nail trim", 40.00, 60, []string{"dog", "cat"}},
			{"Full Grooming", "Complete grooming service", 80.00, 120, []string{"dog"}},
			{"Nail Trimming", "Professional nail care", 15.00, 15, []string{"dog", "cat", "rabbit"}},
			{"Teeth Cleaning", "Dental hygiene service", 25.00, 30, []string{"dog", "cat"}},
			{"Flea Treatment", "Flea removal and prevention", 35.00, 45, []string{"dog", "cat"}},
		}
	case "boarding":
		services = []struct {
			Name        string
			Description string
			Price       float64
			Duration    int
			PetTypes    []string
		}{
			{"Day Care", "Daily pet care service", 30.00, 480, []string{"dog", "cat"}},
			{"Overnight Boarding", "Overnight pet accommodation", 50.00, 720, []string{"dog", "cat", "bird", "rabbit"}},
			{"Extended Stay", "Long-term boarding (per week)", 280.00, 10080, []string{"dog", "cat", "bird", "rabbit"}},
			{"Play Time", "Supervised play session", 20.00, 60, []string{"dog"}},
			{"Walking Service", "Professional dog walking", 25.00, 30, []string{"dog"}},
		}
	default:
		services = []struct {
			Name        string
			Description string
			Price       float64
			Duration    int
			PetTypes    []string
		}{
			{"Pet Care Service", "General pet care", 50.00, 60, []string{"dog", "cat"}},
			{"Consultation", "Pet care consultation", 35.00, 30, []string{"dog", "cat", "bird", "rabbit"}},
		}
	}

	// Get service category ID
	var categoryID string
	err := tx.QueryRow("SELECT id FROM service_categories WHERE name ILIKE $1 LIMIT 1", category).Scan(&categoryID)
	if err != nil {
		// Create category if it doesn't exist
		categoryID = uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO service_categories (id, name, created_at) 
			VALUES ($1, $2, $3)`,
			categoryID, category, time.Now(),
		)
		if err != nil {
			return err
		}
	}

	for _, service := range services {
		serviceID := uuid.New().String()
		_, err := tx.Exec(`
			INSERT INTO services (
				id, company_id, category_id, name, description, price, duration,
				pet_types, available_days, start_time, end_time, is_active,
				created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
			serviceID, companyID, categoryID, service.Name, service.Description,
			service.Price, service.Duration, pq.Array(service.PetTypes),
			pq.Array([]string{"monday", "tuesday", "wednesday", "thursday", "friday", "saturday"}),
			"09:00:00", "17:00:00", true, time.Now(), time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *DemoService) createDemoProducts(tx *sql.Tx, companyID, category string) error {
	var products []struct {
		Name        string
		Description string
		Price       float64
		Stock       int
	}

	switch category {
	case "veterinary":
		products = []struct {
			Name        string
			Description string
			Price       float64
			Stock       int
		}{
			{"Prescription Food - Dog", "Veterinary prescription diet", 45.99, 25},
			{"Prescription Food - Cat", "Therapeutic cat food", 42.99, 20},
			{"Medication Dispenser", "Automatic pill dispenser", 29.99, 15},
			{"Recovery Cone", "Post-surgery protection cone", 12.99, 30},
			{"Wound Care Kit", "Complete wound care package", 24.99, 18},
		}
	case "grooming":
		products = []struct {
			Name        string
			Description string
			Price       float64
			Stock       int
		}{
			{"Premium Dog Shampoo", "Hypoallergenic dog shampoo", 18.99, 40},
			{"Cat Grooming Kit", "Complete grooming tools set", 35.99, 22},
			{"Nail Clippers - Large", "Professional grade nail clippers", 14.99, 35},
			{"Dental Chews - Dog", "Dental health treats", 8.99, 50},
			{"Brushing Set", "Professional brushing tools", 28.99, 25},
		}
	default:
		products = []struct {
			Name        string
			Description string
			Price       float64
			Stock       int
		}{
			{"Pet Toy Set", "Assorted pet toys", 19.99, 30},
			{"Pet Treats", "Healthy pet treats", 12.99, 45},
			{"Pet Carrier", "Comfortable pet carrier", 49.99, 15},
		}
	}

	// Get category ID for products
	var categoryID string
	err := tx.QueryRow("SELECT id FROM service_categories WHERE name ILIKE $1 LIMIT 1", category).Scan(&categoryID)
	if err != nil {
		categoryID = uuid.New().String()
	}

	for _, product := range products {
		productID := uuid.New().String()
		_, err := tx.Exec(`
			INSERT INTO products (
				id, company_id, category_id, name, description, price, stock,
				low_stock_alert, is_active, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			productID, companyID, categoryID, product.Name, product.Description,
			product.Price, product.Stock, 5, true, time.Now(), time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *DemoService) createSampleBookingsAndOrders(tx *sql.Tx, companyID, demoUserID string) error {
	// Create sample pet owner for bookings/orders
	sampleUserID := uuid.New().String()
	_, err := tx.Exec(`
		INSERT INTO users (
			id, firebase_uid, email, first_name, last_name, role,
			phone, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		sampleUserID, "sample-"+uuid.New().String(), "sample@demo.com",
		"John", "Doe", "pet_owner", "+9876543210", time.Now(), time.Now(),
	)
	if err != nil {
		return err
	}

	// Create sample pet
	petID := uuid.New().String()
	_, err = tx.Exec(`
		INSERT INTO pets (
			id, user_id, name, gender, weight, sterilized,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		petID, sampleUserID, "Buddy", "male", 25.5, true, time.Now(), time.Now(),
	)
	if err != nil {
		return err
	}

	// Get a service ID for bookings
	var serviceID string
	err = tx.QueryRow("SELECT id FROM services WHERE company_id = $1 LIMIT 1", companyID).Scan(&serviceID)
	if err != nil {
		return err
	}

	// Create sample bookings
	bookingDates := []time.Time{
		time.Now().AddDate(0, 0, 1),  // Tomorrow
		time.Now().AddDate(0, 0, 3),  // In 3 days
		time.Now().AddDate(0, 0, 7),  // Next week
		time.Now().AddDate(0, 0, -7), // Last week (completed)
		time.Now().AddDate(0, 0, -3), // 3 days ago (completed)
	}

	statuses := []string{"confirmed", "confirmed", "pending", "completed", "completed"}

	for i, date := range bookingDates {
		bookingID := uuid.New().String()
		_, err := tx.Exec(`
			INSERT INTO bookings (
				id, user_id, company_id, service_id, pet_id, date_time,
				duration, price, status, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			bookingID, sampleUserID, companyID, serviceID, petID, date,
			60, 75.00, statuses[i], time.Now(), time.Now(),
		)
		if err != nil {
			return err
		}
	}

	// Create sample orders
	var productID string
	err = tx.QueryRow("SELECT id FROM products WHERE company_id = $1 LIMIT 1", companyID).Scan(&productID)
	if err == nil {
		orderID := uuid.New().String()
		orderItems := []map[string]interface{}{
			{
				"product_id": productID,
				"quantity":   2,
				"price":      18.99,
			},
		}
		orderItemsJSON, _ := json.Marshal(orderItems)

		_, err = tx.Exec(`
			INSERT INTO orders (
				id, user_id, company_id, order_items, total_amount,
				status, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			orderID, sampleUserID, companyID, string(orderItemsJSON),
			37.98, "completed", time.Now().AddDate(0, 0, -2), time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetAllDemoCompanies returns all demo companies
func (s *DemoService) GetAllDemoCompanies() ([]models.Company, error) {
	query := `
		SELECT id, owner_id, name, description, categories, country, state, city,
			   address, phone, email, website, logo_url, media_gallery,
			   business_hours, plan_id, trial_expired, special_partner,
			   manual_enabled_crm, manual_enabled_ai_agents, is_demo, is_active,
			   website_integration_enabled, api_key, publish_to_marketplace,
			   created_at, updated_at
		FROM companies 
		WHERE is_demo = true
		ORDER BY created_at DESC`

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

// DeleteDemoCompany removes a demo company and all its associated data
func (s *DemoService) DeleteDemoCompany(companyID string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check if it's actually a demo company
	var isDemo bool
	err = tx.QueryRow("SELECT is_demo FROM companies WHERE id = $1", companyID).Scan(&isDemo)
	if err != nil {
		return err
	}
	if !isDemo {
		return fmt.Errorf("company is not a demo company")
	}

	// Delete in correct order due to foreign key constraints
	tables := []string{
		"orders", "bookings", "products", "services", "employees",
		"ai_agents", "chats", "messages",
	}

	for _, table := range tables {
		_, err = tx.Exec(fmt.Sprintf("DELETE FROM %s WHERE company_id = $1", table), companyID)
		if err != nil {
			return err
		}
	}

	// Get owner ID before deleting company
	var ownerID string
	err = tx.QueryRow("SELECT owner_id FROM companies WHERE id = $1", companyID).Scan(&ownerID)
	if err != nil {
		return err
	}

	// Delete company
	_, err = tx.Exec("DELETE FROM companies WHERE id = $1", companyID)
	if err != nil {
		return err
	}

	// Delete demo user (owner)
	_, err = tx.Exec("DELETE FROM users WHERE id = $1", ownerID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// ResetDemoData resets all demo data to clean state
func (s *DemoService) ResetDemoData() error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete all demo-related data
	_, err = tx.Exec("DELETE FROM orders WHERE company_id IN (SELECT id FROM companies WHERE is_demo = true)")
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM bookings WHERE company_id IN (SELECT id FROM companies WHERE is_demo = true)")
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM products WHERE company_id IN (SELECT id FROM companies WHERE is_demo = true)")
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM services WHERE company_id IN (SELECT id FROM companies WHERE is_demo = true)")
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM employees WHERE company_id IN (SELECT id FROM companies WHERE is_demo = true)")
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM users WHERE id IN (SELECT owner_id FROM companies WHERE is_demo = true)")
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM companies WHERE is_demo = true")
	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetDemoCompanyStats returns statistics for demo companies
func (s *DemoService) GetDemoCompanyStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	var totalDemo, activeDemos int
	err := s.db.QueryRow("SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true) FROM companies WHERE is_demo = true").Scan(&totalDemo, &activeDemos)
	if err != nil {
		return nil, err
	}

	stats["total_demo_companies"] = totalDemo
	stats["active_demo_companies"] = activeDemos

	// Demo bookings and orders
	var demoBookings, demoOrders int
	err = s.db.QueryRow(`
		SELECT 
			(SELECT COUNT(*) FROM bookings WHERE company_id IN (SELECT id FROM companies WHERE is_demo = true)),
			(SELECT COUNT(*) FROM orders WHERE company_id IN (SELECT id FROM companies WHERE is_demo = true))
	`).Scan(&demoBookings, &demoOrders)
	if err != nil {
		return nil, err
	}

	stats["demo_bookings"] = demoBookings
	stats["demo_orders"] = demoOrders

	return stats, nil
}
