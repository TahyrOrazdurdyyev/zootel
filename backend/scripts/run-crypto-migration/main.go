package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	// Get database connection string from environment
	dbConnection := os.Getenv("DB_CONNECTION")
	if dbConnection == "" {
		dbConnection = "postgres://postgres:postgres@localhost:5432/zootel_dev?sslmode=disable"
	}

	// Connect to database
	db, err := sql.Open("postgres", dbConnection)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Println("✅ Connected to database successfully")

	// Read and execute migration file
	migrationFile := "migrations/035_crypto_payments.sql"
	content, err := ioutil.ReadFile(migrationFile)
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	// Execute migration
	_, err = db.Exec(string(content))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("✅ Crypto payments migration completed successfully")

	// Verify tables were created
	var tableCount int
	err = db.QueryRow("SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('crypto_currencies', 'crypto_networks', 'crypto_payments')").Scan(&tableCount)
	if err != nil {
		log.Fatalf("Failed to verify table creation: %v", err)
	}

	fmt.Printf("✅ Created %d crypto payment tables\n", tableCount)

	// Check crypto currencies count
	var currencyCount int
	err = db.QueryRow("SELECT COUNT(*) FROM crypto_currencies").Scan(&currencyCount)
	if err != nil {
		log.Fatalf("Failed to check crypto currencies: %v", err)
	}

	fmt.Printf("✅ Inserted %d crypto currencies\n", currencyCount)

	// Check crypto networks count
	var networkCount int
	err = db.QueryRow("SELECT COUNT(*) FROM crypto_networks").Scan(&networkCount)
	if err != nil {
		log.Fatalf("Failed to check crypto networks: %v", err)
	}

	fmt.Printf("✅ Inserted %d crypto networks\n", networkCount)
}
