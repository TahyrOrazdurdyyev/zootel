package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	aiService *services.AIService
}

func NewAIHandler(aiService *services.AIService) *AIHandler {
	return &AIHandler{aiService: aiService}
}

func (h *AIHandler) ProcessMessage(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Process AI message endpoint"})
}

func (h *AIHandler) GetAvailableAgents(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get available agents endpoint"})
}

func (h *AIHandler) ActivateAgent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Activate agent endpoint"})
}

func (h *AIHandler) DeactivateAgent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Deactivate agent endpoint"})
}
