# Zootel - Pet Services Platform

A comprehensive platform connecting pet owners with service providers, featuring AI-powered assistance and business management tools.

## Features

### For Pet Owners
- **Service Discovery**: Find veterinary clinics, grooming salons, pet hotels, and more
- **Online Booking**: Schedule appointments 24/7 with automatic confirmation
- **Extended Pet Profiles**: Comprehensive medical records, vaccination tracking, and behavioral notes
- **AI Chat Assistant**: Get instant answers about services and pet care
- **Shopping Cart**: Purchase pet products and services online
- **Order Tracking**: Monitor service appointments and product deliveries
- **Reviews & Ratings**: Share experiences and read reviews from other pet owners

### Extended Profile Management

#### Comprehensive User Profiles
- **Personal Information**: Full name, gender, date of birth, and contact details
- **Address Management**: Complete address with apartment numbers and postal codes
- **Emergency Contacts**: Designated emergency contacts with relationship information
- **Veterinarian Information**: Primary vet contacts and clinic details
- **Notification Preferences**: Customizable push, SMS, and email notification settings
- **Marketing Preferences**: Granular control over promotional communications

#### Advanced Pet Profiles
- **Basic Information**: Name, type, breed, gender, birth date, weight, and microchip ID
- **Medical Records**: 
  - Vaccination tracking with expiry dates and reminders
  - Medication management with dosage and frequency
  - Chronic conditions and allergy management
  - Medical history summaries and checkup scheduling
- **Photo Gallery**: Multiple photos with main photo selection
- **Behavioral Information**: Favorite toys, behavior notes, and stress reaction guidance
- **Veterinary Contacts**: Pet-specific vet information and clinic details
- **Special Needs**: Dietary restrictions and care requirements

### For Service Providers
- **Business Management**: Complete CRM with booking, client, and service management
- **AI-Powered Assistance**: Specialized AI agents adapted to your business type
- **Employee Management**: Staff scheduling and task assignment
- **Analytics & Reports**: Track performance, revenue, and customer insights
- **Multi-Channel Communication**: Chat with clients, send notifications
- **Inventory Management**: Stock tracking for retail businesses
- **Payment Processing**: Accept online payments with automated accounting

## AI Agent Specialization

### Business Type Recognition
The platform automatically recognizes your business type and adapts AI agents accordingly:

- **Veterinary Clinics**: AI agents understand medical terminology, emergency protocols, and health assessment
- **Grooming Salons**: Specialized in coat types, grooming styles, and beauty treatments
- **Pet Hotels/Boarding**: Focus on accommodation needs, feeding schedules, and care requirements
- **Training Services**: Expertise in behavior modification, obedience, and training programs
- **Dog Walking**: Specialized in exercise needs, safety protocols, and scheduling
- **Pet Sitting**: Home care expertise, routine management, and pet comfort
- **Pet Transportation**: Travel requirements, safety measures, and logistics
- **Retail/Pet Stores**: Product knowledge, inventory management, and customer recommendations

### Available AI Agents

1. **Booking Assistant**
   - Automated appointment scheduling
   - Employee assignment based on availability
   - Alternative time slot suggestions
   - Context-aware responses based on business type

2. **Customer Support Agent**
   - 24/7 customer service
   - Business-specific FAQ responses
   - Integration with booking and order systems

3. **Medical/Vet Assistant** (Veterinary Only)
   - Symptom assessment guidance
   - Emergency protocol assistance
   - Medical record management

4. **Retail Shopping Assistant** (Retail Only)
   - Product recommendations
   - Inventory guidance
   - Shopping assistance

5. **Marketing Content Generator**
   - Automated email campaigns
   - Social media content
   - Promotional materials

6. **Analytics Narrator**
   - Business intelligence insights
   - Performance reporting
   - Trend analysis

### AI Agent Configuration

Business types are automatically detected or can be manually set in company settings:

```go
// Available business types
type BusinessType string

const (
    Veterinary  BusinessType = "veterinary"
    Grooming    BusinessType = "grooming" 
    Boarding    BusinessType = "boarding"
    Training    BusinessType = "training"
    Walking     BusinessType = "walking"
    Sitting     BusinessType = "sitting"
    PetTaxi     BusinessType = "pet_taxi"
    Retail      BusinessType = "retail"
    General     BusinessType = "general"
)
```

Each AI agent has specialized prompts and behaviors for different business types, ensuring relevant and accurate responses.

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin HTTP framework
- **Database**: PostgreSQL with migrations
- **Authentication**: Firebase Auth
- **AI Integration**: OpenAI GPT-4
- **Payment Processing**: Stripe
- **File Storage**: Cloud storage integration

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Mobile (Business App)
- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: React Query
- **Authentication**: Firebase SDK

## Installation & Setup

### Prerequisites
- Go 1.21 or higher
- Node.js 18 or higher
- PostgreSQL 13 or higher
- Firebase project
- OpenAI API key (optional, for AI features)
- Stripe account (optional, for payments)

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/your-repo/zootel.git
cd zootel/backend
```

2. Install dependencies:
```bash
go mod download
```

3. Create environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
go run migrations/*.sql
```

5. Start the server:
```bash
go run cmd/main.go
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env.local
# Edit with your configuration
```

4. Start development server:
```bash
npm run dev
```

### Mobile App Setup

1. Navigate to mobile directory:
```bash
cd ../mobile-business
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
```bash
# Follow FIREBASE_SETUP.md instructions
```

4. Start Metro bundler:
```bash
npm start
```

## API Documentation

### Authentication
All protected endpoints require Firebase JWT token in Authorization header:
```
Authorization: Bearer <firebase-jwt-token>
```

### Key Endpoints

#### AI Agents
- `GET /api/ai/agents` - Get available AI agents for company
- `POST /api/ai/process` - Process AI request
- `GET /api/ai/usage-stats` - Get AI usage statistics

#### Company Management
- `GET /companies/profile` - Get company profile
- `PUT /companies/profile` - Update company profile
- `PUT /companies/business-type` - Update business type
- `GET /companies/business-types` - Get available business types

#### Booking System
- `POST /bookings/ai-booking` - AI-powered booking
- `POST /bookings/auto-assign` - Automatic employee assignment
- `GET /bookings/alternatives` - Get alternative time slots

## Business Type Configuration

Companies can set their business type in the settings panel, which affects:

1. **Available AI Agents**: Only relevant agents are shown
2. **AI Response Quality**: Specialized prompts provide better answers
3. **Feature Access**: Type-specific features are enabled/disabled
4. **UI Customization**: Interface adapts to business needs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@zootel.com or create an issue in this repository. 