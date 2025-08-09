package middleware

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimitConfig holds rate limiting configuration
type RateLimitConfig struct {
	RequestsPerHour int
	RequestsPerDay  int
	BurstLimit      int
	WindowSize      time.Duration
}

// DefaultRateLimitConfig returns default rate limiting configuration
func DefaultRateLimitConfig() *RateLimitConfig {
	return &RateLimitConfig{
		RequestsPerHour: 1000,
		RequestsPerDay:  10000,
		BurstLimit:      100,
		WindowSize:      time.Hour,
	}
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(db *sql.DB, config *RateLimitConfig) gin.HandlerFunc {
	if config == nil {
		config = DefaultRateLimitConfig()
	}

	return func(c *gin.Context) {
		identifier := getClientIdentifier(c)
		endpoint := c.Request.URL.Path

		// Check rate limit
		allowed, resetTime, err := checkRateLimit(db, identifier, endpoint, config)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Rate limit check failed",
			})
			c.Abort()
			return
		}

		if !allowed {
			c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerHour))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))
			c.Header("Retry-After", strconv.FormatInt(int64(resetTime.Sub(time.Now()).Seconds()), 10))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": fmt.Sprintf("Too many requests. Try again after %v", resetTime.Format(time.RFC3339)),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// APIKeyRateLimitMiddleware creates API key specific rate limiting
func APIKeyRateLimitMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			apiKey = c.Query("api_key")
		}

		if apiKey == "" {
			c.Next()
			return
		}

		// Get rate limit for this API key from database
		var rateLimit int
		err := db.QueryRow(`
			SELECT rate_limit_per_hour 
			FROM company_integration_settings 
			WHERE api_key = $1 AND integration_status = 'active'
		`, apiKey).Scan(&rateLimit)

		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "Invalid API key",
				})
				c.Abort()
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Rate limit check failed",
			})
			c.Abort()
			return
		}

		config := &RateLimitConfig{
			RequestsPerHour: rateLimit,
			RequestsPerDay:  rateLimit * 24,
			BurstLimit:      rateLimit / 10, // 10% of hourly limit as burst
			WindowSize:      time.Hour,
		}

		identifier := "api_key:" + apiKey
		endpoint := c.Request.URL.Path

		allowed, resetTime, err := checkRateLimit(db, identifier, endpoint, config)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Rate limit check failed",
			})
			c.Abort()
			return
		}

		if !allowed {
			c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerHour))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "API rate limit exceeded",
				"message": "Too many API requests for this key",
			})
			c.Abort()
			return
		}

		// Log API usage
		go logAPIUsage(db, apiKey, c)

		c.Next()
	}
}

// IPRateLimitMiddleware creates IP-based rate limiting
func IPRateLimitMiddleware(db *sql.DB, config *RateLimitConfig) gin.HandlerFunc {
	if config == nil {
		config = &RateLimitConfig{
			RequestsPerHour: 500, // Lower limit for IP-based
			RequestsPerDay:  5000,
			BurstLimit:      50,
			WindowSize:      time.Hour,
		}
	}

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		identifier := "ip:" + clientIP
		endpoint := c.Request.URL.Path

		allowed, resetTime, err := checkRateLimit(db, identifier, endpoint, config)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Rate limit check failed",
			})
			c.Abort()
			return
		}

		if !allowed {
			c.Header("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerHour))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime.Unix(), 10))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "IP rate limit exceeded",
				"message": "Too many requests from this IP address",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getClientIdentifier determines how to identify the client for rate limiting
func getClientIdentifier(c *gin.Context) string {
	// Try API key first
	apiKey := c.GetHeader("X-API-Key")
	if apiKey != "" {
		return "api_key:" + apiKey
	}

	// Try user ID if authenticated
	if userID, exists := c.Get("user_id"); exists {
		return "user:" + userID.(string)
	}

	// Fall back to IP address
	return "ip:" + c.ClientIP()
}

// checkRateLimit checks if the request is within rate limits
func checkRateLimit(db *sql.DB, identifier, endpoint string, config *RateLimitConfig) (bool, time.Time, error) {
	now := time.Now()
	windowStart := now.Truncate(config.WindowSize)
	windowEnd := windowStart.Add(config.WindowSize)

	// Get or create rate limit record
	var requestCount int
	var lastWindowStart time.Time

	err := db.QueryRow(`
		SELECT request_count, window_start 
		FROM rate_limits 
		WHERE identifier = $1 AND endpoint = $2 AND window_start = $3
	`, identifier, endpoint, windowStart).Scan(&requestCount, &lastWindowStart)

	if err == sql.ErrNoRows {
		// Create new rate limit record
		_, err := db.Exec(`
			INSERT INTO rate_limits (identifier, endpoint, request_count, window_start, window_size_minutes, max_requests, created_at, updated_at)
			VALUES ($1, $2, 1, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`, identifier, endpoint, windowStart, int(config.WindowSize.Minutes()), config.RequestsPerHour)

		if err != nil {
			return false, windowEnd, err
		}
		return true, windowEnd, nil
	} else if err != nil {
		return false, windowEnd, err
	}

	// Check if within limits
	if requestCount >= config.RequestsPerHour {
		return false, windowEnd, nil
	}

	// Update request count
	_, err = db.Exec(`
		UPDATE rate_limits 
		SET request_count = request_count + 1, updated_at = CURRENT_TIMESTAMP
		WHERE identifier = $1 AND endpoint = $2 AND window_start = $3
	`, identifier, endpoint, windowStart)

	if err != nil {
		return false, windowEnd, err
	}

	return true, windowEnd, nil
}

// logAPIUsage logs API usage for analytics
func logAPIUsage(db *sql.DB, apiKey string, c *gin.Context) {
	_, err := db.Exec(`
		INSERT INTO api_key_usage_logs (
			company_id, api_key, endpoint, method, status_code,
			ip_address, user_agent, referrer, timestamp
		) SELECT 
			cis.company_id, $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP
		FROM company_integration_settings cis
		WHERE cis.api_key = $1
	`, apiKey, c.Request.URL.Path, c.Request.Method, c.Writer.Status(),
		c.ClientIP(), c.GetHeader("User-Agent"), c.GetHeader("Referer"))

	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to log API usage: %v\n", err)
	}
}

// CleanupExpiredRateLimits removes old rate limit records
func CleanupExpiredRateLimits(db *sql.DB) error {
	// Clean up rate limits older than 24 hours
	_, err := db.Exec(`
		DELETE FROM rate_limits 
		WHERE window_start < CURRENT_TIMESTAMP - INTERVAL '24 hours'
	`)
	return err
}

// GetRateLimitStatus returns current rate limit status for an identifier
func GetRateLimitStatus(db *sql.DB, identifier, endpoint string, config *RateLimitConfig) (*RateLimitStatus, error) {
	windowStart := time.Now().Truncate(config.WindowSize)

	var requestCount int
	err := db.QueryRow(`
		SELECT COALESCE(request_count, 0) 
		FROM rate_limits 
		WHERE identifier = $1 AND endpoint = $2 AND window_start = $3
	`, identifier, endpoint, windowStart).Scan(&requestCount)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	remaining := config.RequestsPerHour - requestCount
	if remaining < 0 {
		remaining = 0
	}

	resetTime := windowStart.Add(config.WindowSize)

	return &RateLimitStatus{
		Limit:     config.RequestsPerHour,
		Remaining: remaining,
		Reset:     resetTime,
		Used:      requestCount,
	}, nil
}

// RateLimitStatus represents the current rate limit status
type RateLimitStatus struct {
	Limit     int       `json:"limit"`
	Remaining int       `json:"remaining"`
	Reset     time.Time `json:"reset"`
	Used      int       `json:"used"`
}

// AdvancedRateLimitMiddleware provides more sophisticated rate limiting
func AdvancedRateLimitMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		identifier := getClientIdentifier(c)
		endpoint := c.Request.URL.Path
		method := c.Request.Method

		// Different limits for different endpoints
		var config *RateLimitConfig

		switch {
		case strings.HasPrefix(endpoint, "/api/v1/auth/"):
			// Stricter limits for auth endpoints
			config = &RateLimitConfig{
				RequestsPerHour: 60, // 1 per minute
				RequestsPerDay:  500,
				BurstLimit:      5,
				WindowSize:      time.Hour,
			}
		case strings.HasPrefix(endpoint, "/api/v1/marketplace/"):
			// More lenient for public marketplace
			config = &RateLimitConfig{
				RequestsPerHour: 2000,
				RequestsPerDay:  20000,
				BurstLimit:      200,
				WindowSize:      time.Hour,
			}
		case strings.HasPrefix(endpoint, "/api/v1/integration/"):
			// API integration limits
			config = &RateLimitConfig{
				RequestsPerHour: 1000,
				RequestsPerDay:  10000,
				BurstLimit:      100,
				WindowSize:      time.Hour,
			}
		case method == "POST" || method == "PUT" || method == "DELETE":
			// Stricter limits for write operations
			config = &RateLimitConfig{
				RequestsPerHour: 300,
				RequestsPerDay:  3000,
				BurstLimit:      30,
				WindowSize:      time.Hour,
			}
		default:
			// Default limits
			config = DefaultRateLimitConfig()
		}

		allowed, resetTime, err := checkRateLimit(db, identifier, endpoint, config)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Rate limit check failed",
			})
			c.Abort()
			return
		}

		// Add rate limit headers
		status, _ := GetRateLimitStatus(db, identifier, endpoint, config)
		if status != nil {
			c.Header("X-RateLimit-Limit", strconv.Itoa(status.Limit))
			c.Header("X-RateLimit-Remaining", strconv.Itoa(status.Remaining))
			c.Header("X-RateLimit-Reset", strconv.FormatInt(status.Reset.Unix(), 10))
		}

		if !allowed {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit exceeded",
				"message":     "Too many requests for this endpoint",
				"retry_after": resetTime.Sub(time.Now()).Seconds(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
