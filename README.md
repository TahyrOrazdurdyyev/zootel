# 🐾 Zootel - Pet Care Services Platform

Zootel is a comprehensive SaaS platform for managing Pet Care businesses (veterinary clinics, grooming, pet boarding, hotels, walking, nutrition, and accessories) with CRM for companies, marketplace for customers, and mobile applications for Pet Owners and Business Management.

## 🏗️ Project Architecture

```
zootel/
├── backend/           # Go API server with PostgreSQL
├── frontend/          # React web application
├── mobile-business/   # React Native app for businesses
├── mobile-pet-owner/  # React Native app for pet owners
├── docs/             # Project documentation
└── scripts/          # Setup and deployment scripts
```

## ✨ Key Features

### 🏢 **Business Management (CRM)**
- Company registration and profile management
- Employee management with RBAC permissions
- Service and product catalog management
- Booking and order management
- Real-time chat with customers
- Analytics and reporting
- AI-powered assistants

### 🛒 **Customer Marketplace**
- Browse and search pet care services
- Book appointments and order products
- Pet profile management with medical records
- Shopping cart and checkout
- Payment processing (Stripe + offline)
- Chat with service providers
- Review and rating system

### 📱 **Mobile Applications**
- **Pet Owner App**: Browse, book, chat, manage pets
- **Business App**: Manage bookings, inventory, chat, calendar

### 🤖 **AI Agents & Automation**
- BookingAssistant - Automated booking management
- CustomerSupportAgent - 24/7 customer support
- ReminderFollowUpBot - Appointment reminders
- MedicalVetAssistant - Veterinary consultation
- MarketingContentGenerator - Content creation
- AnalyticsNarrator - Data insights

### 💳 **Flexible Payment System**
- Offline payments (manual processing)
- Stripe integration with commission model
- Free trial periods for businesses
- Multiple payment flows support

## 🚀 Quick Start

### Prerequisites

- **Go 1.21+** (Backend)
- **Node.js 18+** (Frontend & Mobile)
- **PostgreSQL 14+** (Database)
- **Firebase Account** (Authentication)
- **Stripe Account** (Payments - optional)

### 1. Clone Repository

```bash
git clone https://github.com/TahyrOrazdurdyyev/zootel.git
cd zootel
```

### 2. Database Setup

```bash
# Create PostgreSQL databases
createdb zootel_dev
createdb zootel_prod

# Run migrations
cd backend
psql zootel_dev -f migrations/001_initial_schema.sql
psql zootel_dev -f migrations/002_seed_data.sql
```

### 3. Environment Configuration

Copy and configure environment files:

```bash
# Backend
cp backend/env.example backend/.env.development
cp backend/env.example backend/.env.production

# Frontend  
cp frontend/env.example frontend/.env.development
cp frontend/env.example frontend/.env.production
```

Update the `.env` files with your database credentials, Firebase config, and API keys.

### 4. Firebase Setup

1. Create Firebase project: `zootel-be723`
2. Enable Authentication (Email/Password)
3. Download service account key → `backend/config/serviceAccountKey.json`
4. Update environment variables with Firebase config

Create SuperAdmin user:
```bash
cd backend
go run scripts/createSuperAdmin.go
```

### 5. Start Development Servers

**Backend** (Port 4000):
```bash
cd backend
go mod download
go run cmd/main.go
```

**Frontend** (Port 3000):
```bash
cd frontend
npm install
npm run dev
```

**Mobile Apps**:
```bash
# Business App
cd mobile-business
npm install
npm start

# Pet Owner App  
cd mobile-pet-owner
npm install
npm start
```

## 📚 Documentation

- **[Firebase Setup Guide](backend/docs/firebase-setup.md)** - Authentication configuration
- **[Stripe Setup Guide](backend/docs/stripe-setup.md)** - Payment processing setup
- **[Database Migrations](backend/migrations/README.md)** - Database schema and setup
- **[GraphQL Schema](backend/api/graphql/schema.graphql)** - API schema documentation

## 🔐 User Roles & Permissions

### SuperAdmin
- Manage plans, payment settings, categories
- Manage companies and demo accounts
- Global analytics and reporting
- System configuration

### CompanyOwner  
- Create and manage employees
- Configure company profile and services
- Access to CRM and analytics
- Subscription management

### Employee
- Limited company access based on permissions
- Manage assigned bookings and orders
- Customer communication
- Inventory management

### Pet Owner (B2C User)
- Browse and book services
- Manage pet profiles
- Shopping cart and orders
- Chat with service providers

## 🤖 AI Agents System

The platform includes 8 specialized AI agents:

1. **BookingAssistant** - Service booking automation
2. **CustomerSupportAgent** - General customer support  
3. **ReminderFollowUpBot** - Automated reminders
4. **MedicalVetAssistant** - Veterinary consultations
5. **MarketingContentGenerator** - Marketing content
6. **UpsellCrossSellAgent** - Sales optimization
7. **FeedbackSentimentAnalyzer** - Review analysis
8. **AnalyticsNarrator** - Data insights

## 💰 Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $29.99/month | Basic CRM, 5 employees, Basic analytics |
| **Professional** | $79.99/month | Advanced CRM, 20 employees, AI agents |
| **Enterprise** | $199.99/month | Full suite, unlimited employees, all AI agents |

All plans include 14-30 day free trials.

## 🔄 CI/CD Pipeline

Automated deployment with GitHub Actions:
- **Push to master** → Automatic testing and deployment
- **Pull requests** → Automated testing
- **Environment-specific** builds and deployments

## 🌍 Multi-Platform Support

- **Web Application** - React with TailwindCSS
- **iOS/Android Apps** - React Native with Expo
- **REST API** - Complete backend API
- **GraphQL** - Advanced query capabilities
- **WebSocket** - Real-time chat and notifications

## 📊 Analytics & Reporting

### Company Analytics
- Booking and revenue trends
- Customer segmentation
- Service performance
- Employee productivity

### Global Analytics (SuperAdmin)
- Platform usage statistics
- Revenue analytics
- Geographic distribution
- Growth metrics

## 🔒 Security Features

- **Firebase Authentication** with custom claims
- **Role-based Access Control** (RBAC)
- **Data encryption** at rest and in transit
- **API rate limiting** and security headers
- **PCI DSS compliance** for payments
- **GDPR compliance** for data privacy

## 🌐 Deployment

### Development
```bash
# Start all services locally
npm run dev:all  # Starts backend, frontend, and mobile apps
```

### Production
The platform deploys automatically via GitHub Actions to:
- **Backend**: Cloud server with PostgreSQL
- **Frontend**: Static hosting (Vercel/Netlify)
- **Mobile Apps**: App stores (iOS/Android)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This is a private project. All rights reserved.

## 🆘 Support

For technical support:
- 📧 Email: support@zootel.shop
- 📱 GitHub Issues: [Create an issue](https://github.com/TahyrOrazdurdyyev/zootel/issues)

---

**🐾 Built with ❤️ for pet care professionals and pet owners worldwide** 