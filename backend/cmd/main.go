package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"zootel-backend/internal/database"
	"zootel-backend/internal/handlers"
	"zootel-backend/internal/middleware"
	"zootel-backend/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize services
	userService := services.NewUserService(db)
	companyService := services.NewCompanyService(db)
	petService := services.NewPetService(db)
	bookingService := services.NewBookingService(db)
	orderService := services.NewOrderService(db)
	chatService := services.NewChatService(db)
	paymentService := services.NewPaymentService(db)
	aiService := services.NewAIService(db)
	analyticsService := services.NewAnalyticsService(db)
	notificationService := services.NewNotificationService(db)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService)
	companyHandler := handlers.NewCompanyHandler(companyService)
	petHandler := handlers.NewPetHandler(petService)
	bookingHandler := handlers.NewBookingHandler(bookingService)
	orderHandler := handlers.NewOrderHandler(orderService)
	chatHandler := handlers.NewChatHandler(chatService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	aiHandler := handlers.NewAIHandler(aiService)
	adminHandler := handlers.NewAdminHandler(userService, companyService)
	authHandler := handlers.NewAuthHandler(userService)

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

	// Basic health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "zootel-backend",
		})
	})

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

		// Protected routes requiring authentication
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// User profile endpoints
			users := protected.Group("/users")
			{
				users.GET("/profile", userHandler.GetProfile)
				users.PUT("/profile", userHandler.UpdateProfile)
				users.DELETE("/profile", userHandler.DeleteProfile)
				users.POST("/upload-avatar", userHandler.UploadAvatar)
			}

			// Pet management endpoints
			pets := protected.Group("/pets")
			{
				pets.GET("/", petHandler.GetUserPets)
				pets.POST("/", petHandler.CreatePet)
				pets.GET("/:id", petHandler.GetPet)
				pets.PUT("/:id", petHandler.UpdatePet)
				pets.DELETE("/:id", petHandler.DeletePet)
				pets.POST("/:id/upload-photo", petHandler.UploadPetPhoto)
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
				chats.GET("/:id/messages", chatHandler.GetMessages)
				chats.POST("/:id/messages", chatHandler.SendMessage)
			}

			// Payment endpoints
			payments := protected.Group("/payments")
			{
				payments.POST("/create-intent", paymentHandler.CreatePaymentIntent)
				payments.POST("/confirm", paymentHandler.ConfirmPayment)
				payments.GET("/history", paymentHandler.GetPaymentHistory)
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
				companies.GET("/analytics", analyticsService.GetCompanyAnalytics)
			}

			// AI endpoints
			ai := protected.Group("/ai")
			{
				ai.POST("/chat", aiHandler.ProcessMessage)
				ai.GET("/agents", aiHandler.GetAvailableAgents)
				ai.POST("/agents/:type/activate", aiHandler.ActivateAgent)
				ai.POST("/agents/:type/deactivate", aiHandler.DeactivateAgent)
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

				// Global analytics
				admin.GET("/analytics", analyticsService.GetGlobalAnalytics)
				admin.GET("/analytics/registrations", analyticsService.GetRegistrationAnalytics)
				admin.GET("/analytics/bookings", analyticsService.GetBookingAnalytics)
			}
		}
	}

	// WebSocket endpoints for real-time chat
	r.GET("/ws/chat/:chatId", chatHandler.HandleWebSocket)

	// Webhook endpoints
	webhooks := r.Group("/webhooks")
	{
		webhooks.POST("/stripe", paymentHandler.StripeWebhook)
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
	log.Fatal(http.ListenAndServe(host+":"+port, r))
}
