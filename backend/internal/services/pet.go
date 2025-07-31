package services

import "database/sql"

type PetService struct {
	db *sql.DB
}

func NewPetService(db *sql.DB) *PetService {
	return &PetService{db: db}
}
