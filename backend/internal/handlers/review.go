package handlers

import (
	"net/http"
	"strconv"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type ReviewHandler struct {
	reviewService *services.ReviewService
}

func NewReviewHandler(reviewService *services.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

// CreateReview creates a new review
func (h *ReviewHandler) CreateReview(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := h.reviewService.CreateReview(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"review":  review,
	})
}

// GetReview gets a specific review by ID
func (h *ReviewHandler) GetReview(c *gin.Context) {
	reviewID := c.Param("reviewId")
	if reviewID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Review ID is required"})
		return
	}

	review, err := h.reviewService.GetReviewByID(reviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"review":  review,
	})
}

// GetCompanyReviews gets reviews for a company
func (h *ReviewHandler) GetCompanyReviews(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	status := c.DefaultQuery("status", "approved")
	serviceID := c.Query("service_id")
	ratingStr := c.Query("rating")

	filter := &models.ReviewFilter{
		CompanyID: companyID,
		Status:    status,
		Limit:     limit,
		Offset:    offset,
	}

	if serviceID != "" {
		filter.ServiceID = &serviceID
	}

	if ratingStr != "" {
		if rating, err := strconv.Atoi(ratingStr); err == nil {
			filter.Rating = &rating
		}
	}

	reviews, total, err := h.reviewService.GetCompanyReviews(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"reviews": reviews,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetUserReviews gets reviews by the authenticated user
func (h *ReviewHandler) GetUserReviews(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	reviews, total, err := h.reviewService.GetUserReviews(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"reviews": reviews,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// RespondToReview allows company to respond to a review
func (h *ReviewHandler) RespondToReview(c *gin.Context) {
	companyID := c.GetString("company_id")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID required"})
		return
	}

	var req models.ReviewResponse
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.CompanyID = companyID

	err := h.reviewService.RespondToReview(companyID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Response added successfully",
	})
}

// GetCompanyReviewStats gets review statistics for a company
func (h *ReviewHandler) GetCompanyReviewStats(c *gin.Context) {
	companyID := c.Param("companyId")
	if companyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID is required"})
		return
	}

	stats, err := h.reviewService.GetCompanyReviewStats(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get review stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// UpdateReviewStatus updates review status (for admin moderation)
func (h *ReviewHandler) UpdateReviewStatus(c *gin.Context) {
	reviewID := c.Param("reviewId")
	if reviewID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Review ID is required"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	if req.Status != "approved" && req.Status != "rejected" && req.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Must be: approved, rejected, or pending"})
		return
	}

	err := h.reviewService.UpdateReviewStatus(reviewID, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Review status updated successfully",
	})
}

// DeleteReview deletes a review (only by the user who created it)
func (h *ReviewHandler) DeleteReview(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	reviewID := c.Param("reviewId")
	if reviewID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Review ID is required"})
		return
	}

	err := h.reviewService.DeleteReview(reviewID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Review deleted successfully",
	})
}

// GetReviewableBookings gets bookings that can be reviewed by the user
func (h *ReviewHandler) GetReviewableBookings(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	bookings, err := h.reviewService.GetReviewableBookings(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reviewable bookings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"bookings": bookings,
	})
}

// GetReviewableOrders gets orders that can be reviewed by the user
func (h *ReviewHandler) GetReviewableOrders(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	orders, err := h.reviewService.GetReviewableOrders(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get reviewable orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"orders":  orders,
	})
}
