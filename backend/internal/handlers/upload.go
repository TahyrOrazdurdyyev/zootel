package handlers

import (
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	uploadService *services.UploadService
}

func NewUploadHandler(uploadService *services.UploadService) *UploadHandler {
	return &UploadHandler{
		uploadService: uploadService,
	}
}

// UploadAvatar handles user avatar upload
func (h *UploadHandler) UploadAvatar(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Upload file
	result, err := h.uploadService.UploadImage(file, header, &services.UploadRequest{
		Purpose:    "avatars",
		EntityType: "user",
		EntityID:   userID,
		UserID:     userID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update user avatar URL
	err = h.uploadService.UpdateEntityAvatar("user", userID, result.FileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Avatar uploaded successfully",
		"file":    result,
	})
}

// UploadPetPhoto handles pet photo upload
func (h *UploadHandler) UploadPetPhoto(c *gin.Context) {
	userID := c.GetString("user_id")
	petID := c.Param("petId")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if petID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pet ID is required"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Upload file
	result, err := h.uploadService.UploadImage(file, header, &services.UploadRequest{
		Purpose:    "pets",
		EntityType: "pet",
		EntityID:   petID,
		UserID:     userID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update pet avatar URL
	err = h.uploadService.UpdateEntityAvatar("pet", petID, result.FileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pet profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pet photo uploaded successfully",
		"file":    result,
	})
}

// UploadServiceImage handles service image upload
func (h *UploadHandler) UploadServiceImage(c *gin.Context) {
	userID := c.GetString("user_id")
	serviceID := c.Param("serviceId")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if serviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service ID is required"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Upload file
	result, err := h.uploadService.UploadImage(file, header, &services.UploadRequest{
		Purpose:    "services",
		EntityType: "service",
		EntityID:   serviceID,
		UserID:     userID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service image uploaded successfully",
		"file":    result,
	})
}

// UploadCategoryImage handles service category image upload
func (h *UploadHandler) UploadCategoryImage(c *gin.Context) {
	userRole := c.GetString("user_role")
	categoryID := c.Param("categoryId")

	// Only super admin can upload category images
	if userRole != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only super admin can upload category images"})
		return
	}

	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Upload file
	result, err := h.uploadService.UploadImage(file, header, &services.UploadRequest{
		Purpose:    "categories",
		EntityType: "service_category",
		EntityID:   categoryID,
		UserID:     c.GetString("user_id"),
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Category image uploaded successfully",
		"data":    result,
	})
}

// UploadCompanyLogo handles company logo upload
func (h *UploadHandler) UploadCompanyLogo(c *gin.Context) {
	userID := c.GetString("user_id")
	companyID := c.Param("companyId")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Upload file
	result, err := h.uploadService.UploadImage(file, header, &services.UploadRequest{
		Purpose:    "companies",
		EntityType: "company",
		EntityID:   companyID,
		UserID:     userID,
		CompanyID:  companyID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update company logo URL
	err = h.uploadService.UpdateEntityAvatar("company", companyID, result.FileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Company logo uploaded successfully",
		"file":    result,
	})
}

// UploadGallery handles gallery image upload
func (h *UploadHandler) UploadGallery(c *gin.Context) {
	userID := c.GetString("user_id")
	entityType := c.PostForm("entity_type")
	entityID := c.PostForm("entity_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if entityType == "" || entityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Entity type and ID are required"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Upload file
	result, err := h.uploadService.UploadImage(file, header, &services.UploadRequest{
		Purpose:    "galleries",
		EntityType: entityType,
		EntityID:   entityID,
		UserID:     userID,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Gallery image uploaded successfully",
		"file":    result,
	})
}

// GetFiles returns files for specific entity
func (h *UploadHandler) GetFiles(c *gin.Context) {
	entityType := c.Query("entity_type")
	entityID := c.Query("entity_id")

	if entityType == "" || entityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Entity type and ID are required"})
		return
	}

	files, err := h.uploadService.GetFilesByEntity(entityType, entityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve files"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"files": files,
	})
}

// DeleteFile deletes a file
func (h *UploadHandler) DeleteFile(c *gin.Context) {
	fileID := c.Param("fileId")
	userID := c.GetString("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if fileID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID is required"})
		return
	}

	// TODO: Add permission check - user should own the file or have access to the entity

	err := h.uploadService.DeleteFile(fileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File deleted successfully",
	})
}

// GetFileInfo returns file information
func (h *UploadHandler) GetFileInfo(c *gin.Context) {
	fileID := c.Param("fileId")

	if fileID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File ID is required"})
		return
	}

	file, err := h.uploadService.GetFile(fileID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"file": file,
	})
}
