package handlers

import "zootel-backend/internal/services"

type ChatHandler struct {
	chatService *services.ChatService
}

func NewChatHandler(chatService *services.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

func (h *ChatHandler) GetUserChats(c interface{})    {}
func (h *ChatHandler) CreateChat(c interface{})      {}
func (h *ChatHandler) GetChat(c interface{})         {}
func (h *ChatHandler) GetMessages(c interface{})     {}
func (h *ChatHandler) SendMessage(c interface{})     {}
func (h *ChatHandler) GetCompanyChats(c interface{}) {}
func (h *ChatHandler) HandleWebSocket(c interface{}) {}
