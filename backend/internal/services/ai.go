package services

import "database/sql"

type AIService struct {
	db *sql.DB
}

func NewAIService(db *sql.DB) *AIService {
	return &AIService{db: db}
}
