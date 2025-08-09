package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	chatService *services.ChatService
}

func NewChatHandler(chatService *services.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

// CreateChat creates a new chat conversation
func (h *ChatHandler) CreateChat(c *gin.Context) {
	var req services.CreateChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	req.UserID = userID.(string)

	// Get company ID from context if not provided
	if req.CompanyID == "" {
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
		req.CompanyID = companyID.(string)
	}

	chat, err := h.chatService.CreateChat(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    chat,
	})
}

// SendMessage sends a message in a chat
func (h *ChatHandler) SendMessage(c *gin.Context) {
	var req services.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get sender ID from context
	if req.SenderType == "user" || req.SenderType == "employee" {
		senderID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}
		req.SenderID = senderID.(string)
	}

	message, err := h.chatService.SendMessage(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    message,
	})
}

// GetChat returns a specific chat conversation
func (h *ChatHandler) GetChat(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	chat, err := h.chatService.GetChatByID(chatID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	// Check access permissions
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	companyID, _ := c.Get("company_id")

	canAccess := false
	if userRole == "super_admin" {
		canAccess = true
	} else if userRole == "pet_owner" && chat.UserID == userID.(string) {
		canAccess = true
	} else if (userRole == "company_owner" || userRole == "employee") && chat.CompanyID == companyID.(string) {
		canAccess = true
	}

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    chat,
	})
}

// GetChatMessages returns messages for a chat
func (h *ChatHandler) GetChatMessages(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if limit < 1 || limit > 100 {
		limit = 50
	}

	// Verify access to chat
	chat, err := h.chatService.GetChatByID(chatID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	// Check access permissions
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")
	companyID, _ := c.Get("company_id")

	canAccess := false
	if userRole == "super_admin" {
		canAccess = true
	} else if userRole == "pet_owner" && chat.UserID == userID.(string) {
		canAccess = true
	} else if (userRole == "company_owner" || userRole == "employee") && chat.CompanyID == companyID.(string) {
		canAccess = true
	}

	if !canAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	messages, err := h.chatService.GetChatMessages(chatID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"chat_id":  chatID,
			"messages": messages,
			"limit":    limit,
			"offset":   offset,
		},
	})
}

// GetUserChats returns chats for the authenticated user
func (h *ChatHandler) GetUserChats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	chats, err := h.chatService.GetUserChats(userID.(string), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    chats,
	})
}

// GetCompanyChats returns chats for a company
func (h *ChatHandler) GetCompanyChats(c *gin.Context) {
	companyID := c.Param("company_id")
	if companyID == "" {
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
		companyID = companyID.(string)
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	chats, err := h.chatService.GetCompanyChats(companyID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"company_id": companyID,
			"chats":      chats,
		},
	})
}

// MarkMessagesAsRead marks messages as read
func (h *ChatHandler) MarkMessagesAsRead(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.chatService.MarkMessagesAsRead(chatID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Messages marked as read",
	})
}

// AssignChatToEmployee assigns a chat to an employee
func (h *ChatHandler) AssignChatToEmployee(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	var req struct {
		EmployeeID string `json:"employee_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.chatService.AssignChatToEmployee(chatID, req.EmployeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Chat assigned to employee successfully",
	})
}

// UpdateChatStatus updates chat status
func (h *ChatHandler) UpdateChatStatus(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	validStatuses := []string{"active", "closed", "archived", "pending"}
	isValidStatus := false
	for _, status := range validStatuses {
		if req.Status == status {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	err := h.chatService.UpdateChatStatus(chatID, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Chat status updated successfully",
	})
}

// CreateAIChat creates a chat with AI agent
func (h *ChatHandler) CreateAIChat(c *gin.Context) {
	var req struct {
		CompanyID      string `json:"company_id" binding:"required"`
		AIAgentKey     string `json:"ai_agent_key" binding:"required"`
		InitialMessage string `json:"initial_message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	chatReq := &services.CreateChatRequest{
		CompanyID:      req.CompanyID,
		UserID:         userID.(string),
		AIAgentKey:     req.AIAgentKey,
		InitialMessage: req.InitialMessage,
	}

	chat, err := h.chatService.CreateChat(chatReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    chat,
		"message": "AI chat created successfully",
	})
}

// SendAIMessage sends a message to AI agent in a chat
func (h *ChatHandler) SendAIMessage(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	var req struct {
		MessageText string                 `json:"message_text" binding:"required"`
		Context     map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Send user message first
	messageReq := &services.SendMessageRequest{
		ChatID:      chatID,
		SenderType:  "user",
		SenderID:    userID.(string),
		MessageText: req.MessageText,
		MessageData: req.Context,
	}

	message, err := h.chatService.SendMessage(messageReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    message,
		"message": "Message sent to AI agent",
	})
}

// GetChatStatistics returns chat statistics
func (h *ChatHandler) GetChatStatistics(c *gin.Context) {
	companyID := c.Query("company_id")
	if companyID == "" {
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
			return
		}
		companyID = companyID.(string)
	}

	// TODO: Implement chat statistics in ChatService
	stats := map[string]interface{}{
		"total_chats":           0,
		"active_chats":          0,
		"ai_chats":              0,
		"human_chats":           0,
		"average_response_time": 0,
		"customer_satisfaction": 0,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"company_id": companyID,
			"stats":      stats,
		},
	})
}
