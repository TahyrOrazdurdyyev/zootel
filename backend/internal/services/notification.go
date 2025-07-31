package services

import "database/sql"

type NotificationService struct {
	db *sql.DB
}

func NewNotificationService(db *sql.DB) *NotificationService {
	return &NotificationService{db: db}
}

func (s *NotificationService) StartNotificationCron() {
	// TODO: Implement notification cron job
}
