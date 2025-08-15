package services

import (
	"database/sql"
	"fmt"
	"regexp"
	"strings"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
	"github.com/google/uuid"
)

type PromptService struct {
	db *sql.DB
}

func NewPromptService(db *sql.DB) *PromptService {
	return &PromptService{db: db}
}

// GetPrompt returns a prompt considering the hierarchy (company -> global -> hardcoded)
func (s *PromptService) GetPrompt(companyID, agentKey, promptType string) (*models.PromptResponse, error) {
	var prompt models.PromptResponse
	var source string

	// First, look for custom company prompt
	companyPrompt, err := s.getCompanyPrompt(companyID, agentKey, promptType)
	if err == nil && companyPrompt != nil {
		prompt = models.PromptResponse{
			AIPrompt: models.AIPrompt{
				ID:         companyPrompt.ID,
				AgentKey:   companyPrompt.AgentKey,
				PromptType: companyPrompt.PromptType,
				Content:    companyPrompt.Content,
				IsActive:   companyPrompt.IsActive,
				CreatedAt:  companyPrompt.CreatedAt,
				UpdatedAt:  companyPrompt.UpdatedAt,
			},
			Source:  "company",
			CanEdit: true,
		}
		source = "company"
	} else {
		// Look for global prompt
		globalPrompt, err := s.getGlobalPrompt(agentKey, promptType)
		if err == nil && globalPrompt != nil {
			prompt = models.PromptResponse{
				AIPrompt: *globalPrompt,
				Source:   "global",
				CanEdit:  false,
			}
			source = "global"
		} else {
			// Fallback to hardcoded prompt
			hardcodedContent := s.getHardcodedPrompt(agentKey, promptType)
			if hardcodedContent != "" {
				prompt = models.PromptResponse{
					AIPrompt: models.AIPrompt{
						ID:         "",
						AgentKey:   agentKey,
						PromptType: promptType,
						Content:    hardcodedContent,
						IsActive:   true,
					},
					Source:  "hardcoded",
					CanEdit: false,
				}
				source = "hardcoded"
			} else {
				return nil, fmt.Errorf("prompt not found for agent %s, type %s", agentKey, promptType)
			}
		}
	}

	// Extract variables from the prompt
	prompt.Variables = s.extractVariables(prompt.Content)

	// Log usage
	s.logPromptUsage(companyID, agentKey, promptType, source)

	return &prompt, nil
}

// GetGlobalPrompts returns all global prompts for admin
func (s *PromptService) GetGlobalPrompts() ([]models.AIPrompt, error) {
	query := `
		SELECT id, agent_key, prompt_type, content, version, is_active, 
		       created_by, created_at, updated_at
		FROM ai_prompts 
		WHERE is_active = true
		ORDER BY agent_key, prompt_type
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query global prompts: %w", err)
	}
	defer rows.Close()

	var prompts []models.AIPrompt
	for rows.Next() {
		var prompt models.AIPrompt
		err := rows.Scan(
			&prompt.ID, &prompt.AgentKey, &prompt.PromptType, &prompt.Content,
			&prompt.Version, &prompt.IsActive, &prompt.CreatedBy,
			&prompt.CreatedAt, &prompt.UpdatedAt,
		)
		if err != nil {
			continue
		}
		prompts = append(prompts, prompt)
	}

	return prompts, nil
}

// GetCompanyPrompts returns custom company prompts
func (s *PromptService) GetCompanyPrompts(companyID string) ([]models.CompanyAIPrompt, error) {
	query := `
		SELECT id, company_id, agent_key, prompt_type, content, is_active,
		       created_by, created_at, updated_at
		FROM company_ai_prompts 
		WHERE company_id = $1 AND is_active = true
		ORDER BY agent_key, prompt_type
	`

	rows, err := s.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query company prompts: %w", err)
	}
	defer rows.Close()

	var prompts []models.CompanyAIPrompt
	for rows.Next() {
		var prompt models.CompanyAIPrompt
		err := rows.Scan(
			&prompt.ID, &prompt.CompanyID, &prompt.AgentKey, &prompt.PromptType,
			&prompt.Content, &prompt.IsActive, &prompt.CreatedBy,
			&prompt.CreatedAt, &prompt.UpdatedAt,
		)
		if err != nil {
			continue
		}
		prompts = append(prompts, prompt)
	}

	return prompts, nil
}

// CreateGlobalPrompt creates a new global prompt
func (s *PromptService) CreateGlobalPrompt(req *models.PromptRequest, adminID string) error {
	// Deactivate the previous version
	s.deactivateGlobalPrompt(req.AgentKey, req.PromptType)

	// Get the next version number
	version := s.getNextVersion(req.AgentKey, req.PromptType)

	query := `
		INSERT INTO ai_prompts (id, agent_key, prompt_type, content, version, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := s.db.Exec(query,
		uuid.New().String(),
		req.AgentKey,
		req.PromptType,
		req.Content,
		version,
		adminID,
	)

	if err != nil {
		return fmt.Errorf("failed to create global prompt: %w", err)
	}

	return nil
}

// UpdateGlobalPrompt updates the global prompt
func (s *PromptService) UpdateGlobalPrompt(promptID string, req *models.PromptRequest, adminID string) error {
	query := `
		UPDATE ai_prompts 
		SET content = $1, updated_at = NOW(), version = version + 1
		WHERE id = $2
	`

	result, err := s.db.Exec(query, req.Content, promptID)
	if err != nil {
		return fmt.Errorf("failed to update global prompt: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("prompt not found")
	}

	return nil
}

// CreateCompanyPrompt creates a custom prompt for the company
func (s *PromptService) CreateCompanyPrompt(companyID string, req *models.PromptRequest, userID string) error {
	// Check that such a prompt doesn't exist yet
	existing, _ := s.getCompanyPrompt(companyID, req.AgentKey, req.PromptType)
	if existing != nil {
		return s.UpdateCompanyPrompt(companyID, req.AgentKey, req.PromptType, req, userID)
	}

	query := `
		INSERT INTO company_ai_prompts (id, company_id, agent_key, prompt_type, content, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := s.db.Exec(query,
		uuid.New().String(),
		companyID,
		req.AgentKey,
		req.PromptType,
		req.Content,
		userID,
	)

	if err != nil {
		return fmt.Errorf("failed to create company prompt: %w", err)
	}

	return nil
}

// UpdateCompanyPrompt updates the company's custom prompt
func (s *PromptService) UpdateCompanyPrompt(companyID, agentKey, promptType string, req *models.PromptRequest, userID string) error {
	query := `
		UPDATE company_ai_prompts 
		SET content = $1, updated_at = NOW()
		WHERE company_id = $2 AND agent_key = $3 AND prompt_type = $4
	`

	result, err := s.db.Exec(query, req.Content, companyID, agentKey, promptType)
	if err != nil {
		return fmt.Errorf("failed to update company prompt: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("company prompt not found")
	}

	return nil
}

// DeleteCompanyPrompt deletes the company's custom prompt (fallback to global)
func (s *PromptService) DeleteCompanyPrompt(companyID, agentKey, promptType string) error {
	query := `
		UPDATE company_ai_prompts 
		SET is_active = false, updated_at = NOW()
		WHERE company_id = $1 AND agent_key = $2 AND prompt_type = $3
	`

	_, err := s.db.Exec(query, companyID, agentKey, promptType)
	if err != nil {
		return fmt.Errorf("failed to delete company prompt: %w", err)
	}

	return nil
}

// GetAgentPromptsInfo returns complete information about the agent and its prompts
func (s *PromptService) GetAgentPromptsInfo(companyID, agentKey string) (*models.AgentPromptsInfo, error) {
	// Get agent information from hardcoded data
	agentInfo := s.getAgentInfo(agentKey)
	if agentInfo == nil {
		return nil, fmt.Errorf("agent not found: %s", agentKey)
	}

	// Get system prompt
	systemPrompt, err := s.GetPrompt(companyID, agentKey, "system")
	if err != nil {
		return nil, fmt.Errorf("failed to get system prompt: %w", err)
	}

	// Get user prompt
	userPrompt, err := s.GetPrompt(companyID, agentKey, "user")
	if err != nil {
		return nil, fmt.Errorf("failed to get user prompt: %w", err)
	}

	// Check if there are custom prompts
	hasCustom := systemPrompt.Source == "company" || userPrompt.Source == "company"

	return &models.AgentPromptsInfo{
		AgentKey:         agentKey,
		AgentName:        agentInfo.Name,
		AgentDescription: agentInfo.Description,
		SystemPrompt:     *systemPrompt,
		UserPrompt:       *userPrompt,
		HasCustomPrompts: hasCustom,
	}, nil
}

// Private helper methods

func (s *PromptService) getCompanyPrompt(companyID, agentKey, promptType string) (*models.CompanyAIPrompt, error) {
	query := `
		SELECT id, company_id, agent_key, prompt_type, content, is_active,
		       created_by, created_at, updated_at
		FROM company_ai_prompts 
		WHERE company_id = $1 AND agent_key = $2 AND prompt_type = $3 AND is_active = true
	`

	var prompt models.CompanyAIPrompt
	err := s.db.QueryRow(query, companyID, agentKey, promptType).Scan(
		&prompt.ID, &prompt.CompanyID, &prompt.AgentKey, &prompt.PromptType,
		&prompt.Content, &prompt.IsActive, &prompt.CreatedBy,
		&prompt.CreatedAt, &prompt.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &prompt, nil
}

func (s *PromptService) getGlobalPrompt(agentKey, promptType string) (*models.AIPrompt, error) {
	query := `
		SELECT id, agent_key, prompt_type, content, version, is_active,
		       created_by, created_at, updated_at
		FROM ai_prompts 
		WHERE agent_key = $1 AND prompt_type = $2 AND is_active = true
		ORDER BY version DESC LIMIT 1
	`

	var prompt models.AIPrompt
	err := s.db.QueryRow(query, agentKey, promptType).Scan(
		&prompt.ID, &prompt.AgentKey, &prompt.PromptType, &prompt.Content,
		&prompt.Version, &prompt.IsActive, &prompt.CreatedBy,
		&prompt.CreatedAt, &prompt.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &prompt, nil
}

func (s *PromptService) getHardcodedPrompt(agentKey, promptType string) string {
	// Here you can get hardcoded prompts from AIService
	// For simplicity, return empty string, but in reality you need to
	// integrate with existing prompts from ai.go
	return ""
}

func (s *PromptService) extractVariables(content string) []string {
	re := regexp.MustCompile(`\{\{([^}]+)\}\}`)
	matches := re.FindAllStringSubmatch(content, -1)

	var variables []string
	seen := make(map[string]bool)

	for _, match := range matches {
		if len(match) > 1 {
			variable := strings.TrimSpace(match[1])
			if !seen[variable] {
				variables = append(variables, variable)
				seen[variable] = true
			}
		}
	}

	return variables
}

func (s *PromptService) logPromptUsage(companyID, agentKey, promptType, source string) {
	query := `
		INSERT INTO ai_prompt_usage_log (id, company_id, agent_key, prompt_type, prompt_source)
		VALUES ($1, $2, $3, $4, $5)
	`

	var companyIDPtr *string
	if companyID != "" {
		companyIDPtr = &companyID
	}

	s.db.Exec(query,
		uuid.New().String(),
		companyIDPtr,
		agentKey,
		promptType,
		source,
	)
}

func (s *PromptService) deactivateGlobalPrompt(agentKey, promptType string) {
	query := `UPDATE ai_prompts SET is_active = false WHERE agent_key = $1 AND prompt_type = $2`
	s.db.Exec(query, agentKey, promptType)
}

func (s *PromptService) getNextVersion(agentKey, promptType string) int {
	query := `SELECT COALESCE(MAX(version), 0) + 1 FROM ai_prompts WHERE agent_key = $1 AND prompt_type = $2`

	var version int
	err := s.db.QueryRow(query, agentKey, promptType).Scan(&version)
	if err != nil {
		return 1
	}

	return version
}

func (s *PromptService) getAgentInfo(agentKey string) *struct {
	Name        string
	Description string
} {
	// Mapping hardcoded agent info
	agents := map[string]struct {
		Name        string
		Description string
	}{
		"booking_assistant": {
			Name:        "Booking Assistant",
			Description: "Manages appointment bookings and scheduling",
		},
		"customer_support": {
			Name:        "Customer Support Agent",
			Description: "Provides general customer support and information",
		},
		"medical_vet_assistant": {
			Name:        "Medical Veterinary Assistant",
			Description: "Provides veterinary medical assistance and guidance",
		},
		"analytics_narrator": {
			Name:        "Analytics Narrator",
			Description: "Provides insights from analytics data",
		},
	}

	if info, exists := agents[agentKey]; exists {
		return &info
	}
	return nil
}
