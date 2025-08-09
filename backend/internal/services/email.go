package services

import (
	"database/sql"
	"log"
)

type EmailService struct {
	db *sql.DB
}

func NewEmailService(db *sql.DB) *EmailService {
	return &EmailService{db: db}
}

// SendNotificationEmail sends a notification email
func (s *EmailService) SendNotificationEmail(email, subject, message string, data map[string]interface{}) error {
	// TODO: Implement actual email sending (SMTP, SendGrid, etc.)
	// For now, just log the email
	log.Printf("EMAIL: To: %s, Subject: %s, Message: %s", email, subject, message)
	return nil
}

// SendEmail sends a general email
func (s *EmailService) SendEmail(to, subject, body string) error {
	// TODO: Implement actual email sending
	log.Printf("EMAIL: To: %s, Subject: %s, Body: %s", to, subject, body)
	return nil
}
