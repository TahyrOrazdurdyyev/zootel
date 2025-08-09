package services

import (
	"database/sql"
)

type SMSService struct {
	db *sql.DB
}

func NewSMSService(db *sql.DB) *SMSService {
	return &SMSService{db: db}
}
