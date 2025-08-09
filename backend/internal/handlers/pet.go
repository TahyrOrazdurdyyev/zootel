package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type PetHandler struct {
	petService *services.PetService
}

func NewPetHandler(petService *services.PetService) *PetHandler {
	return &PetHandler{petService: petService}
}

func (h *PetHandler) GetUserPets(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get user pets endpoint"})
}

func (h *PetHandler) CreatePet(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create pet endpoint"})
}

func (h *PetHandler) GetPet(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get pet endpoint"})
}

func (h *PetHandler) UpdatePet(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Update pet endpoint"})
}

func (h *PetHandler) DeletePet(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Delete pet endpoint"})
}

func (h *PetHandler) UploadPetPhoto(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Upload pet photo endpoint"})
}
