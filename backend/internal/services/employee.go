package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type EmployeeService struct {
	db *sql.DB
}

func NewEmployeeService(db *sql.DB) *EmployeeService {
	return &EmployeeService{db: db}
}

// CreateEmployee creates a new employee with specified permissions
func (s *EmployeeService) CreateEmployee(companyID string, req *models.EmployeeRequest) (*models.Employee, error) {
	fmt.Printf("🔥 SERVICE: CreateEmployee called for company %s\n", companyID)
	
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("🔥 SERVICE ERROR: Failed to hash password: %v\n", err)
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	fmt.Printf("🔥 SERVICE: Password hashed successfully\n")

	// Validate role and get default permissions if not specified
	permissions := req.Permissions
	if len(permissions) == 0 {
		rolePerms, exists := models.PredefinedRoles[req.Role]
		if exists {
			permissions = rolePerms.Permissions
		}
	}

	// Convert CustomDate to *time.Time for database storage
	var hireDate *time.Time
	if req.HireDate != nil && !req.HireDate.Time.IsZero() {
		hireDate = &req.HireDate.Time
	}

	employee := &models.Employee{
		ID:          uuid.New().String(),
		CompanyID:   companyID,
		Username:    req.Username,
		Password:    string(hashedPassword),
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		Email:       req.Email,
		Phone:       req.Phone,
		Role:        req.Role,
		Permissions: permissions,
		Department:  req.Department,
		HireDate:    hireDate,
		Salary:      req.Salary,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	query := `
		INSERT INTO employees (
			id, company_id, username, password, first_name, last_name, email, phone,
			role, permissions, department, hire_date, salary, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`

	fmt.Printf("🔥 SERVICE: Executing database insert...\n")
	_, err = s.db.Exec(query,
		employee.ID, employee.CompanyID, employee.Username, employee.Password,
		employee.FirstName, employee.LastName, employee.Email, employee.Phone,
		employee.Role, pq.Array(employee.Permissions), employee.Department,
		employee.HireDate, employee.Salary, employee.IsActive,
		employee.CreatedAt, employee.UpdatedAt,
	)

	if err != nil {
		fmt.Printf("🔥 SERVICE ERROR: Database insert failed: %v\n", err)
		return nil, fmt.Errorf("failed to create employee: %w", err)
	}
	fmt.Printf("🔥 SERVICE: Database insert successful\n")

	// Log activity
	s.logActivity(employee.ID, "employee_created", "employee", employee.ID, map[string]interface{}{
		"role":        employee.Role,
		"department":  employee.Department,
		"permissions": employee.Permissions,
	})

	// Don't return password in response
	employee.Password = ""
	return employee, nil
}

// AuthenticateEmployee authenticates employee and returns session
func (s *EmployeeService) AuthenticateEmployee(req *models.EmployeeLoginRequest) (*models.EmployeeSession, error) {
	var employee models.Employee
	var permissions pq.StringArray

	query := `
		SELECT id, company_id, username, password, first_name, last_name, email,
			   role, permissions, department, is_active
		FROM employees 
		WHERE company_id = $1 AND username = $2 AND is_active = true
	`

	err := s.db.QueryRow(query, req.CompanyID, req.Username).Scan(
		&employee.ID, &employee.CompanyID, &employee.Username, &employee.Password,
		&employee.FirstName, &employee.LastName, &employee.Email,
		&employee.Role, &permissions, &employee.Department, &employee.IsActive,
	)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(employee.Password), []byte(req.Password))
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate session token
	token, err := s.generateSessionToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate session token: %w", err)
	}

	// Create session
	expiresAt := time.Now().Add(8 * time.Hour) // 8 hour session
	sessionQuery := `
		INSERT INTO employee_sessions (employee_id, session_token, expires_at)
		VALUES ($1, $2, $3)
	`
	_, err = s.db.Exec(sessionQuery, employee.ID, token, expiresAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Update last login
	s.db.Exec("UPDATE employees SET last_login = NOW() WHERE id = $1", employee.ID)

	// Log activity
	s.logActivity(employee.ID, "employee_login", "session", "", nil)

	return &models.EmployeeSession{
		EmployeeID:  employee.ID,
		CompanyID:   employee.CompanyID,
		Username:    employee.Username,
		Role:        employee.Role,
		Permissions: []string(permissions),
		Department:  employee.Department,
		LoginTime:   time.Now(),
		ExpiresAt:   expiresAt,
	}, nil
}

// ValidateSession validates employee session token
func (s *EmployeeService) ValidateSession(token string) (*models.Employee, error) {
	var employee models.Employee
	var permissions pq.StringArray

	query := `
		SELECT e.id, e.company_id, e.username, e.first_name, e.last_name, e.email,
			   e.role, e.permissions, e.department, e.is_active
		FROM employees e
		JOIN employee_sessions es ON e.id = es.employee_id
		WHERE es.session_token = $1 AND es.expires_at > NOW() AND es.is_active = true AND e.is_active = true
	`

	err := s.db.QueryRow(query, token).Scan(
		&employee.ID, &employee.CompanyID, &employee.Username,
		&employee.FirstName, &employee.LastName, &employee.Email,
		&employee.Role, &permissions, &employee.Department, &employee.IsActive,
	)
	if err != nil {
		return nil, fmt.Errorf("invalid or expired session")
	}

	employee.Permissions = []string(permissions)
	return &employee, nil
}

// GetEmployeesByCompany gets all employees for a company
func (s *EmployeeService) GetEmployeesByCompany(companyID string, includeInactive bool) ([]models.Employee, error) {
	whereClause := "WHERE company_id = $1"
	args := []interface{}{companyID}

	if !includeInactive {
		whereClause += " AND is_active = true"
	}

	query := fmt.Sprintf(`
		SELECT id, company_id, username, first_name, last_name, email, phone,
			   role, permissions, department, hire_date, salary, is_active,
			   last_login, created_at, updated_at
		FROM employees %s
		ORDER BY role, first_name, last_name
	`, whereClause)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		// Return empty array if table doesn't exist or query fails
		return []models.Employee{}, nil
	}
	defer rows.Close()

	var employees []models.Employee
	for rows.Next() {
		var employee models.Employee
		var permissions pq.StringArray

		err := rows.Scan(
			&employee.ID, &employee.CompanyID, &employee.Username,
			&employee.FirstName, &employee.LastName, &employee.Email, &employee.Phone,
			&employee.Role, &permissions, &employee.Department,
			&employee.HireDate, &employee.Salary, &employee.IsActive,
			&employee.LastLogin, &employee.CreatedAt, &employee.UpdatedAt,
		)
		if err != nil {
			continue
		}

		employee.Permissions = []string(permissions)
		employees = append(employees, employee)
	}

	return employees, nil
}

// GetEmployeeByID gets employee by ID
func (s *EmployeeService) GetEmployeeByID(employeeID string) (*models.Employee, error) {
	var employee models.Employee
	var permissions pq.StringArray

	query := `
		SELECT e.id, e.company_id, e.username, e.first_name, e.last_name, e.email, e.phone,
			   e.role, e.permissions, e.department, e.hire_date, e.salary, e.is_active,
			   e.last_login, e.created_at, e.updated_at, c.name as company_name
		FROM employees e
		JOIN companies c ON e.company_id = c.id
		WHERE e.id = $1
	`

	err := s.db.QueryRow(query, employeeID).Scan(
		&employee.ID, &employee.CompanyID, &employee.Username,
		&employee.FirstName, &employee.LastName, &employee.Email, &employee.Phone,
		&employee.Role, &permissions, &employee.Department,
		&employee.HireDate, &employee.Salary, &employee.IsActive,
		&employee.LastLogin, &employee.CreatedAt, &employee.UpdatedAt,
		&employee.CompanyName,
	)
	if err != nil {
		return nil, fmt.Errorf("employee not found: %w", err)
	}

	employee.Permissions = []string(permissions)
	return &employee, nil
}

// UpdateEmployee updates employee information
func (s *EmployeeService) UpdateEmployee(employeeID string, req *models.EmployeeRequest) (*models.Employee, error) {
	// Get current employee for comparison
	currentEmployee, err := s.GetEmployeeByID(employeeID)
	if err != nil {
		return nil, err
	}

	// Build update query
	query := `
		UPDATE employees SET
			first_name = $1, last_name = $2, email = $3, phone = $4,
			role = $5, permissions = $6, department = $7, hire_date = $8,
			salary = $9, updated_at = NOW()
		WHERE id = $10
	`

	permissions := req.Permissions
	if len(permissions) == 0 {
		rolePerms, exists := models.PredefinedRoles[req.Role]
		if exists {
			permissions = rolePerms.Permissions
		}
	}

	// Convert CustomDate to *time.Time for database storage
	var hireDate *time.Time
	if req.HireDate != nil && !req.HireDate.Time.IsZero() {
		hireDate = &req.HireDate.Time
	}

	_, err = s.db.Exec(query,
		req.FirstName, req.LastName, req.Email, req.Phone,
		req.Role, pq.Array(permissions), req.Department,
		hireDate, req.Salary, employeeID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update employee: %w", err)
	}

	// Log activity
	changes := make(map[string]interface{})
	if currentEmployee.Role != req.Role {
		changes["role_changed"] = map[string]string{"from": currentEmployee.Role, "to": req.Role}
	}
	if fmt.Sprintf("%v", currentEmployee.Permissions) != fmt.Sprintf("%v", permissions) {
		changes["permissions_changed"] = map[string]interface{}{
			"from": currentEmployee.Permissions,
			"to":   permissions,
		}
	}

	s.logActivity(employeeID, "employee_updated", "employee", employeeID, changes)

	return s.GetEmployeeByID(employeeID)
}

// UpdateEmployeePermissions updates only employee permissions
func (s *EmployeeService) UpdateEmployeePermissions(employeeID string, permissions []string) error {
	currentEmployee, err := s.GetEmployeeByID(employeeID)
	if err != nil {
		return err
	}

	query := `UPDATE employees SET permissions = $1, updated_at = NOW() WHERE id = $2`
	_, err = s.db.Exec(query, pq.Array(permissions), employeeID)
	if err != nil {
		return fmt.Errorf("failed to update permissions: %w", err)
	}

	// Log activity
	s.logActivity(employeeID, "permissions_updated", "employee", employeeID, map[string]interface{}{
		"old_permissions": currentEmployee.Permissions,
		"new_permissions": permissions,
	})

	return nil
}

// DeactivateEmployee deactivates employee
func (s *EmployeeService) DeactivateEmployee(employeeID string) error {
	query := `UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1`
	_, err := s.db.Exec(query, employeeID)
	if err != nil {
		return fmt.Errorf("failed to deactivate employee: %w", err)
	}

	// Invalidate all sessions
	s.db.Exec("UPDATE employee_sessions SET is_active = false WHERE employee_id = $1", employeeID)

	// Log activity
	s.logActivity(employeeID, "employee_deactivated", "employee", employeeID, nil)

	return nil
}

// HasPermission checks if employee has specific permission
func (s *EmployeeService) HasPermission(employeeID, permission string) (bool, error) {
	var permissions pq.StringArray
	query := `SELECT permissions FROM employees WHERE id = $1 AND is_active = true`
	err := s.db.QueryRow(query, employeeID).Scan(&permissions)
	if err != nil {
		return false, err
	}

	// Check for 'all' permission or specific permission
	for _, perm := range permissions {
		if perm == "all" || perm == permission {
			return true, nil
		}
	}

	return false, nil
}

// CheckDataAccess checks if employee can access specific data based on role and permissions
func (s *EmployeeService) CheckDataAccess(employeeID, dataType, resourceID string) (bool, error) {
	employee, err := s.GetEmployeeByID(employeeID)
	if err != nil {
		return false, err
	}

	// Check for 'all' permission
	for _, perm := range employee.Permissions {
		if perm == "all" {
			return true, nil
		}
	}

	switch dataType {
	case "booking":
		return s.checkBookingAccess(employee, resourceID)
	case "customer":
		return s.checkCustomerAccess(employee, resourceID)
	case "analytics":
		return s.hasPermission(employee.Permissions, "view_analytics"), nil
	case "financials":
		return s.hasPermission(employee.Permissions, "view_financials"), nil
	case "employees":
		return s.hasPermission(employee.Permissions, "view_employees"), nil
	default:
		return false, nil
	}
}

// GetAvailablePermissions returns all available permissions
func (s *EmployeeService) GetAvailablePermissions() ([]models.EmployeePermission, error) {
	query := `SELECT id, name, description, category FROM employee_permissions ORDER BY category, name`
	rows, err := s.db.Query(query)
	if err != nil {
		// Fallback to hardcoded permissions if table doesn't exist
		return []models.EmployeePermission{
			{ID: "view_bookings", Name: "View Bookings", Description: "View client bookings", Category: "bookings"},
			{ID: "create_bookings", Name: "Create Bookings", Description: "Create new bookings", Category: "bookings"},
			{ID: "edit_bookings", Name: "Edit Bookings", Description: "Modify bookings", Category: "bookings"},
			{ID: "view_customers", Name: "View Customers", Description: "View customer data", Category: "customers"},
			{ID: "edit_customers", Name: "Edit Customers", Description: "Modify customer data", Category: "customers"},
			{ID: "view_services", Name: "View Services", Description: "View company services", Category: "services"},
			{ID: "manage_employees", Name: "Manage Employees", Description: "Manage employees", Category: "employees"},
			{ID: "view_analytics", Name: "View Analytics", Description: "Access to analytics", Category: "analytics"},
			{ID: "process_payments", Name: "Process Payments", Description: "Process payments", Category: "payments"},
			{ID: "all", Name: "Full Access", Description: "Access to all functions", Category: "special"},
		}, nil
	}
	defer rows.Close()

	var permissions []models.EmployeePermission
	for rows.Next() {
		var perm models.EmployeePermission
		err := rows.Scan(&perm.ID, &perm.Name, &perm.Description, &perm.Category)
		if err != nil {
			continue
		}
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// GetAvailableRoles returns all available roles
func (s *EmployeeService) GetAvailableRoles() ([]models.EmployeeRole, error) {
	query := `SELECT id, name, description, department, permissions FROM employee_roles ORDER BY name`
	rows, err := s.db.Query(query)
	if err != nil {
		// Fallback to hardcoded roles if table doesn't exist
		return []models.EmployeeRole{
			{ID: "manager", Name: "Менеджер", Description: "Полный доступ к управлению компанией", Department: "management", Permissions: []string{"all"}},
			{ID: "veterinarian", Name: "Ветеринар", Description: "Доступ к медицинским функциям", Department: "medical", Permissions: []string{"view_bookings", "edit_bookings", "view_customers", "view_services"}},
			{ID: "groomer", Name: "Грумер", Description: "Доступ к грумингу", Department: "grooming", Permissions: []string{"view_bookings", "edit_bookings", "view_customers"}},
			{ID: "receptionist", Name: "Администратор", Description: "Управление записями и клиентами", Department: "reception", Permissions: []string{"view_bookings", "create_bookings", "edit_bookings", "view_customers", "edit_customers", "process_payments"}},
			{ID: "cashier", Name: "Кассир", Description: "Обработка платежей", Department: "reception", Permissions: []string{"view_bookings", "view_customers", "process_payments"}},
			{ID: "analyst", Name: "Аналитик", Description: "Доступ к аналитике", Department: "analytics", Permissions: []string{"view_analytics", "view_bookings", "view_customers"}},
		}, nil
	}
	defer rows.Close()

	var roles []models.EmployeeRole
	for rows.Next() {
		var role models.EmployeeRole
		var permissions pq.StringArray
		err := rows.Scan(&role.ID, &role.Name, &role.Description, &role.Department, &permissions)
		if err != nil {
			continue
		}
		role.Permissions = []string(permissions)
		roles = append(roles, role)
	}

	return roles, nil
}

// Logout invalidates employee session
func (s *EmployeeService) Logout(token string) error {
	query := `UPDATE employee_sessions SET is_active = false WHERE session_token = $1`
	_, err := s.db.Exec(query, token)
	return err
}

// Helper functions

func (s *EmployeeService) generateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (s *EmployeeService) hasPermission(permissions []string, required string) bool {
	for _, perm := range permissions {
		if perm == "all" || perm == required {
			return true
		}
	}
	return false
}

func (s *EmployeeService) hasPermissionBool(permissions []string, required string) bool {
	for _, perm := range permissions {
		if perm == "all" || perm == required {
			return true
		}
	}
	return false
}

func (s *EmployeeService) checkBookingAccess(employee *models.Employee, bookingID string) (bool, error) {
	// Manager and those with 'view_all_bookings' can see all bookings
	if s.hasPermission(employee.Permissions, "view_all_bookings") {
		return true, nil
	}

	// Others can only see their own bookings
	if s.hasPermission(employee.Permissions, "view_bookings") {
		var count int
		query := `SELECT COUNT(*) FROM bookings WHERE id = $1 AND employee_id = $2`
		s.db.QueryRow(query, bookingID, employee.ID).Scan(&count)
		return count > 0, nil
	}

	return false, nil
}

func (s *EmployeeService) checkCustomerAccess(employee *models.Employee, customerID string) (bool, error) {
	// Check if employee has customer view permission
	if !s.hasPermission(employee.Permissions, "view_customers") {
		return false, nil
	}

	// If has customer data permission, can see all customers
	if s.hasPermission(employee.Permissions, "view_customer_data") {
		return true, nil
	}

	// Otherwise, can only see customers they've served
	var count int
	query := `
		SELECT COUNT(*) FROM bookings 
		WHERE user_id = $1 AND employee_id = $2 AND company_id = $3
	`
	s.db.QueryRow(query, customerID, employee.ID, employee.CompanyID).Scan(&count)
	return count > 0, nil
}

func (s *EmployeeService) logActivity(employeeID, action, resource, resourceID string, details map[string]interface{}) {
	query := `
		INSERT INTO employee_activity_log (employee_id, action, resource, resource_id, details)
		VALUES ($1, $2, $3, $4, $5)
	`
	var detailsJSON interface{}
	if details != nil {
		detailsJSON = details
	}

	s.db.Exec(query, employeeID, action, resource, resourceID, detailsJSON)
}
