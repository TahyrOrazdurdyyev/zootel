package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type PetMedicalHandler struct {
	petMedicalService *services.PetMedicalService
	petService        *services.PetService
}

func NewPetMedicalHandler(petMedicalService *services.PetMedicalService, petService *services.PetService) *PetMedicalHandler {
	return &PetMedicalHandler{
		petMedicalService: petMedicalService,
		petService:        petService,
	}
}

// Vaccination handlers
func (h *PetMedicalHandler) CreateVaccination(c *gin.Context) {
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

	var vaccination models.VaccinationRecord
	if err := c.ShouldBindJSON(&vaccination); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petMedicalService.CreateVaccination(petID, &vaccination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vaccination record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":     true,
		"vaccination": vaccination,
	})
}

func (h *PetMedicalHandler) GetPetVaccinations(c *gin.Context) {
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

	vaccinations, err := h.petMedicalService.GetPetVaccinations(petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vaccinations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"vaccinations": vaccinations,
	})
}

func (h *PetMedicalHandler) UpdateVaccination(c *gin.Context) {
	petID := c.Param("petId")
	vaccinationID := c.Param("vaccinationId")
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

	var vaccination models.VaccinationRecord
	if err := c.ShouldBindJSON(&vaccination); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petMedicalService.UpdateVaccination(vaccinationID, &vaccination)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vaccination"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"vaccination": vaccination,
	})
}

func (h *PetMedicalHandler) DeleteVaccination(c *gin.Context) {
	petID := c.Param("petId")
	vaccinationID := c.Param("vaccinationId")
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

	err = h.petMedicalService.DeleteVaccination(vaccinationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vaccination"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Vaccination deleted successfully",
	})
}

// Medication handlers
func (h *PetMedicalHandler) CreateMedication(c *gin.Context) {
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

	var medication models.MedicationRecord
	if err := c.ShouldBindJSON(&medication); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petMedicalService.CreateMedication(petID, &medication)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create medication record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":    true,
		"medication": medication,
	})
}

func (h *PetMedicalHandler) GetPetMedications(c *gin.Context) {
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

	// Check for active_only query parameter
	activeOnlyStr := c.DefaultQuery("active_only", "false")
	activeOnly, _ := strconv.ParseBool(activeOnlyStr)

	medications, err := h.petMedicalService.GetPetMedications(petID, activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get medications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"medications": medications,
	})
}

func (h *PetMedicalHandler) UpdateMedication(c *gin.Context) {
	petID := c.Param("petId")
	medicationID := c.Param("medicationId")
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

	var medication models.MedicationRecord
	if err := c.ShouldBindJSON(&medication); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petMedicalService.UpdateMedication(medicationID, &medication)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update medication"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"medication": medication,
	})
}

func (h *PetMedicalHandler) DeleteMedication(c *gin.Context) {
	petID := c.Param("petId")
	medicationID := c.Param("medicationId")
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

	err = h.petMedicalService.DeleteMedication(medicationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete medication"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Medication deleted successfully",
	})
}

// Medical history handlers
func (h *PetMedicalHandler) GetPetMedicalHistory(c *gin.Context) {
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

	history, err := h.petMedicalService.GetPetMedicalHistory(petID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get medical history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"history": history,
	})
}

func (h *PetMedicalHandler) UpdateMedicalHistory(c *gin.Context) {
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

	var history models.PetMedicalHistory
	if err := c.ShouldBindJSON(&history); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petMedicalService.UpdateMedicalHistory(petID, &history)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update medical history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"history": history,
	})
}

// Extended pet profile handlers
func (h *PetMedicalHandler) UpdatePetExtendedProfile(c *gin.Context) {
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

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.petMedicalService.UpdatePetExtendedProfile(petID, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pet profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pet profile updated successfully",
	})
}

// Utility handlers for alerts and reminders
func (h *PetMedicalHandler) GetUpcomingVaccinations(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 30
	}

	vaccinations, err := h.petMedicalService.GetUpcomingVaccinations(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get upcoming vaccinations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"vaccinations": vaccinations,
	})
}

func (h *PetMedicalHandler) GetExpiredMedications(c *gin.Context) {
	medications, err := h.petMedicalService.GetExpiredMedications()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get expired medications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"medications": medications,
	})
}
