package services

import (
	"database/sql"
)

type WebhookService struct {
	db *sql.DB
}

func NewWebhookService(db *sql.DB) *WebhookService {
	return &WebhookService{db: db}
}
