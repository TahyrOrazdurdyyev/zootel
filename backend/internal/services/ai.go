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
	"github.com/lib/pq"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"
)

type AIService struct {
	db            *sql.DB
	openAIKey     string
	httpClient    *http.Client
	promptService *PromptService
}

func NewAIService(db *sql.DB, promptService *PromptService) *AIService {
	return &AIService{
		db:            db,
		openAIKey:     os.Getenv("OPENAI_API_KEY"),
		httpClient:    &http.Client{Timeout: 30 * time.Second},
		promptService: promptService,
	}
}

type AIAgent struct {
	Key                string            `json:"key"`
	Name               string            `json:"name"`
	Description        string            `json:"description"`
	SystemPrompt       string            `json:"system_prompt"`
	UserPromptTemplate string            `json:"user_prompt_template"`
	Model              string            `json:"model"`
	Temperature        float32           `json:"temperature"`
	MaxTokens          int               `json:"max_tokens"`
	CompanyTypes       []string          `json:"company_types"`       // Типы компаний, для которых подходит этот агент
	SpecializedPrompts map[string]string `json:"specialized_prompts"` // Специализированные промпты для разных типов компаний
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

// GetAvailableAgents returns all available AI agents with specialized prompts
func (s *AIService) GetAvailableAgents() []AIAgent {
	return []AIAgent{
		{
			Key:          "booking_assistant",
			Name:         "Booking Assistant",
			Description:  "Manages appointment bookings and scheduling",
			CompanyTypes: []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi"},
			SystemPrompt: `You are the Booking Assistant for {{company_name}}. You handle all booking requests with intelligent employee assignment.

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. When user requests booking, collect: service type, preferred date/time, pet details
2. Use automatic employee assignment - system will find best available staff
3. If no staff available at requested time, system provides 3 best alternatives
4. Present alternatives clearly and ask user to choose
5. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Booking confirmed: "✅ Booked [SERVICE] on [DATE] at [TIME]. Your appointment has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_TIME] unavailable. Available options: [LIST_ALTERNATIVES]"
- Always be friendly and offer to help find suitable times

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,
			UserPromptTemplate: `User request: "{{user_message}}"
Current context: {{booking_context}}
Available services: {{service_categories}}
Business hours: {{business_hours}}`,
			Model:       "gpt-4",
			Temperature: 0.7,
			MaxTokens:   500,
			SpecializedPrompts: map[string]string{
				"veterinary": `You are the Booking Assistant for {{company_name}} veterinary clinic. 

SPECIAL VETERINARY CONSIDERATIONS:
- Ask about pet symptoms and urgency for emergency cases
- Suggest appropriate appointment types (checkup, consultation, emergency)
- Remind about bringing medical records if available
- Mention pre-appointment fasting if needed for certain procedures
- Ask about pet's current medications and allergies

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. Assess urgency and suggest appropriate appointment type
2. Collect: service type, preferred date/time, pet details, symptoms
3. Use automatic employee assignment - system will find best available staff
4. If no staff available at requested time, system provides 3 best alternatives
5. Present alternatives clearly and ask user to choose
6. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Emergency: "🚨 Emergency appointment needed. We'll prioritize your case."
- Regular booking: "✅ Booked [SERVICE] on [DATE] at [TIME]. Your appointment has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_TIME] unavailable. Available options: [LIST_ALTERNATIVES]"

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,

				"grooming": `You are the Booking Assistant for {{company_name}} grooming salon.

SPECIAL GROOMING CONSIDERATIONS:
- Ask about pet's breed and coat type for appropriate service selection
- Inquire about specific grooming preferences (style, length, special requests)
- Suggest add-on services (nail trimming, teeth cleaning, flea treatment)
- Ask about pet's behavior during grooming (anxious, aggressive, calm)
- Recommend appropriate appointment duration based on service complexity

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. Assess grooming needs and suggest appropriate service level
2. Collect: service type, preferred date/time, pet details, grooming preferences
3. Use automatic employee assignment - system will find best available staff
4. If no staff available at requested time, system provides 3 best alternatives
5. Present alternatives clearly and ask user to choose
6. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Service confirmed: "✅ Booked [SERVICE] on [DATE] at [TIME]. Your grooming appointment has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_TIME] unavailable. Available options: [LIST_ALTERNATIVES]"

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,

				"boarding": `You are the Booking Assistant for {{company_name}} pet boarding facility.

SPECIAL BOARDING CONSIDERATIONS:
- Ask about pet's size, age, and special needs
- Inquire about drop-off and pick-up times
- Suggest appropriate accommodation type (standard, luxury, medical)
- Ask about pet's behavior with other animals
- Collect information about feeding schedule and medications
- Mention required vaccinations and health certificates

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. Assess boarding needs and suggest appropriate accommodation
2. Collect: service type, preferred dates, pet details, special requirements
3. Use automatic employee assignment - system will find best available staff
4. If no staff available at requested time, system provides 3 best alternatives
5. Present alternatives clearly and ask user to choose
6. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Boarding confirmed: "✅ Booked [SERVICE] from [START_DATE] to [END_DATE]. Your pet's stay has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_DATES] unavailable. Available options: [LIST_ALTERNATIVES]"

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,

				"training": `You are the Booking Assistant for {{company_name}} pet training facility.

SPECIAL TRAINING CONSIDERATIONS:
- Ask about pet's age, breed, and current behavior issues
- Inquire about training goals and previous training experience
- Suggest appropriate training program (basic obedience, behavior modification, advanced)
- Ask about pet's socialization level and reaction to other animals
- Recommend individual vs. group training based on needs
- Mention required equipment and preparation for sessions

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. Assess training needs and suggest appropriate program
2. Collect: service type, preferred date/time, pet details, training goals
3. Use automatic employee assignment - system will find best available staff
4. If no staff available at requested time, system provides 3 best alternatives
5. Present alternatives clearly and ask user to choose
6. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Training confirmed: "✅ Booked [SERVICE] on [DATE] at [TIME]. Your training session has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_TIME] unavailable. Available options: [LIST_ALTERNATIVES]"

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,

				"walking": `You are the Booking Assistant for {{company_name}} dog walking service.

SPECIAL WALKING CONSIDERATIONS:
- Ask about dog's size, energy level, and walking preferences
- Inquire about preferred walking duration and time of day
- Ask about dog's behavior with other dogs and people
- Suggest appropriate service type (individual walk, group walk, exercise session)
- Collect information about special needs or restrictions
- Mention required equipment (leash, harness, treats)

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. Assess walking needs and suggest appropriate service
2. Collect: service type, preferred date/time, pet details, walking preferences
3. Use automatic employee assignment - system will find best available staff
4. If no staff available at requested time, system provides 3 best alternatives
5. Present alternatives clearly and ask user to choose
6. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Walking confirmed: "✅ Booked [SERVICE] on [DATE] at [TIME]. Your dog walking appointment has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_TIME] unavailable. Available options: [LIST_ALTERNATIVES]"

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,

				"sitting": `You are the Booking Assistant for {{company_name}} pet sitting service.

SPECIAL SITTING CONSIDERATIONS:
- Ask about pet's care requirements and daily routine
- Inquire about feeding schedule, medications, and special needs
- Ask about pet's behavior when left alone
- Suggest appropriate service type (drop-in visits, overnight stays, extended care)
- Collect information about home access and security
- Mention required supplies and emergency contacts

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. Assess sitting needs and suggest appropriate service
2. Collect: service type, preferred dates, pet details, care requirements
3. Use automatic employee assignment - system will find best available staff
4. If no staff available at requested time, system provides 3 best alternatives
5. Present alternatives clearly and ask user to choose
6. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Sitting confirmed: "✅ Booked [SERVICE] from [START_DATE] to [END_DATE]. Your pet sitting has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_DATES] unavailable. Available options: [LIST_ALTERNATIVES]"

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,

				"pet_taxi": `You are the Booking Assistant for {{company_name}} pet transportation service.

SPECIAL TRANSPORTATION CONSIDERATIONS:
- Ask about pet's size and transportation needs
- Inquire about pickup and drop-off locations
- Ask about pet's behavior during travel
- Suggest appropriate service type (standard transport, medical transport, luxury transport)
- Collect information about special requirements (crate, medication, multiple pets)
- Mention required preparation and travel time estimates

Available services: {{service_categories}}
Business hours: {{business_hours}}

BOOKING PROCESS:
1. Assess transportation needs and suggest appropriate service
2. Collect: service type, preferred date/time, locations, pet details
3. Use automatic employee assignment - system will find best available staff
4. If no staff available at requested time, system provides 3 best alternatives
5. Present alternatives clearly and ask user to choose
6. Confirm final booking without revealing employee names

RESPONSE FORMAT:
- Transport confirmed: "✅ Booked [SERVICE] on [DATE] at [TIME]. Your pet transportation has been confirmed!"
- Alternatives needed: "❌ [REQUESTED_TIME] unavailable. Available options: [LIST_ALTERNATIVES]"

IMPORTANT: Never reveal employee names to clients. Only confirm the booking was successful!`,
			},
		},
		{
			Key:          "customer_support",
			Name:         "Customer Support Agent",
			Description:  "Provides general customer support and information",
			CompanyTypes: []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi", "retail"},
			SystemPrompt: `You are the Customer Support Agent for {{company_name}} offering: {{service_categories}}. 
Use business hours, pricing, cancellation policy, and FAQ to answer questions concisely. 
Hand off booking changes to Booking Assistant. Be empathetic and solution-oriented.`,
			UserPromptTemplate: `Customer inquiry: "{{user_message}}"
Business hours: {{business_hours}}
Company info: {{company_info}}`,
			Model:       "gpt-4",
			Temperature: 0.8,
			MaxTokens:   400,
			SpecializedPrompts: map[string]string{
				"veterinary": `You are the Customer Support Agent for {{company_name}} veterinary clinic.

SPECIAL VETERINARY SUPPORT:
- Provide general health information but always recommend vet consultation for specific issues
- Explain common procedures and what to expect
- Share wellness tips and preventive care advice
- Handle emergency inquiries and direct to appropriate resources
- Explain vaccination schedules and health protocols
- Provide information about prescription medications and refills

Available services: {{service_categories}}
Business hours: {{business_hours}}
Company info: {{company_info}}

IMPORTANT: Never provide specific medical diagnoses. Always recommend professional veterinary consultation.`,

				"grooming": `You are the Customer Support Agent for {{company_name}} grooming salon.

SPECIAL GROOMING SUPPORT:
- Explain grooming procedures and what to expect
- Provide coat care tips and maintenance advice
- Handle questions about grooming products and tools
- Explain different grooming styles and options
- Provide information about special treatments and add-ons
- Handle questions about pet behavior during grooming

Available services: {{service_categories}}
Business hours: {{business_hours}}
Company info: {{company_info}}`,

				"retail": `You are the Customer Support Agent for {{company_name}} pet retail store.

SPECIAL RETAIL SUPPORT:
- Provide product information and recommendations
- Handle questions about product availability and stock
- Explain product features, benefits, and usage
- Provide information about warranties and returns
- Handle questions about pet food and nutrition
- Explain product compatibility and sizing

Available services: {{service_categories}}
Business hours: {{business_hours}}
Company info: {{company_info}}`,
			},
		},
		{
			Key:          "reminder_followup",
			Name:         "Reminder & Follow-Up Bot",
			Description:  "Sends reminders and follow-up messages",
			CompanyTypes: []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi", "retail"},
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
			Key:          "medical_vet_assistant",
			Name:         "Medical/Vet Assistant",
			Description:  "Provides basic medical advice for pets",
			CompanyTypes: []string{"veterinary"},
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
			Key:          "marketing_content",
			Name:         "Marketing Content Generator",
			Description:  "Creates marketing campaigns and content",
			CompanyTypes: []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi", "retail"},
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
			Key:          "upsell_crosssell",
			Name:         "Upsell & Cross-sell Agent",
			Description:  "Suggests complementary services and products",
			CompanyTypes: []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi", "retail"},
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
			Key:          "feedback_sentiment",
			Name:         "Feedback & Sentiment Analyzer",
			Description:  "Analyzes customer feedback and sentiment",
			CompanyTypes: []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi", "retail"},
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
			Key:          "analytics_narrator",
			Name:         "Analytics Narrator",
			Description:  "Provides insights from analytics data",
			CompanyTypes: []string{"veterinary", "grooming", "boarding", "training", "walking", "sitting", "pet_taxi", "retail"},
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
		{
			Key:          "retail_assistant",
			Name:         "Retail Shopping Assistant",
			Description:  "Helps customers with product selection and shopping",
			CompanyTypes: []string{"retail"},
			SystemPrompt: `You are the Retail Shopping Assistant for {{company_name}} pet store.

SPECIAL RETAIL ASSISTANCE:
- Help customers find the right products for their pets
- Provide product recommendations based on pet type, age, and needs
- Explain product features, benefits, and usage instructions
- Handle questions about pet food, nutrition, and dietary requirements
- Suggest complementary products and accessories
- Provide information about warranties, returns, and shipping

Available products: {{service_categories}}
Business hours: {{business_hours}}
Company info: {{company_info}}

IMPORTANT: Always prioritize pet safety and well-being in your recommendations.`,
			UserPromptTemplate: `Customer inquiry: "{{user_message}}"
Available products: {{service_categories}}
Business hours: {{business_hours}}
Company info: {{company_info}}`,
			Model:       "gpt-4",
			Temperature: 0.7,
			MaxTokens:   500,
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
	hasAccess, err := s.CheckAgentAccess(req.CompanyID, req.AgentKey)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, fmt.Errorf("company does not have access to agent: %s", req.AgentKey)
	}

	// Get company type for specialized prompts
	companyType := s.getCompanyType(req.CompanyID)

	// Check if agent supports this company type
	if !s.agentSupportsCompanyType(agent, companyType) {
		return nil, fmt.Errorf("agent %s does not support company type: %s", req.AgentKey, companyType)
	}

	// Prepare context variables
	context := s.prepareContext(req)

	// Get specialized system prompt for company type
	systemPrompt := s.getSpecializedSystemPrompt(agent, companyType, context)
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
		return nil, err
	}

	// Get company type for filtering
	companyType := s.getCompanyType(companyID)
	allAgents := s.GetAvailableAgents()
	var availableAgents []AIAgent

	// Filter agents based on company type and plan/manual settings
	for _, agent := range allAgents {
		// First check if agent supports this company type
		if !s.agentSupportsCompanyType(&agent, companyType) {
			continue
		}

		// If manual AI is enabled, include all supported agents
		if hasManualAI {
			availableAgents = append(availableAgents, agent)
			continue
		}

		// Otherwise, check if agent is included in plan
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

// CheckAgentAccess проверяет доступ компании к определенному AI агенту
func (s *AIService) CheckAgentAccess(companyID, agentType string) (bool, error) {
	// Получаем информацию о компании и её тарифе
	var planID string
	query := `SELECT plan_id FROM companies WHERE id = $1`
	err := s.db.QueryRow(query, companyID).Scan(&planID)
	if err != nil {
		return false, fmt.Errorf("failed to get company plan: %w", err)
	}

	// Проверяем включен ли агент в тариф
	var includedAgents pq.StringArray
	planQuery := `SELECT included_ai_agents FROM plans WHERE id = $1`
	err = s.db.QueryRow(planQuery, planID).Scan(&includedAgents)
	if err != nil {
		return false, fmt.Errorf("failed to get plan details: %w", err)
	}

	// Проверяем включен ли агент в тариф
	for _, agent := range includedAgents {
		if agent == agentType {
			return true, nil
		}
	}

	// Проверяем куплен ли агент как аддон
	var addonCount int
	addonQuery := `
		SELECT COUNT(*) FROM company_addons 
		WHERE company_id = $1 AND addon_type = 'ai_agent' AND addon_key = $2 
		AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
	`
	err = s.db.QueryRow(addonQuery, companyID, agentType).Scan(&addonCount)
	if err != nil {
		return false, fmt.Errorf("failed to check addon access: %w", err)
	}

	return addonCount > 0, nil
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

// getCompanyType determines the primary business type of a company
func (s *AIService) getCompanyType(companyID string) string {
	// First try to get the explicit business_type from company record
	var businessType string
	err := s.db.QueryRow(`
		SELECT business_type 
		FROM companies 
		WHERE id = $1
	`, companyID).Scan(&businessType)

	if err == nil && businessType != "" && businessType != "general" {
		return businessType
	}

	// Fallback: determine type from service categories if business_type is not set or is 'general'
	var categoryName string
	err = s.db.QueryRow(`
		SELECT sc.name 
		FROM service_categories sc
		JOIN services s ON s.category_id = sc.id
		WHERE s.company_id = $1 AND s.is_active = true
		GROUP BY sc.name
		ORDER BY COUNT(*) DESC
		LIMIT 1
	`, companyID).Scan(&categoryName)

	if err != nil {
		// Default fallback
		return "general"
	}

	// Map category names to company types
	switch strings.ToLower(categoryName) {
	case "veterinary", "medical", "emergency", "dental":
		return "veterinary"
	case "grooming", "beauty":
		return "grooming"
	case "boarding", "accommodation", "hotel":
		return "boarding"
	case "training", "behavior":
		return "training"
	case "walking", "exercise":
		return "walking"
	case "sitting", "care":
		return "sitting"
	case "taxi", "transport", "transportation":
		return "pet_taxi"
	case "food", "nutrition", "retail", "products", "supplies":
		return "retail"
	default:
		return "general"
	}
}

// agentSupportsCompanyType checks if an agent supports a specific company type
func (s *AIService) agentSupportsCompanyType(agent *AIAgent, companyType string) bool {
	// If no company types specified, agent supports all types
	if len(agent.CompanyTypes) == 0 {
		return true
	}

	// Check if company type is in the supported list
	for _, supportedType := range agent.CompanyTypes {
		if supportedType == companyType {
			return true
		}
	}

	return false
}

// getSpecializedSystemPrompt returns the appropriate system prompt based on company type
func (s *AIService) getSpecializedSystemPrompt(agent *AIAgent, companyType string, context map[string]interface{}) string {
	// Check if there's a specialized prompt for this company type
	if agent.SpecializedPrompts != nil {
		if specializedPrompt, exists := agent.SpecializedPrompts[companyType]; exists {
			return s.interpolatePrompt(specializedPrompt, context)
		}
	}

	// Fallback to default system prompt
	return s.interpolatePrompt(agent.SystemPrompt, context)
}

// GetAvailableAgentsForCompany возвращает список доступных агентов для компании
func (s *AIService) GetAvailableAgentsForCompany(companyID string) ([]string, error) {
	// Получаем агентов из тарифа
	var includedAgents pq.StringArray
	query := `
		SELECT p.included_ai_agents 
		FROM companies c 
		JOIN plans p ON c.plan_id = p.id 
		WHERE c.id = $1
	`
	err := s.db.QueryRow(query, companyID).Scan(&includedAgents)
	if err != nil {
		return nil, fmt.Errorf("failed to get plan agents: %w", err)
	}

	availableAgents := make(map[string]bool)

	// Добавляем агентов из тарифа
	for _, agent := range includedAgents {
		availableAgents[agent] = true
	}

	// Добавляем купленных агентов-аддонов
	addonQuery := `
		SELECT addon_key FROM company_addons 
		WHERE company_id = $1 AND addon_type = 'ai_agent' AND status = 'active' 
		AND (expires_at IS NULL OR expires_at > NOW())
	`
	rows, err := s.db.Query(addonQuery, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to get addon agents: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var agentKey string
		if err := rows.Scan(&agentKey); err == nil {
			availableAgents[agentKey] = true
		}
	}

	// Конвертируем в слайс
	var result []string
	for agent := range availableAgents {
		result = append(result, agent)
	}

	return result, nil
}

// GetAvailableAddonAgentsForCompany возвращает агентов, которые компания может купить
func (s *AIService) GetAvailableAddonAgentsForCompany(companyID string) ([]models.AddonPricing, error) {
	// Получаем уже доступных агентов
	availableAgents, err := s.GetAvailableAgentsForCompany(companyID)
	if err != nil {
		return nil, err
	}

	availableMap := make(map[string]bool)
	for _, agent := range availableAgents {
		availableMap[agent] = true
	}

	// Получаем все доступные для покупки агенты
	query := `
		SELECT id, addon_type, addon_key, name, description, 
		       monthly_price, yearly_price, one_time_price, is_available,
		       created_at, updated_at
		FROM addon_pricing 
		WHERE addon_type = 'ai_agent' AND is_available = true
		ORDER BY name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query addon agents: %w", err)
	}
	defer rows.Close()

	var availableAddons []models.AddonPricing
	for rows.Next() {
		var addon models.AddonPricing
		err := rows.Scan(
			&addon.ID, &addon.AddonType, &addon.AddonKey, &addon.Name,
			&addon.Description, &addon.MonthlyPrice, &addon.YearlyPrice,
			&addon.OneTimePrice, &addon.IsAvailable, &addon.CreatedAt, &addon.UpdatedAt,
		)
		if err != nil {
			continue
		}

		// Показываем только тех агентов, которых у компании еще нет
		if !availableMap[addon.AddonKey] {
			availableAddons = append(availableAddons, addon)
		}
	}

	return availableAddons, nil
}

func (s *AIService) SendMessage(req *models.AIChatRequest) (*models.AIChatResponse, error) {
	// Проверяем доступ к агенту
	hasAccess, err := s.CheckAgentAccess(req.CompanyID, req.AgentType)
	if err != nil {
		return nil, fmt.Errorf("failed to check agent access: %w", err)
	}
	if !hasAccess {
		return nil, fmt.Errorf("access denied: agent '%s' not available for this company", req.AgentType)
	}

	// Логируем использование AI агента
	s.logAIUsage(req.CompanyID, req.AgentType, "message", len(req.Message))

	// Получаем промпты из новой системы управления
	systemPromptResp, err := s.promptService.GetPrompt(req.CompanyID, req.AgentType, "system")
	if err != nil {
		// Fallback к hardcoded промптам
		return s.sendMessageWithHardcodedPrompts(req)
	}

	userPromptResp, err := s.promptService.GetPrompt(req.CompanyID, req.AgentType, "user")
	if err != nil {
		// Fallback к hardcoded промптам
		return s.sendMessageWithHardcodedPrompts(req)
	}

	// Prepare context variables
	context := s.prepareContext(&AIRequest{
		AgentKey:    req.AgentType,
		UserMessage: req.Message,
		CompanyID:   req.CompanyID,
		UserID:      req.UserID,
		Context:     req.Context,
	})

	// Интерполируем промпты с контекстом
	systemPrompt := s.interpolatePrompt(systemPromptResp.Content, context)
	userPrompt := s.interpolatePrompt(userPromptResp.Content, context)

	// Получаем конфигурацию агента для модели и параметров
	agent := s.getAgentByKey(req.AgentType)
	if agent == nil {
		return nil, fmt.Errorf("agent configuration not found: %s", req.AgentType)
	}

	// Call OpenAI API
	openAIResp, err := s.callOpenAIWithPrompts(agent, systemPrompt, userPrompt)
	if err != nil {
		return nil, err
	}

	// Log AI usage
	err = s.logAIUsage(req.CompanyID, req.UserID, req.AgentType, openAIResp.Usage.TotalTokens)
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to log AI usage: %v\n", err)
	}

	response := &models.AIChatResponse{
		AgentKey:     req.AgentType,
		Response:     openAIResp.Choices[0].Message.Content,
		Confidence:   0.95, // OpenAI doesn't provide confidence scores
		TokensUsed:   openAIResp.Usage.TotalTokens,
		ProcessingMs: 0, // Would need to measure actual processing time
		Context:      req.Context,
	}

	return response, nil
}

// sendMessageWithHardcodedPrompts - fallback метод с оригинальной логикой
func (s *AIService) sendMessageWithHardcodedPrompts(req *models.AIChatRequest) (*models.AIChatResponse, error) {
	// Получаем конфигурацию агента
	agent := s.getAgentByKey(req.AgentType)
	if agent == nil {
		return nil, fmt.Errorf("agent not found: %s", req.AgentType)
	}

	// Get company type for specialized prompts
	companyType := s.getCompanyType(req.CompanyID)

	// Check if agent supports this company type
	if !s.agentSupportsCompanyType(agent, companyType) {
		return nil, fmt.Errorf("agent %s does not support company type: %s", req.AgentType, companyType)
	}

	// Prepare context variables
	context := s.prepareContext(&AIRequest{
		AgentKey:    req.AgentType,
		UserMessage: req.Message,
		CompanyID:   req.CompanyID,
		UserID:      req.UserID,
		Context:     req.Context,
	})

	// Get specialized system prompt for company type
	systemPrompt := s.getSpecializedSystemPrompt(agent, companyType, context)
	userPrompt := s.interpolatePrompt(agent.UserPromptTemplate, context)

	// Call OpenAI API
	openAIResp, err := s.callOpenAI(agent, systemPrompt, userPrompt)
	if err != nil {
		return nil, err
	}

	// Log AI usage
	err = s.logAIUsage(req.CompanyID, req.UserID, req.AgentType, openAIResp.Usage.TotalTokens)
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to log AI usage: %v\n", err)
	}

	response := &models.AIChatResponse{
		AgentKey:     req.AgentType,
		Response:     openAIResp.Choices[0].Message.Content,
		Confidence:   0.95,
		TokensUsed:   openAIResp.Usage.TotalTokens,
		ProcessingMs: 0,
		Context:      req.Context,
	}

	return response, nil
}

// callOpenAIWithPrompts - новый метод для работы с произвольными промптами
func (s *AIService) callOpenAIWithPrompts(agent *AIAgent, systemPrompt, userPrompt string) (*OpenAIResponse, error) {
	reqBody := OpenAIRequest{
		Model: agent.Model,
		Messages: []OpenAIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: agent.Temperature,
		MaxTokens:   agent.MaxTokens,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.openAIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error: %d - %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var openAIResp OpenAIResponse
	err = json.Unmarshal(body, &openAIResp)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &openAIResp, nil
}
