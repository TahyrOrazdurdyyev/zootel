package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type ChatService struct {
	db             *sql.DB
	aiService      *AIService
	bookingService BookingServiceInterface
}

func NewChatService(db *sql.DB, aiService *AIService) *ChatService {
	return &ChatService{
		db:        db,
		aiService: aiService,
	}
}

// SetBookingService injects booking service for AI integration
func (s *ChatService) SetBookingService(bookingService BookingServiceInterface) {
	s.bookingService = bookingService
}

// BookingServiceInterface defines methods needed for chat integration
type BookingServiceInterface interface {
	ProcessAIBookingRequestChat(req *AIBookingRequestChat) (*AIBookingResponseChat, error)
}

type CreateChatRequest struct {
	CompanyID      string `json:"company_id" binding:"required"`
	UserID         string `json:"user_id" binding:"required"`
	AIAgentKey     string `json:"ai_agent_key"`
	InitialMessage string `json:"initial_message"`
}

type SendMessageRequest struct {
	ChatID      string                 `json:"chat_id" binding:"required"`
	SenderType  string                 `json:"sender_type" binding:"required"` // user, employee, ai
	SenderID    string                 `json:"sender_id"`
	MessageText string                 `json:"message_text" binding:"required"`
	MessageData map[string]interface{} `json:"message_data"`
	AIAgentKey  string                 `json:"ai_agent_key"`
}

type ChatMessage struct {
	ID          string                 `json:"id"`
	ChatID      string                 `json:"chat_id"`
	SenderType  string                 `json:"sender_type"`
	SenderID    *string                `json:"sender_id"`
	SenderName  string                 `json:"sender_name"`
	AIAgentKey  *string                `json:"ai_agent_key"`
	MessageText string                 `json:"message_text"`
	MessageData map[string]interface{} `json:"message_data"`
	IsRead      bool                   `json:"is_read"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

type ChatConversation struct {
	ID               string                 `json:"id"`
	CompanyID        string                 `json:"company_id"`
	UserID           string                 `json:"user_id"`
	EmployeeID       *string                `json:"employee_id"`
	AIAgentKey       *string                `json:"ai_agent_key"`
	Status           string                 `json:"status"`
	Subject          string                 `json:"subject"`
	ConversationData map[string]interface{} `json:"conversation_data"`
	LastMessageAt    *time.Time             `json:"last_message_at"`
	LastAIResponseAt *time.Time             `json:"last_ai_response_at"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
	UnreadCount      int                    `json:"unread_count"`
	LastMessage      *ChatMessage           `json:"last_message,omitempty"`
}

// CreateChat creates a new chat conversation
func (s *ChatService) CreateChat(req *CreateChatRequest) (*ChatConversation, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Create chat
	chatID := uuid.New().String()
	subject := "New Chat"
	if req.AIAgentKey != "" {
		// Get agent name for subject
		agents := s.aiService.GetAvailableAgents()
		for _, agent := range agents {
			if agent.Key == req.AIAgentKey {
				subject = "Chat with " + agent.Name
				break
			}
		}
	}

	_, err = tx.Exec(`
		INSERT INTO chats (
			id, company_id, user_id, ai_agent_key, status, subject,
			conversation_data, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, chatID, req.CompanyID, req.UserID, req.AIAgentKey, "active",
		subject, "{}", time.Now(), time.Now())

	if err != nil {
		return nil, err
	}

	// Send initial message if provided
	if req.InitialMessage != "" {
		messageID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO chat_messages (
				id, chat_id, sender_type, sender_id, message_text,
				message_data, is_read, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, messageID, chatID, "user", req.UserID, req.InitialMessage,
			"{}", false, time.Now(), time.Now())

		if err != nil {
			return nil, err
		}

		// Update chat with last message time
		_, err = tx.Exec(`
			UPDATE chats SET last_message_at = $2, updated_at = $3 WHERE id = $1
		`, chatID, time.Now(), time.Now())

		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	// Get the created chat
	chat, err := s.GetChatByID(chatID)
	if err != nil {
		return nil, err
	}

	// Process AI response if this is an AI chat and initial message was provided
	if req.AIAgentKey != "" && req.InitialMessage != "" {
		go s.processAIResponse(chatID, req.AIAgentKey, req.InitialMessage, req.CompanyID, req.UserID)
	}

	return chat, nil
}

// SendMessage sends a message in a chat
func (s *ChatService) SendMessage(req *SendMessageRequest) (*ChatMessage, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Create message
	messageID := uuid.New().String()
	messageDataJSON := "{}"
	if req.MessageData != nil {
		data, _ := json.Marshal(req.MessageData)
		messageDataJSON = string(data)
	}

	_, err = tx.Exec(`
		INSERT INTO chat_messages (
			id, chat_id, sender_type, sender_id, ai_agent_key, message_text,
			message_data, is_read, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, messageID, req.ChatID, req.SenderType, req.SenderID, req.AIAgentKey,
		req.MessageText, messageDataJSON, false, time.Now(), time.Now())

	if err != nil {
		return nil, err
	}

	// Update chat last message time
	updateField := "last_message_at"
	if req.SenderType == "ai" {
		updateField = "last_ai_response_at"
	}

	_, err = tx.Exec(fmt.Sprintf(`
		UPDATE chats SET %s = $2, updated_at = $3 WHERE id = $1
	`, updateField), req.ChatID, time.Now(), time.Now())

	if err != nil {
		return nil, err
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	// Get the created message
	message, err := s.GetMessageByID(messageID)
	if err != nil {
		return nil, err
	}

	// Process AI response if this is a user message in an AI-enabled chat
	if req.SenderType == "user" {
		go s.checkAndProcessAIResponse(req.ChatID, req.MessageText)
	}

	return message, nil
}

// GetChatByID returns a chat by ID
func (s *ChatService) GetChatByID(chatID string) (*ChatConversation, error) {
	var chat ChatConversation
	var lastMessageAt, lastAIResponseAt sql.NullTime
	var conversationDataStr string

	err := s.db.QueryRow(`
		SELECT c.id, c.company_id, c.user_id, c.employee_id, c.ai_agent_key,
			   c.status, c.subject, c.conversation_data, c.last_message_at,
			   c.last_ai_response_at, c.created_at, c.updated_at,
			   COALESCE((SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND is_read = false), 0) as unread_count
		FROM chats c
		WHERE c.id = $1
	`, chatID).Scan(
		&chat.ID, &chat.CompanyID, &chat.UserID, &chat.EmployeeID, &chat.AIAgentKey,
		&chat.Status, &chat.Subject, &conversationDataStr, &lastMessageAt,
		&lastAIResponseAt, &chat.CreatedAt, &chat.UpdatedAt, &chat.UnreadCount,
	)

	if err != nil {
		return nil, err
	}

	// Parse conversation data
	json.Unmarshal([]byte(conversationDataStr), &chat.ConversationData)

	if lastMessageAt.Valid {
		chat.LastMessageAt = &lastMessageAt.Time
	}
	if lastAIResponseAt.Valid {
		chat.LastAIResponseAt = &lastAIResponseAt.Time
	}

	return &chat, nil
}

// GetChatMessages returns messages for a chat
func (s *ChatService) GetChatMessages(chatID string, limit, offset int) ([]ChatMessage, error) {
	query := `
		SELECT cm.id, cm.chat_id, cm.sender_type, cm.sender_id, cm.ai_agent_key,
			   cm.message_text, cm.message_data, cm.is_read, cm.created_at, cm.updated_at,
			   CASE 
				   WHEN cm.sender_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
				   WHEN cm.sender_type = 'employee' THEN e.name
				   WHEN cm.sender_type = 'ai' THEN 'AI Assistant'
				   ELSE 'Unknown'
			   END as sender_name
		FROM chat_messages cm
		LEFT JOIN users u ON cm.sender_type = 'user' AND cm.sender_id = u.id
		LEFT JOIN employees e ON cm.sender_type = 'employee' AND cm.sender_id = e.id
		WHERE cm.chat_id = $1
		ORDER BY cm.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(query, chatID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var message ChatMessage
		var senderID, aiAgentKey sql.NullString
		var messageDataStr string

		err := rows.Scan(
			&message.ID, &message.ChatID, &message.SenderType, &senderID, &aiAgentKey,
			&message.MessageText, &messageDataStr, &message.IsRead, &message.CreatedAt,
			&message.UpdatedAt, &message.SenderName,
		)
		if err != nil {
			continue
		}

		if senderID.Valid {
			message.SenderID = &senderID.String
		}
		if aiAgentKey.Valid {
			message.AIAgentKey = &aiAgentKey.String
		}

		// Parse message data
		json.Unmarshal([]byte(messageDataStr), &message.MessageData)

		messages = append(messages, message)
	}

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

// GetUserChats returns chats for a user
func (s *ChatService) GetUserChats(userID string, limit int) ([]ChatConversation, error) {
	query := `
		SELECT c.id, c.company_id, c.user_id, c.employee_id, c.ai_agent_key,
			   c.status, c.subject, c.conversation_data, c.last_message_at,
			   c.last_ai_response_at, c.created_at, c.updated_at,
			   COALESCE((SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND is_read = false), 0) as unread_count
		FROM chats c
		WHERE c.user_id = $1
		ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
		LIMIT $2
	`

	rows, err := s.db.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chats []ChatConversation
	for rows.Next() {
		var chat ChatConversation
		var lastMessageAt, lastAIResponseAt sql.NullTime
		var conversationDataStr string

		err := rows.Scan(
			&chat.ID, &chat.CompanyID, &chat.UserID, &chat.EmployeeID, &chat.AIAgentKey,
			&chat.Status, &chat.Subject, &conversationDataStr, &lastMessageAt,
			&lastAIResponseAt, &chat.CreatedAt, &chat.UpdatedAt, &chat.UnreadCount,
		)
		if err != nil {
			continue
		}

		// Parse conversation data
		json.Unmarshal([]byte(conversationDataStr), &chat.ConversationData)

		if lastMessageAt.Valid {
			chat.LastMessageAt = &lastMessageAt.Time
		}
		if lastAIResponseAt.Valid {
			chat.LastAIResponseAt = &lastAIResponseAt.Time
		}

		// Get last message
		lastMessage, _ := s.getLastMessage(chat.ID)
		if lastMessage != nil {
			chat.LastMessage = lastMessage
		}

		chats = append(chats, chat)
	}

	return chats, nil
}

// GetCompanyChats returns chats for a company
func (s *ChatService) GetCompanyChats(companyID string, limit int) ([]ChatConversation, error) {
	query := `
		SELECT c.id, c.company_id, c.user_id, c.employee_id, c.ai_agent_key,
			   c.status, c.subject, c.conversation_data, c.last_message_at,
			   c.last_ai_response_at, c.created_at, c.updated_at,
			   COALESCE((SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND is_read = false), 0) as unread_count
		FROM chats c
		WHERE c.company_id = $1
		ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
		LIMIT $2
	`

	rows, err := s.db.Query(query, companyID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chats []ChatConversation
	for rows.Next() {
		var chat ChatConversation
		var lastMessageAt, lastAIResponseAt sql.NullTime
		var conversationDataStr string

		err := rows.Scan(
			&chat.ID, &chat.CompanyID, &chat.UserID, &chat.EmployeeID, &chat.AIAgentKey,
			&chat.Status, &chat.Subject, &conversationDataStr, &lastMessageAt,
			&lastAIResponseAt, &chat.CreatedAt, &chat.UpdatedAt, &chat.UnreadCount,
		)
		if err != nil {
			continue
		}

		// Parse conversation data
		json.Unmarshal([]byte(conversationDataStr), &chat.ConversationData)

		if lastMessageAt.Valid {
			chat.LastMessageAt = &lastMessageAt.Time
		}
		if lastAIResponseAt.Valid {
			chat.LastAIResponseAt = &lastAIResponseAt.Time
		}

		// Get last message
		lastMessage, _ := s.getLastMessage(chat.ID)
		if lastMessage != nil {
			chat.LastMessage = lastMessage
		}

		chats = append(chats, chat)
	}

	return chats, nil
}

// MarkMessagesAsRead marks messages as read
func (s *ChatService) MarkMessagesAsRead(chatID, userID string) error {
	_, err := s.db.Exec(`
		UPDATE chat_messages 
		SET is_read = true, updated_at = $3
		WHERE chat_id = $1 AND sender_id != $2 AND is_read = false
	`, chatID, userID, time.Now())

	return err
}

// AssignChatToEmployee assigns a chat to an employee
func (s *ChatService) AssignChatToEmployee(chatID, employeeID string) error {
	_, err := s.db.Exec(`
		UPDATE chats 
		SET employee_id = $2, updated_at = $3
		WHERE id = $1
	`, chatID, employeeID, time.Now())

	return err
}

// UpdateChatStatus updates chat status
func (s *ChatService) UpdateChatStatus(chatID, status string) error {
	_, err := s.db.Exec(`
		UPDATE chats 
		SET status = $2, updated_at = $3
		WHERE id = $1
	`, chatID, status, time.Now())

	return err
}

// Helper methods

func (s *ChatService) GetMessageByID(messageID string) (*ChatMessage, error) {
	var message ChatMessage
	var senderID, aiAgentKey sql.NullString
	var messageDataStr string

	err := s.db.QueryRow(`
		SELECT cm.id, cm.chat_id, cm.sender_type, cm.sender_id, cm.ai_agent_key,
			   cm.message_text, cm.message_data, cm.is_read, cm.created_at, cm.updated_at,
			   CASE 
				   WHEN cm.sender_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
				   WHEN cm.sender_type = 'employee' THEN e.name
				   WHEN cm.sender_type = 'ai' THEN 'AI Assistant'
				   ELSE 'Unknown'
			   END as sender_name
		FROM chat_messages cm
		LEFT JOIN users u ON cm.sender_type = 'user' AND cm.sender_id = u.id
		LEFT JOIN employees e ON cm.sender_type = 'employee' AND cm.sender_id = e.id
		WHERE cm.id = $1
	`, messageID).Scan(
		&message.ID, &message.ChatID, &message.SenderType, &senderID, &aiAgentKey,
		&message.MessageText, &messageDataStr, &message.IsRead, &message.CreatedAt,
		&message.UpdatedAt, &message.SenderName,
	)

	if err != nil {
		return nil, err
	}

	if senderID.Valid {
		message.SenderID = &senderID.String
	}
	if aiAgentKey.Valid {
		message.AIAgentKey = &aiAgentKey.String
	}

	// Parse message data
	json.Unmarshal([]byte(messageDataStr), &message.MessageData)

	return &message, nil
}

func (s *ChatService) getLastMessage(chatID string) (*ChatMessage, error) {
	var message ChatMessage
	var senderID, aiAgentKey sql.NullString
	var messageDataStr string

	err := s.db.QueryRow(`
		SELECT cm.id, cm.chat_id, cm.sender_type, cm.sender_id, cm.ai_agent_key,
			   cm.message_text, cm.message_data, cm.is_read, cm.created_at, cm.updated_at,
			   CASE 
				   WHEN cm.sender_type = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
				   WHEN cm.sender_type = 'employee' THEN e.name
				   WHEN cm.sender_type = 'ai' THEN 'AI Assistant'
				   ELSE 'Unknown'
			   END as sender_name
		FROM chat_messages cm
		LEFT JOIN users u ON cm.sender_type = 'user' AND cm.sender_id = u.id
		LEFT JOIN employees e ON cm.sender_type = 'employee' AND cm.sender_id = e.id
		WHERE cm.chat_id = $1
		ORDER BY cm.created_at DESC
		LIMIT 1
	`, chatID).Scan(
		&message.ID, &message.ChatID, &message.SenderType, &senderID, &aiAgentKey,
		&message.MessageText, &messageDataStr, &message.IsRead, &message.CreatedAt,
		&message.UpdatedAt, &message.SenderName,
	)

	if err != nil {
		return nil, err
	}

	if senderID.Valid {
		message.SenderID = &senderID.String
	}
	if aiAgentKey.Valid {
		message.AIAgentKey = &aiAgentKey.String
	}

	// Parse message data
	json.Unmarshal([]byte(messageDataStr), &message.MessageData)

	return &message, nil
}

func (s *ChatService) checkAndProcessAIResponse(chatID, userMessage string) {
	// Get chat details
	chat, err := s.GetChatByID(chatID)
	if err != nil || chat.AIAgentKey == nil {
		return
	}

	s.processAIResponse(chatID, *chat.AIAgentKey, userMessage, chat.CompanyID, chat.UserID)
}

func (s *ChatService) processAIResponse(chatID, agentKey, userMessage, companyID, userID string) {
	// Prepare context based on agent type
	context := map[string]interface{}{
		"chat_id": chatID,
	}

	// Special handling for Booking Assistant
	if agentKey == "booking_assistant" {
		// Try to extract booking intent from user message
		bookingContext := s.analyzeBookingIntent(userMessage, companyID, userID)
		context["booking_context"] = bookingContext

		// If this looks like a booking request, try to process it
		if bookingRequest := s.extractBookingRequest(userMessage, companyID, userID); bookingRequest != nil {
			// Get booking service from container (we'll need to inject this)
			if s.bookingService != nil {
				aiBookingReq := &AIBookingRequestChat{
					UserID:    userID,
					CompanyID: companyID,
					ServiceID: bookingRequest.ServiceID,
					PetID:     bookingRequest.PetID,
					DateTime:  bookingRequest.DateTime,
					Notes:     bookingRequest.Notes,
				}

				aiResponse, err := s.bookingService.ProcessAIBookingRequestChat(aiBookingReq)
				if err == nil {
					// Send structured booking response
					aiMessageReq := &SendMessageRequest{
						ChatID:      chatID,
						SenderType:  "ai",
						MessageText: s.formatBookingResponse(aiResponse),
						AIAgentKey:  agentKey,
						MessageData: map[string]interface{}{
							"booking_response": aiResponse,
							"is_booking":       true,
						},
					}

					s.SendMessage(aiMessageReq)
					return
				}
			}
		}
	}

	// Process AI response
	aiRequest := &AIRequest{
		AgentKey:    agentKey,
		UserMessage: userMessage,
		CompanyID:   companyID,
		UserID:      userID,
		Context:     context,
	}

	aiResponse, err := s.aiService.ProcessAIRequest(aiRequest)
	if err != nil {
		fmt.Printf("AI processing error: %v\n", err)
		return
	}

	// Send AI response as a message
	aiMessageReq := &SendMessageRequest{
		ChatID:      chatID,
		SenderType:  "ai",
		MessageText: aiResponse.Response,
		AIAgentKey:  agentKey,
		MessageData: map[string]interface{}{
			"confidence":    aiResponse.Confidence,
			"tokens_used":   aiResponse.TokensUsed,
			"processing_ms": aiResponse.ProcessingMs,
		},
	}

	_, err = s.SendMessage(aiMessageReq)
	if err != nil {
		fmt.Printf("Error sending AI message: %v\n", err)
	}
}

// Helper functions for booking integration
func (s *ChatService) analyzeBookingIntent(message, companyID, userID string) map[string]interface{} {
	context := make(map[string]interface{})

	// Simple keyword analysis (could be enhanced with NLP)
	lowerMessage := strings.ToLower(message)

	// Check for booking keywords
	bookingKeywords := []string{"book", "schedule", "appointment", "reserve", "времени", "записать", "забронировать"}
	hasBookingIntent := false
	for _, keyword := range bookingKeywords {
		if strings.Contains(lowerMessage, keyword) {
			hasBookingIntent = true
			break
		}
	}

	context["has_booking_intent"] = hasBookingIntent

	// Extract potential service types
	serviceKeywords := map[string]string{
		"grooming":   "grooming",
		"veterinary": "veterinary",
		"hotel":      "hotel",
		"training":   "training",
	}

	for service, russian := range serviceKeywords {
		if strings.Contains(lowerMessage, service) || strings.Contains(lowerMessage, russian) {
			context["mentioned_service"] = service
			break
		}
	}

	// Extract time mentions (simplified)
	timeKeywords := []string{"today", "tomorrow", "сегодня", "завтра", "понедельник", "вторник"}
	for _, timeKeyword := range timeKeywords {
		if strings.Contains(lowerMessage, timeKeyword) {
			context["mentioned_time"] = timeKeyword
			break
		}
	}

	return context
}

func (s *ChatService) extractBookingRequest(message, companyID, userID string) *BookingRequestData {
	// This is a simplified extraction - in production you'd use more sophisticated NLP
	// For now, return nil to let AI handle the conversation flow
	return nil
}

func (s *ChatService) formatBookingResponse(aiResponse *AIBookingResponseChat) string {
	if aiResponse.Success {
		return aiResponse.ClientMessage
	}

	// For unsuccessful bookings, show alternatives or error
	if len(aiResponse.Alternatives) > 0 {
		return aiResponse.ClientMessage
	}

	return aiResponse.ClientMessage
}

// Types for booking integration (renamed to avoid conflicts)
type BookingRequestData struct {
	ServiceID string
	PetID     string
	DateTime  time.Time
	Notes     string
}

// Note: AIBookingResponseChat and related types are defined in booking.go
