package services

import "database/sql"

type CompanyService struct {
	db *sql.DB
}

func NewCompanyService(db *sql.DB) *CompanyService {
	return &CompanyService{db: db}
}
