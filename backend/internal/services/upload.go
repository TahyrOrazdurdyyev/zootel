package services

import (
	"database/sql"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/nfnt/resize"
)

type UploadService struct {
	db        *sql.DB
	uploadDir string
	baseURL   string
}

func NewUploadService(db *sql.DB) *UploadService {
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	baseURL := os.Getenv("UPLOAD_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:4000/uploads"
	}

	// Create upload directory if it doesn't exist
	os.MkdirAll(uploadDir, 0755)
	os.MkdirAll(filepath.Join(uploadDir, "avatars"), 0755)
	os.MkdirAll(filepath.Join(uploadDir, "pets"), 0755)
	os.MkdirAll(filepath.Join(uploadDir, "services"), 0755)
	os.MkdirAll(filepath.Join(uploadDir, "companies"), 0755)
	os.MkdirAll(filepath.Join(uploadDir, "galleries"), 0755)

	return &UploadService{
		db:        db,
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}
}

type UploadRequest struct {
	Purpose    string // avatar, pet, service, gallery, etc.
	EntityType string // user, pet, service, company
	EntityID   string
	UserID     string
	CompanyID  string
}

type UploadResult struct {
	FileID       string            `json:"file_id"`
	OriginalName string            `json:"original_name"`
	FileName     string            `json:"file_name"`
	FileSize     int64             `json:"file_size"`
	MimeType     string            `json:"mime_type"`
	URL          string            `json:"url"`
	ThumbnailURL string            `json:"thumbnail_url,omitempty"`
	Variants     map[string]string `json:"variants,omitempty"`
}

// ValidateImage validates uploaded image file
func (s *UploadService) ValidateImage(file multipart.File, header *multipart.FileHeader) error {
	// Check file size (max 10MB)
	if header.Size > 10*1024*1024 {
		return fmt.Errorf("file size too large: %d bytes (max 10MB)", header.Size)
	}

	// Check mime type
	contentType := header.Header.Get("Content-Type")
	allowedTypes := []string{"image/jpeg", "image/jpg", "image/png", "image/webp"}
	isValidType := false
	for _, t := range allowedTypes {
		if contentType == t {
			isValidType = true
			break
		}
	}
	if !isValidType {
		return fmt.Errorf("invalid file type: %s. Allowed: %v", contentType, allowedTypes)
	}

	// Validate image by trying to decode it
	file.Seek(0, 0) // Reset file pointer
	_, _, err := image.DecodeConfig(file)
	if err != nil {
		return fmt.Errorf("invalid image file: %v", err)
	}

	file.Seek(0, 0) // Reset file pointer again
	return nil
}

// UploadImage handles image upload with variants generation
func (s *UploadService) UploadImage(file multipart.File, header *multipart.FileHeader, req *UploadRequest) (*UploadResult, error) {
	// Validate the image
	if err := s.ValidateImage(file, header); err != nil {
		return nil, err
	}

	// Generate file ID and names
	fileID := uuid.New().String()
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}

	fileName := fmt.Sprintf("%s%s", fileID, ext)

	// Determine subdirectory based on purpose
	subDir := req.Purpose
	if subDir == "" {
		subDir = "misc"
	}

	// Create file path
	filePath := filepath.Join(s.uploadDir, subDir, fileName)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %v", err)
	}
	defer dst.Close()

	// Copy uploaded file to destination
	file.Seek(0, 0)
	_, err = io.Copy(dst, file)
	if err != nil {
		return nil, fmt.Errorf("failed to save file: %v", err)
	}

	// Generate variants (thumbnail, small, medium)
	variants, err := s.generateImageVariants(filePath, fileID, subDir, ext)
	if err != nil {
		// Log error but don't fail the upload
		fmt.Printf("Failed to generate variants: %v\n", err)
		variants = make(map[string]string)
	}

	// Save file record to database
	fileRecord := &models.FileUpload{
		ID:           fileID,
		OriginalName: header.Filename,
		FileName:     fileName,
		FilePath:     filePath,
		FileSize:     header.Size,
		MimeType:     header.Header.Get("Content-Type"),
		Purpose:      req.Purpose,
		EntityType:   req.EntityType,
		EntityID:     req.EntityID,
		UploaderID:   req.UserID,
		UploaderType: "user",
		CreatedAt:    time.Now(),
	}

	err = s.saveFileRecord(fileRecord)
	if err != nil {
		// Clean up files on database error
		os.Remove(filePath)
		for _, variantPath := range variants {
			os.Remove(filepath.Join(s.uploadDir, subDir, variantPath))
		}
		return nil, fmt.Errorf("failed to save file record: %v", err)
	}

	// Build URLs
	baseURL := fmt.Sprintf("%s/%s", s.baseURL, subDir)
	result := &UploadResult{
		FileID:       fileID,
		OriginalName: header.Filename,
		FileName:     fileName,
		FileSize:     header.Size,
		MimeType:     header.Header.Get("Content-Type"),
		URL:          fmt.Sprintf("%s/%s", baseURL, fileName),
		Variants:     make(map[string]string),
	}

	// Add variant URLs
	for size, variantFile := range variants {
		result.Variants[size] = fmt.Sprintf("%s/%s", baseURL, variantFile)
	}

	if thumbFile, ok := variants["thumbnail"]; ok {
		result.ThumbnailURL = fmt.Sprintf("%s/%s", baseURL, thumbFile)
	}

	return result, nil
}

// generateImageVariants creates different sizes of the image
func (s *UploadService) generateImageVariants(originalPath, fileID, subDir, ext string) (map[string]string, error) {
	variants := make(map[string]string)

	// Open original image
	file, err := os.Open(originalPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Decode image
	img, _, err := image.Decode(file)
	if err != nil {
		return nil, err
	}

	// Define sizes
	sizes := map[string]uint{
		"thumbnail": 150,
		"small":     300,
		"medium":    600,
		"large":     1200,
	}

	for sizeName, width := range sizes {
		// Resize image
		resized := resize.Resize(width, 0, img, resize.Lanczos3)

		// Generate filename
		variantFileName := fmt.Sprintf("%s_%s%s", fileID, sizeName, ext)
		variantPath := filepath.Join(s.uploadDir, subDir, variantFileName)

		// Create file
		variantFile, err := os.Create(variantPath)
		if err != nil {
			continue // Skip this variant on error
		}

		// Encode based on extension
		switch strings.ToLower(ext) {
		case ".png":
			err = png.Encode(variantFile, resized)
		default:
			err = jpeg.Encode(variantFile, resized, &jpeg.Options{Quality: 85})
		}

		variantFile.Close()

		if err == nil {
			variants[sizeName] = variantFileName
		}
	}

	return variants, nil
}

// saveFileRecord saves file upload record to database
func (s *UploadService) saveFileRecord(file *models.FileUpload) error {
	query := `
		INSERT INTO file_uploads (
			id, original_name, file_name, file_path, file_size, mime_type,
			purpose, entity_type, entity_id, uploader_id, uploader_type,
			is_public, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err := s.db.Exec(query,
		file.ID, file.OriginalName, file.FileName, file.FilePath,
		file.FileSize, file.MimeType, file.Purpose, file.EntityType,
		file.EntityID, file.UploaderID, file.UploaderType,
		file.IsPublic, file.CreatedAt,
	)

	return err
}

// DeleteFile removes file and its variants
func (s *UploadService) DeleteFile(fileID string) error {
	// Get file record
	var file models.FileUpload
	query := `SELECT id, file_name, file_path, purpose FROM file_uploads WHERE id = $1`
	err := s.db.QueryRow(query, fileID).Scan(&file.ID, &file.FileName, &file.FilePath, &file.Purpose)
	if err != nil {
		return fmt.Errorf("file not found: %v", err)
	}

	// Delete main file
	if err := os.Remove(file.FilePath); err != nil && !os.IsNotExist(err) {
		fmt.Printf("Failed to delete file %s: %v\n", file.FilePath, err)
	}

	// Delete variants
	ext := filepath.Ext(file.FileName)
	baseFileName := strings.TrimSuffix(file.FileName, ext)
	variantSizes := []string{"thumbnail", "small", "medium", "large"}

	for _, size := range variantSizes {
		variantFile := fmt.Sprintf("%s_%s%s", baseFileName, size, ext)
		variantPath := filepath.Join(s.uploadDir, file.Purpose, variantFile)
		if err := os.Remove(variantPath); err != nil && !os.IsNotExist(err) {
			fmt.Printf("Failed to delete variant %s: %v\n", variantPath, err)
		}
	}

	// Delete database record
	_, err = s.db.Exec("DELETE FROM file_uploads WHERE id = $1", fileID)
	return err
}

// GetFile retrieves file information
func (s *UploadService) GetFile(fileID string) (*models.FileUpload, error) {
	var file models.FileUpload
	query := `
		SELECT id, original_name, file_name, file_path, file_size, mime_type,
			   purpose, entity_type, entity_id, uploader_id, uploader_type,
			   is_public, created_at, updated_at
		FROM file_uploads WHERE id = $1
	`

	err := s.db.QueryRow(query, fileID).Scan(
		&file.ID, &file.OriginalName, &file.FileName, &file.FilePath,
		&file.FileSize, &file.MimeType, &file.Purpose, &file.EntityType,
		&file.EntityID, &file.UploaderID, &file.UploaderType,
		&file.IsPublic, &file.CreatedAt, &file.UpdatedAt,
	)

	return &file, err
}

// GetFilesByEntity retrieves files for specific entity
func (s *UploadService) GetFilesByEntity(entityType, entityID string) ([]*models.FileUpload, error) {
	query := `
		SELECT id, original_name, file_name, file_path, file_size, mime_type,
			   purpose, entity_type, entity_id, uploader_id, uploader_type,
			   is_public, created_at, updated_at
		FROM file_uploads 
		WHERE entity_type = $1 AND entity_id = $2
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, entityType, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []*models.FileUpload
	for rows.Next() {
		var file models.FileUpload
		err := rows.Scan(
			&file.ID, &file.OriginalName, &file.FileName, &file.FilePath,
			&file.FileSize, &file.MimeType, &file.Purpose, &file.EntityType,
			&file.EntityID, &file.UploaderID, &file.UploaderType,
			&file.IsPublic, &file.CreatedAt, &file.UpdatedAt,
		)
		if err != nil {
			continue
		}
		files = append(files, &file)
	}

	return files, nil
}

// UpdateEntityAvatar updates avatar for user, company, etc.
func (s *UploadService) UpdateEntityAvatar(entityType, entityID, fileID string) error {
	var query string
	switch entityType {
	case "user":
		query = "UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	case "company":
		query = "UPDATE companies SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	case "pet":
		query = "UPDATE pets SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2"
	default:
		return fmt.Errorf("unsupported entity type: %s", entityType)
	}

	// Get file URL
	file, err := s.GetFile(fileID)
	if err != nil {
		return err
	}

	fileURL := fmt.Sprintf("%s/%s/%s", s.baseURL, file.Purpose, file.FileName)
	_, err = s.db.Exec(query, fileURL, entityID)
	return err
}
