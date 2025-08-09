package main

import (
	"context"
	"fmt"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

const (
	defaultEmail    = "tahyr.orazdurdyyev@zootel.shop"
	defaultPassword = "ChangeMe123"
)

func main() {
	// Load Firebase configuration
	serviceAccountKeyPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if serviceAccountKeyPath == "" {
		serviceAccountKeyPath = "../../config/serviceAccountKey.json"
	}

	ctx := context.Background()

	// Initialize Firebase app
	opt := option.WithCredentialsFile(serviceAccountKeyPath)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase app: %v", err)
	}

	// Get Auth client
	client, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Failed to get Auth client: %v", err)
	}

	// Get email and password from command line args or use defaults
	email := defaultEmail
	password := defaultPassword

	if len(os.Args) > 1 {
		email = os.Args[1]
	}
	if len(os.Args) > 2 {
		password = os.Args[2]
	}

	fmt.Printf("Creating SuperAdmin user with email: %s\n", email)

	// Try to get existing user first
	user, err := client.GetUserByEmail(ctx, email)
	if err != nil {
		// User doesn't exist, create new one
		fmt.Println("User doesn't exist, creating new user...")

		params := (&auth.UserToCreate{}).
			Email(email).
			EmailVerified(true).
			Password(password).
			DisplayName("Super Admin").
			Disabled(false)

		user, err = client.CreateUser(ctx, params)
		if err != nil {
			log.Fatalf("Failed to create user: %v", err)
		}
		fmt.Printf("Successfully created user: %s\n", user.UID)
	} else {
		fmt.Printf("User already exists with UID: %s\n", user.UID)

		// Update password if provided
		if len(os.Args) > 2 {
			params := (&auth.UserToUpdate{}).Password(password)
			_, err = client.UpdateUser(ctx, user.UID, params)
			if err != nil {
				log.Fatalf("Failed to update user password: %v", err)
			}
			fmt.Println("Password updated successfully")
		}
	}

	// Set custom claims for SuperAdmin role
	customClaims := map[string]interface{}{
		"role": "super_admin",
		"permissions": []string{
			"manage_plans",
			"manage_payment_settings",
			"manage_service_categories",
			"manage_pet_types_breeds",
			"manage_companies",
			"manage_demo_companies",
			"manage_employees",
			"view_global_analytics",
			"manage_coupons",
			"manage_flash_sales",
		},
	}

	err = client.SetCustomUserClaims(ctx, user.UID, customClaims)
	if err != nil {
		log.Fatalf("Failed to set custom claims: %v", err)
	}

	fmt.Println("✅ SuperAdmin user created/updated successfully!")
	fmt.Printf("Email: %s\n", email)
	fmt.Printf("UID: %s\n", user.UID)
	fmt.Printf("Role: super_admin\n")
	fmt.Println("\n📧 You can now login to the admin panel with these credentials.")
	fmt.Println("🔒 Make sure to change the password after first login for security.")
}

/*
Usage:
  cd backend/scripts/createSuperAdmin && go run .
  cd backend/scripts/createSuperAdmin && go run . custom@email.com
  cd backend/scripts/createSuperAdmin && go run . custom@email.com customPassword123

Or build and run:
  cd backend/scripts/createSuperAdmin && go build . && ./createSuperAdmin

Prerequisites:
1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
   OR place serviceAccountKey.json in ./config/ directory
2. Ensure Firebase project is properly configured
3. Run from the backend/scripts/createSuperAdmin directory
*/
