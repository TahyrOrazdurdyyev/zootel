package services

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
)

type ContentService struct {
	db *sql.DB
}

func NewContentService(db *sql.DB) *ContentService {
	return &ContentService{db: db}
}

// ==================== CAREERS ====================

func (s *ContentService) GetCareers() ([]models.Career, error) {
	query := `
		SELECT id, title, department, location, type, description, requirements, benefits, salary_range, is_active, created_at, updated_at
		FROM careers
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query careers: %w", err)
	}
	defer rows.Close()

	var careers []models.Career
	for rows.Next() {
		var career models.Career
		err := rows.Scan(
			&career.ID, &career.Title, &career.Department, &career.Location, &career.Type,
			&career.Description, &career.Requirements, &career.Benefits, &career.SalaryRange,
			&career.IsActive, &career.CreatedAt, &career.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan career: %w", err)
		}
		careers = append(careers, career)
	}

	return careers, nil
}

func (s *ContentService) GetActiveCareers() ([]models.Career, error) {
	query := `
		SELECT id, title, department, location, type, description, requirements, benefits, salary_range, is_active, created_at, updated_at
		FROM careers
		WHERE is_active = true
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active careers: %w", err)
	}
	defer rows.Close()

	var careers []models.Career
	for rows.Next() {
		var career models.Career
		err := rows.Scan(
			&career.ID, &career.Title, &career.Department, &career.Location, &career.Type,
			&career.Description, &career.Requirements, &career.Benefits, &career.SalaryRange,
			&career.IsActive, &career.CreatedAt, &career.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan career: %w", err)
		}
		careers = append(careers, career)
	}

	return careers, nil
}

func (s *ContentService) GetCareerByID(id string) (*models.Career, error) {
	query := `
		SELECT id, title, department, location, type, description, requirements, benefits, salary_range, is_active, created_at, updated_at
		FROM careers
		WHERE id = $1
	`

	var career models.Career
	err := s.db.QueryRow(query, id).Scan(
		&career.ID, &career.Title, &career.Department, &career.Location, &career.Type,
		&career.Description, &career.Requirements, &career.Benefits, &career.SalaryRange,
		&career.IsActive, &career.CreatedAt, &career.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("career not found")
		}
		return nil, fmt.Errorf("failed to get career: %w", err)
	}

	return &career, nil
}

func (s *ContentService) CreateCareer(career *models.Career) error {
	career.ID = uuid.New().String()
	career.CreatedAt = time.Now()
	career.UpdatedAt = time.Now()

	query := `
		INSERT INTO careers (id, title, department, location, type, description, requirements, benefits, salary_range, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err := s.db.Exec(query,
		career.ID, career.Title, career.Department, career.Location, career.Type,
		career.Description, career.Requirements, career.Benefits, career.SalaryRange,
		career.IsActive, career.CreatedAt, career.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create career: %w", err)
	}

	return nil
}

func (s *ContentService) UpdateCareer(career *models.Career) error {
	career.UpdatedAt = time.Now()

	query := `
		UPDATE careers
		SET title = $2, department = $3, location = $4, type = $5, description = $6,
		    requirements = $7, benefits = $8, salary_range = $9, is_active = $10, updated_at = $11
		WHERE id = $1
	`

	result, err := s.db.Exec(query,
		career.ID, career.Title, career.Department, career.Location, career.Type,
		career.Description, career.Requirements, career.Benefits, career.SalaryRange,
		career.IsActive, career.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update career: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("career not found")
	}

	return nil
}

func (s *ContentService) DeleteCareer(id string) error {
	query := `DELETE FROM careers WHERE id = $1`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete career: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("career not found")
	}

	return nil
}

// ==================== PRESS RELEASES ====================

func (s *ContentService) GetPressReleases() ([]models.PressRelease, error) {
	query := `
		SELECT id, title, subtitle, content, summary, image_url, image_id, tags, is_published, published_at, created_at, updated_at
		FROM press_releases
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query press releases: %w", err)
	}
	defer rows.Close()

	var releases []models.PressRelease
	for rows.Next() {
		var release models.PressRelease
		err := rows.Scan(
			&release.ID, &release.Title, &release.Subtitle, &release.Content, &release.Summary,
			&release.ImageURL, &release.ImageID, &release.Tags, &release.IsPublished,
			&release.PublishedAt, &release.CreatedAt, &release.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan press release: %w", err)
		}
		releases = append(releases, release)
	}

	return releases, nil
}

func (s *ContentService) GetPublishedPressReleases() ([]models.PressRelease, error) {
	query := `
		SELECT id, title, subtitle, content, summary, image_url, image_id, tags, is_published, published_at, created_at, updated_at
		FROM press_releases
		WHERE is_published = true
		ORDER BY published_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query published press releases: %w", err)
	}
	defer rows.Close()

	var releases []models.PressRelease
	for rows.Next() {
		var release models.PressRelease
		err := rows.Scan(
			&release.ID, &release.Title, &release.Subtitle, &release.Content, &release.Summary,
			&release.ImageURL, &release.ImageID, &release.Tags, &release.IsPublished,
			&release.PublishedAt, &release.CreatedAt, &release.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan press release: %w", err)
		}
		releases = append(releases, release)
	}

	return releases, nil
}

func (s *ContentService) GetPressReleaseByID(id string) (*models.PressRelease, error) {
	query := `
		SELECT id, title, subtitle, content, summary, image_url, image_id, tags, is_published, published_at, created_at, updated_at
		FROM press_releases
		WHERE id = $1
	`

	var release models.PressRelease
	err := s.db.QueryRow(query, id).Scan(
		&release.ID, &release.Title, &release.Subtitle, &release.Content, &release.Summary,
		&release.ImageURL, &release.ImageID, &release.Tags, &release.IsPublished,
		&release.PublishedAt, &release.CreatedAt, &release.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("press release not found")
		}
		return nil, fmt.Errorf("failed to get press release: %w", err)
	}

	return &release, nil
}

func (s *ContentService) CreatePressRelease(release *models.PressRelease) error {
	release.ID = uuid.New().String()
	release.CreatedAt = time.Now()
	release.UpdatedAt = time.Now()

	if release.IsPublished && release.PublishedAt == nil {
		now := time.Now()
		release.PublishedAt = &now
	}

	query := `
		INSERT INTO press_releases (id, title, subtitle, content, summary, image_url, image_id, tags, is_published, published_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err := s.db.Exec(query,
		release.ID, release.Title, release.Subtitle, release.Content, release.Summary,
		release.ImageURL, release.ImageID, release.Tags, release.IsPublished,
		release.PublishedAt, release.CreatedAt, release.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create press release: %w", err)
	}

	return nil
}

func (s *ContentService) UpdatePressRelease(release *models.PressRelease) error {
	release.UpdatedAt = time.Now()

	// Set published_at if publishing for the first time
	if release.IsPublished && release.PublishedAt == nil {
		now := time.Now()
		release.PublishedAt = &now
	}

	query := `
		UPDATE press_releases
		SET title = $2, subtitle = $3, content = $4, summary = $5, image_url = $6, image_id = $7,
		    tags = $8, is_published = $9, published_at = $10, updated_at = $11
		WHERE id = $1
	`

	result, err := s.db.Exec(query,
		release.ID, release.Title, release.Subtitle, release.Content, release.Summary,
		release.ImageURL, release.ImageID, release.Tags, release.IsPublished,
		release.PublishedAt, release.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update press release: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("press release not found")
	}

	return nil
}

func (s *ContentService) DeletePressRelease(id string) error {
	query := `DELETE FROM press_releases WHERE id = $1`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete press release: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("press release not found")
	}

	return nil
}

// ==================== BLOG POSTS ====================

func (s *ContentService) GetBlogPosts() ([]models.BlogPost, error) {
	query := `
		SELECT id, title, slug, content, excerpt, image_url, image_id, category, tags,
		       author_name, author_bio, author_image, is_published, published_at, view_count, created_at, updated_at
		FROM blog_posts
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query blog posts: %w", err)
	}
	defer rows.Close()

	var posts []models.BlogPost
	for rows.Next() {
		var post models.BlogPost
		err := rows.Scan(
			&post.ID, &post.Title, &post.Slug, &post.Content, &post.Excerpt,
			&post.ImageURL, &post.ImageID, &post.Category, &post.Tags,
			&post.AuthorName, &post.AuthorBio, &post.AuthorImage,
			&post.IsPublished, &post.PublishedAt, &post.ViewCount,
			&post.CreatedAt, &post.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan blog post: %w", err)
		}
		posts = append(posts, post)
	}

	return posts, nil
}

func (s *ContentService) GetPublishedBlogPosts() ([]models.BlogPost, error) {
	query := `
		SELECT id, title, slug, content, excerpt, image_url, image_id, category, tags,
		       author_name, author_bio, author_image, is_published, published_at, view_count, created_at, updated_at
		FROM blog_posts
		WHERE is_published = true
		ORDER BY published_at DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query published blog posts: %w", err)
	}
	defer rows.Close()

	var posts []models.BlogPost
	for rows.Next() {
		var post models.BlogPost
		err := rows.Scan(
			&post.ID, &post.Title, &post.Slug, &post.Content, &post.Excerpt,
			&post.ImageURL, &post.ImageID, &post.Category, &post.Tags,
			&post.AuthorName, &post.AuthorBio, &post.AuthorImage,
			&post.IsPublished, &post.PublishedAt, &post.ViewCount,
			&post.CreatedAt, &post.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan blog post: %w", err)
		}
		posts = append(posts, post)
	}

	return posts, nil
}

func (s *ContentService) GetBlogPostBySlug(slug string) (*models.BlogPost, error) {
	query := `
		SELECT id, title, slug, content, excerpt, image_url, image_id, category, tags,
		       author_name, author_bio, author_image, is_published, published_at, view_count, created_at, updated_at
		FROM blog_posts
		WHERE slug = $1
	`

	var post models.BlogPost
	err := s.db.QueryRow(query, slug).Scan(
		&post.ID, &post.Title, &post.Slug, &post.Content, &post.Excerpt,
		&post.ImageURL, &post.ImageID, &post.Category, &post.Tags,
		&post.AuthorName, &post.AuthorBio, &post.AuthorImage,
		&post.IsPublished, &post.PublishedAt, &post.ViewCount,
		&post.CreatedAt, &post.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("blog post not found")
		}
		return nil, fmt.Errorf("failed to get blog post: %w", err)
	}

	return &post, nil
}

func (s *ContentService) GetBlogPostByID(id string) (*models.BlogPost, error) {
	query := `
		SELECT id, title, slug, content, excerpt, image_url, image_id, category, tags,
		       author_name, author_bio, author_image, is_published, published_at, view_count, created_at, updated_at
		FROM blog_posts
		WHERE id = $1
	`

	var post models.BlogPost
	err := s.db.QueryRow(query, id).Scan(
		&post.ID, &post.Title, &post.Slug, &post.Content, &post.Excerpt,
		&post.ImageURL, &post.ImageID, &post.Category, &post.Tags,
		&post.AuthorName, &post.AuthorBio, &post.AuthorImage,
		&post.IsPublished, &post.PublishedAt, &post.ViewCount,
		&post.CreatedAt, &post.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("blog post not found")
		}
		return nil, fmt.Errorf("failed to get blog post: %w", err)
	}

	return &post, nil
}

func (s *ContentService) CreateBlogPost(post *models.BlogPost) error {
	post.ID = uuid.New().String()
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()

	// Generate slug if not provided
	if post.Slug == "" {
		post.Slug = s.generateSlug(post.Title)
	}

	// Ensure slug is unique
	post.Slug = s.ensureUniqueSlug(post.Slug)

	if post.IsPublished && post.PublishedAt == nil {
		now := time.Now()
		post.PublishedAt = &now
	}

	query := `
		INSERT INTO blog_posts (id, title, slug, content, excerpt, image_url, image_id, category, tags,
		                       author_name, author_bio, author_image, is_published, published_at, view_count, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
	`

	_, err := s.db.Exec(query,
		post.ID, post.Title, post.Slug, post.Content, post.Excerpt,
		post.ImageURL, post.ImageID, post.Category, post.Tags,
		post.AuthorName, post.AuthorBio, post.AuthorImage,
		post.IsPublished, post.PublishedAt, post.ViewCount,
		post.CreatedAt, post.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create blog post: %w", err)
	}

	return nil
}

func (s *ContentService) UpdateBlogPost(post *models.BlogPost) error {
	post.UpdatedAt = time.Now()

	// Set published_at if publishing for the first time
	if post.IsPublished && post.PublishedAt == nil {
		now := time.Now()
		post.PublishedAt = &now
	}

	query := `
		UPDATE blog_posts
		SET title = $2, slug = $3, content = $4, excerpt = $5, image_url = $6, image_id = $7,
		    category = $8, tags = $9, author_name = $10, author_bio = $11, author_image = $12,
		    is_published = $13, published_at = $14, updated_at = $15
		WHERE id = $1
	`

	result, err := s.db.Exec(query,
		post.ID, post.Title, post.Slug, post.Content, post.Excerpt,
		post.ImageURL, post.ImageID, post.Category, post.Tags,
		post.AuthorName, post.AuthorBio, post.AuthorImage,
		post.IsPublished, post.PublishedAt, post.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update blog post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("blog post not found")
	}

	return nil
}

func (s *ContentService) DeleteBlogPost(id string) error {
	query := `DELETE FROM blog_posts WHERE id = $1`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete blog post: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("blog post not found")
	}

	return nil
}

func (s *ContentService) IncrementBlogPostViews(slug string) error {
	query := `UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1`

	_, err := s.db.Exec(query, slug)
	if err != nil {
		return fmt.Errorf("failed to increment blog post views: %w", err)
	}

	return nil
}

// ==================== HELPER FUNCTIONS ====================

func (s *ContentService) generateSlug(title string) string {
	// Convert to lowercase and replace spaces with hyphens
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")

	// Remove special characters (keep only letters, numbers, and hyphens)
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}

	// Remove multiple consecutive hyphens
	slug = result.String()
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}

	// Trim hyphens from start and end
	slug = strings.Trim(slug, "-")

	return slug
}

func (s *ContentService) ensureUniqueSlug(baseSlug string) string {
	slug := baseSlug
	counter := 1

	for {
		// Check if slug exists
		var exists bool
		err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM blog_posts WHERE slug = $1)", slug).Scan(&exists)
		if err != nil {
			// If there's an error, just return the original slug
			return baseSlug
		}

		if !exists {
			return slug
		}

		// If slug exists, append counter
		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++
	}
}
