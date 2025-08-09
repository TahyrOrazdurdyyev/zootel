package database

import (
	"database/sql"
	"fmt"
	"log"
)

// SeedData contains all seed data for the application
type SeedData struct {
	db *sql.DB
}

// NewSeedData creates a new seed data instance
func NewSeedData(db *sql.DB) *SeedData {
	return &SeedData{db: db}
}

// SeedAll runs all seed functions
func (s *SeedData) SeedAll() error {
	log.Println("Starting database seeding...")

	if err := s.SeedPetTypes(); err != nil {
		return fmt.Errorf("failed to seed pet types: %v", err)
	}

	if err := s.SeedServiceCategories(); err != nil {
		return fmt.Errorf("failed to seed service categories: %v", err)
	}

	if err := s.SeedPlans(); err != nil {
		return fmt.Errorf("failed to seed plans: %v", err)
	}

	if err := s.SeedPaymentMethods(); err != nil {
		return fmt.Errorf("failed to seed payment methods: %v", err)
	}

	if err := s.SeedNotificationTemplates(); err != nil {
		return fmt.Errorf("failed to seed notification templates: %v", err)
	}

	if err := s.SeedAvailableAddons(); err != nil {
		return fmt.Errorf("failed to seed available addons: %v", err)
	}

	if err := s.SeedDemoUsers(); err != nil {
		return fmt.Errorf("failed to seed demo users: %v", err)
	}

	if err := s.SeedDemoCompanies(); err != nil {
		return fmt.Errorf("failed to seed demo companies: %v", err)
	}

	log.Println("Database seeding completed successfully")
	return nil
}

// SeedPetTypes seeds the pet_types table
func (s *SeedData) SeedPetTypes() error {
	log.Println("Seeding pet types...")

	petTypes := []map[string]interface{}{
		{"name": "Dog", "description": "Domestic dogs", "is_active": true},
		{"name": "Cat", "description": "Domestic cats", "is_active": true},
		{"name": "Bird", "description": "Birds and avian pets", "is_active": true},
		{"name": "Fish", "description": "Aquatic pets", "is_active": true},
		{"name": "Rabbit", "description": "Rabbits and bunnies", "is_active": true},
		{"name": "Hamster", "description": "Small rodents", "is_active": true},
		{"name": "Guinea Pig", "description": "Guinea pigs", "is_active": true},
		{"name": "Reptile", "description": "Reptiles and lizards", "is_active": true},
		{"name": "Horse", "description": "Horses and equines", "is_active": true},
		{"name": "Other", "description": "Other types of pets", "is_active": true},
	}

	for _, petType := range petTypes {
		query := `
			INSERT INTO pet_types (id, name, description, is_active, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (name) DO NOTHING
		`
		_, err := s.db.Exec(query, petType["name"], petType["description"], petType["is_active"])
		if err != nil {
			return err
		}
	}

	return nil
}

// SeedServiceCategories seeds the service_categories table
func (s *SeedData) SeedServiceCategories() error {
	log.Println("Seeding service categories...")

	categories := []map[string]interface{}{
		{"name": "Veterinary", "description": "Medical care and health services", "is_active": true},
		{"name": "Grooming", "description": "Pet grooming and beauty services", "is_active": true},
		{"name": "Boarding", "description": "Pet boarding and accommodation", "is_active": true},
		{"name": "Training", "description": "Pet training and behavior modification", "is_active": true},
		{"name": "Walking", "description": "Dog walking and exercise services", "is_active": true},
		{"name": "Sitting", "description": "Pet sitting and care services", "is_active": true},
		{"name": "Nutrition", "description": "Pet nutrition and dietary consulting", "is_active": true},
		{"name": "Emergency", "description": "Emergency veterinary services", "is_active": true},
		{"name": "Dental", "description": "Pet dental care services", "is_active": true},
		{"name": "Rehabilitation", "description": "Pet rehabilitation and therapy", "is_active": true},
	}

	for _, category := range categories {
		query := `
			INSERT INTO service_categories (id, name, description, is_active, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (name) DO NOTHING
		`
		_, err := s.db.Exec(query, category["name"], category["description"], category["is_active"])
		if err != nil {
			return err
		}
	}

	return nil
}

// SeedPlans seeds the plans table
func (s *SeedData) SeedPlans() error {
	log.Println("Seeding subscription plans...")

	plans := []map[string]interface{}{
		{
			"name":                   "Starter",
			"description":            "Perfect for small pet care businesses just starting out",
			"price":                  29.99,
			"currency":               "USD",
			"billing_cycle":          "monthly",
			"max_employees":          2,
			"max_services":           10,
			"max_bookings_per_month": 100,
			"max_storage_gb":         5,
			"features":               `["online_booking", "customer_management", "appointment_scheduling"]`,
			"included_ai_agents":     `["booking_assistant"]`,
			"ai_agent_addons":        `["customer_support", "vet_consultant"]`,
			"is_active":              true,
			"trial_days":             14,
		},
		{
			"name":                   "Professional",
			"description":            "For growing businesses that need more features and capacity",
			"price":                  79.99,
			"currency":               "USD",
			"billing_cycle":          "monthly",
			"max_employees":          10,
			"max_services":           50,
			"max_bookings_per_month": 500,
			"max_storage_gb":         25,
			"features":               `["online_booking", "customer_management", "appointment_scheduling", "inventory_management", "analytics", "email_notifications", "payment_processing"]`,
			"included_ai_agents":     `["booking_assistant", "customer_support"]`,
			"ai_agent_addons":        `["vet_consultant", "nutrition_advisor", "training_coach"]`,
			"is_active":              true,
			"trial_days":             14,
		},
		{
			"name":                   "Business",
			"description":            "For established businesses with advanced needs",
			"price":                  149.99,
			"currency":               "USD",
			"billing_cycle":          "monthly",
			"max_employees":          25,
			"max_services":           200,
			"max_bookings_per_month": 2000,
			"max_storage_gb":         100,
			"features":               `["online_booking", "customer_management", "appointment_scheduling", "inventory_management", "analytics", "email_notifications", "sms_notifications", "payment_processing", "website_integration", "marketplace_visibility", "employee_management", "financial_reports"]`,
			"included_ai_agents":     `["booking_assistant", "customer_support", "vet_consultant"]`,
			"ai_agent_addons":        `["nutrition_advisor", "training_coach", "emergency_advisor", "appointment_scheduler"]`,
			"is_active":              true,
			"trial_days":             14,
		},
		{
			"name":                   "Enterprise",
			"description":            "For large organizations with complex requirements",
			"price":                  299.99,
			"currency":               "USD",
			"billing_cycle":          "monthly",
			"max_employees":          -1, // Unlimited
			"max_services":           -1, // Unlimited
			"max_bookings_per_month": -1, // Unlimited
			"max_storage_gb":         500,
			"features":               `["online_booking", "customer_management", "appointment_scheduling", "inventory_management", "analytics", "email_notifications", "sms_notifications", "payment_processing", "website_integration", "marketplace_visibility", "custom_branding", "api_access", "multi_location", "employee_management", "financial_reports", "customer_reviews", "loyalty_program", "bulk_operations", "data_export"]`,
			"included_ai_agents":     `["booking_assistant", "customer_support", "vet_consultant", "nutrition_advisor", "training_coach", "emergency_advisor", "appointment_scheduler", "follow_up_assistant"]`,
			"ai_agent_addons":        `[]`,
			"is_active":              true,
			"trial_days":             30,
		},
	}

	for _, plan := range plans {
		query := `
			INSERT INTO plans (id, name, description, price, currency, billing_cycle, max_employees, max_services, max_bookings_per_month, max_storage_gb, features, included_ai_agents, ai_agent_addons, is_active, trial_days, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (name) DO NOTHING
		`
		_, err := s.db.Exec(query,
			plan["name"], plan["description"], plan["price"], plan["currency"], plan["billing_cycle"],
			plan["max_employees"], plan["max_services"], plan["max_bookings_per_month"], plan["max_storage_gb"],
			plan["features"], plan["included_ai_agents"], plan["ai_agent_addons"], plan["is_active"], plan["trial_days"])
		if err != nil {
			return err
		}
	}

	return nil
}

// SeedPaymentMethods seeds the payment_methods table
func (s *SeedData) SeedPaymentMethods() error {
	log.Println("Seeding payment methods...")

	methods := []map[string]interface{}{
		{"name": "Credit Card", "type": "card", "processing_fee_percentage": 2.9, "processing_fee_fixed": 0.30},
		{"name": "Debit Card", "type": "card", "processing_fee_percentage": 2.9, "processing_fee_fixed": 0.30},
		{"name": "Bank Transfer", "type": "bank_transfer", "processing_fee_percentage": 0.8, "processing_fee_fixed": 0.00},
		{"name": "Cash", "type": "cash", "processing_fee_percentage": 0.0, "processing_fee_fixed": 0.00},
		{"name": "Apple Pay", "type": "digital_wallet", "processing_fee_percentage": 2.9, "processing_fee_fixed": 0.30},
		{"name": "Google Pay", "type": "digital_wallet", "processing_fee_percentage": 2.9, "processing_fee_fixed": 0.30},
	}

	for _, method := range methods {
		query := `
			INSERT INTO payment_methods (id, name, type, processing_fee_percentage, processing_fee_fixed, is_active, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (name) DO NOTHING
		`
		_, err := s.db.Exec(query, method["name"], method["type"], method["processing_fee_percentage"], method["processing_fee_fixed"])
		if err != nil {
			return err
		}
	}

	return nil
}

// SeedNotificationTemplates seeds the notification_templates table
func (s *SeedData) SeedNotificationTemplates() error {
	log.Println("Seeding notification templates...")

	templates := []map[string]interface{}{
		{
			"name":    "booking_confirmation",
			"type":    "email",
			"title":   "Booking Confirmation",
			"content": "Hello {{user_name}},\n\nYour booking for {{service_name}} on {{booking_date}} has been confirmed.\n\nDetails:\n- Service: {{service_name}}\n- Date: {{booking_date}}\n- Duration: {{duration}} minutes\n- Price: ${{price}}\n- Company: {{company_name}}\n\nThank you for choosing us!\n\nBest regards,\nZootel Team",
		},
		{
			"name":    "booking_reminder",
			"type":    "email",
			"title":   "Booking Reminder",
			"content": "Hello {{user_name}},\n\nThis is a reminder that you have a booking tomorrow:\n\n- Service: {{service_name}}\n- Date: {{booking_date}}\n- Time: {{booking_time}}\n- Company: {{company_name}}\n- Address: {{company_address}}\n\nPlease arrive 10 minutes early.\n\nBest regards,\nZootel Team",
		},
		{
			"name":    "booking_cancelled",
			"type":    "email",
			"title":   "Booking Cancelled",
			"content": "Hello {{user_name}},\n\nYour booking for {{service_name}} on {{booking_date}} has been cancelled.\n\nIf you have any questions, please contact us.\n\nBest regards,\nZootel Team",
		},
		{
			"name":    "welcome_email",
			"type":    "email",
			"title":   "Welcome to Zootel!",
			"content": "Hello {{user_name}},\n\nWelcome to Zootel! We're excited to have you join our community of pet lovers.\n\nYou can now:\n- Book services for your pets\n- Manage your pet profiles\n- Track your booking history\n- Chat with service providers\n\nGet started by exploring our marketplace!\n\nBest regards,\nZootel Team",
		},
	}

	for _, template := range templates {
		query := `
			INSERT INTO notification_templates (id, name, type, title, content, is_active, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (name) DO NOTHING
		`
		_, err := s.db.Exec(query, template["name"], template["type"], template["title"], template["content"])
		if err != nil {
			return err
		}
	}

	return nil
}

// SeedAvailableAddons seeds the available_addons table
func (s *SeedData) SeedAvailableAddons() error {
	log.Println("Seeding available addons...")

	addons := []map[string]interface{}{
		{
			"name":          "Additional Employee",
			"type":          "employee_limit",
			"description":   "Add one more employee to your team",
			"price":         15.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
		{
			"name":          "Customer Support AI",
			"type":          "ai_agent",
			"description":   "AI-powered customer support agent",
			"price":         25.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
		{
			"name":          "Vet Consultant AI",
			"type":          "ai_agent",
			"description":   "AI veterinary consultant for basic health advice",
			"price":         35.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
		{
			"name":          "Nutrition Advisor AI",
			"type":          "ai_agent",
			"description":   "AI nutrition advisor for pet dietary recommendations",
			"price":         30.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
		{
			"name":          "Training Coach AI",
			"type":          "ai_agent",
			"description":   "AI training coach for pet behavior guidance",
			"price":         25.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
		{
			"name":          "Website Integration",
			"type":          "feature",
			"description":   "Integrate Zootel widgets into your website",
			"price":         50.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
		{
			"name":          "Advanced Analytics",
			"type":          "feature",
			"description":   "Advanced analytics and reporting features",
			"price":         20.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
		{
			"name":          "SMS Notifications",
			"type":          "feature",
			"description":   "Send SMS notifications to customers",
			"price":         15.00,
			"currency":      "USD",
			"billing_cycle": "monthly",
		},
	}

	for _, addon := range addons {
		query := `
			INSERT INTO available_addons (id, name, type, description, price, currency, billing_cycle, is_active, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (name) DO NOTHING
		`
		_, err := s.db.Exec(query, addon["name"], addon["type"], addon["description"], addon["price"], addon["currency"], addon["billing_cycle"])
		if err != nil {
			return err
		}
	}

	return nil
}

// SeedDemoUsers creates demo users for testing
func (s *SeedData) SeedDemoUsers() error {
	log.Println("Seeding demo users...")

	users := []map[string]interface{}{
		{
			"email":      "admin@zootel.com",
			"username":   "admin",
			"first_name": "Super",
			"last_name":  "Admin",
			"role":       "super_admin",
			"is_active":  true,
		},
		{
			"email":      "demo@petowner.com",
			"username":   "demo_owner",
			"first_name": "John",
			"last_name":  "Doe",
			"role":       "pet_owner",
			"is_active":  true,
		},
		{
			"email":      "demo@company.com",
			"username":   "demo_company",
			"first_name": "Jane",
			"last_name":  "Smith",
			"role":       "company_owner",
			"is_active":  true,
		},
	}

	for _, user := range users {
		query := `
			INSERT INTO users (id, email, username, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (email) DO NOTHING
		`
		_, err := s.db.Exec(query, user["email"], user["username"], user["first_name"], user["last_name"], user["role"], user["is_active"])
		if err != nil {
			return err
		}
	}

	return nil
}

// SeedDemoCompanies creates demo companies for testing
func (s *SeedData) SeedDemoCompanies() error {
	log.Println("Seeding demo companies...")

	// First, get the demo company owner user ID
	var userID string
	err := s.db.QueryRow("SELECT id FROM users WHERE email = 'demo@company.com' LIMIT 1").Scan(&userID)
	if err != nil {
		log.Printf("Warning: Could not find demo company owner: %v", err)
		return nil // Don't fail the entire seeding process
	}

	// Get starter plan ID
	var planID string
	err = s.db.QueryRow("SELECT id FROM plans WHERE name = 'Starter' LIMIT 1").Scan(&planID)
	if err != nil {
		log.Printf("Warning: Could not find Starter plan: %v", err)
		return nil
	}

	companies := []map[string]interface{}{
		{
			"owner_id":               userID,
			"name":                   "Happy Paws Veterinary Clinic",
			"description":            "Professional veterinary care for all your pet needs",
			"address":                "123 Main Street, Pet City, PC 12345",
			"phone":                  "+1 (555) 123-4567",
			"email":                  "info@happypaws.com",
			"website":                "https://happypaws.com",
			"category":               "veterinary",
			"business_hours":         `{"monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00", "friday": "9:00-17:00", "saturday": "9:00-15:00", "sunday": "closed"}`,
			"rating":                 4.8,
			"is_active":              true,
			"is_verified":            true,
			"publish_to_marketplace": true,
			"plan_id":                planID,
		},
	}

	for _, company := range companies {
		query := `
			INSERT INTO companies (id, owner_id, name, description, address, phone, email, website, category, business_hours, rating, is_active, is_verified, publish_to_marketplace, plan_id, created_at, updated_at)
			VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (email) DO NOTHING
		`
		_, err := s.db.Exec(query,
			company["owner_id"], company["name"], company["description"], company["address"], company["phone"],
			company["email"], company["website"], company["category"], company["business_hours"], company["rating"],
			company["is_active"], company["is_verified"], company["publish_to_marketplace"], company["plan_id"])
		if err != nil {
			return err
		}
	}

	return nil
}

// CheckIfSeeded checks if the database has already been seeded
func (s *SeedData) CheckIfSeeded() (bool, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM plans").Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// ClearSeedData removes all seed data (for testing purposes)
func (s *SeedData) ClearSeedData() error {
	log.Println("Clearing seed data...")

	tables := []string{
		"companies",
		"users",
		"available_addons",
		"notification_templates",
		"payment_methods",
		"plans",
		"service_categories",
		"pet_types",
	}

	for _, table := range tables {
		query := fmt.Sprintf("DELETE FROM %s WHERE created_at >= CURRENT_DATE", table)
		_, err := s.db.Exec(query)
		if err != nil {
			log.Printf("Warning: Failed to clear %s: %v", table, err)
		}
	}

	log.Println("Seed data cleared")
	return nil
}
