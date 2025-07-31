package handlers

import "zootel-backend/internal/services"

type AuthHandler struct {
	userService *services.UserService
}

func NewAuthHandler(userService *services.UserService) *AuthHandler {
	return &AuthHandler{userService: userService}
}

func (h *AuthHandler) Register(c interface{})      {}
func (h *AuthHandler) Login(c interface{})         {}
func (h *AuthHandler) EmployeeLogin(c interface{}) {}
func (h *AuthHandler) RefreshToken(c interface{})  {}
func (h *AuthHandler) Logout(c interface{})        {}
func (h *AuthHandler) VerifyEmail(c interface{})   {}
func (h *AuthHandler) ResetPassword(c interface{}) {}
