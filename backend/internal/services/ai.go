package services

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
)

type AIService struct {
	db         *sql.DB
	openAIKey  string
	httpClient *http.Client
}

func NewAIService(db *sql.DB) *AIService {
	return &AIService{
		db:         db,
		openAIKey:  os.Getenv("OPENAI_API_KEY"),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

type AIAgent struct {
	Key                string  `json:"key"`
	Name               string  `json:"name"`
	Description        string  `json:"description"`
	SystemPrompt       string  `json:"system_prompt"`
	UserPromptTemplate string  `json:"user_prompt_template"`
	Model              string  `json:"model"`
	Temperature        float32 `json:"temperature"`
	MaxTokens          int     `json:"max_tokens"`
}

type AIRequest struct {
	AgentKey    string                 `json:"agent_key" binding:"required"`
	UserMessage string                 `json:"user_message" binding:"required"`
	Context     map[string]interface{} `json:"context"`
	CompanyID   string                 `json:"company_id"`
	UserID      string                 `json:"user_id"`
}

type AIResponse struct {
	AgentKey     string                 `json:"agent_key"`
	Response     string                 `json:"response"`
	Confidence   float32                `json:"confidence"`
	TokensUsed   int                    `json:"tokens_used"`
	ProcessingMs int64                  `json:"processing_ms"`
	Context      map[string]interface{} `json:"context"`
}

type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	Temperature float32         `json:"temperature"`
	MaxTokens   int             `json:"max_tokens"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// GetAvailableAgents returns all available AI agents
func (s *AIService) GetAvailableAgents() []AIAgent {
	return []AIAgent{
		{
			Key:         "booking_assistant",
			Name:        "Booking Assistant",
			Description: "Helps customers make bookings and check availability",
			SystemPrompt: `You are the Booking Assistant for a Pet Care company offering these services: {{service_categories}}. 
You have access to service catalog, employee schedules, and availability API. On booking request:
1. Identify service and time.
2. Check availability using the provided API.
3. If slot free, create booking and reply: "Your booking is confirmed for {date} at {time}."
4. If not available, propose alternative slots and await selection.
Always be friendly, professional, and helpful.`,
			UserPromptTemplate: `Customer request: "{{user_message}}"
Available services: {{service_categories}}
Current date: {{current_date}}`,
			Model:       "gpt-4",
			Temperature: 0.7,
			MaxTokens:   500,
		},
		{
			Key:         "customer_support",
			Name:        "Customer Support Agent",
			Description: "Provides general customer support and information",
			SystemPrompt: `You are the Customer Support Agent for a Pet Care company offering: {{service_categories}}. 
Use business hours, pricing, cancellation policy, and FAQ to answer questions concisely. 
Hand off booking changes to Booking Assistant. Be empathetic and solution-oriented.`,
			UserPromptTemplate: `Customer inquiry: "{{user_message}}"
Business hours: {{business_hours}}
Company info: {{company_info}}`,
			Model:       "gpt-4",
			Temperature: 0.8,
			MaxTokens:   400,
		},
		{
			Key:         "reminder_followup",
			Name:        "Reminder & Follow-Up Bot",
			Description: "Sends reminders and follow-up messages",
			SystemPrompt: `You are the Reminder & Follow-Up Bot. For each booking/order:
• 24h before: send friendly reminder
• After completion: send review request
Keep messages short, personalized, and actionable.`,
			UserPromptTemplate: `Task: {{task_type}}
Booking details: {{booking_info}}
Customer name: {{customer_name}}`,
			Model:       "gpt-3.5-turbo",
			Temperature: 0.6,
			MaxTokens:   200,
		},
		{
			Key:         "medical_vet_assistant",
			Name:        "Medical/Vet Assistant",
			Description: "Provides basic medical advice for pets",
			SystemPrompt: `You are the Medical/Vet Assistant for a veterinary clinic. Given pet symptoms, 
provide general wellness advice and suggest visit time. 
IMPORTANT: Always recommend consulting with a veterinarian for serious symptoms. 
Provide helpful but not diagnostic advice.`,
			UserPromptTemplate: `Pet symptoms described by owner: "{{user_message}}"
Pet details: {{pet_info}}
Emergency symptoms checklist: {{emergency_symptoms}}`,
			Model:       "gpt-4",
			Temperature: 0.3,
			MaxTokens:   600,
		},
		{
			Key:         "marketing_content",
			Name:        "Marketing Content Generator",
			Description: "Creates marketing campaigns and content",
			SystemPrompt: `You are the Marketing Content Generator. Given campaign topic and audience segment, 
generate email subject, body and CTA. Make content engaging, personalized, and action-oriented. 
Include pet care tips when relevant.`,
			UserPromptTemplate: `Campaign topic: "{{campaign_topic}}"
Target segment: "{{segment_description}}"
Company brand voice: {{brand_voice}}`,
			Model:       "gpt-4",
			Temperature: 0.9,
			MaxTokens:   800,
		},
		{
			Key:         "upsell_crosssell",
			Name:        "Upsell & Cross-sell Agent",
			Description: "Suggests complementary services and products",
			SystemPrompt: `You are the Upsell & Cross-sell Agent. Suggest complementary services/products 
based on order history with friendly copy and coupon codes. 
Focus on customer value and pet wellness, not just sales.`,
			UserPromptTemplate: `Customer order history: {{order_history}}
Current purchase: {{current_order}}
Available services: {{available_services}}`,
			Model:       "gpt-4",
			Temperature: 0.8,
			MaxTokens:   400,
		},
		{
			Key:         "feedback_sentiment",
			Name:        "Feedback & Sentiment Analyzer",
			Description: "Analyzes customer feedback and sentiment",
			SystemPrompt: `You are the Feedback & Sentiment Analyzer. Summarize reviews for given date range:
percent positive vs negative, top praises, top complaints. 
Provide actionable insights for business improvement.`,
			UserPromptTemplate: `Reviews to analyze: {{review_list}}
Date range: {{date_range}}
Previous period comparison: {{previous_data}}`,
			Model:       "gpt-4",
			Temperature: 0.2,
			MaxTokens:   600,
		},
		{
			Key:         "analytics_narrator",
			Name:        "Analytics Narrator",
			Description: "Provides insights from analytics data",
			SystemPrompt: `You are the Analytics Narrator. Given metrics data, summarize trends in 
3–4 sentences and highlight key insights. Focus on actionable business intelligence 
and growth opportunities.`,
			UserPromptTemplate: `Analytics query: "{{user_message}}"
Metrics data: {{metrics_data}}
Previous period: {{comparison_data}}`,
			Model:       "gpt-4",
			Temperature: 0.4,
			MaxTokens:   300,
		},
	}
}

// ProcessAIRequest processes an AI request and returns response
func (s *AIService) ProcessAIRequest(req *AIRequest) (*AIResponse, error) {
	startTime := time.Now()

	// Get agent configuration
	agent := s.getAgentByKey(req.AgentKey)
	if agent == nil {
		return nil, fmt.Errorf("agent not found: %s", req.AgentKey)
	}

	// Check if company has access to this agent
	hasAccess, err := s.checkAgentAccess(req.CompanyID, req.AgentKey)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, fmt.Errorf("company does not have access to agent: %s", req.AgentKey)
	}

	// Prepare context variables
	context := s.prepareContext(req)

	// Generate system prompt with context
	systemPrompt := s.interpolatePrompt(agent.SystemPrompt, context)
	userPrompt := s.interpolatePrompt(agent.UserPromptTemplate, context)

	// Call OpenAI API
	openAIResp, err := s.callOpenAI(agent, systemPrompt, userPrompt)
	if err != nil {
		return nil, err
	}

	// Log AI usage
	err = s.logAIUsage(req.CompanyID, req.UserID, req.AgentKey, openAIResp.Usage.TotalTokens)
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to log AI usage: %v\n", err)
	}

	response := &AIResponse{
		AgentKey:     req.AgentKey,
		Response:     openAIResp.Choices[0].Message.Content,
		Confidence:   0.85, // Could be calculated based on response quality
		TokensUsed:   openAIResp.Usage.TotalTokens,
		ProcessingMs: time.Since(startTime).Milliseconds(),
		Context:      req.Context,
	}

	return response, nil
}

// GetCompanyAIAgents returns available AI agents for a company
func (s *AIService) GetCompanyAIAgents(companyID string) ([]AIAgent, error) {
	// Get company's plan and manual settings
	var planIncludedAgents, manualEnabledAgents []string
	var hasManualAI bool

	err := s.db.QueryRow(`
		SELECT 
			COALESCE(p.included_ai_agents, '{}'),
			c.manual_enabled_ai_agents
		FROM companies c
		LEFT JOIN plans p ON c.plan_id = p.id
		WHERE c.id = $1
	`, companyID).Scan(&planIncludedAgents, &hasManualAI)

	if err != nil {
		return nil, err
	}

	// If manual AI is enabled, return all agents
	if hasManualAI {
		return s.GetAvailableAgents(), nil
	}

	// Return only plan-included agents
	allAgents := s.GetAvailableAgents()
	var availableAgents []AIAgent

	for _, agent := range allAgents {
		for _, includedAgent := range planIncludedAgents {
			if agent.Key == includedAgent {
				availableAgents = append(availableAgents, agent)
				break
			}
		}
	}

	return availableAgents, nil
}

// GetAIUsageStats returns AI usage statistics
func (s *AIService) GetAIUsageStats(companyID string, days int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := `
		SELECT 
			agent_key,
			COUNT(*) as request_count,
			SUM(tokens_used) as total_tokens,
			AVG(tokens_used) as avg_tokens_per_request
		FROM ai_usage_log 
		WHERE company_id = $1 
			AND created_at >= NOW() - INTERVAL '%d days'
		GROUP BY agent_key
		ORDER BY request_count DESC
	`

	rows, err := s.db.Query(fmt.Sprintf(query, days), companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var agentStats []map[string]interface{}
	var totalRequests, totalTokens int

	for rows.Next() {
		var agentKey string
		var requestCount, agentTotalTokens, avgTokens int

		err := rows.Scan(&agentKey, &requestCount, &agentTotalTokens, &avgTokens)
		if err != nil {
			return nil, err
		}

		agentStats = append(agentStats, map[string]interface{}{
			"agent_key":     agentKey,
			"request_count": requestCount,
			"total_tokens":  agentTotalTokens,
			"avg_tokens":    avgTokens,
		})

		totalRequests += requestCount
		totalTokens += agentTotalTokens
	}

	stats["agent_stats"] = agentStats
	stats["total_requests"] = totalRequests
	stats["total_tokens"] = totalTokens
	stats["period_days"] = days

	if totalRequests > 0 {
		stats["avg_tokens_per_request"] = totalTokens / totalRequests
	}

	return stats, nil
}

// Helper methods

func (s *AIService) getAgentByKey(key string) *AIAgent {
	agents := s.GetAvailableAgents()
	for _, agent := range agents {
		if agent.Key == key {
			return &agent
		}
	}
	return nil
}

func (s *AIService) checkAgentAccess(companyID, agentKey string) (bool, error) {
	var planIncludedAgents []string
	var hasManualAI bool

	err := s.db.QueryRow(`
		SELECT 
			COALESCE(p.included_ai_agents, '{}'),
			c.manual_enabled_ai_agents
		FROM companies c
		LEFT JOIN plans p ON c.plan_id = p.id
		WHERE c.id = $1
	`, companyID).Scan(&planIncludedAgents, &hasManualAI)

	if err != nil {
		return false, err
	}

	// If manual AI is enabled, allow all agents
	if hasManualAI {
		return true, nil
	}

	// Check if agent is included in plan
	for _, includedAgent := range planIncludedAgents {
		if includedAgent == agentKey {
			return true, nil
		}
	}

	return false, nil
}

func (s *AIService) prepareContext(req *AIRequest) map[string]interface{} {
	context := make(map[string]interface{})

	// Copy provided context
	for k, v := range req.Context {
		context[k] = v
	}

	// Add standard context variables
	context["user_message"] = req.UserMessage
	context["current_date"] = time.Now().Format("2006-01-02")
	context["current_time"] = time.Now().Format("15:04")

	// Get company-specific context
	if req.CompanyID != "" {
		companyContext := s.getCompanyContext(req.CompanyID)
		for k, v := range companyContext {
			context[k] = v
		}
	}

	return context
}

func (s *AIService) getCompanyContext(companyID string) map[string]interface{} {
	context := make(map[string]interface{})

	// Get company details
	var name, description, businessHours string
	var serviceCategories []string

	err := s.db.QueryRow(`
		SELECT name, description, business_hours
		FROM companies WHERE id = $1
	`, companyID).Scan(&name, &description, &businessHours)

	if err == nil {
		context["company_name"] = name
		context["company_info"] = description
		context["business_hours"] = businessHours
	}

	// Get service categories
	rows, err := s.db.Query(`
		SELECT DISTINCT sc.name 
		FROM service_categories sc
		JOIN services s ON s.category_id = sc.id
		WHERE s.company_id = $1 AND s.is_active = true
	`, companyID)

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var categoryName string
			if rows.Scan(&categoryName) == nil {
				serviceCategories = append(serviceCategories, categoryName)
			}
		}
		context["service_categories"] = strings.Join(serviceCategories, ", ")
	}

	return context
}

func (s *AIService) interpolatePrompt(template string, context map[string]interface{}) string {
	result := template

	for key, value := range context {
		placeholder := fmt.Sprintf("{{%s}}", key)
		replacement := fmt.Sprintf("%v", value)
		result = strings.ReplaceAll(result, placeholder, replacement)
	}

	return result
}

func (s *AIService) callOpenAI(agent *AIAgent, systemPrompt, userPrompt string) (*OpenAIResponse, error) {
	if s.openAIKey == "" {
		return nil, fmt.Errorf("OpenAI API key not configured")
	}

	request := OpenAIRequest{
		Model:       agent.Model,
		Temperature: agent.Temperature,
		MaxTokens:   agent.MaxTokens,
		Messages: []OpenAIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.openAIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error: %s", string(body))
	}

	var openAIResp OpenAIResponse
	err = json.NewDecoder(resp.Body).Decode(&openAIResp)
	if err != nil {
		return nil, err
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	return &openAIResp, nil
}

func (s *AIService) logAIUsage(companyID, userID, agentKey string, tokensUsed int) error {
	_, err := s.db.Exec(`
		INSERT INTO ai_usage_log (id, company_id, user_id, agent_key, tokens_used, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, uuid.New().String(), companyID, userID, agentKey, tokensUsed, time.Now())

	return err
}
