package graphql

import (
	"context"
	"fmt"
	"net/http"

	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/graphql-go/graphql"
)

type GraphQLHandler struct {
	schema         graphql.Schema
	userService    *services.UserService
	companyService *services.CompanyService
	serviceService *services.ServiceService
	bookingService *services.BookingService
	petService     *services.PetService
}

type GraphQLRequest struct {
	Query         string                 `json:"query"`
	Variables     map[string]interface{} `json:"variables"`
	OperationName string                 `json:"operationName"`
}

type GraphQLResponse struct {
	Data   interface{}    `json:"data,omitempty"`
	Errors []GraphQLError `json:"errors,omitempty"`
}

type GraphQLError struct {
	Message string   `json:"message"`
	Path    []string `json:"path,omitempty"`
}

func NewGraphQLHandler(
	userService *services.UserService,
	companyService *services.CompanyService,
	serviceService *services.ServiceService,
	bookingService *services.BookingService,
	petService *services.PetService,
) *GraphQLHandler {
	handler := &GraphQLHandler{
		userService:    userService,
		companyService: companyService,
		serviceService: serviceService,
		bookingService: bookingService,
		petService:     petService,
	}

	schema, err := handler.createSchema()
	if err != nil {
		panic(fmt.Sprintf("Failed to create GraphQL schema: %v", err))
	}

	handler.schema = schema
	return handler
}

func (h *GraphQLHandler) createSchema() (graphql.Schema, error) {
	// Define User type
	userType := graphql.NewObject(graphql.ObjectConfig{
		Name: "User",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type: graphql.String,
			},
			"email": &graphql.Field{
				Type: graphql.String,
			},
			"username": &graphql.Field{
				Type: graphql.String,
			},
			"firstName": &graphql.Field{
				Type: graphql.String,
			},
			"lastName": &graphql.Field{
				Type: graphql.String,
			},
			"role": &graphql.Field{
				Type: graphql.String,
			},
			"isActive": &graphql.Field{
				Type: graphql.Boolean,
			},
			"createdAt": &graphql.Field{
				Type: graphql.String,
			},
		},
	})

	// Define Company type
	companyType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Company",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type: graphql.String,
			},
			"name": &graphql.Field{
				Type: graphql.String,
			},
			"description": &graphql.Field{
				Type: graphql.String,
			},
			"address": &graphql.Field{
				Type: graphql.String,
			},
			"phone": &graphql.Field{
				Type: graphql.String,
			},
			"email": &graphql.Field{
				Type: graphql.String,
			},
			"website": &graphql.Field{
				Type: graphql.String,
			},
			"category": &graphql.Field{
				Type: graphql.String,
			},
			"rating": &graphql.Field{
				Type: graphql.Float,
			},
			"isActive": &graphql.Field{
				Type: graphql.Boolean,
			},
			"publishToMarketplace": &graphql.Field{
				Type: graphql.Boolean,
			},
		},
	})

	// Define Service type
	serviceType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Service",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type: graphql.String,
			},
			"companyId": &graphql.Field{
				Type: graphql.String,
			},
			"name": &graphql.Field{
				Type: graphql.String,
			},
			"description": &graphql.Field{
				Type: graphql.String,
			},
			"price": &graphql.Field{
				Type: graphql.Float,
			},
			"duration": &graphql.Field{
				Type: graphql.Int,
			},
			"petTypes": &graphql.Field{
				Type: graphql.NewList(graphql.String),
			},
			"imageUrl": &graphql.Field{
				Type: graphql.String,
			},
			"isActive": &graphql.Field{
				Type: graphql.Boolean,
			},
		},
	})

	// Define Pet type
	petType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Pet",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type: graphql.String,
			},
			"userId": &graphql.Field{
				Type: graphql.String,
			},
			"name": &graphql.Field{
				Type: graphql.String,
			},
			"type": &graphql.Field{
				Type: graphql.String,
			},
			"breed": &graphql.Field{
				Type: graphql.String,
			},
			"age": &graphql.Field{
				Type: graphql.Int,
			},
			"weight": &graphql.Field{
				Type: graphql.Float,
			},
			"notes": &graphql.Field{
				Type: graphql.String,
			},
		},
	})

	// Define Booking type
	bookingType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Booking",
		Fields: graphql.Fields{
			"id": &graphql.Field{
				Type: graphql.String,
			},
			"userId": &graphql.Field{
				Type: graphql.String,
			},
			"companyId": &graphql.Field{
				Type: graphql.String,
			},
			"serviceId": &graphql.Field{
				Type: graphql.String,
			},
			"petId": &graphql.Field{
				Type: graphql.String,
			},
			"dateTime": &graphql.Field{
				Type: graphql.String,
			},
			"duration": &graphql.Field{
				Type: graphql.Int,
			},
			"price": &graphql.Field{
				Type: graphql.Float,
			},
			"status": &graphql.Field{
				Type: graphql.String,
			},
			"notes": &graphql.Field{
				Type: graphql.String,
			},
		},
	})

	// Define Query type
	queryType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"user": &graphql.Field{
				Type: userType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
				},
				Resolve: h.resolveUser,
			},
			"users": &graphql.Field{
				Type: graphql.NewList(userType),
				Args: graphql.FieldConfigArgument{
					"limit": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
					"offset": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
				},
				Resolve: h.resolveUsers,
			},
			"companies": &graphql.Field{
				Type: graphql.NewList(companyType),
				Args: graphql.FieldConfigArgument{
					"category": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"location": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"limit": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
					"offset": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
				},
				Resolve: h.resolveCompanies,
			},
			"company": &graphql.Field{
				Type: companyType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
				},
				Resolve: h.resolveCompany,
			},
			"services": &graphql.Field{
				Type: graphql.NewList(serviceType),
				Args: graphql.FieldConfigArgument{
					"companyId": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"category": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"petType": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"limit": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
					"offset": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
				},
				Resolve: h.resolveServices,
			},
			"service": &graphql.Field{
				Type: serviceType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
				},
				Resolve: h.resolveService,
			},
			"pets": &graphql.Field{
				Type: graphql.NewList(petType),
				Args: graphql.FieldConfigArgument{
					"userId": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
				},
				Resolve: h.resolvePets,
			},
			"bookings": &graphql.Field{
				Type: graphql.NewList(bookingType),
				Args: graphql.FieldConfigArgument{
					"userId": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"companyId": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"status": &graphql.ArgumentConfig{
						Type: graphql.String,
					},
					"limit": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
					"offset": &graphql.ArgumentConfig{
						Type: graphql.Int,
					},
				},
				Resolve: h.resolveBookings,
			},
		},
	})

	// Create schema
	schema, err := graphql.NewSchema(graphql.SchemaConfig{
		Query: queryType,
	})

	return schema, err
}

// Resolver functions
func (h *GraphQLHandler) resolveUser(p graphql.ResolveParams) (interface{}, error) {
	id, ok := p.Args["id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid user ID")
	}

	// This would call your user service
	// user, err := h.userService.GetUserByID(id)
	// For now, return mock data
	return map[string]interface{}{
		"id":        id,
		"email":     "user@example.com",
		"username":  "user123",
		"firstName": "John",
		"lastName":  "Doe",
		"role":      "pet_owner",
		"isActive":  true,
		"createdAt": "2024-01-01T00:00:00Z",
	}, nil
}

func (h *GraphQLHandler) resolveUsers(p graphql.ResolveParams) (interface{}, error) {
	limit := 10
	offset := 0

	if l, ok := p.Args["limit"].(int); ok {
		limit = l
	}
	if o, ok := p.Args["offset"].(int); ok {
		offset = o
	}

	// Mock data
	users := []map[string]interface{}{
		{
			"id":        "1",
			"email":     "user1@example.com",
			"username":  "user1",
			"firstName": "John",
			"lastName":  "Doe",
			"role":      "pet_owner",
			"isActive":  true,
			"createdAt": "2024-01-01T00:00:00Z",
		},
		{
			"id":        "2",
			"email":     "user2@example.com",
			"username":  "user2",
			"firstName": "Jane",
			"lastName":  "Smith",
			"role":      "company_owner",
			"isActive":  true,
			"createdAt": "2024-01-02T00:00:00Z",
		},
	}

	// Apply pagination
	start := offset
	end := offset + limit
	if start >= len(users) {
		return []map[string]interface{}{}, nil
	}
	if end > len(users) {
		end = len(users)
	}

	return users[start:end], nil
}

func (h *GraphQLHandler) resolveCompanies(p graphql.ResolveParams) (interface{}, error) {
	// Extract filters
	category, _ := p.Args["category"].(string)
	limit := 10
	offset := 0

	if l, ok := p.Args["limit"].(int); ok {
		limit = l
	}
	if o, ok := p.Args["offset"].(int); ok {
		offset = o
	}

	// Mock data
	companies := []map[string]interface{}{
		{
			"id":                   "1",
			"name":                 "Happy Pets Clinic",
			"description":          "Professional pet care services",
			"address":              "123 Main St, City",
			"phone":                "+1234567890",
			"email":                "info@happypets.com",
			"website":              "https://happypets.com",
			"category":             "veterinary",
			"rating":               4.8,
			"isActive":             true,
			"publishToMarketplace": true,
		},
		{
			"id":                   "2",
			"name":                 "Pet Grooming Pro",
			"description":          "Professional grooming services",
			"address":              "456 Oak Ave, City",
			"phone":                "+1234567891",
			"email":                "contact@petgrooming.com",
			"website":              "https://petgrooming.com",
			"category":             "grooming",
			"rating":               4.6,
			"isActive":             true,
			"publishToMarketplace": true,
		},
	}

	// Apply filters
	filteredCompanies := companies
	if category != "" {
		var filtered []map[string]interface{}
		for _, company := range companies {
			if company["category"] == category {
				filtered = append(filtered, company)
			}
		}
		filteredCompanies = filtered
	}

	// Apply pagination
	start := offset
	end := offset + limit
	if start >= len(filteredCompanies) {
		return []map[string]interface{}{}, nil
	}
	if end > len(filteredCompanies) {
		end = len(filteredCompanies)
	}

	return filteredCompanies[start:end], nil
}

func (h *GraphQLHandler) resolveCompany(p graphql.ResolveParams) (interface{}, error) {
	id, ok := p.Args["id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid company ID")
	}

	return map[string]interface{}{
		"id":                   id,
		"name":                 "Happy Pets Clinic",
		"description":          "Professional pet care services",
		"address":              "123 Main St, City",
		"phone":                "+1234567890",
		"email":                "info@happypets.com",
		"website":              "https://happypets.com",
		"category":             "veterinary",
		"rating":               4.8,
		"isActive":             true,
		"publishToMarketplace": true,
	}, nil
}

func (h *GraphQLHandler) resolveServices(p graphql.ResolveParams) (interface{}, error) {
	companyId, _ := p.Args["companyId"].(string)

	// Mock data
	services := []map[string]interface{}{
		{
			"id":          "1",
			"companyId":   "1",
			"name":        "Health Checkup",
			"description": "Complete health examination",
			"price":       50.0,
			"duration":    60,
			"petTypes":    []string{"dog", "cat"},
			"imageUrl":    "https://example.com/checkup.jpg",
			"isActive":    true,
		},
		{
			"id":          "2",
			"companyId":   "2",
			"name":        "Full Grooming",
			"description": "Complete grooming package",
			"price":       75.0,
			"duration":    90,
			"petTypes":    []string{"dog"},
			"imageUrl":    "https://example.com/grooming.jpg",
			"isActive":    true,
		},
	}

	// Apply filters
	filteredServices := services
	if companyId != "" {
		var filtered []map[string]interface{}
		for _, service := range services {
			if service["companyId"] == companyId {
				filtered = append(filtered, service)
			}
		}
		filteredServices = filtered
	}

	return filteredServices, nil
}

func (h *GraphQLHandler) resolveService(p graphql.ResolveParams) (interface{}, error) {
	id, ok := p.Args["id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid service ID")
	}

	return map[string]interface{}{
		"id":          id,
		"companyId":   "1",
		"name":        "Health Checkup",
		"description": "Complete health examination",
		"price":       50.0,
		"duration":    60,
		"petTypes":    []string{"dog", "cat"},
		"imageUrl":    "https://example.com/checkup.jpg",
		"isActive":    true,
	}, nil
}

func (h *GraphQLHandler) resolvePets(p graphql.ResolveParams) (interface{}, error) {
	userId, _ := p.Args["userId"].(string)

	pets := []map[string]interface{}{
		{
			"id":     "1",
			"userId": userId,
			"name":   "Buddy",
			"type":   "dog",
			"breed":  "Golden Retriever",
			"age":    3,
			"weight": 30.5,
			"notes":  "Friendly and energetic",
		},
		{
			"id":     "2",
			"userId": userId,
			"name":   "Whiskers",
			"type":   "cat",
			"breed":  "Persian",
			"age":    2,
			"weight": 4.2,
			"notes":  "Calm and gentle",
		},
	}

	return pets, nil
}

func (h *GraphQLHandler) resolveBookings(p graphql.ResolveParams) (interface{}, error) {
	userId, _ := p.Args["userId"].(string)
	companyId, _ := p.Args["companyId"].(string)
	status, _ := p.Args["status"].(string)

	bookings := []map[string]interface{}{
		{
			"id":        "1",
			"userId":    userId,
			"companyId": companyId,
			"serviceId": "1",
			"petId":     "1",
			"dateTime":  "2024-12-15T10:00:00Z",
			"duration":  60,
			"price":     50.0,
			"status":    "confirmed",
			"notes":     "Regular checkup",
		},
		{
			"id":        "2",
			"userId":    userId,
			"companyId": companyId,
			"serviceId": "2",
			"petId":     "2",
			"dateTime":  "2024-12-20T14:00:00Z",
			"duration":  90,
			"price":     75.0,
			"status":    "pending",
			"notes":     "First grooming session",
		},
	}

	// Apply filters
	filteredBookings := bookings
	if status != "" {
		var filtered []map[string]interface{}
		for _, booking := range bookings {
			if booking["status"] == status {
				filtered = append(filtered, booking)
			}
		}
		filteredBookings = filtered
	}

	return filteredBookings, nil
}

// HTTP handler for GraphQL endpoint
func (h *GraphQLHandler) HandleGraphQL(c *gin.Context) {
	var req GraphQLRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, GraphQLResponse{
			Errors: []GraphQLError{
				{Message: "Invalid JSON request"},
			},
		})
		return
	}

	// Execute GraphQL query
	result := graphql.Do(graphql.Params{
		Schema:         h.schema,
		RequestString:  req.Query,
		VariableValues: req.Variables,
		OperationName:  req.OperationName,
		Context:        context.Background(),
	})

	// Convert errors
	var errors []GraphQLError
	if len(result.Errors) > 0 {
		for _, err := range result.Errors {
			// Convert []interface{} to []string safely
			var pathStrings []string
			if err.Path != nil {
				for _, p := range err.Path {
					if str, ok := p.(string); ok {
						pathStrings = append(pathStrings, str)
					} else if num, ok := p.(int); ok {
						pathStrings = append(pathStrings, fmt.Sprintf("%d", num))
					}
				}
			}

			errors = append(errors, GraphQLError{
				Message: err.Message,
				Path:    pathStrings,
			})
		}
	}

	response := GraphQLResponse{
		Data:   result.Data,
		Errors: errors,
	}

	c.JSON(http.StatusOK, response)
}

// Handle GET requests for GraphQL playground
func (h *GraphQLHandler) HandleGraphQLPlayground(c *gin.Context) {
	playgroundHTML := `
<!DOCTYPE html>
<html>
<head>
	<meta charset=utf-8/>
	<meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui">
	<title>GraphQL Playground</title>
	<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
	<link rel="shortcut icon" href="//cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
	<script src="//cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
</head>
<body>
	<div id="root">
		<style>
			body {
				background-color: rgb(23, 42, 58);
				font-family: Open Sans, sans-serif;
				height: 90vh;
			}
			#root {
				height: 100%;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.loading {
				font-size: 32px;
				font-weight: 200;
				color: rgba(255, 255, 255, .6);
				margin-left: 20px;
			}
			img {
				width: 78px;
				height: 78px;
			}
			.title {
				font-weight: 400;
			}
		</style>
		<img src="//cdn.jsdelivr.net/npm/graphql-playground-react/build/logo.png" alt="">
		<div class="loading"> Loading
			<span class="title">GraphQL Playground</span>
		</div>
	</div>
	<script>window.addEventListener('load', function (event) {
			GraphQLPlayground.init(document.getElementById('root'), {
				endpoint: '/graphql'
			})
		})</script>
</body>
</html>
`
	c.Header("Content-Type", "text/html")
	c.String(http.StatusOK, playgroundHTML)
}
