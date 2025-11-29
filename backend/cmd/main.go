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
		log.Fatal("Failed to initialize services:", err)
	}

	// Individual services for dependency injection
	bookingService := serviceContainer.BookingService()
	chatService := serviceContainer.ChatService()

	// Initialize handlers
	userHandler := handlers.NewUserHandler(serviceContainer.UserService())
	authHandler := handlers.NewAuthHandler(serviceContainer.UserService())
	companyHandler := handlers.NewCompanyHandler(serviceContainer.CompanyService(), serviceContainer.UserService())
	serviceHandler := handlers.NewServiceHandler(serviceContainer.ServiceService())
	bookingHandler := handlers.NewBookingHandler(serviceContainer.BookingService())
	contentHandler := handlers.NewContentHandler(serviceContainer.ContentService())
	petHandler := handlers.NewPetHandler(serviceContainer.PetService())
	petMedicalHandler := handlers.NewPetMedicalHandler(serviceContainer.PetMedicalService(), serviceContainer.PetService())
	orderHandler := handlers.NewOrderHandler(serviceContainer.OrderService())
	chatHandler := handlers.NewChatHandler(serviceContainer.ChatService())
	adminHandler := handlers.NewAdminHandler(serviceContainer.AdminService())
	analyticsHandler := handlers.NewAnalyticsHandler(serviceContainer.AnalyticsService())
	addonHandler := handlers.NewAddonHandler(serviceContainer.AddonService(), db)
	integrationHandler := handlers.NewIntegrationHandler(serviceContainer.IntegrationService())
	productHandler := handlers.NewProductHandler(serviceContainer.ProductService(), serviceContainer.DeliveryService())
	uploadHandler := handlers.NewUploadHandler(serviceContainer.UploadService())
	paymentHandler := handlers.NewPaymentHandler(serviceContainer.PaymentService())
	aiHandler := handlers.NewAIHandler(serviceContainer.AIService())
	reviewHandler := handlers.NewReviewHandler(serviceContainer.ReviewService())
	employeeHandler := handlers.NewEmployeeHandler(serviceContainer.EmployeeService())
	promptHandler := handlers.NewPromptHandler(serviceContainer.PromptService())
	inventoryHandler := handlers.NewInventoryHandler(serviceContainer.InventoryService())
	currencyHandler := handlers.NewCurrencyHandler(serviceContainer.CurrencyService())
	cryptoHandler := handlers.NewCryptoHandler(serviceContainer.CryptoService())

	// Set up additional dependencies
	companyHandler.SetServices(serviceContainer.ServiceService(), serviceContainer.ProductService())
	companyHandler.SetAdminService(serviceContainer.AdminService())

	// Set up chat service dependencies
	chatService.SetBookingService(bookingService)

	// Initialize GraphQL handlers
	graphqlHandler := graphql.NewGraphQLHandler(
		serviceContainer.UserService(),
		serviceContainer.CompanyService(),
		serviceContainer.ServiceService(),
		serviceContainer.BookingService(),
		serviceContainer.PetService(),
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
			auth.GET("/me", middleware.AuthMiddleware(authClient, db), authHandler.GetMe)
			auth.GET("/users", middleware.AuthMiddleware(authClient, db), middleware.SuperAdminMiddleware(), authHandler.GetUsers)
			auth.GET("/search-users", middleware.AuthMiddleware(authClient, db), middleware.SuperAdminMiddleware(), authHandler.SearchUsers)
		}

		// Public marketplace endpoints
		marketplace := api.Group("/marketplace")
		{
			marketplace.GET("/companies", companyHandler.GetPublicCompanies)
			marketplace.GET("/companies/:id", companyHandler.GetPublicCompany)
			marketplace.GET("/services", companyHandler.GetPublicServices)
			marketplace.GET("/services/discounts", serviceHandler.GetActiveDiscountServices)
			marketplace.GET("/products", companyHandler.GetPublicProducts)
			marketplace.GET("/categories", companyHandler.GetServiceCategoriesWithCounts)
			marketplace.GET("/business-types", companyHandler.GetBusinessTypes)
			marketplace.GET("/plans", adminHandler.GetPublicPlans)
			marketplace.GET("/search", companyHandler.Search)
		}

		// Public endpoints for marketplace
		public := api.Group("/public")
		{
			// Marketplace data
			public.GET("/marketplace", companyHandler.GetMarketplaceData)
			public.GET("/categories", companyHandler.GetServiceCategories)

			// Content endpoints
			public.GET("/careers", contentHandler.GetPublicCareers)
			public.GET("/careers/:id", contentHandler.GetCareerByID)
			public.GET("/press", contentHandler.GetPublicPressReleases)
			public.GET("/press/:id", contentHandler.GetPressReleaseByID)
			public.GET("/blog", contentHandler.GetPublicBlogPosts)
			public.GET("/blog/:slug", contentHandler.GetBlogPostBySlug)

			// Company endpoints
			publicCompanies := public.Group("/companies")
			{
				publicCompanies.GET("/", companyHandler.GetPublicCompanies)
				publicCompanies.GET("/cities", companyHandler.GetCompanyCities)
				publicCompanies.GET("/:companyId", companyHandler.GetPublicCompany)
				publicCompanies.GET("/:companyId/services", companyHandler.GetPublicServices)
				publicCompanies.GET("/:companyId/products", companyHandler.GetPublicProducts)
			}
		}

		// Public integration endpoints (for website widgets)
		integration := api.Group("/integration")
		{
			integration.POST("/validate-key", integrationHandler.ValidateAPIKey)
			integration.GET("/domain-access", integrationHandler.CheckDomainAccess)
			integration.POST("/record-interaction", integrationHandler.RecordWidgetInteraction)
		}

		// Public currency endpoints
		currencies := api.Group("/currencies")
		{
			currencies.GET("/", currencyHandler.GetCurrencies)
			currencies.GET("/:code", currencyHandler.GetCurrency)
			currencies.POST("/convert", currencyHandler.ConvertCurrency)
		}

		// Public crypto payment endpoints
		crypto := api.Group("/crypto")
		{
			crypto.GET("/currencies", cryptoHandler.GetCryptoCurrencies)
			crypto.GET("/currencies/:currency/networks", cryptoHandler.GetCryptoNetworks)
			crypto.GET("/estimate", cryptoHandler.EstimateCryptoAmount)
			crypto.GET("/payment-methods", cryptoHandler.GetPaymentMethods)
		}

		// Protected routes requiring authentication
		protected := api.Group("/")
		if authClient != nil {
			protected.Use(middleware.AuthMiddleware(authClient, db))
		} else {
			log.Printf("Warning: Firebase Auth client is nil - protected routes will not have auth middleware")
			// Temporary: Don't fail, just log warning for testing
		}
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
				pets.GET("/:petId", petHandler.GetPet)
				pets.PUT("/:petId", petHandler.UpdatePet)
				pets.DELETE("/:petId", petHandler.DeletePet)
				pets.POST("/:petId/upload-photo", uploadHandler.UploadPetPhoto)

				// Pet medical records
				pets.POST("/:petId/vaccinations", petMedicalHandler.CreateVaccination)
				pets.GET("/:petId/vaccinations", petMedicalHandler.GetPetVaccinations)
				pets.PUT("/:petId/vaccinations/:vaccinationId", petMedicalHandler.UpdateVaccination)
				pets.DELETE("/:petId/vaccinations/:vaccinationId", petMedicalHandler.DeleteVaccination)

				pets.POST("/:petId/medications", petMedicalHandler.CreateMedication)
				pets.GET("/:petId/medications", petMedicalHandler.GetPetMedications)
				pets.PUT("/:petId/medications/:medicationId", petMedicalHandler.UpdateMedication)
				pets.DELETE("/:petId/medications/:medicationId", petMedicalHandler.DeleteMedication)

				pets.GET("/:petId/medical-history", petMedicalHandler.GetPetMedicalHistory)
				pets.PUT("/:petId/medical-history", petMedicalHandler.UpdateMedicalHistory)
				pets.PUT("/:petId/extended-profile", petMedicalHandler.UpdatePetExtendedProfile)

				// Pet photo gallery
				pets.POST("/:petId/photos", petHandler.AddPetPhoto)
				pets.DELETE("/:petId/photos", petHandler.RemovePetPhoto)
				pets.PUT("/:petId/main-photo", petHandler.UpdatePetMainPhoto)
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

				// AI-powered booking endpoints
				bookings.POST("/ai-booking", bookingHandler.ProcessAIBooking)
				bookings.POST("/auto-assign", bookingHandler.AutoAssignBooking)
				bookings.GET("/find-employee", bookingHandler.FindAvailableEmployees)
				bookings.GET("/alternatives", bookingHandler.GetAlternativeSlots)
				bookings.POST("/confirm-alternative", bookingHandler.ConfirmAlternativeBooking)

				// Customer pet medical data endpoints (for companies)
				bookings.GET("/customer-pets/:petId/medical-data", bookingHandler.GetCustomerPetMedicalData)
				bookings.GET("/customer-pets/:petId/vaccinations", bookingHandler.GetCustomerPetVaccinations)
				bookings.GET("/customer-pets/:petId/medications", bookingHandler.GetCustomerPetMedications)
			}

			// Review endpoints
			reviews := protected.Group("/reviews")
			{
				// User review endpoints
				reviews.POST("/", reviewHandler.CreateReview)                            // Create a review
				reviews.GET("/my", reviewHandler.GetUserReviews)                         // Get user's reviews
				reviews.GET("/reviewable-bookings", reviewHandler.GetReviewableBookings) // Get bookings that can be reviewed
				reviews.GET("/reviewable-orders", reviewHandler.GetReviewableOrders)     // Get orders that can be reviewed
				reviews.DELETE("/:reviewId", reviewHandler.DeleteReview)                 // Delete user's own review

				// Public review endpoints (no auth needed)
				reviews.GET("/:reviewId", reviewHandler.GetReview)                            // Get specific review
				reviews.GET("/company/:companyId", reviewHandler.GetCompanyReviews)           // Get company reviews
				reviews.GET("/company/:companyId/stats", reviewHandler.GetCompanyReviewStats) // Get company review stats

				// Company response endpoints
				reviews.POST("/respond", reviewHandler.RespondToReview) // Company responds to review
			}

			// Employee Management System
			employees := protected.Group("/employees")
			{
				// Employee authentication (no middleware required)
				employees.POST("/login", employeeHandler.LoginEmployee)
				employees.POST("/logout", employeeHandler.LogoutEmployee)

				// Employee profile endpoints (employee auth required)
				profileGroup := employees.Group("/")
				profileGroup.Use(middleware.EmployeeAuthMiddleware(serviceContainer.EmployeeService()))
				{
					profileGroup.GET("/profile", employeeHandler.GetEmployeeProfile)
					profileGroup.GET("/dashboard", employeeHandler.GetEmployeeDashboard)
					profileGroup.GET("/check-permission/:permission", employeeHandler.CheckPermission)
				}

				// Employee management (requires manage_employees permission)
				management := employees.Group("/manage")
				management.Use(middleware.EmployeeAuthMiddleware(serviceContainer.EmployeeService()))
				management.Use(middleware.RequirePermission("manage_employees"))
				{
					management.POST("/", employeeHandler.CreateEmployee)
					management.GET("/", employeeHandler.GetCompanyEmployees)
					management.GET("/:employeeId", employeeHandler.GetEmployee)
					management.PUT("/:employeeId", employeeHandler.UpdateEmployee)
					management.PUT("/:employeeId/permissions", employeeHandler.UpdateEmployeePermissions)
					management.DELETE("/:employeeId", employeeHandler.DeactivateEmployee)
				}

				// Reference data (employee auth required)
				reference := employees.Group("/reference")
				reference.Use(middleware.EmployeeAuthMiddleware(serviceContainer.EmployeeService()))
				{
					reference.GET("/permissions", employeeHandler.GetAvailablePermissions)
					reference.GET("/roles", employeeHandler.GetAvailableRoles)
				}
			}

			// Admin review moderation endpoints

			// Order endpoints
			orders := protected.Group("/orders")
			{
				orders.GET("/", orderHandler.GetUserOrders)
				orders.POST("/", orderHandler.CreateOrder)
				orders.GET("/:id", orderHandler.GetOrder)
				orders.PUT("/:id", orderHandler.UpdateOrder)
				orders.DELETE("/:id", orderHandler.CancelOrder)
			}

			// Crypto payment endpoints
			cryptoPayments := protected.Group("/crypto-payments")
			{
				cryptoPayments.POST("/", cryptoHandler.CreateCryptoPayment)
				cryptoPayments.GET("/:payment_id/status", cryptoHandler.GetCryptoPaymentStatus)
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
				uploads.POST("/category/:categoryId/image", uploadHandler.UploadCategoryImage)
				uploads.POST("/company/:companyId/logo", uploadHandler.UploadCompanyLogo)
				uploads.POST("/gallery", uploadHandler.UploadGallery)
				uploads.POST("/temp", uploadHandler.UploadTempImage)
				uploads.GET("/files", uploadHandler.GetFiles)
				uploads.DELETE("/files/:fileId", uploadHandler.DeleteFile)
				uploads.GET("/files/:fileId", uploadHandler.GetFileInfo)
			}

			// Addon endpoints
			addons := protected.Group("/addons")
			{
				addons.GET("/available", addonHandler.GetAvailableAddons)
			}

			// Company registration endpoint (before CompanyOwnerMiddleware)
			protected.POST("/companies/register", companyHandler.RegisterCompany)

			// Company addon endpoints
			companies := protected.Group("/companies")
			companies.Use(middleware.CompanyOwnerMiddleware(serviceContainer.UserService()))
			{
				companies.GET("/trial-status", companyHandler.GetCompanyTrialStatus)
				companies.GET("/profile", companyHandler.GetCompanyProfile)
				companies.PUT("/profile", companyHandler.UpdateCompanyProfile)
				companies.PUT("/business-type", companyHandler.UpdateBusinessType)
				// companies.GET("/business-types", companyHandler.GetBusinessTypes) // Moved to public marketplace
				companies.POST("/upload-logo", companyHandler.UploadLogo)
				companies.POST("/upload-media", companyHandler.UploadMedia)
				companies.POST("/upload-gallery", uploadHandler.UploadGallery)

				// Services management
				companies.GET("/services", serviceHandler.GetCompanyServices)
				companies.POST("/services", serviceHandler.CreateService)
				companies.PUT("/services/:serviceId", serviceHandler.UpdateService)
				companies.GET("/services/:serviceId/booking-count", serviceHandler.GetServiceBookingCount)
				companies.DELETE("/services/:serviceId", serviceHandler.DeleteService)
				companies.POST("/services/:serviceId/upload-image", serviceHandler.UploadServiceImage)
				companies.DELETE("/services/:serviceId/images/:imageId", serviceHandler.DeleteServiceImage)
				companies.GET("/service-categories", adminHandler.GetServiceCategories)
				companies.GET("/pet-types", adminHandler.GetPetTypes)

				// Products management - Add product handler
				companies.GET("/products", productHandler.GetCompanyProducts)
				companies.POST("/products", productHandler.CreateProduct)
				companies.PUT("/products/:productId", productHandler.UpdateProduct)
				companies.DELETE("/products/:productId", productHandler.DeleteProduct)

				// Company bookings and orders
				companies.GET("/bookings", bookingHandler.GetCompanyBookings)
				companies.POST("/bookings", bookingHandler.CreateCompanyBooking)
				companies.PUT("/bookings/:id/status", bookingHandler.UpdateBookingStatus)
				companies.GET("/orders", orderHandler.GetCompanyOrders)
				companies.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)

				// Company chats
				companies.GET("/chats", chatHandler.GetCompanyChats)

				// Analytics
				companies.GET("/analytics", analyticsHandler.GetCompanyAnalytics)
				companies.GET("/analytics/dashboard", analyticsHandler.GetCompanyDashboard)
				companies.GET("/analytics/revenue", analyticsHandler.GetCompanyRevenue)
				companies.GET("/analytics/bookings", analyticsHandler.GetCompanyBookingAnalytics)
				companies.GET("/analytics/customers", analyticsHandler.GetCompanyCustomerAnalytics)
				companies.GET("/analytics/repeat-orders", analyticsHandler.GetRepeatOrdersAnalytics)
				companies.GET("/analytics/cancellations", analyticsHandler.GetCancellationAnalytics)
				companies.GET("/analytics/refunds", analyticsHandler.GetRefundAnalytics)
				companies.GET("/analytics/team-workload", analyticsHandler.GetTeamWorkloadAnalytics)
				companies.GET("/analytics/average-check", analyticsHandler.GetAverageCheckTrends)
				companies.GET("/analytics/customer-segmentation", analyticsHandler.GetCustomerSegmentationAnalytics)
				companies.GET("/analytics/customer-location", analyticsHandler.GetCompanyCustomerLocationStats)

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

				// Customer Data Access for Companies
				companies.GET("/:companyId/customers", bookingHandler.GetCompanyCustomers)
				companies.GET("/:companyId/customers/:userId/history", bookingHandler.GetCustomerBookingHistory)
				companies.GET("/:companyId/bookings/with-customer-data", bookingHandler.GetBookingsWithCustomerData)

				// Company Addons
				companies.GET("/addons", addonHandler.GetCompanyAddons)
				companies.POST("/addons/purchase", addonHandler.PurchaseAddon)
				companies.DELETE("/addons/:id/cancel", addonHandler.CancelAddon)

				// Inventory Management
				companies.GET("/inventory", inventoryHandler.GetCompanyInventory)
				companies.POST("/inventory", inventoryHandler.CreateProduct)
				companies.GET("/inventory/:id", inventoryHandler.GetProduct)
				companies.PUT("/inventory/:id", inventoryHandler.UpdateProduct)
				companies.DELETE("/inventory/:id", inventoryHandler.DeleteProduct)
				companies.POST("/inventory/:id/stock", inventoryHandler.UpdateStock)
				companies.GET("/inventory/:id/transactions", inventoryHandler.GetInventoryTransactions)
				companies.GET("/inventory/alerts", inventoryHandler.GetInventoryAlerts)
				companies.PUT("/inventory/alerts/:alertId/read", inventoryHandler.MarkAlertAsRead)
				companies.GET("/inventory/stats", inventoryHandler.GetInventoryStats)

				// Employee Management for Company Owners
				companies.POST("/employees", employeeHandler.CreateEmployee)
				companies.GET("/employees", employeeHandler.GetCompanyEmployees)
				companies.GET("/employees/:employeeId", employeeHandler.GetEmployee)
				companies.PUT("/employees/:employeeId", employeeHandler.UpdateEmployee)
				companies.PUT("/employees/:employeeId/permissions", employeeHandler.UpdateEmployeePermissions)
				companies.DELETE("/employees/:employeeId", employeeHandler.DeactivateEmployee)
				companies.GET("/employees/reference/permissions", employeeHandler.GetAvailablePermissions)
				companies.GET("/employees/reference/roles", employeeHandler.GetAvailableRoles)
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

				// Addon pricing management
				admin.GET("/addon-pricing", adminHandler.GetAddonPricing)
				admin.POST("/addon-pricing", adminHandler.CreateAddonPricing)
				admin.PUT("/addon-pricing/:id", adminHandler.UpdateAddonPricing)
				admin.DELETE("/addon-pricing/:id", adminHandler.DeleteAddonPricing)

				// Content management
				// Careers
				admin.GET("/careers", contentHandler.GetCareers)
				admin.POST("/careers", contentHandler.CreateCareer)
				admin.PUT("/careers/:id", contentHandler.UpdateCareer)
				admin.DELETE("/careers/:id", contentHandler.DeleteCareer)
				admin.GET("/careers/:id", contentHandler.GetCareerByID)

				// Press releases
				admin.GET("/press", contentHandler.GetPressReleases)
				admin.POST("/press", contentHandler.CreatePressRelease)
				admin.PUT("/press/:id", contentHandler.UpdatePressRelease)
				admin.DELETE("/press/:id", contentHandler.DeletePressRelease)
				admin.GET("/press/:id", contentHandler.GetPressReleaseByID)

				// Blog posts
				admin.GET("/blog", contentHandler.GetBlogPosts)
				admin.POST("/blog", contentHandler.CreateBlogPost)
				admin.PUT("/blog/:id", contentHandler.UpdateBlogPost)
				admin.DELETE("/blog/:id", contentHandler.DeleteBlogPost)
				admin.GET("/blog/:id", contentHandler.GetBlogPostByID)

				// Payment settings
				admin.GET("/payment-settings", adminHandler.GetPaymentSettings)
				admin.PUT("/payment-settings", adminHandler.UpdatePaymentSettings)

				// Service categories
				admin.GET("/service-categories", adminHandler.GetServiceCategories)
				admin.POST("/service-categories", adminHandler.CreateServiceCategory)
				admin.PUT("/service-categories/:id", adminHandler.UpdateServiceCategory)
				admin.DELETE("/service-categories/:id", adminHandler.DeleteServiceCategory)

				// Business types management
				admin.GET("/business-types", adminHandler.GetBusinessTypes)
				admin.POST("/business-types", adminHandler.CreateBusinessType)
				admin.PUT("/business-types/:id", adminHandler.UpdateBusinessType)
				admin.DELETE("/business-types/:id", adminHandler.DeleteBusinessType)

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
				admin.PUT("/companies/:companyId/toggle-special-partner", adminHandler.ToggleSpecialPartner)
				admin.PUT("/companies/:companyId/toggle-manual-crm", adminHandler.ToggleManualCRM)
				admin.PUT("/companies/:companyId/toggle-manual-ai", adminHandler.ToggleManualAI)
				admin.PUT("/companies/:companyId/block", adminHandler.BlockCompany)
				admin.PUT("/companies/:companyId/unblock", adminHandler.UnblockCompany)

				// Company feature status and permissions
				admin.GET("/companies/:companyId/feature-status", adminHandler.GetCompanyFeatureStatus)
				admin.GET("/companies/:companyId/check-crm-toggle", adminHandler.CheckCRMTogglePermission)
				admin.GET("/companies/:companyId/check-ai-toggle", adminHandler.CheckAITogglePermission)
				admin.GET("/companies/:companyId/check-agent-deactivate/:agentKey", adminHandler.CheckAgentDeactivatePermission)

				// Free trial management
				admin.POST("/companies/:companyId/extend-trial", adminHandler.ExtendCompanyFreeTrial)
				admin.GET("/companies/expired-trials", adminHandler.GetCompaniesWithExpiredTrials)
				admin.GET("/companies/on-trial", adminHandler.GetCompaniesOnFreeTrial)
				admin.POST("/companies/activate-subscription", gin.WrapF(adminHandler.ActivateCompanySubscription))
				admin.POST("/process-expired-trials", gin.WrapF(adminHandler.ProcessExpiredTrials))
				admin.GET("/companies/trial-expiring", gin.WrapF(adminHandler.GetTrialExpiringCompanies))

				// Global analytics
				admin.GET("/analytics/dashboard", analyticsHandler.GetGlobalDashboard)
				admin.GET("/analytics/revenue-trends", analyticsHandler.GetGlobalRevenueTrends)
				admin.GET("/analytics/registration-trends", analyticsHandler.GetGlobalRegistrationTrends)
				admin.GET("/analytics/user-segmentation", analyticsHandler.GetGlobalUserSegmentation)
				admin.GET("/analytics/top-companies", analyticsHandler.GetTopPerformingCompanies)
				admin.GET("/analytics/service-performance", analyticsHandler.GetServiceCategoryPerformance)
				admin.GET("/analytics/pet-popularity", analyticsHandler.GetPetTypePopularity)
				admin.GET("/analytics/cohort", analyticsHandler.GetCohortAnalytics)
				admin.GET("/analytics/geographic", analyticsHandler.GetGeographicDistribution)

				// New advanced analytics endpoints
				admin.GET("/analytics/segments", analyticsHandler.GetSegmentAnalytics)
				admin.GET("/analytics/funnel", analyticsHandler.GetFunnelAnalytics)
				admin.GET("/analytics/recent-activity", analyticsHandler.GetRecentActivity)
				admin.GET("/analytics/key-metrics", analyticsHandler.GetKeyMetrics)
				admin.GET("/analytics/platform-status", analyticsHandler.GetPlatformStatus)

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

				// Admin addon management (addon-pricing moved to adminHandler above)
				admin.POST("/companies/:companyId/addons/enable", addonHandler.ManuallyEnableAddon)
				admin.POST("/addon-billing/process", addonHandler.ProcessBilling)

				// Regional Analytics for SuperAdmin
				admin.GET("/analytics/regional", analyticsHandler.GetRegionalRegistrations)
				admin.GET("/analytics/users/phone-data", analyticsHandler.GetAllUsersPhoneData)
				admin.GET("/analytics/users/country/:country", analyticsHandler.GetUsersByCountry)

				// Enhanced Location Analytics for SuperAdmin
				admin.GET("/analytics/location/overview", analyticsHandler.GetUserLocationAnalytics)
				admin.GET("/analytics/location/detailed", analyticsHandler.GetDetailedUserLocationReport)
				admin.GET("/analytics/location/trends", analyticsHandler.GetLocationTrends)

				// Discount management
				admin.POST("/services/expire-sales", serviceHandler.ExpireOutdatedSales)

				// Admin AI Agents Management
				admin.GET("/ai-agents", adminHandler.GetAllCompaniesAIAgents)
				admin.GET("/ai-agents/:company_id", adminHandler.GetCompanyAIAgents)
				admin.POST("/ai-agents/activate", adminHandler.ActivateAgentForCompany)
				admin.DELETE("/ai-agents/deactivate", adminHandler.DeactivateAgentForCompany)
				admin.GET("/ai-agents/available", adminHandler.GetAvailableAIAgents)
				admin.PUT("/ai-agents/:agentKey/pricing", adminHandler.UpdateAIAgentPricing)
				admin.POST("/ai-agents", adminHandler.CreateAIAgent)
				admin.DELETE("/ai-agents/:agentKey", adminHandler.DeleteAIAgent)

				// AI prompts management for admins
				admin.GET("/prompts", promptHandler.GetGlobalPrompts)
				admin.POST("/prompts", promptHandler.CreateGlobalPrompt)
				admin.PUT("/prompts/:id", promptHandler.UpdateGlobalPrompt)

				// Currency management for admins
				admin.GET("/currencies", currencyHandler.GetAllCurrencies)
				admin.POST("/currencies", currencyHandler.CreateCurrency)
				admin.PUT("/currencies/:code", currencyHandler.UpdateCurrency)
				admin.DELETE("/currencies/:code", currencyHandler.DeleteCurrency)
				admin.PUT("/currencies/:code/toggle", currencyHandler.ToggleCurrencyStatus)
				admin.PUT("/currencies/:code/set-base", currencyHandler.SetBaseCurrency)
				admin.POST("/currencies/update-rates", currencyHandler.UpdateExchangeRates)
			}
		}
	}

	// WebSocket endpoints for real-time chat
	r.GET("/ws/chat/:chatId", chatHandler.HandleWebSocket)

	// Webhook endpoints
	webhooks := r.Group("/webhooks")
	{
		webhooks.POST("/stripe", paymentHandler.HandleWebhook)
		webhooks.POST("/nowpayments", cryptoHandler.WebhookHandler)
	}

	// Start notification cron job
	go serviceContainer.NotificationService().StartNotificationCron()

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
