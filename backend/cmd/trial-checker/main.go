package main

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/config"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	log.Println("Starting trial checker cron job...")

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	db, err := sql.Open("postgres", cfg.Database.GetDatabaseURL())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Initialize services
	adminService := services.NewAdminService(db)
	firebaseCredentials := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	notificationService := services.NewNotificationService(db, firebaseCredentials)

	// Check and update expired trials
	log.Println("Checking for expired trials...")
	err = adminService.CheckAndUpdateExpiredTrials()
	if err != nil {
		log.Printf("Error updating expired trials: %v", err)
	}

	// Get companies with expired trials and send notifications
	expiredCompanies, err := adminService.GetCompaniesWithExpiredTrials()
	if err != nil {
		log.Printf("Error getting expired companies: %v", err)
	} else {
		log.Printf("Found %d companies with expired trials", len(expiredCompanies))
		for _, company := range expiredCompanies {
			err := notificationService.SendTrialExpiredNotification(company.ID)
			if err != nil {
				log.Printf("Failed to send expired notification to company %s: %v", company.ID, err)
			}
		}
	}

	// Get companies with trials expiring in 3 days and send warnings
	expiringCompanies, err := adminService.GetTrialExpiringCompanies(3)
	if err != nil {
		log.Printf("Error getting expiring companies: %v", err)
	} else {
		log.Printf("Found %d companies with trials expiring in 3 days", len(expiringCompanies))
		for _, company := range expiringCompanies {
			// Calculate days left
			var daysLeft int
			if company.TrialEndsAt != nil {
				daysLeft = int(time.Until(*company.TrialEndsAt).Hours() / 24)
			}

			err := notificationService.SendTrialExpiringNotification(company.ID, daysLeft)
			if err != nil {
				log.Printf("Failed to send expiring notification to company %s: %v", company.ID, err)
			}
		}
	}

	// Get companies with trials expiring in 7 days and send early warnings
	earlyWarningCompanies, err := adminService.GetTrialExpiringCompanies(7)
	if err != nil {
		log.Printf("Error getting early warning companies: %v", err)
	} else {
		log.Printf("Found %d companies with trials expiring in 7 days", len(earlyWarningCompanies))
		for _, company := range earlyWarningCompanies {
			// Calculate days left
			var daysLeft int
			if company.TrialEndsAt != nil {
				daysLeft = int(time.Until(*company.TrialEndsAt).Hours() / 24)
				// Only send if exactly 7 days (to avoid spamming)
				if daysLeft == 7 {
					err := notificationService.SendTrialExpiringNotification(company.ID, daysLeft)
					if err != nil {
						log.Printf("Failed to send early warning notification to company %s: %v", company.ID, err)
					}
				}
			}
		}
	}

	log.Println("Trial checker cron job completed successfully")
}
