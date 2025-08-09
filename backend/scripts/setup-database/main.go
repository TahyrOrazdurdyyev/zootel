package main

import (
	"bufio"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/database"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Migration struct {
	Number   int
	Filename string
	Content  string
}

func main() {
	fmt.Println("🐾 Zootel Database Setup Script")
	fmt.Println("==============================")

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Could not load .env file: %v", err)
	}

	// Get database connection info
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "zootel")
	dbSSLMode := getEnv("DB_SSL_MODE", "disable")

	// Check if we should create the database
	if len(os.Args) > 1 && os.Args[1] == "--create-db" {
		if err := createDatabase(dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode); err != nil {
			log.Fatalf("Failed to create database: %v", err)
		}
		fmt.Println("✅ Database created successfully!")
	}

	// Connect to database
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Printf("✅ Connected to database: %s\n", dbName)

	// Create migrations table if it doesn't exist
	if err := createMigrationsTable(db); err != nil {
		log.Fatalf("Failed to create migrations table: %v", err)
	}

	// Get command line arguments
	command := "migrate"
	if len(os.Args) > 1 && os.Args[1] != "--create-db" {
		command = os.Args[1]
	}

	switch command {
	case "migrate":
		if err := runMigrations(db); err != nil {
			log.Fatalf("Migration failed: %v", err)
		}
	case "rollback":
		if err := rollbackMigration(db); err != nil {
			log.Fatalf("Rollback failed: %v", err)
		}
	case "status":
		if err := showMigrationStatus(db); err != nil {
			log.Fatalf("Failed to show status: %v", err)
		}
	case "reset":
		if err := resetDatabase(db); err != nil {
			log.Fatalf("Reset failed: %v", err)
		}
	case "seed":
		if err := runSeedData(db); err != nil {
			log.Fatalf("Seeding failed: %v", err)
		}
	default:
		fmt.Printf("Usage: %s [migrate|rollback|status|reset|seed|--create-db]\n", os.Args[0])
		fmt.Println("\nCommands:")
		fmt.Println("  migrate     - Run pending migrations")
		fmt.Println("  rollback    - Rollback last migration")
		fmt.Println("  status      - Show migration status")
		fmt.Println("  reset       - Reset database (drop all tables)")
		fmt.Println("  seed        - Run seed data")
		fmt.Println("  --create-db - Create database if it doesn't exist")
		os.Exit(1)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func createDatabase(host, port, user, password, dbName, sslMode string) error {
	fmt.Printf("🔨 Creating database: %s\n", dbName)

	// Connect to postgres database to create the target database
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=%s",
		host, port, user, password, sslMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to postgres database: %v", err)
	}
	defer db.Close()

	// Check if database exists
	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = $1)", dbName).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check if database exists: %v", err)
	}

	if exists {
		fmt.Printf("ℹ️  Database %s already exists\n", dbName)
		return nil
	}

	// Create database
	_, err = db.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
	if err != nil {
		return fmt.Errorf("failed to create database: %v", err)
	}

	// Connect to the new database and create extensions
	newConnStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbName, sslMode)

	newDB, err := sql.Open("postgres", newConnStr)
	if err != nil {
		return fmt.Errorf("failed to connect to new database: %v", err)
	}
	defer newDB.Close()

	// Create required extensions
	extensions := []string{
		"CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"",
		"CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"",
	}

	for _, ext := range extensions {
		if _, err := newDB.Exec(ext); err != nil {
			log.Printf("Warning: Failed to create extension: %v", err)
		}
	}

	return nil
}

func createMigrationsTable(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		filename VARCHAR(255) NOT NULL,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		execution_time_ms INTEGER DEFAULT 0
	)`

	_, err := db.Exec(query)
	return err
}

func loadMigrations() ([]Migration, error) {
	migrationsDir := "migrations"

	// Check if migrations directory exists
	if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("migrations directory not found: %s", migrationsDir)
	}

	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read migrations directory: %v", err)
	}

	var migrations []Migration
	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		// Extract migration number from filename (e.g., 001_initial_schema.sql)
		parts := strings.Split(file.Name(), "_")
		if len(parts) < 2 {
			log.Printf("Warning: Invalid migration filename: %s", file.Name())
			continue
		}

		number, err := strconv.Atoi(parts[0])
		if err != nil {
			log.Printf("Warning: Invalid migration number in filename: %s", file.Name())
			continue
		}

		// Read file content
		content, err := ioutil.ReadFile(filepath.Join(migrationsDir, file.Name()))
		if err != nil {
			return nil, fmt.Errorf("failed to read migration file %s: %v", file.Name(), err)
		}

		migrations = append(migrations, Migration{
			Number:   number,
			Filename: file.Name(),
			Content:  string(content),
		})
	}

	// Sort migrations by number
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Number < migrations[j].Number
	})

	return migrations, nil
}

func getAppliedMigrations(db *sql.DB) (map[int]bool, error) {
	rows, err := db.Query("SELECT version FROM schema_migrations ORDER BY version")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[int]bool)
	for rows.Next() {
		var version int
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}

	return applied, nil
}

func runMigrations(db *sql.DB) error {
	fmt.Println("🚀 Running database migrations...")

	migrations, err := loadMigrations()
	if err != nil {
		return err
	}

	applied, err := getAppliedMigrations(db)
	if err != nil {
		return err
	}

	pendingCount := 0
	for _, migration := range migrations {
		if !applied[migration.Number] {
			pendingCount++
		}
	}

	if pendingCount == 0 {
		fmt.Println("✅ No pending migrations")
		return nil
	}

	fmt.Printf("📋 Found %d pending migrations\n", pendingCount)

	for _, migration := range migrations {
		if applied[migration.Number] {
			continue
		}

		fmt.Printf("⏳ Applying migration %03d: %s\n", migration.Number, migration.Filename)

		start := time.Now()

		// Begin transaction
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %v", err)
		}

		// Execute migration
		if _, err := tx.Exec(migration.Content); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %03d: %v", migration.Number, err)
		}

		// Record migration
		executionTime := int(time.Since(start).Milliseconds())
		_, err = tx.Exec("INSERT INTO schema_migrations (version, filename, execution_time_ms) VALUES ($1, $2, $3)",
			migration.Number, migration.Filename, executionTime)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration: %v", err)
		}

		// Commit transaction
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration: %v", err)
		}

		fmt.Printf("✅ Applied migration %03d in %dms\n", migration.Number, executionTime)
	}

	fmt.Println("🎉 All migrations completed successfully!")
	return nil
}

/*
Usage:
  cd backend/scripts/setup-database && go run . [command]

Commands:
  migrate     - Run pending migrations
  rollback    - Rollback last migration
  status      - Show migration status
  reset       - Reset database (drop all tables)
  seed        - Run seed data
  --create-db - Create database if it doesn't exist

Examples:
  cd backend/scripts/setup-database && go run . migrate
  cd backend/scripts/setup-database && go run . --create-db migrate
  cd backend/scripts/setup-database && go run . seed

Or build and run:
  cd backend/scripts/setup-database && go build . && ./setup-database migrate
*/

func rollbackMigration(db *sql.DB) error {
	fmt.Println("🔄 Rolling back last migration...")

	// Get the last applied migration
	var lastVersion int
	var lastFilename string
	err := db.QueryRow("SELECT version, filename FROM schema_migrations ORDER BY version DESC LIMIT 1").Scan(&lastVersion, &lastFilename)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("ℹ️  No migrations to rollback")
			return nil
		}
		return fmt.Errorf("failed to get last migration: %v", err)
	}

	// Confirm rollback
	fmt.Printf("⚠️  Are you sure you want to rollback migration %03d: %s? (y/N): ", lastVersion, lastFilename)
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	response := strings.ToLower(strings.TrimSpace(scanner.Text()))

	if response != "y" && response != "yes" {
		fmt.Println("❌ Rollback cancelled")
		return nil
	}

	// Look for rollback file
	rollbackFile := fmt.Sprintf("migrations/%03d_rollback_%s", lastVersion, strings.TrimPrefix(lastFilename, fmt.Sprintf("%03d_", lastVersion)))

	if _, err := os.Stat(rollbackFile); os.IsNotExist(err) {
		fmt.Printf("⚠️  No rollback file found: %s\n", rollbackFile)
		fmt.Println("❌ Manual rollback required")
		return nil
	}

	// Read and execute rollback
	content, err := ioutil.ReadFile(rollbackFile)
	if err != nil {
		return fmt.Errorf("failed to read rollback file: %v", err)
	}

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}

	// Execute rollback
	if _, err := tx.Exec(string(content)); err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to execute rollback: %v", err)
	}

	// Remove migration record
	if _, err := tx.Exec("DELETE FROM schema_migrations WHERE version = $1", lastVersion); err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to remove migration record: %v", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit rollback: %v", err)
	}

	fmt.Printf("✅ Rolled back migration %03d\n", lastVersion)
	return nil
}

func showMigrationStatus(db *sql.DB) error {
	fmt.Println("📊 Migration Status")
	fmt.Println("==================")

	migrations, err := loadMigrations()
	if err != nil {
		return err
	}

	applied, err := getAppliedMigrations(db)
	if err != nil {
		return err
	}

	for _, migration := range migrations {
		status := "❌ Pending"
		if applied[migration.Number] {
			status = "✅ Applied"
		}
		fmt.Printf("%s - %03d: %s\n", status, migration.Number, migration.Filename)
	}

	pendingCount := 0
	for _, migration := range migrations {
		if !applied[migration.Number] {
			pendingCount++
		}
	}

	fmt.Printf("\nSummary: %d total, %d applied, %d pending\n",
		len(migrations), len(applied), pendingCount)

	return nil
}

func resetDatabase(db *sql.DB) error {
	fmt.Println("⚠️  This will DELETE ALL DATA in the database!")
	fmt.Print("Are you sure you want to continue? (y/N): ")

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	response := strings.ToLower(strings.TrimSpace(scanner.Text()))

	if response != "y" && response != "yes" {
		fmt.Println("❌ Reset cancelled")
		return nil
	}

	fmt.Println("🗑️  Dropping all tables...")

	// Get all table names
	rows, err := db.Query(`
		SELECT tablename 
		FROM pg_tables 
		WHERE schemaname = 'public' 
		AND tablename != 'schema_migrations'
	`)
	if err != nil {
		return fmt.Errorf("failed to get table names: %v", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tablename string
		if err := rows.Scan(&tablename); err != nil {
			return err
		}
		tables = append(tables, tablename)
	}

	// Drop all tables
	for _, table := range tables {
		if _, err := db.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", table)); err != nil {
			log.Printf("Warning: Failed to drop table %s: %v", table, err)
		}
	}

	// Clear migration history
	if _, err := db.Exec("DELETE FROM schema_migrations"); err != nil {
		log.Printf("Warning: Failed to clear migration history: %v", err)
	}

	fmt.Println("✅ Database reset completed")
	return nil
}

func runSeedData(db *sql.DB) error {
	fmt.Println("🌱 Running database seed data...")

	// Use new seeding system
	seeder := database.NewSeedData(db)

	// Check if already seeded
	seeded, err := seeder.CheckIfSeeded()
	if err != nil {
		return fmt.Errorf("failed to check seed status: %v", err)
	}

	if seeded {
		fmt.Println("ℹ️  Database already contains seed data")

		fmt.Print("Do you want to run seeding anyway? (y/N): ")
		reader := bufio.NewReader(os.Stdin)
		response, _ := reader.ReadString('\n')
		response = strings.TrimSpace(strings.ToLower(response))

		if response != "y" && response != "yes" {
			fmt.Println("Seeding cancelled")
			return nil
		}
	}

	// Run comprehensive seeding
	if err := seeder.SeedAll(); err != nil {
		return fmt.Errorf("seeding failed: %v", err)
	}

	fmt.Println("✅ Database seeding completed successfully!")
	return nil
}
