package auth

import (
	"context"
	"encoding/json"
	"fmt"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

// FirebaseAuth wraps Firebase authentication
type FirebaseAuth struct {
	client *auth.Client
}

// NewFirebaseAuth creates a new Firebase auth instance
func NewFirebaseAuth(credentialsJSON string, projectID string) (*FirebaseAuth, error) {
	ctx := context.Background()

	// Parse credentials
	var creds map[string]interface{}
	if err := json.Unmarshal([]byte(credentialsJSON), &creds); err != nil {
		return nil, fmt.Errorf("failed to parse Firebase credentials: %v", err)
	}

	// Initialize Firebase app
	conf := &firebase.Config{ProjectID: projectID}
	opt := option.WithCredentialsJSON([]byte(credentialsJSON))

	app, err := firebase.NewApp(ctx, conf, opt)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Firebase app: %v", err)
	}

	// Get Auth client
	client, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Firebase Auth client: %v", err)
	}

	return &FirebaseAuth{client: client}, nil
}

// VerifyIDToken verifies a Firebase ID token
func (f *FirebaseAuth) VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error) {
	token, err := f.client.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %v", err)
	}
	return token, nil
}

// GetUser gets user information by UID
func (f *FirebaseAuth) GetUser(ctx context.Context, uid string) (*auth.UserRecord, error) {
	user, err := f.client.GetUser(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %v", err)
	}
	return user, nil
}

// CreateUser creates a new user
func (f *FirebaseAuth) CreateUser(ctx context.Context, params *auth.UserToCreate) (*auth.UserRecord, error) {
	user, err := f.client.CreateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}
	return user, nil
}

// UpdateUser updates user information
func (f *FirebaseAuth) UpdateUser(ctx context.Context, uid string, params *auth.UserToUpdate) (*auth.UserRecord, error) {
	user, err := f.client.UpdateUser(ctx, uid, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %v", err)
	}
	return user, nil
}

// DeleteUser deletes a user
func (f *FirebaseAuth) DeleteUser(ctx context.Context, uid string) error {
	err := f.client.DeleteUser(ctx, uid)
	if err != nil {
		return fmt.Errorf("failed to delete user: %v", err)
	}
	return nil
}

// CreateCustomToken creates a custom token for a user
func (f *FirebaseAuth) CreateCustomToken(ctx context.Context, uid string, claims map[string]interface{}) (string, error) {
	token, err := f.client.CustomTokenWithClaims(ctx, uid, claims)
	if err != nil {
		return "", fmt.Errorf("failed to create custom token: %v", err)
	}
	return token, nil
}

// SetCustomUserClaims sets custom claims for a user
func (f *FirebaseAuth) SetCustomUserClaims(ctx context.Context, uid string, claims map[string]interface{}) error {
	err := f.client.SetCustomUserClaims(ctx, uid, claims)
	if err != nil {
		return fmt.Errorf("failed to set custom user claims: %v", err)
	}
	return nil
}

// RevokeRefreshTokens revokes all refresh tokens for a user
func (f *FirebaseAuth) RevokeRefreshTokens(ctx context.Context, uid string) error {
	err := f.client.RevokeRefreshTokens(ctx, uid)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh tokens: %v", err)
	}
	return nil
}

// ImportUsers imports multiple users
func (f *FirebaseAuth) ImportUsers(ctx context.Context, users []*auth.UserToImport, options *auth.UserImportOptions) (*auth.UserImportResult, error) {
	result, err := f.client.ImportUsers(ctx, users, options)
	if err != nil {
		return nil, fmt.Errorf("failed to import users: %v", err)
	}
	return result, nil
}

// ListUsers lists all users
func (f *FirebaseAuth) ListUsers(ctx context.Context, maxResults int, pageToken string) (*auth.ExportedUserRecord, error) {
	pager := auth.MaxResults(maxResults)
	if pageToken != "" {
		pager = auth.StartAfterToken(pageToken)
	}

	iter := f.client.Users(ctx, pager)
	user, err := iter.Next()
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %v", err)
	}
	return user, nil
}

// GenerateEmailVerificationLink generates email verification link
func (f *FirebaseAuth) GenerateEmailVerificationLink(ctx context.Context, email string) (string, error) {
	link, err := f.client.EmailVerificationLink(ctx, email)
	if err != nil {
		return "", fmt.Errorf("failed to generate email verification link: %v", err)
	}
	return link, nil
}

// GeneratePasswordResetLink generates password reset link
func (f *FirebaseAuth) GeneratePasswordResetLink(ctx context.Context, email string) (string, error) {
	link, err := f.client.PasswordResetLink(ctx, email)
	if err != nil {
		return "", fmt.Errorf("failed to generate password reset link: %v", err)
	}
	return link, nil
}
