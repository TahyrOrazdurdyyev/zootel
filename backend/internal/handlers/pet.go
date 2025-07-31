package handlers

import "zootel-backend/internal/services"

type PetHandler struct {
	petService *services.PetService
}

func NewPetHandler(petService *services.PetService) *PetHandler {
	return &PetHandler{petService: petService}
}

func (h *PetHandler) GetUserPets(c interface{})    {}
func (h *PetHandler) CreatePet(c interface{})      {}
func (h *PetHandler) GetPet(c interface{})         {}
func (h *PetHandler) UpdatePet(c interface{})      {}
func (h *PetHandler) DeletePet(c interface{})      {}
func (h *PetHandler) UploadPetPhoto(c interface{}) {}
