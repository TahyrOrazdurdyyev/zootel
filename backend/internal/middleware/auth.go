package middleware

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates Firebase JWT tokens and sets user context
func AuthMiddleware(authClient *auth.Client, db *sql.DB) gin.HandlerFunc {
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

		// Verify Firebase JWT token
		token, err := authClient.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user from database using Firebase UID
		user, err := getUserByFirebaseUID(db, token.UID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

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

// CompanyOwnerMiddleware checks if user is a company owner
func CompanyOwnerMiddleware() gin.HandlerFunc {
	return RequireRole("company_owner")
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
func EmployeeAuthMiddleware(db *sql.DB) gin.HandlerFunc {
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

		// For employees, we use a different token system
		// This would be a JWT token containing employee ID and company ID
		employee, err := validateEmployeeToken(db, tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid employee token"})
			c.Abort()
			return
		}

		// Set employee context
		c.Set("employee_id", employee.ID)
		c.Set("company_id", employee.CompanyID)
		c.Set("employee_role", employee.Role)
		c.Set("employee_permissions", employee.Permissions)
		c.Set("employee", employee)

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
		for _, perm := range permList {
			if perm == permission || perm == "all" {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
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
