# Zootel

Zootel is a comprehensive pet services platform that connects pet owners with pet care businesses and services.

## Project Structure

- **backend/** - Go backend API server
- **frontend/** - React web application
- **mobile-business/** - React Native mobile app for businesses
- **mobile-pet-owner/** - React Native mobile app for pet owners
- **docs/** - Project documentation
- **config/** - Configuration files
- **scripts/** - Setup and deployment scripts

## Features

- Pet owner management
- Business registration and management
- Service booking and scheduling
- Chat and messaging
- Payment processing
- Order management
- Analytics and reporting

## Getting Started

### Prerequisites

- Go 1.19+
- Node.js 16+
- React Native development environment
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/TahyrOrazdurdyyev/zootel.git
cd zootel
```

2. Set up backend
```bash
cd backend
go mod download
```

3. Set up frontend
```bash
cd frontend
npm install
```

4. Set up mobile apps
```bash
cd mobile-business
npm install

cd ../mobile-pet-owner
npm install
```

## Development

Each component has its own development setup. See individual README files in each directory for detailed instructions.

## Deployment

See the scripts directory for deployment automation.

## License

Private project - All rights reserved. 