package services

import (
	"database/sql"
	"fmt"
	"time"
)

type AnalyticsService struct {
	db *sql.DB
}

func NewAnalyticsService(db *sql.DB) *AnalyticsService {
	return &AnalyticsService{db: db}
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

// GetGlobalDashboard returns comprehensive dashboard metrics
func (s *AnalyticsService) GetGlobalDashboard() (*DashboardMetrics, error) {
	metrics := &DashboardMetrics{}

	// Basic counts
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
		err = s.db.QueryRow(`
			SELECT COUNT(DISTINCT u.id) FROM users u
			WHERE u.role = 'pet_owner' AND (
				u.id IN (SELECT DISTINCT user_id FROM bookings) OR
				u.id IN (SELECT DISTINCT user_id FROM orders)
			)
		`).Scan(&convertedUsers)
		if err == nil {
			metrics.ConversionRate = float64(convertedUsers) / float64(metrics.TotalUsers) * 100
		}
	}

	// Calculate average order value
	if metrics.TotalOrders > 0 {
		metrics.AverageOrderValue = metrics.TotalRevenue / float64(metrics.TotalOrders)
	}

	return metrics, nil
}

// GetRevenueTrends returns revenue trends over time
func (s *AnalyticsService) GetRevenueTrends(days int) ([]TimeSeriesData, error) {
	query := `
		SELECT 
			DATE(created_at) as date,
			COALESCE(SUM(total_amount), 0) as revenue,
			COUNT(*) as order_count
		FROM orders 
		WHERE status = 'completed' 
			AND created_at >= NOW() - INTERVAL '%d days'
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
		err := rows.Scan(&trend.Date, &trend.Value, &trend.Count)
		if err != nil {
			return nil, err
		}
		trends = append(trends, trend)
	}

	return trends, nil
}

// GetUserRegistrationTrends returns user registration trends
func (s *AnalyticsService) GetUserRegistrationTrends(days int) ([]TimeSeriesData, error) {
	query := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as count
		FROM users 
		WHERE role = 'pet_owner' 
			AND created_at >= NOW() - INTERVAL '%d days'
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
		err := rows.Scan(&trend.Date, &trend.Count)
		if err != nil {
			return nil, err
		}
		trend.Value = float64(trend.Count)
		trends = append(trends, trend)
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

// TrackEvent records an analytics event
func (s *AnalyticsService) TrackEvent(eventType, userID, companyID string, metadata map[string]interface{}) error {
	// This would typically integrate with an analytics service like Google Analytics, Mixpanel, etc.
	// For now, we'll implement basic event logging

	// You could create an events table for tracking:
	// CREATE TABLE analytics_events (
	//     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	//     event_type VARCHAR(255) NOT NULL,
	//     user_id UUID,
	//     company_id UUID,
	//     metadata JSONB,
	//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	// );

	// For demonstration, we'll just log the event
	fmt.Printf("Analytics Event: %s - User: %s, Company: %s, Data: %+v\n",
		eventType, userID, companyID, metadata)

	return nil
}
