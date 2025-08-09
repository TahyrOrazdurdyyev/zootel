package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type AnalyticsService struct {
	db *sql.DB
}

func NewAnalyticsService(db *sql.DB) *AnalyticsService {
	return &AnalyticsService{db: db}
}

// Analytics Event Tracking

type AnalyticsEvent struct {
	ID        string                 `json:"id"`
	CompanyID *string                `json:"company_id"`
	UserID    *string                `json:"user_id"`
	EventType string                 `json:"event_type"`
	EventName string                 `json:"event_name"`
	EventData map[string]interface{} `json:"event_data"`
	SessionID string                 `json:"session_id"`
	IPAddress string                 `json:"ip_address"`
	UserAgent string                 `json:"user_agent"`
	Referrer  string                 `json:"referrer"`
	CreatedAt time.Time              `json:"created_at"`
}

type TrackEventRequest struct {
	CompanyID string                 `json:"company_id"`
	UserID    string                 `json:"user_id"`
	EventType string                 `json:"event_type" binding:"required"`
	EventName string                 `json:"event_name" binding:"required"`
	EventData map[string]interface{} `json:"event_data"`
	SessionID string                 `json:"session_id"`
	IPAddress string                 `json:"ip_address"`
	UserAgent string                 `json:"user_agent"`
	Referrer  string                 `json:"referrer"`
}

// TrackEvent tracks an analytics event
func (s *AnalyticsService) TrackEvent(req *TrackEventRequest) error {
	eventID := uuid.New().String()
	eventDataJSON := "{}"

	if req.EventData != nil {
		data, err := json.Marshal(req.EventData)
		if err == nil {
			eventDataJSON = string(data)
		}
	}

	var companyID, userID interface{}
	if req.CompanyID != "" {
		companyID = req.CompanyID
	}
	if req.UserID != "" {
		userID = req.UserID
	}

	_, err := s.db.Exec(`
		INSERT INTO analytics_events (
			id, company_id, user_id, event_type, event_name, event_data,
			session_id, ip_address, user_agent, referrer, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, eventID, companyID, userID, req.EventType, req.EventName, eventDataJSON,
		req.SessionID, req.IPAddress, req.UserAgent, req.Referrer, time.Now())

	return err
}

// TrackSignUpRegion tracks user sign-up by region
func (s *AnalyticsService) TrackSignUpRegion(userID, region, country, state, city, ipAddress string) error {
	return s.TrackEvent(&TrackEventRequest{
		UserID:    userID,
		EventType: "user_registration",
		EventName: "sign_up_region",
		EventData: map[string]interface{}{
			"region":  region,
			"country": country,
			"state":   state,
			"city":    city,
		},
		IPAddress: ipAddress,
	})
}

// TrackSelectLocation tracks location selection events
func (s *AnalyticsService) TrackSelectLocation(userID, companyID, location, locationType string) error {
	return s.TrackEvent(&TrackEventRequest{
		CompanyID: companyID,
		UserID:    userID,
		EventType: "user_interaction",
		EventName: "select_location",
		EventData: map[string]interface{}{
			"location":      location,
			"location_type": locationType,
		},
	})
}

// TrackProfileCompleted tracks profile completion events
func (s *AnalyticsService) TrackProfileCompleted(userID, companyID string, profileData map[string]interface{}) error {
	return s.TrackEvent(&TrackEventRequest{
		CompanyID: companyID,
		UserID:    userID,
		EventType: "user_milestone",
		EventName: "profile_completed",
		EventData: profileData,
	})
}

// TrackLocation tracks user location changes
func (s *AnalyticsService) TrackLocation(userID, companyID string, latitude, longitude float64, accuracy float64) error {
	return s.TrackEvent(&TrackEventRequest{
		CompanyID: companyID,
		UserID:    userID,
		EventType: "user_location",
		EventName: "track_location",
		EventData: map[string]interface{}{
			"latitude":  latitude,
			"longitude": longitude,
			"accuracy":  accuracy,
		},
	})
}

// TrackBookingEvent tracks booking-related events
func (s *AnalyticsService) TrackBookingEvent(eventName, userID, companyID, bookingID string, eventData map[string]interface{}) error {
	return s.TrackEvent(&TrackEventRequest{
		CompanyID: companyID,
		UserID:    userID,
		EventType: "booking",
		EventName: eventName,
		EventData: map[string]interface{}{
			"booking_id": bookingID,
			"data":       eventData,
		},
	})
}

// TrackPaymentEvent tracks payment-related events
func (s *AnalyticsService) TrackPaymentEvent(eventName, userID, companyID, paymentID string, amount float64, currency string) error {
	return s.TrackEvent(&TrackEventRequest{
		CompanyID: companyID,
		UserID:    userID,
		EventType: "payment",
		EventName: eventName,
		EventData: map[string]interface{}{
			"payment_id": paymentID,
			"amount":     amount,
			"currency":   currency,
		},
	})
}

// GetAnalyticsEvents returns analytics events with filtering
func (s *AnalyticsService) GetAnalyticsEvents(companyID string, eventType, eventName string, days int, limit int) ([]AnalyticsEvent, error) {
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if companyID != "" {
		whereClause += fmt.Sprintf(" AND company_id = $%d", argIndex)
		args = append(args, companyID)
		argIndex++
	}

	if eventType != "" {
		whereClause += fmt.Sprintf(" AND event_type = $%d", argIndex)
		args = append(args, eventType)
		argIndex++
	}

	if eventName != "" {
		whereClause += fmt.Sprintf(" AND event_name = $%d", argIndex)
		args = append(args, eventName)
		argIndex++
	}

	if days > 0 {
		whereClause += fmt.Sprintf(" AND created_at >= NOW() - INTERVAL '%d days'", days)
	}

	query := fmt.Sprintf(`
		SELECT id, company_id, user_id, event_type, event_name, event_data,
			   session_id, ip_address, user_agent, referrer, created_at
		FROM analytics_events %s
		ORDER BY created_at DESC
		LIMIT $%d
	`, whereClause, argIndex)

	args = append(args, limit)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []AnalyticsEvent
	for rows.Next() {
		var event AnalyticsEvent
		var companyID, userID sql.NullString
		var eventDataStr string

		err := rows.Scan(
			&event.ID, &companyID, &userID, &event.EventType, &event.EventName,
			&eventDataStr, &event.SessionID, &event.IPAddress, &event.UserAgent,
			&event.Referrer, &event.CreatedAt,
		)
		if err != nil {
			continue
		}

		if companyID.Valid {
			event.CompanyID = &companyID.String
		}
		if userID.Valid {
			event.UserID = &userID.String
		}

		// Parse event data
		json.Unmarshal([]byte(eventDataStr), &event.EventData)

		events = append(events, event)
	}

	return events, nil
}

// GetEventAggregations returns aggregated event data
func (s *AnalyticsService) GetEventAggregations(companyID, eventType string, days int) (map[string]interface{}, error) {
	aggregations := make(map[string]interface{})

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if companyID != "" {
		whereClause += fmt.Sprintf(" AND company_id = $%d", argIndex)
		args = append(args, companyID)
		argIndex++
	}

	if eventType != "" {
		whereClause += fmt.Sprintf(" AND event_type = $%d", argIndex)
		args = append(args, eventType)
		argIndex++
	}

	if days > 0 {
		whereClause += fmt.Sprintf(" AND created_at >= NOW() - INTERVAL '%d days'", days)
	}

	// Total events
	query := fmt.Sprintf("SELECT COUNT(*) FROM analytics_events %s", whereClause)
	var totalEvents int
	err := s.db.QueryRow(query, args...).Scan(&totalEvents)
	if err != nil {
		return nil, err
	}
	aggregations["total_events"] = totalEvents

	// Unique users
	query = fmt.Sprintf("SELECT COUNT(DISTINCT user_id) FROM analytics_events %s AND user_id IS NOT NULL", whereClause)
	var uniqueUsers int
	err = s.db.QueryRow(query, args...).Scan(&uniqueUsers)
	if err == nil {
		aggregations["unique_users"] = uniqueUsers
	}

	// Unique sessions
	query = fmt.Sprintf("SELECT COUNT(DISTINCT session_id) FROM analytics_events %s AND session_id IS NOT NULL AND session_id != ''", whereClause)
	var uniqueSessions int
	err = s.db.QueryRow(query, args...).Scan(&uniqueSessions)
	if err == nil {
		aggregations["unique_sessions"] = uniqueSessions
	}

	// Top event names
	query = fmt.Sprintf(`
		SELECT event_name, COUNT(*) as count
		FROM analytics_events %s
		GROUP BY event_name
		ORDER BY count DESC
		LIMIT 10
	`, whereClause)

	rows, err := s.db.Query(query, args...)
	if err == nil {
		defer rows.Close()
		topEvents := make([]map[string]interface{}, 0)
		for rows.Next() {
			var eventName string
			var count int
			if rows.Scan(&eventName, &count) == nil {
				topEvents = append(topEvents, map[string]interface{}{
					"event_name": eventName,
					"count":      count,
				})
			}
		}
		aggregations["top_events"] = topEvents
	}

	// Geographic distribution (countries)
	query = fmt.Sprintf(`
		SELECT 
			COALESCE(event_data->>'country', 'Unknown') as country,
			COUNT(*) as count
		FROM analytics_events %s
		AND event_data->>'country' IS NOT NULL
		GROUP BY event_data->>'country'
		ORDER BY count DESC
		LIMIT 10
	`, whereClause)

	rows, err = s.db.Query(query, args...)
	if err == nil {
		defer rows.Close()
		countries := make([]map[string]interface{}, 0)
		for rows.Next() {
			var country string
			var count int
			if rows.Scan(&country, &count) == nil {
				countries = append(countries, map[string]interface{}{
					"country": country,
					"count":   count,
				})
			}
		}
		aggregations["top_countries"] = countries
	}

	return aggregations, nil
}

// GetUserJourney returns user journey analytics
func (s *AnalyticsService) GetUserJourney(userID string, days int) ([]AnalyticsEvent, error) {
	whereClause := "WHERE user_id = $1"
	args := []interface{}{userID}

	if days > 0 {
		whereClause += fmt.Sprintf(" AND created_at >= NOW() - INTERVAL '%d days'", days)
	}

	query := fmt.Sprintf(`
		SELECT id, company_id, user_id, event_type, event_name, event_data,
			   session_id, ip_address, user_agent, referrer, created_at
		FROM analytics_events %s
		ORDER BY created_at ASC
	`, whereClause)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []AnalyticsEvent
	for rows.Next() {
		var event AnalyticsEvent
		var companyID sql.NullString
		var eventDataStr string

		err := rows.Scan(
			&event.ID, &companyID, &event.UserID, &event.EventType, &event.EventName,
			&eventDataStr, &event.SessionID, &event.IPAddress, &event.UserAgent,
			&event.Referrer, &event.CreatedAt,
		)
		if err != nil {
			continue
		}

		if companyID.Valid {
			event.CompanyID = &companyID.String
		}

		// Parse event data
		json.Unmarshal([]byte(eventDataStr), &event.EventData)

		events = append(events, event)
	}

	return events, nil
}

// GetConversionFunnel returns conversion funnel analytics
func (s *AnalyticsService) GetConversionFunnel(companyID string, funnelSteps []string, days int) (map[string]interface{}, error) {
	funnel := make(map[string]interface{})

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if companyID != "" {
		whereClause += fmt.Sprintf(" AND company_id = $%d", argIndex)
		args = append(args, companyID)
		argIndex++
	}

	if days > 0 {
		whereClause += fmt.Sprintf(" AND created_at >= NOW() - INTERVAL '%d days'", days)
	}

	steps := make([]map[string]interface{}, 0)

	for i, step := range funnelSteps {
		stepWhereClause := whereClause + fmt.Sprintf(" AND event_name = $%d", argIndex)
		stepArgs := append(args, step)

		query := fmt.Sprintf(`
			SELECT 
				COUNT(*) as total_events,
				COUNT(DISTINCT user_id) as unique_users
			FROM analytics_events %s
		`, stepWhereClause)

		var totalEvents, uniqueUsers int
		err := s.db.QueryRow(query, stepArgs...).Scan(&totalEvents, &uniqueUsers)
		if err != nil {
			continue
		}

		stepData := map[string]interface{}{
			"step":         i + 1,
			"event_name":   step,
			"total_events": totalEvents,
			"unique_users": uniqueUsers,
		}

		// Calculate conversion rate from previous step
		if i > 0 && len(steps) > 0 {
			prevUniqueUsers := steps[i-1]["unique_users"].(int)
			if prevUniqueUsers > 0 {
				conversionRate := float64(uniqueUsers) / float64(prevUniqueUsers) * 100
				stepData["conversion_rate"] = conversionRate
			}
		}

		steps = append(steps, stepData)
	}

	funnel["steps"] = steps
	return funnel, nil
}

// Existing analytics methods (keeping the original functionality)

type TimeSeriesData struct {
	Date  time.Time `json:"date"`
	Value float64   `json:"value"`
	Count int       `json:"count"`
}

type UserSegmentation struct {
	Segment string  `json:"segment"`
	Count   int     `json:"count"`
	Percent float64 `json:"percent"`
}

type CompanyAnalytics struct {
	CompanyID      string     `json:"company_id"`
	CompanyName    string     `json:"company_name"`
	TotalBookings  int        `json:"total_bookings"`
	TotalOrders    int        `json:"total_orders"`
	TotalRevenue   float64    `json:"total_revenue"`
	ActiveServices int        `json:"active_services"`
	ActiveProducts int        `json:"active_products"`
	EmployeeCount  int        `json:"employee_count"`
	LastActivity   *time.Time `json:"last_activity"`
}

type DashboardMetrics struct {
	TotalUsers        int     `json:"total_users"`
	TotalCompanies    int     `json:"total_companies"`
	TotalBookings     int     `json:"total_bookings"`
	TotalOrders       int     `json:"total_orders"`
	TotalRevenue      float64 `json:"total_revenue"`
	ActiveUsers       int     `json:"active_users"`
	ActiveCompanies   int     `json:"active_companies"`
	RecentUsers       int     `json:"recent_users"`
	RecentCompanies   int     `json:"recent_companies"`
	ConversionRate    float64 `json:"conversion_rate"`
	AverageOrderValue float64 `json:"average_order_value"`
}

func (s *AnalyticsService) GetGlobalDashboard() (*DashboardMetrics, error) {
	metrics := &DashboardMetrics{}

	query := `
		SELECT
			(SELECT COUNT(*) FROM users WHERE role = 'pet_owner') as total_users,
			(SELECT COUNT(*) FROM companies WHERE is_active = true AND is_demo = false) as total_companies,
			(SELECT COUNT(*) FROM bookings) as total_bookings,
			(SELECT COUNT(*) FROM orders) as total_orders,
			(SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'completed') as total_revenue,
			(SELECT COUNT(DISTINCT u.id) FROM users u
				LEFT JOIN bookings b ON u.id = b.user_id
				LEFT JOIN orders o ON u.id = o.user_id
				WHERE (b.created_at >= NOW() - INTERVAL '30 days' OR o.created_at >= NOW() - INTERVAL '30 days')
			) as active_users,
			(SELECT COUNT(*) FROM companies WHERE is_active = true AND is_demo = false
				AND (id IN (SELECT DISTINCT company_id FROM bookings WHERE created_at >= NOW() - INTERVAL '30 days')
					OR id IN (SELECT DISTINCT company_id FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'))
			) as active_companies,
			(SELECT COUNT(*) FROM users WHERE role = 'pet_owner' AND created_at >= NOW() - INTERVAL '30 days') as recent_users,
			(SELECT COUNT(*) FROM companies WHERE is_demo = false AND created_at >= NOW() - INTERVAL '30 days') as recent_companies
	`

	err := s.db.QueryRow(query).Scan(
		&metrics.TotalUsers, &metrics.TotalCompanies, &metrics.TotalBookings,
		&metrics.TotalOrders, &metrics.TotalRevenue, &metrics.ActiveUsers,
		&metrics.ActiveCompanies, &metrics.RecentUsers, &metrics.RecentCompanies,
	)
	if err != nil {
		return nil, err
	}

	// Calculate conversion rate (users who made bookings/orders vs total users)
	if metrics.TotalUsers > 0 {
		var convertedUsers int
		s.db.QueryRow(`
			SELECT COUNT(DISTINCT user_id) FROM (
				SELECT user_id FROM bookings
				UNION
				SELECT user_id FROM orders
			) converted
		`).Scan(&convertedUsers)

		metrics.ConversionRate = float64(convertedUsers) / float64(metrics.TotalUsers) * 100
	}

	// Calculate average order value
	if metrics.TotalOrders > 0 {
		metrics.AverageOrderValue = metrics.TotalRevenue / float64(metrics.TotalOrders)
	}

	return metrics, nil
}

// Keep all existing analytics methods...
// [Previous methods like GetRevenueTrends, GetUserRegistrationTrends, etc. remain unchanged]

func (s *AnalyticsService) GetRevenueTrends(companyID string, days int) ([]map[string]interface{}, error) {
	whereClause := ""
	args := []interface{}{days}

	if companyID != "" {
		whereClause = "AND company_id = $2"
		args = append(args, companyID)
	}

	query := fmt.Sprintf(`
		SELECT 
			DATE(created_at) as date,
			SUM(total_amount) as revenue,
			COUNT(*) as order_count
		FROM orders 
		WHERE created_at >= NOW() - INTERVAL '%d days' 
			AND status = 'completed' %s
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`, days, whereClause)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trends []map[string]interface{}
	for rows.Next() {
		var date time.Time
		var revenue float64
		var orderCount int

		err := rows.Scan(&date, &revenue, &orderCount)
		if err != nil {
			continue
		}

		trends = append(trends, map[string]interface{}{
			"date":        date.Format("2006-01-02"),
			"revenue":     revenue,
			"order_count": orderCount,
		})
	}

	return trends, nil
}

func (s *AnalyticsService) GetUserRegistrationTrends(days int) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as registrations
		FROM users 
		WHERE created_at >= NOW() - INTERVAL '%d days' 
			AND role = 'pet_owner'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`

	rows, err := s.db.Query(fmt.Sprintf(query, days))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trends []map[string]interface{}
	for rows.Next() {
		var date time.Time
		var registrations int

		err := rows.Scan(&date, &registrations)
		if err != nil {
			continue
		}

		trends = append(trends, map[string]interface{}{
			"date":          date.Format("2006-01-02"),
			"registrations": registrations,
		})
	}

	return trends, nil
}

// GetBookingTrends returns booking trends over time
func (s *AnalyticsService) GetBookingTrends(days int) ([]TimeSeriesData, error) {
	query := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as count,
			COALESCE(AVG(price), 0) as avg_price
		FROM bookings 
		WHERE created_at >= NOW() - INTERVAL '%d days'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`

	rows, err := s.db.Query(fmt.Sprintf(query, days))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trends []TimeSeriesData
	for rows.Next() {
		var trend TimeSeriesData
		err := rows.Scan(&trend.Date, &trend.Count, &trend.Value)
		if err != nil {
			return nil, err
		}
		trends = append(trends, trend)
	}

	return trends, nil
}

// GetUserSegmentation returns user segmentation analysis
func (s *AnalyticsService) GetUserSegmentation() ([]UserSegmentation, error) {
	var totalUsers int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE role = 'pet_owner'").Scan(&totalUsers)
	if err != nil {
		return nil, err
	}

	// Segmentation by activity level
	query := `
		SELECT 
			CASE 
				WHEN booking_count >= 5 OR order_count >= 3 THEN 'High Activity'
				WHEN booking_count >= 2 OR order_count >= 1 THEN 'Medium Activity'
				WHEN booking_count >= 1 OR order_count >= 1 THEN 'Low Activity'
				ELSE 'No Activity'
			END as segment,
			COUNT(*) as count
		FROM (
			SELECT 
				u.id,
				COALESCE(b.booking_count, 0) as booking_count,
				COALESCE(o.order_count, 0) as order_count
			FROM users u
			LEFT JOIN (
				SELECT user_id, COUNT(*) as booking_count 
				FROM bookings 
				GROUP BY user_id
			) b ON u.id = b.user_id
			LEFT JOIN (
				SELECT user_id, COUNT(*) as order_count 
				FROM orders 
				GROUP BY user_id
			) o ON u.id = o.user_id
			WHERE u.role = 'pet_owner'
		) user_activity
		GROUP BY segment
		ORDER BY 
			CASE segment
				WHEN 'High Activity' THEN 1
				WHEN 'Medium Activity' THEN 2
				WHEN 'Low Activity' THEN 3
				WHEN 'No Activity' THEN 4
			END
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var segmentation []UserSegmentation
	for rows.Next() {
		var seg UserSegmentation
		err := rows.Scan(&seg.Segment, &seg.Count)
		if err != nil {
			return nil, err
		}
		if totalUsers > 0 {
			seg.Percent = float64(seg.Count) / float64(totalUsers) * 100
		}
		segmentation = append(segmentation, seg)
	}

	return segmentation, nil
}

// GetTopPerformingCompanies returns top companies by various metrics
func (s *AnalyticsService) GetTopPerformingCompanies(limit int) ([]CompanyAnalytics, error) {
	query := `
		SELECT 
			c.id,
			c.name,
			COALESCE(b.booking_count, 0) as total_bookings,
			COALESCE(o.order_count, 0) as total_orders,
			COALESCE(o.total_revenue, 0) as total_revenue,
			COALESCE(s.service_count, 0) as active_services,
			COALESCE(p.product_count, 0) as active_products,
			COALESCE(e.employee_count, 0) as employee_count,
			GREATEST(b.last_booking, o.last_order) as last_activity
		FROM companies c
		LEFT JOIN (
			SELECT 
				company_id, 
				COUNT(*) as booking_count,
				MAX(created_at) as last_booking
			FROM bookings 
			GROUP BY company_id
		) b ON c.id = b.company_id
		LEFT JOIN (
			SELECT 
				company_id, 
				COUNT(*) as order_count,
				SUM(total_amount) as total_revenue,
				MAX(created_at) as last_order
			FROM orders 
			WHERE status = 'completed'
			GROUP BY company_id
		) o ON c.id = o.company_id
		LEFT JOIN (
			SELECT company_id, COUNT(*) as service_count
			FROM services 
			WHERE is_active = true
			GROUP BY company_id
		) s ON c.id = s.company_id
		LEFT JOIN (
			SELECT company_id, COUNT(*) as product_count
			FROM products 
			WHERE is_active = true
			GROUP BY company_id
		) p ON c.id = p.company_id
		LEFT JOIN (
			SELECT company_id, COUNT(*) as employee_count
			FROM employees 
			WHERE is_active = true
			GROUP BY company_id
		) e ON c.id = e.company_id
		WHERE c.is_active = true AND c.is_demo = false
		ORDER BY (COALESCE(b.booking_count, 0) + COALESCE(o.order_count, 0)) DESC, total_revenue DESC
		LIMIT $1
	`

	rows, err := s.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var companies []CompanyAnalytics
	for rows.Next() {
		var company CompanyAnalytics
		err := rows.Scan(
			&company.CompanyID, &company.CompanyName, &company.TotalBookings,
			&company.TotalOrders, &company.TotalRevenue, &company.ActiveServices,
			&company.ActiveProducts, &company.EmployeeCount, &company.LastActivity,
		)
		if err != nil {
			return nil, err
		}
		companies = append(companies, company)
	}

	return companies, nil
}

// GetServiceCategoryPerformance returns performance metrics by service category
func (s *AnalyticsService) GetServiceCategoryPerformance() ([]map[string]interface{}, error) {
	query := `
		SELECT 
			sc.name as category_name,
			COUNT(DISTINCT s.id) as total_services,
			COUNT(DISTINCT s.company_id) as companies_offering,
			COALESCE(SUM(b.booking_count), 0) as total_bookings,
			COALESCE(AVG(s.price), 0) as avg_price,
			COALESCE(SUM(b.total_revenue), 0) as total_revenue
		FROM service_categories sc
		LEFT JOIN services s ON sc.id = s.category_id AND s.is_active = true
		LEFT JOIN (
			SELECT 
				service_id,
				COUNT(*) as booking_count,
				SUM(price) as total_revenue
			FROM bookings
			GROUP BY service_id
		) b ON s.id = b.service_id
		GROUP BY sc.id, sc.name
		HAVING COUNT(DISTINCT s.id) > 0
		ORDER BY total_revenue DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var performance []map[string]interface{}
	for rows.Next() {
		var categoryName string
		var totalServices, companiesOffering, totalBookings int
		var avgPrice, totalRevenue float64

		err := rows.Scan(
			&categoryName, &totalServices, &companiesOffering,
			&totalBookings, &avgPrice, &totalRevenue,
		)
		if err != nil {
			return nil, err
		}

		performance = append(performance, map[string]interface{}{
			"category_name":      categoryName,
			"total_services":     totalServices,
			"companies_offering": companiesOffering,
			"total_bookings":     totalBookings,
			"avg_price":          avgPrice,
			"total_revenue":      totalRevenue,
		})
	}

	return performance, nil
}

// GetCompanyAnalytics returns detailed analytics for a specific company
func (s *AnalyticsService) GetCompanyAnalytics(companyID string, days int) (map[string]interface{}, error) {
	analytics := make(map[string]interface{})

	// Basic metrics
	var totalBookings, totalOrders, totalServices, totalProducts int
	var totalRevenue float64

	err := s.db.QueryRow(`
		SELECT 
			(SELECT COUNT(*) FROM bookings WHERE company_id = $1 AND created_at >= NOW() - INTERVAL '%d days') as bookings,
			(SELECT COUNT(*) FROM orders WHERE company_id = $1 AND created_at >= NOW() - INTERVAL '%d days') as orders,
			(SELECT COUNT(*) FROM services WHERE company_id = $1 AND is_active = true) as services,
			(SELECT COUNT(*) FROM products WHERE company_id = $1 AND is_active = true) as products,
			(SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE company_id = $1 AND status = 'completed' AND created_at >= NOW() - INTERVAL '%d days') as revenue
	`, companyID, days, days, days).Scan(&totalBookings, &totalOrders, &totalServices, &totalProducts, &totalRevenue)

	if err != nil {
		return nil, err
	}

	analytics["total_bookings"] = totalBookings
	analytics["total_orders"] = totalOrders
	analytics["total_services"] = totalServices
	analytics["total_products"] = totalProducts
	analytics["total_revenue"] = totalRevenue

	// Booking status distribution
	bookingStatusQuery := `
		SELECT status, COUNT(*) 
		FROM bookings 
		WHERE company_id = $1 AND created_at >= NOW() - INTERVAL '%d days'
		GROUP BY status
	`

	rows, err := s.db.Query(fmt.Sprintf(bookingStatusQuery, days), companyID)
	if err != nil {
		return nil, err
	}

	bookingStatus := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		err := rows.Scan(&status, &count)
		if err != nil {
			continue
		}
		bookingStatus[status] = count
	}
	rows.Close()
	analytics["booking_status"] = bookingStatus

	// Top services
	topServicesQuery := `
		SELECT s.name, COUNT(b.id) as booking_count, COALESCE(SUM(b.price), 0) as revenue
		FROM services s
		LEFT JOIN bookings b ON s.id = b.service_id AND b.created_at >= NOW() - INTERVAL '%d days'
		WHERE s.company_id = $1 AND s.is_active = true
		GROUP BY s.id, s.name
		ORDER BY booking_count DESC, revenue DESC
		LIMIT 5
	`

	rows, err = s.db.Query(fmt.Sprintf(topServicesQuery, days), companyID)
	if err != nil {
		return nil, err
	}

	var topServices []map[string]interface{}
	for rows.Next() {
		var serviceName string
		var bookingCount int
		var revenue float64
		err := rows.Scan(&serviceName, &bookingCount, &revenue)
		if err != nil {
			continue
		}
		topServices = append(topServices, map[string]interface{}{
			"service_name":  serviceName,
			"booking_count": bookingCount,
			"revenue":       revenue,
		})
	}
	rows.Close()
	analytics["top_services"] = topServices

	return analytics, nil
}

// GetPetTypePopularity returns popularity statistics for different pet types
func (s *AnalyticsService) GetPetTypePopularity() ([]map[string]interface{}, error) {
	query := `
		SELECT 
			pt.name as pet_type,
			COUNT(p.id) as pet_count,
			COUNT(DISTINCT p.user_id) as owner_count,
			COUNT(DISTINCT b.id) as booking_count
		FROM pet_types pt
		LEFT JOIN pets p ON pt.id = p.pet_type_id
		LEFT JOIN bookings b ON p.id = b.pet_id
		GROUP BY pt.id, pt.name
		HAVING COUNT(p.id) > 0
		ORDER BY pet_count DESC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var popularity []map[string]interface{}
	for rows.Next() {
		var petType string
		var petCount, ownerCount, bookingCount int

		err := rows.Scan(&petType, &petCount, &ownerCount, &bookingCount)
		if err != nil {
			return nil, err
		}

		popularity = append(popularity, map[string]interface{}{
			"pet_type":      petType,
			"pet_count":     petCount,
			"owner_count":   ownerCount,
			"booking_count": bookingCount,
		})
	}

	return popularity, nil
}

// GetCohortAnalysis returns user cohort analysis
func (s *AnalyticsService) GetCohortAnalysis(months int) ([]map[string]interface{}, error) {
	query := `
		WITH user_cohorts AS (
			SELECT 
				u.id,
				DATE_TRUNC('month', u.created_at) as cohort_month,
				u.created_at as registration_date
			FROM users u
			WHERE u.role = 'pet_owner' 
				AND u.created_at >= NOW() - INTERVAL '%d months'
		),
		cohort_activity AS (
			SELECT 
				uc.cohort_month,
				DATE_TRUNC('month', COALESCE(b.created_at, o.created_at)) as activity_month,
				COUNT(DISTINCT uc.id) as active_users
			FROM user_cohorts uc
			LEFT JOIN bookings b ON uc.id = b.user_id
			LEFT JOIN orders o ON uc.id = o.user_id
			WHERE (b.created_at IS NOT NULL OR o.created_at IS NOT NULL)
			GROUP BY uc.cohort_month, DATE_TRUNC('month', COALESCE(b.created_at, o.created_at))
		)
		SELECT 
			cohort_month,
			activity_month,
			active_users,
			ROUND(
				active_users::numeric / 
				(SELECT COUNT(*) FROM user_cohorts WHERE cohort_month = ca.cohort_month)::numeric * 100, 
				2
			) as retention_rate
		FROM cohort_activity ca
		ORDER BY cohort_month, activity_month
	`

	rows, err := s.db.Query(fmt.Sprintf(query, months))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cohorts []map[string]interface{}
	for rows.Next() {
		var cohortMonth, activityMonth time.Time
		var activeUsers int
		var retentionRate float64

		err := rows.Scan(&cohortMonth, &activityMonth, &activeUsers, &retentionRate)
		if err != nil {
			return nil, err
		}

		cohorts = append(cohorts, map[string]interface{}{
			"cohort_month":   cohortMonth,
			"activity_month": activityMonth,
			"active_users":   activeUsers,
			"retention_rate": retentionRate,
		})
	}

	return cohorts, nil
}

// GetGeographicDistribution returns geographic distribution of users and companies
func (s *AnalyticsService) GetGeographicDistribution() (map[string]interface{}, error) {
	result := make(map[string]interface{})

	// User distribution by country
	userQuery := `
		SELECT country, COUNT(*) as user_count
		FROM users 
		WHERE role = 'pet_owner' AND country IS NOT NULL AND country != ''
		GROUP BY country
		ORDER BY user_count DESC
		LIMIT 10
	`

	rows, err := s.db.Query(userQuery)
	if err != nil {
		return nil, err
	}

	var userDistribution []map[string]interface{}
	for rows.Next() {
		var country string
		var count int
		err := rows.Scan(&country, &count)
		if err != nil {
			continue
		}
		userDistribution = append(userDistribution, map[string]interface{}{
			"country": country,
			"count":   count,
		})
	}
	rows.Close()
	result["user_distribution"] = userDistribution

	// Company distribution by country
	companyQuery := `
		SELECT country, COUNT(*) as company_count
		FROM companies 
		WHERE is_active = true AND is_demo = false AND country IS NOT NULL AND country != ''
		GROUP BY country
		ORDER BY company_count DESC
		LIMIT 10
	`

	rows, err = s.db.Query(companyQuery)
	if err != nil {
		return nil, err
	}

	var companyDistribution []map[string]interface{}
	for rows.Next() {
		var country string
		var count int
		err := rows.Scan(&country, &count)
		if err != nil {
			continue
		}
		companyDistribution = append(companyDistribution, map[string]interface{}{
			"country": country,
			"count":   count,
		})
	}
	rows.Close()
	result["company_distribution"] = companyDistribution

	return result, nil
}
