package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	aiService *services.AIService
}

func NewAIHandler(aiService *services.AIService) *AIHandler {
	return &AIHandler{aiService: aiService}
}

// ProcessAIRequest handles AI agent requests
func (h *AIHandler) ProcessAIRequest(c *gin.Context) {
	var req services.AIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user and company context
	userID, exists := c.Get("user_id")
	if exists {
		req.UserID = userID.(string)
	}

	// Get company ID from context or request
	if req.CompanyID == "" {
		companyID, exists := c.Get("company_id")
		if exists {
			req.CompanyID = companyID.(string)
		}
	}

	if req.CompanyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	response, err := h.aiService.ProcessAIRequest(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// GetAvailableAgents returns all available AI agents
func (h *AIHandler) GetAvailableAgents(c *gin.Context) {
	agents := h.aiService.GetAvailableAgents()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    agents,
	})
}

// GetCompanyAIAgents returns available AI agents for a specific company
func (h *AIHandler) GetCompanyAIAgents(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
		companyID = companyID.(string)
	}

	agents, err := h.aiService.GetCompanyAIAgents(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"company_id": companyID,
			"agents":     agents,
		},
	})
}

// GetAIUsageStats returns AI usage statistics for a company
func (h *AIHandler) GetAIUsageStats(c *gin.Context) {
	companyID := c.Query("company_id")
	if companyID == "" {
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
		companyID = companyID.(string)
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	stats, err := h.aiService.GetAIUsageStats(companyID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"company_id": companyID,
			"period":     days,
			"stats":      stats,
		},
	})
}

// BookingAssistantRequest handles booking-specific AI requests
func (h *AIHandler) BookingAssistantRequest(c *gin.Context) {
	var req struct {
		UserMessage string                 `json:"user_message" binding:"required"`
		ServiceID   string                 `json:"service_id"`
		DateTime    string                 `json:"date_time"`
		Context     map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get company ID
	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Get user ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Prepare AI request with booking context
	aiRequest := &services.AIRequest{
		AgentKey:    "booking_assistant",
		UserMessage: req.UserMessage,
		CompanyID:   companyID.(string),
		UserID:      userID.(string),
		Context:     req.Context,
	}

	// Add booking-specific context
	if aiRequest.Context == nil {
		aiRequest.Context = make(map[string]interface{})
	}
	if req.ServiceID != "" {
		aiRequest.Context["service_id"] = req.ServiceID
	}
	if req.DateTime != "" {
		aiRequest.Context["requested_time"] = req.DateTime
	}

	response, err := h.aiService.ProcessAIRequest(aiRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// CustomerSupportRequest handles customer support AI requests
func (h *AIHandler) CustomerSupportRequest(c *gin.Context) {
	var req struct {
		UserMessage string                 `json:"user_message" binding:"required"`
		Category    string                 `json:"category"`
		Context     map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get company ID
	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Get user ID (optional for customer support)
	userID, _ := c.Get("user_id")
	userIDStr := ""
	if userID != nil {
		userIDStr = userID.(string)
	}

	// Prepare AI request
	aiRequest := &services.AIRequest{
		AgentKey:    "customer_support",
		UserMessage: req.UserMessage,
		CompanyID:   companyID.(string),
		UserID:      userIDStr,
		Context:     req.Context,
	}

	// Add support-specific context
	if aiRequest.Context == nil {
		aiRequest.Context = make(map[string]interface{})
	}
	if req.Category != "" {
		aiRequest.Context["inquiry_category"] = req.Category
	}

	response, err := h.aiService.ProcessAIRequest(aiRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// MedicalVetRequest handles veterinary AI requests
func (h *AIHandler) MedicalVetRequest(c *gin.Context) {
	var req struct {
		UserMessage string                 `json:"user_message" binding:"required"`
		PetID       string                 `json:"pet_id"`
		Symptoms    []string               `json:"symptoms"`
		Context     map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get company ID
	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Get user ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Prepare AI request
	aiRequest := &services.AIRequest{
		AgentKey:    "medical_vet_assistant",
		UserMessage: req.UserMessage,
		CompanyID:   companyID.(string),
		UserID:      userID.(string),
		Context:     req.Context,
	}

	// Add medical-specific context
	if aiRequest.Context == nil {
		aiRequest.Context = make(map[string]interface{})
	}
	if req.PetID != "" {
		aiRequest.Context["pet_id"] = req.PetID
		// TODO: Fetch pet details from database
	}
	if len(req.Symptoms) > 0 {
		aiRequest.Context["symptoms"] = req.Symptoms
	}

	response, err := h.aiService.ProcessAIRequest(aiRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// AnalyticsNarratorRequest handles analytics narration requests
func (h *AIHandler) AnalyticsNarratorRequest(c *gin.Context) {
	var req struct {
		Query       string                 `json:"query" binding:"required"`
		MetricsData map[string]interface{} `json:"metrics_data"`
		Context     map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get company ID
	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Get user ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Prepare AI request
	aiRequest := &services.AIRequest{
		AgentKey:    "analytics_narrator",
		UserMessage: req.Query,
		CompanyID:   companyID.(string),
		UserID:      userID.(string),
		Context:     req.Context,
	}

	// Add analytics-specific context
	if aiRequest.Context == nil {
		aiRequest.Context = make(map[string]interface{})
	}
	if req.MetricsData != nil {
		aiRequest.Context["metrics_data"] = req.MetricsData
	}

	response, err := h.aiService.ProcessAIRequest(aiRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// TestAIAgent allows testing AI agents with sample data
func (h *AIHandler) TestAIAgent(c *gin.Context) {
	agentKey := c.Param("agent_key")
	if agentKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent key is required"})
		return
	}

	var req struct {
		UserMessage string                 `json:"user_message" binding:"required"`
		Context     map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Use demo company for testing
	companyID := "demo-company-id" // TODO: Create or use actual demo company

	aiRequest := &services.AIRequest{
		AgentKey:    agentKey,
		UserMessage: req.UserMessage,
		CompanyID:   companyID,
		UserID:      "test-user-id",
		Context:     req.Context,
	}

	response, err := h.aiService.ProcessAIRequest(aiRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
		"note":    "This is a test request using demo data",
	})
}

// ProcessMessage handles general AI message processing (legacy endpoint)
func (h *AIHandler) ProcessMessage(c *gin.Context) {
	var req struct {
		Message   string                 `json:"message" binding:"required"`
		AgentType string                 `json:"agent_type"`
		Context   map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user and company context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company context required"})
		return
	}

	// Convert to AIRequest format
	aiRequest := &services.AIRequest{
		UserID:      userID.(string),
		CompanyID:   companyID.(string),
		AgentKey:    req.AgentType,
		UserMessage: req.Message,
		Context:     req.Context,
	}

	// Default to customer support if no agent specified
	if aiRequest.AgentKey == "" {
		aiRequest.AgentKey = "customer_support"
	}

	response, err := h.aiService.ProcessAIRequest(aiRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// ActivateAgent activates an AI agent for a company
func (h *AIHandler) ActivateAgent(c *gin.Context) {
	agentType := c.Param("type")
	if agentType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent type is required"})
		return
	}

	// Get company context
	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company context required"})
		return
	}

	// Check if user has permission (company owner or admin)
	userRole, _ := c.Get("user_role")
	if userRole != "company_owner" && userRole != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// For now, return success - full implementation would update company AI agent settings
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI agent activated",
		"data": gin.H{
			"company_id": companyID,
			"agent_type": agentType,
			"status":     "active",
		},
		"note": "Full activation logic to be implemented - would update company.manual_enabled_ai_agents",
	})
}

// DeactivateAgent deactivates an AI agent for a company
func (h *AIHandler) DeactivateAgent(c *gin.Context) {
	agentType := c.Param("type")
	if agentType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Agent type is required"})
		return
	}

	// Get company context
	companyID, exists := c.Get("company_id")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company context required"})
		return
	}

	// Check if user has permission (company owner or admin)
	userRole, _ := c.Get("user_role")
	if userRole != "company_owner" && userRole != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// For now, return success - full implementation would update company AI agent settings
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AI agent deactivated",
		"data": gin.H{
			"company_id": companyID,
			"agent_type": agentType,
			"status":     "inactive",
		},
		"note": "Full deactivation logic to be implemented - would update company.manual_enabled_ai_agents",
	})
}
