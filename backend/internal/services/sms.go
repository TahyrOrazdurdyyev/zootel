package services

import (
	"database/sql"
	"log"
)

type SMSService struct {
	db *sql.DB
}

func NewSMSService(db *sql.DB) *SMSService {
	return &SMSService{db: db}
}

// SendSMS sends an SMS message
func (s *SMSService) SendSMS(phone, message string) error {
	// TODO: Implement actual SMS sending (Twilio, AWS SNS, etc.)
	// For now, just log the SMS
	log.Printf("SMS: To: %s, Message: %s", phone, message)
	return nil
}

// SendBulkSMS sends SMS to multiple recipients
func (s *SMSService) SendBulkSMS(phones []string, message string) error {
	for _, phone := range phones {
		err := s.SendSMS(phone, message)
		if err != nil {
			log.Printf("Failed to send SMS to %s: %v", phone, err)
		}
	}
	return nil
}
