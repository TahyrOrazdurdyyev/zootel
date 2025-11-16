package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type ContentHandler struct {
	contentService *services.ContentService
}

func NewContentHandler(contentService *services.ContentService) *ContentHandler {
	return &ContentHandler{
		contentService: contentService,
	}
}

// ==================== CAREERS ====================

// GetCareers - Admin only: Get all careers
func (h *ContentHandler) GetCareers(c *gin.Context) {
	careers, err := h.contentService.GetCareers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    careers,
	})
}

// GetPublicCareers - Public: Get active careers only
func (h *ContentHandler) GetPublicCareers(c *gin.Context) {
	careers, err := h.contentService.GetActiveCareers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    careers,
	})
}

// GetCareerByID - Public: Get career by ID
func (h *ContentHandler) GetCareerByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Career ID is required"})
		return
	}

	career, err := h.contentService.GetCareerByID(id)
	if err != nil {
		if err.Error() == "career not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Career not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    career,
	})
}

// CreateCareer - Admin only: Create new career
func (h *ContentHandler) CreateCareer(c *gin.Context) {
	var career models.Career
	if err := c.ShouldBindJSON(&career); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.contentService.CreateCareer(&career); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Career created successfully",
		"data":    career,
	})
}

// UpdateCareer - Admin only: Update career
func (h *ContentHandler) UpdateCareer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Career ID is required"})
		return
	}

	var career models.Career
	if err := c.ShouldBindJSON(&career); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	career.ID = id
	if err := h.contentService.UpdateCareer(&career); err != nil {
		if err.Error() == "career not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Career not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Career updated successfully",
		"data":    career,
	})
}

// DeleteCareer - Admin only: Delete career
func (h *ContentHandler) DeleteCareer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Career ID is required"})
		return
	}

	if err := h.contentService.DeleteCareer(id); err != nil {
		if err.Error() == "career not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Career not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Career deleted successfully",
	})
}

// ==================== PRESS RELEASES ====================

// GetPressReleases - Admin only: Get all press releases
func (h *ContentHandler) GetPressReleases(c *gin.Context) {
	releases, err := h.contentService.GetPressReleases()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    releases,
	})
}

// GetPublicPressReleases - Public: Get published press releases only
func (h *ContentHandler) GetPublicPressReleases(c *gin.Context) {
	releases, err := h.contentService.GetPublishedPressReleases()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    releases,
	})
}

// GetPressReleaseByID - Public: Get press release by ID
func (h *ContentHandler) GetPressReleaseByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Press release ID is required"})
		return
	}

	release, err := h.contentService.GetPressReleaseByID(id)
	if err != nil {
		if err.Error() == "press release not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Press release not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    release,
	})
}

// CreatePressRelease - Admin only: Create new press release
func (h *ContentHandler) CreatePressRelease(c *gin.Context) {
	var release models.PressRelease
	if err := c.ShouldBindJSON(&release); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.contentService.CreatePressRelease(&release); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Press release created successfully",
		"data":    release,
	})
}

// UpdatePressRelease - Admin only: Update press release
func (h *ContentHandler) UpdatePressRelease(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Press release ID is required"})
		return
	}

	var release models.PressRelease
	if err := c.ShouldBindJSON(&release); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	release.ID = id
	if err := h.contentService.UpdatePressRelease(&release); err != nil {
		if err.Error() == "press release not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Press release not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Press release updated successfully",
		"data":    release,
	})
}

// DeletePressRelease - Admin only: Delete press release
func (h *ContentHandler) DeletePressRelease(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Press release ID is required"})
		return
	}

	if err := h.contentService.DeletePressRelease(id); err != nil {
		if err.Error() == "press release not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Press release not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Press release deleted successfully",
	})
}

// ==================== BLOG POSTS ====================

// GetBlogPosts - Admin only: Get all blog posts
func (h *ContentHandler) GetBlogPosts(c *gin.Context) {
	posts, err := h.contentService.GetBlogPosts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    posts,
	})
}

// GetPublicBlogPosts - Public: Get published blog posts only
func (h *ContentHandler) GetPublicBlogPosts(c *gin.Context) {
	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	category := c.Query("category")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	posts, err := h.contentService.GetPublishedBlogPosts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filter by category if provided
	if category != "" {
		var filteredPosts []models.BlogPost
		for _, post := range posts {
			if post.Category == category {
				filteredPosts = append(filteredPosts, post)
			}
		}
		posts = filteredPosts
	}

	// Simple pagination
	total := len(posts)
	start := (page - 1) * limit
	end := start + limit

	if start >= total {
		posts = []models.BlogPost{}
	} else {
		if end > total {
			end = total
		}
		posts = posts[start:end]
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    posts,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetBlogPostBySlug - Public: Get blog post by slug
func (h *ContentHandler) GetBlogPostBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Blog post slug is required"})
		return
	}

	post, err := h.contentService.GetBlogPostBySlug(slug)
	if err != nil {
		if err.Error() == "blog post not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Blog post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Increment view count
	go h.contentService.IncrementBlogPostViews(slug)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    post,
	})
}

// GetBlogPostByID - Admin: Get blog post by ID
func (h *ContentHandler) GetBlogPostByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Blog post ID is required"})
		return
	}

	post, err := h.contentService.GetBlogPostByID(id)
	if err != nil {
		if err.Error() == "blog post not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Blog post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    post,
	})
}

// CreateBlogPost - Admin only: Create new blog post
func (h *ContentHandler) CreateBlogPost(c *gin.Context) {
	var post models.BlogPost
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.contentService.CreateBlogPost(&post); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Blog post created successfully",
		"data":    post,
	})
}

// UpdateBlogPost - Admin only: Update blog post
func (h *ContentHandler) UpdateBlogPost(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Blog post ID is required"})
		return
	}

	var post models.BlogPost
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post.ID = id
	if err := h.contentService.UpdateBlogPost(&post); err != nil {
		if err.Error() == "blog post not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Blog post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Blog post updated successfully",
		"data":    post,
	})
}

// DeleteBlogPost - Admin only: Delete blog post
func (h *ContentHandler) DeleteBlogPost(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Blog post ID is required"})
		return
	}

	if err := h.contentService.DeleteBlogPost(id); err != nil {
		if err.Error() == "blog post not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Blog post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Blog post deleted successfully",
	})
}
