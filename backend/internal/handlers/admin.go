package handlers

import "zootel-backend/internal/services"

type AdminHandler struct {
	userService    *services.UserService
	companyService *services.CompanyService
}

func NewAdminHandler(userService *services.UserService, companyService *services.CompanyService) *AdminHandler {
	return &AdminHandler{
		userService:    userService,
		companyService: companyService,
	}
}

func (h *AdminHandler) GetPlans(c interface{})              {}
func (h *AdminHandler) CreatePlan(c interface{})            {}
func (h *AdminHandler) UpdatePlan(c interface{})            {}
func (h *AdminHandler) DeletePlan(c interface{})            {}
func (h *AdminHandler) GetPaymentSettings(c interface{})    {}
func (h *AdminHandler) UpdatePaymentSettings(c interface{}) {}
func (h *AdminHandler) GetServiceCategories(c interface{})  {}
func (h *AdminHandler) CreateServiceCategory(c interface{}) {}
func (h *AdminHandler) UpdateServiceCategory(c interface{}) {}
func (h *AdminHandler) DeleteServiceCategory(c interface{}) {}
func (h *AdminHandler) GetPetTypes(c interface{})           {}
func (h *AdminHandler) CreatePetType(c interface{})         {}
func (h *AdminHandler) UpdatePetType(c interface{})         {}
func (h *AdminHandler) DeletePetType(c interface{})         {}
func (h *AdminHandler) GetBreeds(c interface{})             {}
func (h *AdminHandler) CreateBreed(c interface{})           {}
func (h *AdminHandler) UpdateBreed(c interface{})           {}
func (h *AdminHandler) DeleteBreed(c interface{})           {}
func (h *AdminHandler) GetAllCompanies(c interface{})       {}
func (h *AdminHandler) ToggleSpecialPartner(c interface{})  {}
func (h *AdminHandler) ToggleManualCRM(c interface{})       {}
func (h *AdminHandler) ToggleManualAI(c interface{})        {}
func (h *AdminHandler) BlockCompany(c interface{})          {}
func (h *AdminHandler) UnblockCompany(c interface{})        {}
