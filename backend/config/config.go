package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Firebase FirebaseConfig
	Stripe   StripeConfig
	Email    EmailConfig
	SMS      SMSConfig
	Storage  StorageConfig
	Redis    RedisConfig
	OpenAI   OpenAIConfig
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Host         string
	Port         string
	Environment  string
	AllowOrigins []string
	AllowMethods []string
	AllowHeaders []string
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxIdle  int
	MaxOpen  int
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret    string
	ExpiresIn time.Duration
}

// FirebaseConfig holds Firebase configuration
type FirebaseConfig struct {
	ProjectID      string
	CredentialsKey string
}

// StripeConfig holds Stripe configuration
type StripeConfig struct {
	SecretKey      string
	PublishableKey string
	WebhookSecret  string
}

// EmailConfig holds email service configuration
type EmailConfig struct {
	Provider  string
	APIKey    string
	FromEmail string
	FromName  string
}

// SMSConfig holds SMS service configuration
type SMSConfig struct {
	Provider string
	APIKey   string
	FromName string
}

// StorageConfig holds file storage configuration
type StorageConfig struct {
	Provider    string
	BucketName  string
	Region      string
	AccessKey   string
	SecretKey   string
	CDNBaseURL  string
	MaxFileSize int64
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// OpenAIConfig holds OpenAI configuration
type OpenAIConfig struct {
	APIKey string
	Model  string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Host:        getEnv("API_HOST", "0.0.0.0"),
			Port:        getEnv("API_PORT", "4000"),
			Environment: getEnv("ENVIRONMENT", "development"),
			AllowOrigins: []string{
				getEnv("FRONTEND_URL", "http://localhost:3000"),
				getEnv("ADMIN_URL", "http://localhost:3001"),
			},
			AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
			AllowHeaders: []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-API-Key"},
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "zootel"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			MaxIdle:  getEnvAsInt("DB_MAX_IDLE", 10),
			MaxOpen:  getEnvAsInt("DB_MAX_OPEN", 100),
		},
		JWT: JWTConfig{
			Secret:    getEnv("JWT_SECRET", "your-secret-key"),
			ExpiresIn: getEnvAsDuration("JWT_EXPIRES_IN", "24h"),
		},
		Firebase: FirebaseConfig{
			ProjectID:      getEnv("FIREBASE_PROJECT_ID", ""),
			CredentialsKey: getEnv("FIREBASE_CREDENTIALS_KEY", ""),
		},
		Stripe: StripeConfig{
			SecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
			PublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
			WebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
		},
		Email: EmailConfig{
			Provider:  getEnv("EMAIL_PROVIDER", "sendgrid"),
			APIKey:    getEnv("EMAIL_API_KEY", ""),
			FromEmail: getEnv("EMAIL_FROM_EMAIL", "noreply@zootel.com"),
			FromName:  getEnv("EMAIL_FROM_NAME", "Zootel"),
		},
		SMS: SMSConfig{
			Provider: getEnv("SMS_PROVIDER", "twilio"),
			APIKey:   getEnv("SMS_API_KEY", ""),
			FromName: getEnv("SMS_FROM_NAME", "Zootel"),
		},
		Storage: StorageConfig{
			Provider:    getEnv("STORAGE_PROVIDER", "local"),
			BucketName:  getEnv("STORAGE_BUCKET", "zootel-uploads"),
			Region:      getEnv("STORAGE_REGION", "us-east-1"),
			AccessKey:   getEnv("STORAGE_ACCESS_KEY", ""),
			SecretKey:   getEnv("STORAGE_SECRET_KEY", ""),
			CDNBaseURL:  getEnv("STORAGE_CDN_BASE_URL", ""),
			MaxFileSize: getEnvAsInt64("STORAGE_MAX_FILE_SIZE", 50*1024*1024), // 50MB
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		OpenAI: OpenAIConfig{
			APIKey: getEnv("OPENAI_API_KEY", ""),
			Model:  getEnv("OPENAI_MODEL", "gpt-3.5-turbo"),
		},
	}
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue string) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	if duration, err := time.ParseDuration(defaultValue); err == nil {
		return duration
	}
	return time.Hour * 24 // fallback to 24 hours
}

// GetDatabaseURL returns the database connection URL
func (c *DatabaseConfig) GetDatabaseURL() string {
	return "postgres://" + c.User + ":" + c.Password + "@" + c.Host + ":" + c.Port + "/" + c.DBName + "?sslmode=" + c.SSLMode
}

// IsProduction returns true if running in production environment
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}

// IsDevelopment returns true if running in development environment
func (c *Config) IsDevelopment() bool {
	return c.Server.Environment == "development"
}

// IsStaging returns true if running in staging environment
func (c *Config) IsStaging() bool {
	return c.Server.Environment == "staging"
}
