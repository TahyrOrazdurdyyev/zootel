package services

import (
	"database/sql"
	"log"
	"os"
	"sync"
)

// ServiceContainer manages all application services with dependency injection
type ServiceContainer struct {
	db *sql.DB
	mu sync.RWMutex

	// Services
	userService         *UserService
	companyService      *CompanyService
	serviceService      *ServiceService
	productService      *ProductService
	deliveryService     *DeliveryService
	bookingService      *BookingService
	petService          *PetService
	petMedicalService   *PetMedicalService
	orderService        *OrderService
	chatService         *ChatService
	aiService           *AIService
	paymentService      *PaymentService
	notificationService *NotificationService
	analyticsService    *AnalyticsService
	adminService        *AdminService
	addonService        *AddonService
	integrationService  IntegrationServiceInterface
	cartService         CartServiceInterface
	demoService         *DemoService
	emailService        *EmailService
	smsService          *SMSService
	webhookService      *WebhookService
	uploadService       *UploadService
	reviewService       *ReviewService
	employeeService     *EmployeeService
	promptService       *PromptService
	inventoryService    *InventoryService

	// Service initialization status
	initialized map[string]bool
}

// NewServiceContainer creates a new service container
func NewServiceContainer(db *sql.DB) *ServiceContainer {
	// Initialize basic services first (no dependencies)
	userService := NewUserService(db)
	companyService := NewCompanyService(db)
	serviceService := NewServiceService(db)
	petService := NewPetService(db)
	petMedicalService := NewPetMedicalService(db)
	uploadService := NewUploadService(db)
	integrationService := NewIntegrationService(db)
	cartService := NewCartService(db)
	demoService := NewDemoService(db)
	adminService := NewAdminService(db)
	analyticsService := NewAnalyticsService(db)
	paymentService := NewPaymentService(db)
	orderService := NewOrderService(db)
	reviewService := NewReviewService(db)
	employeeService := NewEmployeeService(db)
	promptService := NewPromptService(db)

	// Initialize services with dependencies
	emailService := NewEmailService(db)
	smsService := NewSMSService(db)
	webhookService := NewWebhookService(db)

	// Notification service needs webhook URL
	notificationService := NewNotificationService(db, os.Getenv("FCM_SERVER_KEY"))

	// Booking service needs notification services
	bookingService := NewBookingService(db, notificationService, emailService, smsService)

	// Addon service needs payment service
	addonService := NewAddonService(db, paymentService)

	// AI service needs prompt service
	aiService := NewAIService(db, promptService)

	// Chat service needs AI service
	chatService := NewChatService(db, aiService)

	// Inventory service (no dependencies)
	inventoryService := NewInventoryService(db)

	return &ServiceContainer{
		db:                  db,
		initialized:         make(map[string]bool),
		userService:         userService,
		companyService:      companyService,
		serviceService:      serviceService,
		bookingService:      bookingService,
		petService:          petService,
		petMedicalService:   petMedicalService,
		notificationService: notificationService,
		emailService:        emailService,
		smsService:          smsService,
		webhookService:      webhookService,
		uploadService:       uploadService,
		addonService:        addonService,
		integrationService:  integrationService,
		cartService:         cartService,
		demoService:         demoService,
		adminService:        adminService,
		analyticsService:    analyticsService,
		paymentService:      paymentService,
		orderService:        orderService,
		chatService:         chatService,
		reviewService:       reviewService,
		employeeService:     employeeService,
		promptService:       promptService,
		inventoryService:    inventoryService,
	}
}

// InitializeServices initializes all services with proper dependency injection
func (c *ServiceContainer) InitializeServices() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	log.Println("Initializing services...")

	// Initialize core services first
	c.userService = NewUserService(c.db)
	c.initialized["user"] = true

	c.companyService = NewCompanyService(c.db)
	c.initialized["company"] = true

	c.serviceService = NewServiceService(c.db)
	c.initialized["service"] = true

	c.productService = NewProductService(c.db)
	c.initialized["product"] = true

	c.deliveryService = NewDeliveryService(c.db)
	c.initialized["delivery"] = true

	c.petService = NewPetService(c.db)
	c.initialized["pet"] = true

	c.petMedicalService = NewPetMedicalService(c.db)
	c.initialized["petMedical"] = true

	c.paymentService = NewPaymentService(c.db)
	c.initialized["payment"] = true

	c.aiService = NewAIService(c.db, c.promptService)
	c.initialized["ai"] = true

	c.analyticsService = NewAnalyticsService(c.db)
	c.initialized["analytics"] = true

	c.adminService = NewAdminService(c.db)
	c.initialized["admin"] = true

	// Initialize notification service with credential file
	c.notificationService = NewNotificationService(c.db, "")
	c.initialized["notification"] = true

	// Initialize email and SMS services
	c.emailService = NewEmailService(c.db)
	c.initialized["email"] = true

	c.smsService = NewSMSService(c.db)
	c.initialized["sms"] = true

	// Initialize services that depend on notification/email/sms
	c.bookingService = NewBookingService(c.db, c.notificationService, c.emailService, c.smsService)
	c.initialized["booking"] = true

	c.chatService = NewChatService(c.db, c.aiService)
	c.initialized["chat"] = true

	c.orderService = NewOrderService(c.db)
	c.initialized["order"] = true

	c.addonService = NewAddonService(c.db, c.PaymentService())
	c.initialized["addon"] = true

	c.integrationService = NewIntegrationService(c.db)
	c.initialized["integration"] = true

	c.cartService = NewCartService(c.db)
	c.initialized["cart"] = true

	c.demoService = NewDemoService(c.db)
	c.initialized["demo"] = true

	c.webhookService = NewWebhookService(c.db)
	c.initialized["webhook"] = true

	c.uploadService = NewUploadService(c.db)
	c.initialized["upload"] = true

	c.reviewService = NewReviewService(c.db)
	c.initialized["review"] = true

	c.employeeService = NewEmployeeService(c.db)
	c.initialized["employee"] = true

	log.Println("All services initialized successfully")
	return nil
}

// Service Getters
func (c *ServiceContainer) UserService() *UserService {
	return c.userService
}

func (c *ServiceContainer) CompanyService() *CompanyService {
	return c.companyService
}

func (c *ServiceContainer) ServiceService() *ServiceService {
	return c.serviceService
}

func (c *ServiceContainer) ProductService() *ProductService {
	return c.productService
}

func (c *ServiceContainer) DeliveryService() *DeliveryService {
	return c.deliveryService
}

func (c *ServiceContainer) BookingService() *BookingService {
	return c.bookingService
}

func (c *ServiceContainer) PetService() *PetService {
	return c.petService
}

func (c *ServiceContainer) PetMedicalService() *PetMedicalService {
	return c.petMedicalService
}

func (c *ServiceContainer) OrderService() *OrderService {
	return c.orderService
}

func (c *ServiceContainer) ChatService() *ChatService {
	return c.chatService
}

func (c *ServiceContainer) AIService() *AIService {
	return c.aiService
}

func (c *ServiceContainer) PaymentService() *PaymentService {
	return c.paymentService
}

func (c *ServiceContainer) NotificationService() *NotificationService {
	return c.notificationService
}

func (c *ServiceContainer) AnalyticsService() *AnalyticsService {
	return c.analyticsService
}

func (c *ServiceContainer) AdminService() *AdminService {
	return c.adminService
}

func (c *ServiceContainer) AddonService() *AddonService {
	return c.addonService
}

func (c *ServiceContainer) IntegrationService() IntegrationServiceInterface {
	return c.integrationService
}

func (c *ServiceContainer) CartService() CartServiceInterface {
	return c.cartService
}

func (c *ServiceContainer) DemoService() *DemoService {
	return c.demoService
}

func (c *ServiceContainer) EmailService() *EmailService {
	return c.emailService
}

func (c *ServiceContainer) SMSService() *SMSService {
	return c.smsService
}

func (c *ServiceContainer) WebhookService() *WebhookService {
	return c.webhookService
}

func (c *ServiceContainer) UploadService() *UploadService {
	return c.uploadService
}

func (c *ServiceContainer) ReviewService() *ReviewService {
	return c.reviewService
}

func (c *ServiceContainer) EmployeeService() *EmployeeService {
	return c.employeeService
}

func (c *ServiceContainer) PromptService() *PromptService {
	return c.promptService
}

func (c *ServiceContainer) InventoryService() *InventoryService {
	return c.inventoryService
}

// Cleanup method
func (c *ServiceContainer) Cleanup() {
	log.Println("Services cleanup completed")
}
