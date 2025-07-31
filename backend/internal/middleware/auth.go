package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware() gin.HandlerFunc {
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

		// TODO: Validate Firebase JWT token
		// For now, just pass through
		c.Set("user_id", "placeholder_user_id")
		c.Next()
	}
}

// CompanyOwnerMiddleware checks if user is a company owner
func CompanyOwnerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Check if user has company owner role
		c.Next()
	}
}

// SuperAdminMiddleware checks if user is a super admin
func SuperAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Check if user has super admin role
		c.Next()
	}
}
