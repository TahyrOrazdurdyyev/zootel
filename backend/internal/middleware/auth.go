package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates Firebase JWT tokens and sets user context
func AuthMiddleware(authClient *auth.Client, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("[AUTH] Request: %s %s from %s\n", c.Request.Method, c.Request.URL.Path, c.ClientIP())

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			fmt.Printf("[AUTH] No authorization header\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Verify Firebase JWT token
		fmt.Printf("[AUTH] Verifying Firebase token...\n")
		token, err := authClient.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			fmt.Printf("[AUTH] Firebase token invalid: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user from database using Firebase UID
		fmt.Printf("[AUTH] Looking up user with Firebase UID: %s\n", token.UID)
		user, err := getUserByFirebaseUID(db, token.UID)
		if err != nil {
			fmt.Printf("[AUTH] User not found in database: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		fmt.Printf("[AUTH] User found: %s (%s)\n", user.Email, user.Role)

		// Set user context
		c.Set("user_id", user.ID)
		c.Set("user_email", user.Email)
		c.Set("user_role", user.Role)
		c.Set("firebase_uid", user.FirebaseUID)
		c.Set("user", user)

		c.Next()
	}
}

// RequireRole middleware checks if user has the required role
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		role := userRole.(string)
		for _, requiredRole := range roles {
			if role == requiredRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
}

// SuperAdminMiddleware checks if user is a super admin
func SuperAdminMiddleware() gin.HandlerFunc {
	return RequireRole("super_admin")
}

// CompanyOwnerMiddleware checks if user is a company owner and sets company_id
func CompanyOwnerMiddleware(userService *services.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// First check if user has company_owner role
		userRole := c.GetString("user_role")
		if userRole != "company_owner" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. Company owner role required."})
			c.Abort()
			return
		}

		// Get user ID
		userID := c.GetString("user_id")
		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		// Find user's company
		company, err := userService.GetCompanyByOwner(userID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found for this user"})
			c.Abort()
			return
		}

		// Set company_id in context
		c.Set("company_id", company.ID)
		c.Next()
	}
}

// CompanyOwnerOrSuperAdminMiddleware checks if user is a company owner or super admin
func CompanyOwnerOrSuperAdminMiddleware() gin.HandlerFunc {
	return RequireRole("company_owner", "super_admin")
}

// PetOwnerMiddleware checks if user is a pet owner
func PetOwnerMiddleware() gin.HandlerFunc {
	return RequireRole("pet_owner")
}

// EmployeeAuthMiddleware validates employee credentials
func EmployeeAuthMiddleware(employeeService *services.EmployeeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Validate employee session token
		employee, err := employeeService.ValidateSession(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session"})
			c.Abort()
			return
		}

		// Set employee context
		c.Set("employee_id", employee.ID)
		c.Set("company_id", employee.CompanyID)
		c.Set("employee_role", employee.Role)
		c.Set("employee_permissions", employee.Permissions)
		c.Set("employee_department", employee.Department)
		c.Set("employee", employee)
		c.Set("user_type", "employee")

		c.Next()
	}
}

// RequirePermission middleware checks if employee has the required permission
func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		permissions, exists := c.Get("employee_permissions")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "No permissions found"})
			c.Abort()
			return
		}

		permList := permissions.([]string)
		hasPermission := false

		// Check for specific permission or 'all' permission
		for _, perm := range permList {
			if perm == permission || perm == "all" {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"error":               "Insufficient permissions",
				"required_permission": permission,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission middleware checks if employee has any of the specified permissions
func RequireAnyPermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		employeePermissions, exists := c.Get("employee_permissions")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "No permissions found"})
			c.Abort()
			return
		}

		permList := employeePermissions.([]string)
		hasPermission := false

		// Check for any required permission or 'all' permission
		for _, empPerm := range permList {
			if empPerm == "all" {
				hasPermission = true
				break
			}
			for _, reqPerm := range permissions {
				if empPerm == reqPerm {
					hasPermission = true
					break
				}
			}
			if hasPermission {
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"error":                "Insufficient permissions",
				"required_permissions": permissions,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole middleware checks if employee has the required role
func RequireEmployeeRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		employeeRole, exists := c.Get("employee_role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Employee role not found"})
			c.Abort()
			return
		}

		role := employeeRole.(string)
		hasRole := false

		for _, requiredRole := range roles {
			if role == requiredRole {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{
				"error":          "Insufficient role permissions",
				"required_roles": roles,
				"current_role":   role,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireDepartment middleware checks if employee belongs to specific department
func RequireDepartment(departments ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		employeeDepartment, exists := c.Get("employee_department")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Employee department not found"})
			c.Abort()
			return
		}

		department := employeeDepartment.(string)
		hasDepartment := false

		for _, reqDept := range departments {
			if department == reqDept {
				hasDepartment = true
				break
			}
		}

		if !hasDepartment {
			c.JSON(http.StatusForbidden, gin.H{
				"error":                "Department access denied",
				"required_departments": departments,
				"current_department":   department,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// DataAccessMiddleware checks if employee can access specific data
func DataAccessMiddleware(employeeService *services.EmployeeService, dataType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		employeeID := c.GetString("employee_id")
		if employeeID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Employee not authenticated"})
			c.Abort()
			return
		}

		// Get resource ID from URL parameters
		resourceID := ""
		switch dataType {
		case "booking":
			resourceID = c.Param("bookingId")
		case "customer":
			resourceID = c.Param("customerId")
		case "employee":
			resourceID = c.Param("employeeId")
		}

		if resourceID != "" {
			hasAccess, err := employeeService.CheckDataAccess(employeeID, dataType, resourceID)
			if err != nil || !hasAccess {
				c.JSON(http.StatusForbidden, gin.H{
					"error":       "Data access denied",
					"data_type":   dataType,
					"resource_id": resourceID,
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// FlexibleAuthMiddleware allows both user and employee authentication
func FlexibleAuthMiddleware(authClient *auth.Client, db *sql.DB, employeeService *services.EmployeeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Try employee authentication first
		employee, err := employeeService.ValidateSession(tokenString)
		if err == nil {
			// Employee authentication successful
			c.Set("employee_id", employee.ID)
			c.Set("company_id", employee.CompanyID)
			c.Set("employee_role", employee.Role)
			c.Set("employee_permissions", employee.Permissions)
			c.Set("employee_department", employee.Department)
			c.Set("employee", employee)
			c.Set("user_type", "employee")
			c.Next()
			return
		}

		// Try Firebase user authentication
		token, err := authClient.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		user, err := getUserByFirebaseUID(db, token.UID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", user.ID)
		c.Set("user_role", user.Role)
		c.Set("firebase_uid", user.FirebaseUID)
		c.Set("user", user)
		c.Set("user_type", "user")

		// Set company_id if user is company owner
		if user.Role == "company_owner" {
			companyID, err := getCompanyIDByOwner(db, user.ID)
			if err == nil {
				c.Set("company_id", companyID)
			}
		}

		c.Next()
	}
}

// Helper function to get company ID by owner
func getCompanyIDByOwner(db *sql.DB, ownerID string) (string, error) {
	var companyID string
	query := `SELECT id FROM companies WHERE owner_id = $1 AND is_active = true LIMIT 1`
	err := db.QueryRow(query, ownerID).Scan(&companyID)
	return companyID, err
}

// CompanyAccessMiddleware checks if user has access to the specified company
func CompanyAccessMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		companyID := c.Param("company_id")
		if companyID == "" {
			companyID = c.Query("company_id")
		}

		if companyID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
			c.Abort()
			return
		}

		userRole, _ := c.Get("user_role")
		userID, _ := c.Get("user_id")

		// Super admin can access any company
		if userRole == "super_admin" {
			c.Next()
			return
		}

		// Company owner can only access their own company
		if userRole == "company_owner" {
			hasAccess, err := isCompanyOwner(db, userID.(string), companyID)
			if err != nil || !hasAccess {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// TrialStatusMiddleware checks if company trial has expired and blocks access if needed
func TrialStatusMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip trial check for certain endpoints
		skipPaths := []string{
			"/api/auth/",
			"/api/public/",
			"/api/payments/",
			"/api/admin/",
			"/api/webhooks/",
		}

		for _, path := range skipPaths {
			if strings.HasPrefix(r.URL.Path, path) {
				next.ServeHTTP(w, r)
				return
			}
		}

		// Get user from context (set by AuthMiddleware)
		user, ok := r.Context().Value("user").(*models.User)
		if !ok || user == nil {
			next.ServeHTTP(w, r)
			return
		}

		// Skip if not a company owner or employee
		if user.Role != "company_owner" && user.Role != "employee" {
			next.ServeHTTP(w, r)
			return
		}

		// Get company by owner or employee
		var company *models.Company
		var err error

		if user.Role == "company_owner" {
			company, err = getCompanyByOwnerID(r.Context(), user.ID)
		} else if user.Role == "employee" {
			// For employees, get company from employee record
			company, err = getCompanyByEmployeeID(r.Context(), user.ID)
		}

		if err != nil || company == nil {
			next.ServeHTTP(w, r)
			return
		}

		// Check if trial expired and not a special partner
		if company.TrialExpired && !company.SpecialPartner {
			// Allow read-only access to certain endpoints
			readOnlyPaths := []string{
				"/api/user/profile",
				"/api/company/details",
				"/api/plans/",
			}

			isReadOnly := false
			for _, path := range readOnlyPaths {
				if strings.HasPrefix(r.URL.Path, path) && r.Method == "GET" {
					isReadOnly = true
					break
				}
			}

			if !isReadOnly {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusPaymentRequired)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error":         "trial_expired",
					"message":       "Your free trial has expired. Please upgrade your plan to continue using the service.",
					"trial_expired": true,
					"company_id":    company.ID,
				})
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// Helper functions
type User struct {
	ID          string `db:"id"`
	FirebaseUID string `db:"firebase_uid"`
	Email       string `db:"email"`
	Role        string `db:"role"`
}

type Employee struct {
	ID          string   `db:"id"`
	CompanyID   string   `db:"company_id"`
	Username    string   `db:"username"`
	Role        string   `db:"role"`
	Permissions []string `db:"permissions"`
	IsActive    bool     `db:"is_active"`
}

func getUserByFirebaseUID(db *sql.DB, firebaseUID string) (*User, error) {
	var user User
	query := `SELECT id, firebase_uid, email, role FROM users WHERE firebase_uid = $1`
	err := db.QueryRow(query, firebaseUID).Scan(&user.ID, &user.FirebaseUID, &user.Email, &user.Role)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func validateEmployeeToken(db *sql.DB, token string) (*Employee, error) {
	// TODO: Implement JWT validation for employee tokens
	// For now, this is a placeholder
	// In real implementation, you would:
	// 1. Parse JWT token
	// 2. Validate signature
	// 3. Extract employee ID
	// 4. Query database for employee

	var employee Employee
	// This is a simplified version - in real implementation you'd extract ID from JWT
	query := `
		SELECT id, company_id, username, role, permissions, is_active 
		FROM employees 
		WHERE id = $1 AND is_active = true
	`

	// For demo purposes, assume token contains employee ID directly
	err := db.QueryRow(query, token).Scan(
		&employee.ID, &employee.CompanyID, &employee.Username,
		&employee.Role, &employee.Permissions, &employee.IsActive,
	)
	if err != nil {
		return nil, err
	}

	return &employee, nil
}

func isCompanyOwner(db *sql.DB, userID, companyID string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM companies WHERE id = $1 AND owner_id = $2`
	err := db.QueryRow(query, companyID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// Helper functions to get company data
func getCompanyByOwnerID(ctx context.Context, ownerID string) (*models.Company, error) {
	// Get database from context or use a global reference
	// This is a simplified implementation
	return nil, fmt.Errorf("not implemented - database access needed")
}

func getCompanyByEmployeeID(ctx context.Context, employeeID string) (*models.Company, error) {
	// Get database from context or use a global reference
	// This is a simplified implementation
	return nil, fmt.Errorf("not implemented - database access needed")
}

// OptionalAuth middleware that doesn't require authentication but sets user context if available
func OptionalAuth(authClient *auth.Client, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.Next()
			return
		}

		// Try to verify token but don't fail if invalid
		token, err := authClient.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			c.Next()
			return
		}

		// Try to get user from database
		user, err := getUserByFirebaseUID(db, token.UID)
		if err != nil {
			c.Next()
			return
		}

		// Set user context if found
		c.Set("user_id", user.ID)
		c.Set("user_email", user.Email)
		c.Set("user_role", user.Role)
		c.Set("firebase_uid", user.FirebaseUID)
		c.Set("user", user)

		c.Next()
	}
}

// LoggingMiddleware logs API requests with user context
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Log the request with user context if available
		userID, _ := c.Get("user_id")
		userRole, _ := c.Get("user_role")

		fmt.Printf("[%s] %s %s - User: %v (%v)\n",
			c.Request.Method, c.Request.URL.Path, c.ClientIP(), userID, userRole)

		c.Next()
	}
}
