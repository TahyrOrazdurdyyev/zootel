package main

import (
	"context"
	"log"
	"net/http"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"

	"github.com/TahyrOrazdurdyyev/zootel/backend/api/graphql"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/database"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/handlers"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/middleware"
	"github.com/TahyrOrazdurdyyev/zootel/backend/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize Firebase Auth
	var authClient *auth.Client
	firebaseCredentials := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	if firebaseCredentials == "" {
		// Initialize Firebase without credentials file (using default application credentials)
		app, err := firebase.NewApp(context.Background(), nil)
		if err != nil {
			log.Printf("Warning: Failed to initialize Firebase app: %v", err)
		} else {
			authClient, err = app.Auth(context.Background())
			if err != nil {
				log.Printf("Warning: Failed to initialize Firebase Auth: %v", err)
			}
		}
	} else {
		// Initialize Firebase with credentials file
		opt := option.WithCredentialsFile(firebaseCredentials)
		app, err := firebase.NewApp(context.Background(), nil, opt)
		if err != nil {
			log.Printf("Warning: Failed to initialize Firebase app with credentials: %v", err)
		} else {
			authClient, err = app.Auth(context.Background())
			if err != nil {
				log.Printf("Warning: Failed to initialize Firebase Auth: %v", err)
			}
		}
	}

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize service container
	serviceContainer := services.NewServiceContainer(db)
	if err := serviceContainer.InitializeServices(); err != nil {
		log.Fatalf("Failed to initialize services: %v", err)
	}
	defer serviceContainer.Cleanup()

	// Get services from container
	userService := serviceContainer.UserService()
	companyService := serviceContainer.CompanyService()
	petService := serviceContainer.PetService()
	bookingService := serviceContainer.BookingService()
	orderService := serviceContainer.OrderService()
	chatService := serviceContainer.ChatService()
	paymentService := serviceContainer.PaymentService()
	aiService := serviceContainer.AIService()
	analyticsService := serviceContainer.AnalyticsService()
	notificationService := serviceContainer.NotificationService()
	adminService := serviceContainer.AdminService()
	addonService := serviceContainer.AddonService()
	integrationService := serviceContainer.IntegrationService()
	uploadService := serviceContainer.UploadService()

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService)
	companyHandler := handlers.NewCompanyHandler(companyService)
	petHandler := handlers.NewPetHandler(petService)
	bookingHandler := handlers.NewBookingHandler(bookingService)
	orderHandler := handlers.NewOrderHandler(orderService)
	chatHandler := handlers.NewChatHandler(chatService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	aiHandler := handlers.NewAIHandler(aiService)
	adminHandler := handlers.NewAdminHandler(adminService)
	authHandler := handlers.NewAuthHandler(userService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	addonHandler := handlers.NewAddonHandler(addonService, db)
	integrationHandler := handlers.NewIntegrationHandler(integrationService)
	uploadHandler := handlers.NewUploadHandler(uploadService)

	// Initialize GraphQL handlers
	graphqlHandler := graphql.NewGraphQLHandler(
		userService,
		companyService,
		serviceContainer.ServiceService(),
		bookingService,
		petService,
	)

	// Set up Gin router
	r := gin.Default()

	// CORS configuration
	allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000"
	}

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{allowedOrigins}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// Serve static files (uploaded images)
	r.Static("/uploads", "./uploads")

	// Basic health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "zootel-backend",
		})
	})

	// GraphQL endpoints
	r.POST("/graphql", graphqlHandler.HandleGraphQL)
	r.GET("/graphql", graphqlHandler.HandleGraphQLPlayground)

	// API routes
	api := r.Group("/api/v1")
	{
		// Public endpoints
		api.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "Zootel API is running",
			})
		})

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/employee-login", authHandler.EmployeeLogin)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/verify-email", authHandler.VerifyEmail)
			auth.POST("/reset-password", authHandler.ResetPassword)
		}

		// Public marketplace endpoints
		marketplace := api.Group("/marketplace")
		{
			marketplace.GET("/companies", companyHandler.GetPublicCompanies)
			marketplace.GET("/companies/:id", companyHandler.GetPublicCompany)
			marketplace.GET("/services", companyHandler.GetPublicServices)
			marketplace.GET("/products", companyHandler.GetPublicProducts)
			marketplace.GET("/categories", companyHandler.GetServiceCategories)
			marketplace.GET("/search", companyHandler.Search)
		}

		// Public integration endpoints (for website widgets)
		integration := api.Group("/integration")
		{
			integration.POST("/validate-key", integrationHandler.ValidateAPIKey)
			integration.GET("/domain-access", integrationHandler.CheckDomainAccess)
			integration.POST("/record-interaction", integrationHandler.RecordWidgetInteraction)
		}

		// Protected routes requiring authentication
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(authClient, db))
		{
			// User profile endpoints
			users := protected.Group("/users")
			{
				users.GET("/profile", userHandler.GetProfile)
				users.PUT("/profile", userHandler.UpdateProfile)
				users.DELETE("/profile", userHandler.DeleteProfile)
				users.POST("/upload-avatar", uploadHandler.UploadAvatar)
			}

			// Pet management endpoints
			pets := protected.Group("/pets")
			{
				pets.GET("/", petHandler.GetUserPets)
				pets.POST("/", petHandler.CreatePet)
				pets.GET("/:id", petHandler.GetPet)
				pets.PUT("/:id", petHandler.UpdatePet)
				pets.DELETE("/:id", petHandler.DeletePet)
				pets.POST("/:petId/upload-photo", uploadHandler.UploadPetPhoto)
			}

			// Booking endpoints
			bookings := protected.Group("/bookings")
			{
				bookings.GET("/", bookingHandler.GetUserBookings)
				bookings.POST("/", bookingHandler.CreateBooking)
				bookings.GET("/:id", bookingHandler.GetBooking)
				bookings.PUT("/:id", bookingHandler.UpdateBooking)
				bookings.DELETE("/:id", bookingHandler.CancelBooking)
				bookings.GET("/availability", bookingHandler.CheckAvailability)
			}

			// Order endpoints
			orders := protected.Group("/orders")
			{
				orders.GET("/", orderHandler.GetUserOrders)
				orders.POST("/", orderHandler.CreateOrder)
				orders.GET("/:id", orderHandler.GetOrder)
				orders.PUT("/:id", orderHandler.UpdateOrder)
				orders.DELETE("/:id", orderHandler.CancelOrder)
			}

			// Chat endpoints
			chats := protected.Group("/chats")
			{
				chats.GET("/", chatHandler.GetUserChats)
				chats.POST("/", chatHandler.CreateChat)
				chats.GET("/:id", chatHandler.GetChat)
				chats.GET("/:id/messages", chatHandler.GetChatMessages)
				chats.POST("/:id/messages", chatHandler.SendMessage)
			}

			// Payment endpoints
			payments := protected.Group("/payments")
			{
				payments.POST("/create-intent", paymentHandler.CreatePaymentIntent)
				payments.POST("/confirm", paymentHandler.ConfirmPayment)
				payments.GET("/history", paymentHandler.GetPaymentHistory)
			}

			// Upload endpoints
			uploads := protected.Group("/uploads")
			{
				uploads.POST("/avatar", uploadHandler.UploadAvatar)
				uploads.POST("/pet/:petId/photo", uploadHandler.UploadPetPhoto)
				uploads.POST("/service/:serviceId/image", uploadHandler.UploadServiceImage)
				uploads.POST("/company/:companyId/logo", uploadHandler.UploadCompanyLogo)
				uploads.POST("/gallery", uploadHandler.UploadGallery)
				uploads.GET("/files", uploadHandler.GetFiles)
				uploads.DELETE("/files/:fileId", uploadHandler.DeleteFile)
				uploads.GET("/files/:fileId", uploadHandler.GetFileInfo)
			}

			// Company management endpoints (for company owners)
			companies := protected.Group("/companies")
			companies.Use(middleware.CompanyOwnerMiddleware())
			{
				companies.GET("/profile", companyHandler.GetCompanyProfile)
				companies.PUT("/profile", companyHandler.UpdateCompanyProfile)
				companies.POST("/upload-logo", companyHandler.UploadLogo)
				companies.POST("/upload-media", companyHandler.UploadMedia)

				// Services management
				companies.GET("/services", companyHandler.GetCompanyServices)
				companies.POST("/services", companyHandler.CreateService)
				companies.PUT("/services/:id", companyHandler.UpdateService)
				companies.DELETE("/services/:id", companyHandler.DeleteService)

				// Products management
				companies.GET("/products", companyHandler.GetCompanyProducts)
				companies.POST("/products", companyHandler.CreateProduct)
				companies.PUT("/products/:id", companyHandler.UpdateProduct)
				companies.DELETE("/products/:id", companyHandler.DeleteProduct)

				// Employee management
				companies.GET("/employees", companyHandler.GetEmployees)
				companies.POST("/employees", companyHandler.CreateEmployee)
				companies.PUT("/employees/:id", companyHandler.UpdateEmployee)
				companies.DELETE("/employees/:id", companyHandler.DeleteEmployee)

				// Company bookings and orders
				companies.GET("/bookings", bookingHandler.GetCompanyBookings)
				companies.PUT("/bookings/:id/status", bookingHandler.UpdateBookingStatus)
				companies.GET("/orders", orderHandler.GetCompanyOrders)
				companies.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)

				// Company chats
				companies.GET("/chats", chatHandler.GetCompanyChats)

				// Analytics
				companies.GET("/analytics", analyticsHandler.GetCompanyAnalytics)

				// Website Integration
				companies.POST("/integration/enable", integrationHandler.EnableWebsiteIntegration)
				companies.DELETE("/integration/disable", integrationHandler.DisableWebsiteIntegration)
				companies.GET("/integration/settings", integrationHandler.GetIntegrationSettings)
				companies.PUT("/integration/settings", integrationHandler.UpdateIntegrationSettings)
				companies.POST("/integration/regenerate-key", integrationHandler.RegenerateAPIKey)
				companies.GET("/integration/features", integrationHandler.GetIntegrationFeatures)
				companies.GET("/integration/marketplace-eligibility", integrationHandler.GetMarketplaceEligibility)
				companies.PUT("/integration/marketplace-visibility", integrationHandler.UpdateMarketplaceVisibility)
				companies.GET("/integration/analytics", integrationHandler.GetSourceAnalytics)
			}

			// AI endpoints
			ai := protected.Group("/ai")
			{
				ai.POST("/request", aiHandler.ProcessAIRequest)
				ai.POST("/chat", aiHandler.ProcessMessage) // Legacy endpoint
				ai.GET("/agents", aiHandler.GetAvailableAgents)
				ai.POST("/agents/:type/activate", aiHandler.ActivateAgent)
				ai.POST("/agents/:type/deactivate", aiHandler.DeactivateAgent)
				ai.GET("/company/:companyId/agents", aiHandler.GetCompanyAIAgents)
				ai.GET("/usage/stats", aiHandler.GetAIUsageStats)
				ai.POST("/booking-assistant", aiHandler.BookingAssistantRequest)
				ai.POST("/customer-support", aiHandler.CustomerSupportRequest)
				ai.POST("/medical-vet", aiHandler.MedicalVetRequest)
				ai.POST("/analytics-narrator", aiHandler.AnalyticsNarratorRequest)
				ai.POST("/test/:agentKey", aiHandler.TestAIAgent)
			}

			// SuperAdmin endpoints
			admin := protected.Group("/admin")
			admin.Use(middleware.SuperAdminMiddleware())
			{
				// Plan management
				admin.GET("/plans", adminHandler.GetPlans)
				admin.POST("/plans", adminHandler.CreatePlan)
				admin.PUT("/plans/:id", adminHandler.UpdatePlan)
				admin.DELETE("/plans/:id", adminHandler.DeletePlan)

				// Payment settings
				admin.GET("/payment-settings", adminHandler.GetPaymentSettings)
				admin.PUT("/payment-settings", adminHandler.UpdatePaymentSettings)

				// Service categories
				admin.GET("/service-categories", adminHandler.GetServiceCategories)
				admin.POST("/service-categories", adminHandler.CreateServiceCategory)
				admin.PUT("/service-categories/:id", adminHandler.UpdateServiceCategory)
				admin.DELETE("/service-categories/:id", adminHandler.DeleteServiceCategory)

				// Pet types and breeds
				admin.GET("/pet-types", adminHandler.GetPetTypes)
				admin.POST("/pet-types", adminHandler.CreatePetType)
				admin.PUT("/pet-types/:id", adminHandler.UpdatePetType)
				admin.DELETE("/pet-types/:id", adminHandler.DeletePetType)

				admin.GET("/breeds", adminHandler.GetBreeds)
				admin.POST("/breeds", adminHandler.CreateBreed)
				admin.PUT("/breeds/:id", adminHandler.UpdateBreed)
				admin.DELETE("/breeds/:id", adminHandler.DeleteBreed)

				// Company management
				admin.GET("/companies", adminHandler.GetAllCompanies)
				admin.PUT("/companies/:id/toggle-special-partner", adminHandler.ToggleSpecialPartner)
				admin.PUT("/companies/:id/toggle-manual-crm", adminHandler.ToggleManualCRM)
				admin.PUT("/companies/:id/toggle-manual-ai", adminHandler.ToggleManualAI)
				admin.PUT("/companies/:id/block", adminHandler.BlockCompany)
				admin.PUT("/companies/:id/unblock", adminHandler.UnblockCompany)

				// Free trial management
				admin.POST("/companies/:company_id/extend-trial", adminHandler.ExtendCompanyFreeTrial)
				admin.GET("/companies/expired-trials", adminHandler.GetCompaniesWithExpiredTrials)
				admin.GET("/companies/on-trial", adminHandler.GetCompaniesOnFreeTrial)

				// Global analytics
				admin.GET("/analytics/dashboard", analyticsHandler.GetGlobalDashboard)
				admin.GET("/analytics/revenue-trends", analyticsHandler.GetGlobalRevenueTrends)
				admin.GET("/analytics/registration-trends", analyticsHandler.GetGlobalRegistrationTrends)
				admin.GET("/analytics/user-segmentation", analyticsHandler.GetGlobalUserSegmentation)
				admin.GET("/analytics/top-companies", analyticsHandler.GetTopPerformingCompanies)
				admin.GET("/analytics/service-performance", analyticsHandler.GetServiceCategoryPerformance)
				admin.GET("/analytics/pet-popularity", analyticsHandler.GetPetTypePopularity)
				admin.GET("/analytics/cohort", analyticsHandler.GetCohortAnalysis)
				admin.GET("/analytics/geographic", analyticsHandler.GetGeographicDistribution)

				// Addon management
				admin.GET("/addons", addonHandler.GetAvailableAddons)
				admin.POST("/addons", addonHandler.CreateAvailableAddon)
				admin.PUT("/addons/:id", addonHandler.UpdateAvailableAddon)

				// Company addon management
				admin.GET("/companies/:companyId/addons", addonHandler.GetCompanyAddons)
				admin.GET("/companies/:companyId/addon-summary", addonHandler.GetCompanyAddonSummary)
				admin.POST("/companies/:companyId/addons", addonHandler.AddCompanyAddon)
				admin.DELETE("/companies/:companyId/addons/:addonId", addonHandler.RemoveCompanyAddon)
				admin.GET("/companies/:companyId/addon-check", addonHandler.CheckCompanyAddon)
				admin.GET("/companies/addon-summaries", addonHandler.GetAllCompaniesAddonSummary)
			}
		}
	}

	// WebSocket endpoints for real-time chat
	r.GET("/ws/chat/:chatId", chatHandler.HandleWebSocket)

	// Webhook endpoints
	webhooks := r.Group("/webhooks")
	{
		webhooks.POST("/stripe", paymentHandler.HandleWebhook)
	}

	// Start notification cron job
	go notificationService.StartNotificationCron()

	// Get port from environment or default to 4000
	port := os.Getenv("API_PORT")
	if port == "" {
		port = "4000"
	}

	host := os.Getenv("API_HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	log.Printf("Starting Zootel Backend API on %s:%s", host, port)
	log.Printf("GraphQL Playground available at: http://%s:%s/graphql", host, port)
	log.Fatal(http.ListenAndServe(host+":"+port, r))
}
