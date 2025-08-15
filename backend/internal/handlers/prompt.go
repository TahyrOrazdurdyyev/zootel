package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type PromptHandler struct {
	promptService *services.PromptService
}

func NewPromptHandler(promptService *services.PromptService) *PromptHandler {
	return &PromptHandler{promptService: promptService}
}

// Admin Endpoints

// GetGlobalPrompts returns all global prompts (admin only)
func (h *PromptHandler) GetGlobalPrompts(c *gin.Context) {
	prompts, err := h.promptService.GetGlobalPrompts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get global prompts: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    prompts,
	})
}

// CreateGlobalPrompt creates a new global prompt (admin only)
func (h *PromptHandler) CreateGlobalPrompt(c *gin.Context) {
	var req models.PromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get admin ID from context
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin ID not found"})
		return
	}

	err := h.promptService.CreateGlobalPrompt(&req, adminID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create global prompt: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Global prompt created successfully",
	})
}

// UpdateGlobalPrompt updates the global prompt (admin only)
func (h *PromptHandler) UpdateGlobalPrompt(c *gin.Context) {
	promptID := c.Param("id")
	if promptID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Prompt ID is required"})
		return
	}

	var req models.PromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get admin ID from context
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Admin ID not found"})
		return
	}

	err := h.promptService.UpdateGlobalPrompt(promptID, &req, adminID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update global prompt: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Global prompt updated successfully",
	})
}

// Company Endpoints

// GetCompanyPrompts returns custom company prompts
func (h *PromptHandler) GetCompanyPrompts(c *gin.Context) {
	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company ID not found"})
		return
	}

	prompts, err := h.promptService.GetCompanyPrompts(companyID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get company prompts: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    prompts,
	})
}

// GetAgentPromptsInfo returns complete information about the agent and its prompts
func (h *PromptHandler) GetAgentPromptsInfo(c *gin.Context) {
	agentKey := c.Param("agentKey")
	if agentKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent key is required"})
		return
	}

	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company ID not found"})
		return
	}

	info, err := h.promptService.GetAgentPromptsInfo(companyID.(string), agentKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get agent prompts info: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    info,
	})
}

// CreateCompanyPrompt creates a custom prompt for the company
func (h *PromptHandler) CreateCompanyPrompt(c *gin.Context) {
	var req models.PromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company ID not found"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	err := h.promptService.CreateCompanyPrompt(companyID.(string), &req, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create company prompt: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Company prompt created successfully",
	})
}

// UpdateCompanyPrompt updates the company's custom prompt
func (h *PromptHandler) UpdateCompanyPrompt(c *gin.Context) {
	agentKey := c.Param("agentKey")
	promptType := c.Param("promptType")

	if agentKey == "" || promptType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent key and prompt type are required"})
		return
	}

	var req models.PromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company ID not found"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	err := h.promptService.UpdateCompanyPrompt(companyID.(string), agentKey, promptType, &req, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update company prompt: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company prompt updated successfully",
	})
}

// DeleteCompanyPrompt deletes the company's custom prompt (fallback to global)
func (h *PromptHandler) DeleteCompanyPrompt(c *gin.Context) {
	agentKey := c.Param("agentKey")
	promptType := c.Param("promptType")

	if agentKey == "" || promptType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent key and prompt type are required"})
		return
	}

	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Company ID not found"})
		return
	}

	err := h.promptService.DeleteCompanyPrompt(companyID.(string), agentKey, promptType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete company prompt: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Company prompt deleted successfully (reverted to global)",
	})
}

// GetPromptPreview returns a preview of the prompt with interpolated variables
func (h *PromptHandler) GetPromptPreview(c *gin.Context) {
	agentKey := c.Query("agent_key")
	promptType := c.Query("prompt_type")
	content := c.Query("content")

	if agentKey == "" || promptType == "" || content == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "agent_key, prompt_type, and content are required",
		})
		return
	}

	// Here you can add preview logic with variable interpolation
	// For simplicity, return the original content with extracted variables

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"content":   content,
			"variables": extractVariables(content),
			"preview":   "Preview functionality coming soon",
		},
	})
}

// Helper function to extract variables from prompt content
func extractVariables(content string) []string {
	// This is a simplified version - in real implementation would use regex
	// to extract {{variable_name}} patterns
	return []string{"company_name", "service_categories", "business_hours"}
}
