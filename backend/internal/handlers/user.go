package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get profile endpoint"})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update profile endpoint"})
}

func (h *UserHandler) DeleteProfile(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete profile endpoint"})
}

func (h *UserHandler) UploadAvatar(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload avatar endpoint"})
}
