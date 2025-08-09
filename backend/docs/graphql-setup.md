# GraphQL Setup for Zootel Backend

## Overview
This document describes the GraphQL implementation for the Zootel platform, providing a flexible and efficient API for mobile and web clients.

## Installation

### 1. Install gqlgen
```bash
go install github.com/99designs/gqlgen@latest
```

### 2. Initialize GraphQL
```bash
cd backend/api/graphql
go run github.com/99designs/gqlgen init
```

## Configuration

### gqlgen.yml
The GraphQL configuration is defined in `backend/api/graphql/gqlgen.yml`:

```yaml
schema:
  - graph/schema.graphqls

exec:
  filename: graph/generated.go
  package: graph

model:
  filename: graph/model/models_gen.go
  package: model

resolver:
  layout: follow-schema
  dir: graph
  package: graph
  filename_template: "{name}.resolvers.go"

autobind:
  - "github.com/TahyrOrazdurdyyev/zootel/backend/internal/models"

models:
  ID:
    model:
      - github.com/99designs/gqlgen/graphql.ID
      - github.com/99designs/gqlgen/graphql.Int
      - github.com/99designs/gqlgen/graphql.Int64
      - github.com/99designs/gqlgen/graphql.Int32
  UUID:
    model:
      - github.com/google/uuid.UUID
```

## Schema Definition

### Main Types
The GraphQL schema defines the following main types:

#### User Types
- `User` - Platform users (pet owners)
- `Employee` - Company employees
- `Company` - Pet care businesses

#### Business Types
- `Service` - Services offered by companies
- `Product` - Products sold by companies
- `Booking` - Service bookings
- `Order` - Product orders

#### Platform Types
- `Pet` - User's pets
- `PetType` - Pet species
- `Breed` - Pet breeds

### Queries
```graphql
type Query {
  # User queries
  user(id: ID!): User
  users(filter: UserFilter, pagination: Pagination): UserConnection
  
  # Company queries
  company(id: ID!): Company
  companies(filter: CompanyFilter, pagination: Pagination): CompanyConnection
  publicCompanies(filter: PublicCompanyFilter, pagination: Pagination): CompanyConnection
  
  # Service queries
  service(id: ID!): Service
  services(companyId: ID, filter: ServiceFilter, pagination: Pagination): ServiceConnection
  
  # Product queries
  product(id: ID!): Product
  products(companyId: ID, filter: ProductFilter, pagination: Pagination): ProductConnection
  
  # Booking queries
  booking(id: ID!): Booking
  bookings(userId: ID, companyId: ID, filter: BookingFilter, pagination: Pagination): BookingConnection
  
  # Pet queries
  pet(id: ID!): Pet
  pets(userId: ID!): [Pet!]!
  petTypes: [PetType!]!
  breeds(petTypeId: ID): [Breed!]!
}
```

### Mutations
```graphql
type Mutation {
  # User mutations
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  
  # Company mutations
  createCompany(input: CreateCompanyInput!): Company!
  updateCompany(id: ID!, input: UpdateCompanyInput!): Company!
  
  # Service mutations
  createService(input: CreateServiceInput!): Service!
  updateService(id: ID!, input: UpdateServiceInput!): Service!
  deleteService(id: ID!): Boolean!
  
  # Booking mutations
  createBooking(input: CreateBookingInput!): Booking!
  updateBookingStatus(id: ID!, status: BookingStatus!): Booking!
  cancelBooking(id: ID!): Boolean!
  
  # Pet mutations
  createPet(input: CreatePetInput!): Pet!
  updatePet(id: ID!, input: UpdatePetInput!): Pet!
  deletePet(id: ID!): Boolean!
}
```

### Subscriptions
```graphql
type Subscription {
  # Real-time booking updates
  bookingUpdated(companyId: ID!): Booking!
  
  # Chat messages
  messageAdded(chatId: ID!): Message!
  
  # Notifications
  notificationAdded(userId: ID!): Notification!
}
```

## Resolvers

### Implementing Resolvers
Resolvers are implemented in the `graph` package and connect GraphQL operations to business logic:

```go
func (r *queryResolver) User(ctx context.Context, id string) (*model.User, error) {
    return r.userService.GetByID(id)
}

func (r *mutationResolver) CreateBooking(ctx context.Context, input model.CreateBookingInput) (*model.Booking, error) {
    return r.bookingService.Create(ctx, &input)
}
```

### Context and Authentication
GraphQL resolvers use context for authentication and authorization:

```go
func (r *queryResolver) MyBookings(ctx context.Context) ([]*model.Booking, error) {
    userID := auth.GetUserIDFromContext(ctx)
    if userID == "" {
        return nil, errors.New("unauthorized")
    }
    return r.bookingService.GetByUserID(userID)
}
```

## Integration with REST API

### Shared Services
GraphQL resolvers use the same service layer as REST endpoints:

```go
type Resolver struct {
    userService     services.UserServiceInterface
    companyService  services.CompanyServiceInterface
    bookingService  services.BookingServiceInterface
    // ... other services
}
```

### Consistent Data Models
Both GraphQL and REST APIs use the same internal models from `internal/models`.

## Performance Optimization

### DataLoader Pattern
Use DataLoader to solve N+1 query problems:

```go
func (r *companyResolver) Services(ctx context.Context, obj *model.Company) ([]*model.Service, error) {
    return r.serviceLoader.LoadMany(ctx, obj.ID)
}
```

### Field-Level Permissions
Implement field-level authorization:

```go
func (r *userResolver) Email(ctx context.Context, obj *model.User) (*string, error) {
    currentUser := auth.GetUserFromContext(ctx)
    if currentUser.ID != obj.ID && !currentUser.IsAdmin {
        return nil, nil // Hide email for other users
    }
    return &obj.Email, nil
}
```

## Testing

### Unit Tests
```go
func TestUserResolver(t *testing.T) {
    resolver := &queryResolver{
        userService: &mockUserService{},
    }
    
    user, err := resolver.User(context.Background(), "user-id")
    assert.NoError(t, err)
    assert.NotNil(t, user)
}
```

### Integration Tests
Use GraphQL testing tools to test complete operations:

```go
func TestCreateBooking(t *testing.T) {
    client := buildTestClient()
    
    mutation := `
        mutation {
            createBooking(input: {
                serviceId: "service-1"
                petId: "pet-1"
                dateTime: "2023-12-01T10:00:00Z"
            }) {
                id
                status
            }
        }
    `
    
    resp := client.MustPost(mutation)
    // Assert response
}
```

## Deployment

### Production Setup
1. Enable query complexity analysis
2. Set up query timeout
3. Configure rate limiting
4. Enable introspection only in development

```go
srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))
srv.Use(extension.Introspection{})
srv.SetQueryCache(lru.New(1000))
```

## Monitoring

### Metrics
- Query execution time
- Resolver performance
- Error rates
- Query complexity

### Logging
Log GraphQL operations for debugging:

```go
srv.Use(apollotracing.Tracer{})
srv.AroundResponses(func(ctx context.Context, next graphql.ResponseHandler) *graphql.Response {
    start := time.Now()
    resp := next(ctx)
    duration := time.Since(start)
    
    log.Printf("GraphQL operation took %v", duration)
    return resp
})
``` 