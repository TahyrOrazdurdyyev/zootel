package handlers

import "zootel-backend/internal/services"

type AIHandler struct {
	aiService *services.AIService
}

func NewAIHandler(aiService *services.AIService) *AIHandler {
	return &AIHandler{aiService: aiService}
}

func (h *AIHandler) ProcessMessage(c interface{})     {}
func (h *AIHandler) GetAvailableAgents(c interface{}) {}
func (h *AIHandler) ActivateAgent(c interface{})      {}
func (h *AIHandler) DeactivateAgent(c interface{})    {}
