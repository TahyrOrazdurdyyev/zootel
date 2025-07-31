package handlers

import (
	"net/http"
	"zootel-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get user profile"})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update user profile"})
}

func (h *UserHandler) DeleteProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete user profile"})
}

func (h *UserHandler) UploadAvatar(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload avatar"})
}
