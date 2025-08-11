package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type ReviewService struct {
	db *sql.DB
}

func NewReviewService(db *sql.DB) *ReviewService {
	return &ReviewService{db: db}
}

// CreateReview creates a new review
func (s *ReviewService) CreateReview(userID string, req *models.ReviewRequest) (*models.Review, error) {
	// Validate that user has actually used the service (has booking/order)
	if req.BookingID != nil {
		if !s.validateUserBooking(userID, *req.BookingID) {
			return nil, fmt.Errorf("user does not have access to this booking")
		}
	}
	if req.OrderID != nil {
		if !s.validateUserOrder(userID, *req.OrderID) {
			return nil, fmt.Errorf("user does not have access to this order")
		}
	}

	// Check if user already reviewed this booking/order
	if s.hasExistingReview(userID, req.BookingID, req.OrderID) {
		return nil, fmt.Errorf("review already exists for this booking/order")
	}

	// Create the review
	review := &models.Review{
		ID:          uuid.New().String(),
		UserID:      userID,
		CompanyID:   req.CompanyID,
		ServiceID:   req.ServiceID,
		BookingID:   req.BookingID,
		OrderID:     req.OrderID,
		Rating:      req.Rating,
		Comment:     req.Comment,
		Photos:      req.Photos,
		IsAnonymous: req.IsAnonymous,
		Status:      "approved", // Auto-approve for now, can be changed to "pending"
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	query := `
		INSERT INTO reviews (
			id, user_id, company_id, service_id, booking_id, order_id,
			rating, comment, photos, is_anonymous, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err := s.db.Exec(query,
		review.ID, review.UserID, review.CompanyID, review.ServiceID,
		review.BookingID, review.OrderID, review.Rating, review.Comment,
		pq.Array(review.Photos), review.IsAnonymous, review.Status,
		review.CreatedAt, review.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create review: %w", err)
	}

	// Get the created review with additional info
	return s.GetReviewByID(review.ID)
}

// GetReviewByID gets a specific review by ID
func (s *ReviewService) GetReviewByID(reviewID string) (*models.Review, error) {
	query := `
		SELECT 
			r.id, r.user_id, r.company_id, r.service_id, r.booking_id, r.order_id,
			r.rating, r.comment, r.photos, r.is_anonymous, r.status, r.response,
			r.responded_at, r.created_at, r.updated_at,
			u.first_name, u.last_name, u.email,
			COALESCE(s.name, '') as service_name,
			c.name as company_name
		FROM reviews r
		JOIN users u ON r.user_id = u.id
		LEFT JOIN services s ON r.service_id = s.id
		JOIN companies c ON r.company_id = c.id
		WHERE r.id = $1
	`

	var review models.Review
	var photos pq.StringArray
	var customerInfo models.CustomerInfo

	err := s.db.QueryRow(query, reviewID).Scan(
		&review.ID, &review.UserID, &review.CompanyID, &review.ServiceID,
		&review.BookingID, &review.OrderID, &review.Rating, &review.Comment,
		&photos, &review.IsAnonymous, &review.Status, &review.Response,
		&review.RespondedAt, &review.CreatedAt, &review.UpdatedAt,
		&customerInfo.FirstName, &customerInfo.LastName, &customerInfo.Email,
		&review.ServiceName, &review.CompanyName,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get review: %w", err)
	}

	review.Photos = []string(photos)
	if !review.IsAnonymous {
		review.CustomerInfo = &customerInfo
	}

	return &review, nil
}

// GetCompanyReviews gets reviews for a company with filters
func (s *ReviewService) GetCompanyReviews(filter *models.ReviewFilter) ([]models.Review, int, error) {
	whereClause := "WHERE r.company_id = $1"
	args := []interface{}{filter.CompanyID}
	argIndex := 2

	// Add filters
	if filter.ServiceID != nil {
		whereClause += fmt.Sprintf(" AND r.service_id = $%d", argIndex)
		args = append(args, *filter.ServiceID)
		argIndex++
	}

	if filter.Rating != nil {
		whereClause += fmt.Sprintf(" AND r.rating = $%d", argIndex)
		args = append(args, *filter.Rating)
		argIndex++
	}

	if filter.Status != "" {
		whereClause += fmt.Sprintf(" AND r.status = $%d", argIndex)
		args = append(args, filter.Status)
		argIndex++
	}

	if filter.DateFrom != nil {
		whereClause += fmt.Sprintf(" AND r.created_at >= $%d", argIndex)
		args = append(args, *filter.DateFrom)
		argIndex++
	}

	if filter.DateTo != nil {
		whereClause += fmt.Sprintf(" AND r.created_at <= $%d", argIndex)
		args = append(args, *filter.DateTo)
		argIndex++
	}

	// Get total count
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM reviews r 
		%s
	`, whereClause)

	var totalCount int
	err := s.db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get review count: %w", err)
	}

	// Get reviews
	query := fmt.Sprintf(`
		SELECT 
			r.id, r.user_id, r.company_id, r.service_id, r.booking_id, r.order_id,
			r.rating, r.comment, r.photos, r.is_anonymous, r.status, r.response,
			r.responded_at, r.created_at, r.updated_at,
			u.first_name, u.last_name, u.email,
			COALESCE(s.name, '') as service_name,
			c.name as company_name
		FROM reviews r
		JOIN users u ON r.user_id = u.id
		LEFT JOIN services s ON r.service_id = s.id
		JOIN companies c ON r.company_id = c.id
		%s
		ORDER BY r.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)

	args = append(args, filter.Limit, filter.Offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query reviews: %w", err)
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var review models.Review
		var photos pq.StringArray
		var customerInfo models.CustomerInfo

		err := rows.Scan(
			&review.ID, &review.UserID, &review.CompanyID, &review.ServiceID,
			&review.BookingID, &review.OrderID, &review.Rating, &review.Comment,
			&photos, &review.IsAnonymous, &review.Status, &review.Response,
			&review.RespondedAt, &review.CreatedAt, &review.UpdatedAt,
			&customerInfo.FirstName, &customerInfo.LastName, &customerInfo.Email,
			&review.ServiceName, &review.CompanyName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan review: %w", err)
		}

		review.Photos = []string(photos)
		if !review.IsAnonymous {
			review.CustomerInfo = &customerInfo
		}

		reviews = append(reviews, review)
	}

	return reviews, totalCount, nil
}

// GetUserReviews gets reviews by a specific user
func (s *ReviewService) GetUserReviews(userID string, limit, offset int) ([]models.Review, int, error) {
	// Get total count
	var totalCount int
	err := s.db.QueryRow(`
		SELECT COUNT(*) FROM reviews WHERE user_id = $1
	`, userID).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user review count: %w", err)
	}

	// Get reviews
	query := `
		SELECT 
			r.id, r.user_id, r.company_id, r.service_id, r.booking_id, r.order_id,
			r.rating, r.comment, r.photos, r.is_anonymous, r.status, r.response,
			r.responded_at, r.created_at, r.updated_at,
			COALESCE(s.name, '') as service_name,
			c.name as company_name
		FROM reviews r
		LEFT JOIN services s ON r.service_id = s.id
		JOIN companies c ON r.company_id = c.id
		WHERE r.user_id = $1
		ORDER BY r.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query user reviews: %w", err)
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var review models.Review
		var photos pq.StringArray

		err := rows.Scan(
			&review.ID, &review.UserID, &review.CompanyID, &review.ServiceID,
			&review.BookingID, &review.OrderID, &review.Rating, &review.Comment,
			&photos, &review.IsAnonymous, &review.Status, &review.Response,
			&review.RespondedAt, &review.CreatedAt, &review.UpdatedAt,
			&review.ServiceName, &review.CompanyName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user review: %w", err)
		}

		review.Photos = []string(photos)
		reviews = append(reviews, review)
	}

	return reviews, totalCount, nil
}

// RespondToReview allows company to respond to a review
func (s *ReviewService) RespondToReview(companyID string, req *models.ReviewResponse) error {
	// Verify the review belongs to this company
	var reviewCompanyID string
	err := s.db.QueryRow(`
		SELECT company_id FROM reviews WHERE id = $1
	`, req.ReviewID).Scan(&reviewCompanyID)
	if err != nil {
		return fmt.Errorf("review not found: %w", err)
	}

	if reviewCompanyID != companyID {
		return fmt.Errorf("unauthorized: review does not belong to this company")
	}

	// Update the review with response
	query := `
		UPDATE reviews 
		SET response = $1, responded_at = $2, updated_at = $3
		WHERE id = $4
	`

	_, err = s.db.Exec(query, req.Response, time.Now(), time.Now(), req.ReviewID)
	if err != nil {
		return fmt.Errorf("failed to update review response: %w", err)
	}

	return nil
}

// GetCompanyReviewStats gets review statistics for a company
func (s *ReviewService) GetCompanyReviewStats(companyID string) (*models.ReviewStats, error) {
	stats := &models.ReviewStats{
		CompanyID:       companyID,
		RatingBreakdown: make(map[int]int),
	}

	// Get total count and average rating
	err := s.db.QueryRow(`
		SELECT COUNT(*), COALESCE(AVG(rating), 0)
		FROM reviews 
		WHERE company_id = $1 AND status = 'approved'
	`, companyID).Scan(&stats.TotalReviews, &stats.AverageRating)
	if err != nil {
		return nil, fmt.Errorf("failed to get review stats: %w", err)
	}

	// Get rating breakdown
	rows, err := s.db.Query(`
		SELECT rating, COUNT(*) 
		FROM reviews 
		WHERE company_id = $1 AND status = 'approved'
		GROUP BY rating
		ORDER BY rating DESC
	`, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rating breakdown: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var rating, count int
		err := rows.Scan(&rating, &count)
		if err != nil {
			continue
		}
		stats.RatingBreakdown[rating] = count
	}

	// Get recent reviews
	recentReviews, _, err := s.GetCompanyReviews(&models.ReviewFilter{
		CompanyID: companyID,
		Status:    "approved",
		Limit:     5,
		Offset:    0,
	})
	if err == nil {
		stats.RecentReviews = recentReviews
	}

	return stats, nil
}

// UpdateReviewStatus updates the status of a review (for moderation)
func (s *ReviewService) UpdateReviewStatus(reviewID, status string) error {
	query := `
		UPDATE reviews 
		SET status = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := s.db.Exec(query, status, time.Now(), reviewID)
	if err != nil {
		return fmt.Errorf("failed to update review status: %w", err)
	}

	return nil
}

// DeleteReview deletes a review (only by user who created it)
func (s *ReviewService) DeleteReview(reviewID, userID string) error {
	// Verify ownership
	var reviewUserID string
	err := s.db.QueryRow(`
		SELECT user_id FROM reviews WHERE id = $1
	`, reviewID).Scan(&reviewUserID)
	if err != nil {
		return fmt.Errorf("review not found: %w", err)
	}

	if reviewUserID != userID {
		return fmt.Errorf("unauthorized: cannot delete another user's review")
	}

	// Delete the review
	_, err = s.db.Exec(`DELETE FROM reviews WHERE id = $1`, reviewID)
	if err != nil {
		return fmt.Errorf("failed to delete review: %w", err)
	}

	return nil
}

// Helper functions

func (s *ReviewService) validateUserBooking(userID, bookingID string) bool {
	var count int
	s.db.QueryRow(`
		SELECT COUNT(*) FROM bookings 
		WHERE id = $1 AND user_id = $2
	`, bookingID, userID).Scan(&count)
	return count > 0
}

func (s *ReviewService) validateUserOrder(userID, orderID string) bool {
	var count int
	s.db.QueryRow(`
		SELECT COUNT(*) FROM orders 
		WHERE id = $1 AND user_id = $2
	`, orderID, userID).Scan(&count)
	return count > 0
}

func (s *ReviewService) hasExistingReview(userID string, bookingID, orderID *string) bool {
	var count int

	if bookingID != nil {
		s.db.QueryRow(`
			SELECT COUNT(*) FROM reviews 
			WHERE user_id = $1 AND booking_id = $2
		`, userID, *bookingID).Scan(&count)
	} else if orderID != nil {
		s.db.QueryRow(`
			SELECT COUNT(*) FROM reviews 
			WHERE user_id = $1 AND order_id = $2
		`, userID, *orderID).Scan(&count)
	}

	return count > 0
}

// GetReviewableBookings gets bookings that can be reviewed by the user
func (s *ReviewService) GetReviewableBookings(userID string) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			b.id, b.company_id, b.service_id, b.date_time, b.status,
			c.name as company_name,
			COALESCE(s.name, '') as service_name
		FROM bookings b
		JOIN companies c ON b.company_id = c.id
		LEFT JOIN services s ON b.service_id = s.id
		WHERE b.user_id = $1 
		AND b.status = 'completed'
		AND NOT EXISTS (
			SELECT 1 FROM reviews r 
			WHERE r.booking_id = b.id AND r.user_id = $1
		)
		ORDER BY b.date_time DESC
		LIMIT 50
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewable bookings: %w", err)
	}
	defer rows.Close()

	var bookings []map[string]interface{}
	for rows.Next() {
		var booking map[string]interface{}
		var id, companyID, serviceID, status, companyName, serviceName string
		var dateTime time.Time

		err := rows.Scan(&id, &companyID, &serviceID, &dateTime, &status, &companyName, &serviceName)
		if err != nil {
			continue
		}

		booking = map[string]interface{}{
			"id":           id,
			"company_id":   companyID,
			"service_id":   serviceID,
			"date_time":    dateTime,
			"status":       status,
			"company_name": companyName,
			"service_name": serviceName,
		}

		bookings = append(bookings, booking)
	}

	return bookings, nil
}

// GetReviewableOrders gets orders that can be reviewed by the user
func (s *ReviewService) GetReviewableOrders(userID string) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			o.id, o.company_id, o.created_at, o.status, o.total_amount,
			c.name as company_name
		FROM orders o
		JOIN companies c ON o.company_id = c.id
		WHERE o.user_id = $1 
		AND o.status = 'completed'
		AND NOT EXISTS (
			SELECT 1 FROM reviews r 
			WHERE r.order_id = o.id AND r.user_id = $1
		)
		ORDER BY o.created_at DESC
		LIMIT 50
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get reviewable orders: %w", err)
	}
	defer rows.Close()

	var orders []map[string]interface{}
	for rows.Next() {
		var order map[string]interface{}
		var id, companyID, status, companyName string
		var createdAt time.Time
		var totalAmount float64

		err := rows.Scan(&id, &companyID, &createdAt, &status, &totalAmount, &companyName)
		if err != nil {
			continue
		}

		order = map[string]interface{}{
			"id":           id,
			"company_id":   companyID,
			"created_at":   createdAt,
			"status":       status,
			"total_amount": totalAmount,
			"company_name": companyName,
		}

		orders = append(orders, order)
	}

	return orders, nil
}
