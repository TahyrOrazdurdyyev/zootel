package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userService *services.UserService
}

func NewAuthHandler(userService *services.UserService) *AuthHandler {
	return &AuthHandler{userService: userService}
}

type RegisterRequest struct {
	FirebaseUID         string   `json:"firebase_uid" binding:"required"`
	Email               string   `json:"email" binding:"required,email"`
	FirstName           string   `json:"first_name"`
	LastName            string   `json:"last_name"`
	Role                string   `json:"role"`
	Gender              string   `json:"gender"`
	Phone               string   `json:"phone"`
	Address             string   `json:"address"`
	Country             string   `json:"country"`
	State               string   `json:"state"`
	City                string   `json:"city"`
	Timezone            string   `json:"timezone"`
	NotificationMethods []string `json:"notification_methods"`
	MarketingOptIn      bool     `json:"marketing_opt_in"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type EmployeeLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email is already taken
	emailTaken, err := h.userService.IsEmailTaken(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check email availability"})
		return
	}

	if emailTaken {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Create user
	user := &models.User{
		FirebaseUID:         req.FirebaseUID,
		Email:               req.Email,
		FirstName:           req.FirstName,
		LastName:            req.LastName,
		Role:                req.Role,
		Gender:              req.Gender,
		Phone:               req.Phone,
		Address:             req.Address,
		Country:             req.Country,
		State:               req.State,
		City:                req.City,
		Timezone:            req.Timezone,
		NotificationMethods: req.NotificationMethods,
		MarketingOptIn:      req.MarketingOptIn,
	}

	if err := h.userService.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "User registered successfully",
		"data": gin.H{
			"user_id": user.ID,
			"email":   user.Email,
			"role":    user.Role,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	// For Firebase auth, login is handled by the client
	// This endpoint can be used for additional server-side logic after Firebase login
	// Or for custom token generation if needed

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Use Firebase authentication on client side",
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	fmt.Printf("[HANDLER] GetMe called from %s\n", c.ClientIP())
	
	// Get user data from Firebase UID in context (set by AuthMiddleware)
	firebaseUID, exists := c.Get("firebase_uid")
	if !exists {
		fmt.Printf("[HANDLER] No firebase_uid in context\n")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	fmt.Printf("[HANDLER] Firebase UID from context: %s\n", firebaseUID)

	// Get user from database
	fmt.Printf("[HANDLER] Calling userService.GetUserByFirebaseUID...\n")
	user, err := h.userService.GetUserByFirebaseUID(firebaseUID.(string))
	if err != nil {
		fmt.Printf("[HANDLER] Error from userService: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	fmt.Printf("[HANDLER] User retrieved successfully: %s\n", user.Email)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

func (h *AuthHandler) EmployeeLogin(c *gin.Context) {
	var req EmployeeLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement employee authentication
	// This would involve:
	// 1. Validate username/password against employees table
	// 2. Generate JWT token for employee
	// 3. Return token and employee info

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee login endpoint - TODO: implement JWT generation",
		"data": gin.H{
			"username": req.Username,
			"token":    "employee-jwt-token-placeholder",
		},
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Firebase handles token refresh on client side
	// This can be used for custom token refresh logic if needed

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Token refresh handled by Firebase SDK",
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Logout is typically handled on client side with Firebase
	// Server-side logout might involve token blacklisting if needed

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logout successful",
	})
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	// Email verification is handled by Firebase
	// This endpoint can be used for custom verification logic

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Email verification handled by Firebase",
	})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	// Password reset is handled by Firebase
	// This endpoint can be used for custom reset logic

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password reset handled by Firebase",
	})
}

// GetCurrentUser returns the current authenticated user's information
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user, err := h.userService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// UpdateProfile updates the current user's profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var updates models.User
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.UpdateUser(userID.(string), &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile updated successfully",
	})
}

// UploadAvatar handles avatar upload
func (h *AuthHandler) UploadAvatar(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// TODO: Implement file upload logic
	// For now, accept avatar URL in request body
	var req struct {
		AvatarURL string `json:"avatar_url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.UploadAvatar(userID.(string), req.AvatarURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update avatar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Avatar updated successfully",
	})
}

// UpdateNotificationPreferences updates user's notification settings
func (h *AuthHandler) UpdateNotificationPreferences(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req struct {
		NotificationMethods []string `json:"notification_methods" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.UpdateNotificationPreferences(userID.(string), req.NotificationMethods); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification preferences"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification preferences updated successfully",
	})
}

// GetUserProfile returns user's profile information (for other users or admin)
func (h *AuthHandler) GetUserProfile(c *gin.Context) {
	targetUserID := c.Param("user_id")
	currentUserID, _ := c.Get("user_id")
	currentUserRole, _ := c.Get("user_role")

	// Check if user can access this profile
	if currentUserRole != "super_admin" && !h.userService.ValidateUserAccess(currentUserID.(string), targetUserID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	user, err := h.userService.GetUserByID(targetUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// GetUsers returns list of users (admin only)
func (h *AuthHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	role := c.Query("role")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	users, total, err := h.userService.GetAllUsers(page, limit, role)
	if err != nil {
		fmt.Printf("[ERROR] GetUsers failed: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// SearchUsers searches for users (admin only)
func (h *AuthHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	role := c.Query("role")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	if limit < 1 || limit > 100 {
		limit = 20
	}

	users, err := h.userService.SearchUsers(query, role, limit)
	if err != nil {
		fmt.Printf("[ERROR] SearchUsers failed: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
	})
}

// GetUserStats returns user statistics (admin only)
func (h *AuthHandler) GetUserStats(c *gin.Context) {
	stats, err := h.userService.GetUserStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user statistics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// UpdateUserRole updates a user's role (admin only)
func (h *AuthHandler) UpdateUserRole(c *gin.Context) {
	userID := c.Param("user_id")

	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role
	validRoles := []string{"pet_owner", "company_owner", "super_admin"}
	isValidRole := false
	for _, validRole := range validRoles {
		if req.Role == validRole {
			isValidRole = true
			break
		}
	}

	if !isValidRole {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	if err := h.userService.UpdateUserRole(userID, req.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User role updated successfully",
	})
}
