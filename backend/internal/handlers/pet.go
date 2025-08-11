package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
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
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	pets, err := h.petService.GetUserPets(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"pets":    pets,
	})
}

func (h *PetHandler) CreatePet(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var pet models.Pet
	if err := c.ShouldBindJSON(&pet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pet.UserID = userID
	err := h.petService.CreatePet(&pet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pet"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"pet":     pet,
	})
}

func (h *PetHandler) GetPet(c *gin.Context) {
	petID := c.Param("id")
	userID := c.GetString("user_id")

	// Validate pet ownership
	isOwner, err := h.petService.ValidatePetOwnership(petID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate ownership"})
		return
	}
	if !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to access this pet"})
		return
	}

	pet, err := h.petService.GetPetWithDetails(petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pet"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"pet":     pet,
	})
}

func (h *PetHandler) UpdatePet(c *gin.Context) {
	petID := c.Param("id")
	userID := c.GetString("user_id")

	// Validate pet ownership
	isOwner, err := h.petService.ValidatePetOwnership(petID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate ownership"})
		return
	}
	if !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to access this pet"})
		return
	}

	var pet models.Pet
	if err := c.ShouldBindJSON(&pet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petService.UpdatePet(petID, &pet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pet"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"pet":     pet,
	})
}

func (h *PetHandler) DeletePet(c *gin.Context) {
	petID := c.Param("id")
	userID := c.GetString("user_id")

	// Validate pet ownership
	isOwner, err := h.petService.ValidatePetOwnership(petID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate ownership"})
		return
	}
	if !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to access this pet"})
		return
	}

	err = h.petService.DeletePet(petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pet"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pet deleted successfully",
	})
}

func (h *PetHandler) AddPetPhoto(c *gin.Context) {
	petID := c.Param("petId")
	userID := c.GetString("user_id")

	// Validate pet ownership
	isOwner, err := h.petService.ValidatePetOwnership(petID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate ownership"})
		return
	}
	if !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to access this pet"})
		return
	}

	var req struct {
		PhotoURL string `json:"photoUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petService.AddPetPhoto(petID, req.PhotoURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add photo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Photo added successfully",
	})
}

func (h *PetHandler) RemovePetPhoto(c *gin.Context) {
	petID := c.Param("petId")
	userID := c.GetString("user_id")

	// Validate pet ownership
	isOwner, err := h.petService.ValidatePetOwnership(petID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate ownership"})
		return
	}
	if !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to access this pet"})
		return
	}

	var req struct {
		PhotoURL string `json:"photoUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petService.RemovePetPhoto(petID, req.PhotoURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove photo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Photo removed successfully",
	})
}

func (h *PetHandler) UpdatePetMainPhoto(c *gin.Context) {
	petID := c.Param("petId")
	userID := c.GetString("user_id")

	// Validate pet ownership
	isOwner, err := h.petService.ValidatePetOwnership(petID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate ownership"})
		return
	}
	if !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to access this pet"})
		return
	}

	var req struct {
		PhotoURL string `json:"photoUrl" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petService.UpdatePetMainPhoto(petID, req.PhotoURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update main photo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Main photo updated successfully",
	})
}

func (h *PetHandler) UpdatePetWeight(c *gin.Context) {
	petID := c.Param("petId")
	userID := c.GetString("user_id")

	// Validate pet ownership
	isOwner, err := h.petService.ValidatePetOwnership(petID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate ownership"})
		return
	}
	if !isOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to access this pet"})
		return
	}

	var req struct {
		Weight float64 `json:"weight" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petService.UpdatePetWeight(petID, req.Weight)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update weight"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pet weight updated successfully",
	})
}

// Legacy method for upload handler compatibility
func (h *PetHandler) UploadPetPhoto(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Use /api/upload/pet/{petId}/photo endpoint"})
}
