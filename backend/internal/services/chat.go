package services

import "database/sql"

type ChatService struct {
	db *sql.DB
}

func NewChatService(db *sql.DB) *ChatService {
	return &ChatService{db: db}
}
