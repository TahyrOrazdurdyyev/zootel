package services

import (
	"database/sql"
	"log"
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
	bookingService      *BookingService
	petService          *PetService
	orderService        *OrderService
	chatService         *ChatService
	aiService           *AIService
	paymentService      *PaymentService
	notificationService *NotificationService
	analyticsService    *AnalyticsService
	adminService        *AdminService
	addonService        AddonServiceInterface
	integrationService  IntegrationServiceInterface
	cartService         CartServiceInterface
	demoService         *DemoService
	emailService        *EmailService
	smsService          *SMSService
	webhookService      *WebhookService
	uploadService       *UploadService

	// Service initialization status
	initialized map[string]bool
}

// NewServiceContainer creates a new service container
func NewServiceContainer(db *sql.DB) *ServiceContainer {
	return &ServiceContainer{
		db:          db,
		initialized: make(map[string]bool),
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

	c.petService = NewPetService(c.db)
	c.initialized["pet"] = true

	c.paymentService = NewPaymentService(c.db)
	c.initialized["payment"] = true

	c.aiService = NewAIService(c.db)
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

	c.addonService = NewAddonService(c.db)
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

func (c *ServiceContainer) BookingService() *BookingService {
	return c.bookingService
}

func (c *ServiceContainer) PetService() *PetService {
	return c.petService
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

func (c *ServiceContainer) AddonService() AddonServiceInterface {
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

// Cleanup method
func (c *ServiceContainer) Cleanup() {
	log.Println("Services cleanup completed")
}
