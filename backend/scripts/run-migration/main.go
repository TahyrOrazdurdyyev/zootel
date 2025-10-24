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
	migrationFile := "migrations/001_create_currencies_table.sql"
	content, err := ioutil.ReadFile(migrationFile)
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	// Execute migration
	_, err = db.Exec(string(content))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("✅ Currency table migration completed successfully")

	// Verify table was created
	var tableName string
	err = db.QueryRow("SELECT table_name FROM information_schema.tables WHERE table_name = 'currencies'").Scan(&tableName)
	if err != nil {
		log.Fatalf("Failed to verify table creation: %v", err)
	}

	fmt.Printf("✅ Table '%s' created successfully\n", tableName)

	// Insert initial currencies
	insertCurrencies(db)
}

func insertCurrencies(db *sql.DB) {
	currencies := []struct {
		code         string
		name         string
		symbol       string
		flagEmoji    string
		isActive     bool
		isBase       bool
		exchangeRate float64
	}{
		{"USD", "US Dollar", "$", "🇺🇸", true, true, 1.0},
		{"EUR", "Euro", "€", "🇪🇺", true, false, 0.85},
		{"GBP", "British Pound", "£", "🇬🇧", true, false, 0.73},
		{"JPY", "Japanese Yen", "¥", "🇯🇵", true, false, 110.0},
		{"CAD", "Canadian Dollar", "C$", "🇨🇦", true, false, 1.25},
		{"AUD", "Australian Dollar", "A$", "🇦🇺", true, false, 1.35},
		{"CHF", "Swiss Franc", "CHF", "🇨🇭", true, false, 0.92},
		{"CNY", "Chinese Yuan", "¥", "🇨🇳", true, false, 6.45},
		{"RUB", "Russian Ruble", "₽", "🇷🇺", true, false, 75.0},
		{"INR", "Indian Rupee", "₹", "🇮🇳", true, false, 74.0},
	}

	stmt, err := db.Prepare(`
		INSERT INTO currencies (code, name, symbol, flag_emoji, is_active, is_base, exchange_rate, last_updated, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
		ON CONFLICT (code) DO NOTHING
	`)
	if err != nil {
		log.Fatalf("Failed to prepare insert statement: %v", err)
	}
	defer stmt.Close()

	for _, currency := range currencies {
		_, err := stmt.Exec(currency.code, currency.name, currency.symbol, currency.flagEmoji, currency.isActive, currency.isBase, currency.exchangeRate)
		if err != nil {
			log.Printf("Warning: Failed to insert currency %s: %v", currency.code, err)
		} else {
			fmt.Printf("✅ Inserted currency: %s\n", currency.code)
		}
	}

	fmt.Println("✅ Initial currencies inserted successfully")
}
