# Zootel - Pet Services Marketplace

A comprehensive platform connecting pet owners with service providers, featuring company dashboards, booking systems, and admin management.

## 🏗️ Tech Stack

- **Frontend**: React (JavaScript) with Vite
- **Backend**: Node.js + Express (JavaScript)
- **Database**: MySQL
- **Authentication**: Firebase Authentication + Admin SDK
- **CI/CD**: GitHub Actions + Manual SSH Deployment
- **Design**: Orange (#FFA500) & White (#FFFFFF) theme

## 📁 Project Structure

```
zootel/
├── frontend/          # React frontend application
├── backend/           # Express backend API
├── scripts/           # Deployment scripts
├── docs/              # Documentation (coming soon)
└── .github/workflows/ # GitHub Actions CI/CD
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MySQL database
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TahyrOrazdurdyyev/zootel.git
   cd zootel
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Superadmin Configuration
SUPERADMIN_EMAIL=tahyr.orazdurdyyev@icloud.com
SUPERADMIN_PASSWORD=TSI#2024Go

# Database Configuration
DB_HOST=31.187.72.39
DB_PORT=3306
DB_NAME=zootel
DB_USER=your_mysql_username
DB_PASS=your_mysql_password

# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key

# VPS Configuration (for deployment)
VPS_HOST=31.187.72.39
VPS_USER=your-vps-username
VPS_KEY=/path/to/your/private/ssh/key

# URLs
FRONTEND_URL=https://zootel.shop
BACKEND_URL=https://api.zootel.shop
```

## 📜 Available Scripts

### Root Level Commands
- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both frontend and backend in development
- `npm run build` - Build both frontend and backend
- `npm run start` - Start both applications in production
- `npm run lint` - Lint both applications
- `npm run test` - Test both applications

### Frontend Commands
- `npm run dev:frontend` - Start frontend development server
- `npm run build:frontend` - Build frontend for production
- `npm run lint:frontend` - Lint frontend code

### Backend Commands
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Build backend (no-op for JavaScript)
- `npm run lint:backend` - Lint backend code

## 🚀 Deployment

### Manual Deployment to VPS

1. **Set up SSH access to your VPS**
   ```bash
   # Add your VPS to known hosts
   ssh-keyscan -H 31.187.72.39 >> ~/.ssh/known_hosts
   
   # Test SSH connection
   ssh -i /path/to/your/ssh/key your-username@31.187.72.39
   ```

2. **Clone repository on VPS (first time only)**
   ```bash
   # On your VPS
   cd /var/www
   git clone https://github.com/TahyrOrazdurdyyev/zootel.git
   cd zootel
   ```

3. **Install PM2 globally on VPS (first time only)**
   ```bash
   # On your VPS
   npm install -g pm2
   ```

4. **Deploy from your local machine**
   ```bash
   # Set environment variables
   export VPS_HOST=31.187.72.39
   export VPS_USER=your-username
   export VPS_KEY=/path/to/your/ssh/key
   
   # Run deployment script
   ./scripts/deploy.sh
   ```

### Environment Variables for Deployment

Ensure these environment variables are set before running the deployment script:

- `VPS_HOST`: Your VPS IP address (default: 31.187.72.39)
- `VPS_USER`: SSH username for your VPS
- `VPS_KEY`: Path to your SSH private key

### What the Deployment Script Does

1. Connects to your VPS via SSH
2. Pulls the latest code from the main branch
3. Installs/updates dependencies for root, frontend, and backend
4. Builds the frontend application
5. Restarts the application using PM2
6. Saves the PM2 configuration

## 🔄 CI/CD with GitHub Actions

The project includes a GitHub Actions workflow that automatically:

- Runs on every push to the main branch
- Installs dependencies for all packages
- Lints the code for both frontend and backend
- Runs tests (with soft failures)
- Builds both applications
- Notifies of build status

### GitHub Secrets Configuration

The following secrets are already configured in the GitHub repository:

- `FIREBASE_PRIVATE_KEY`: Firebase service account private key (full JSON)
- `FIREBASE_CLIENT_EMAIL`: Firebase service account email
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `SUPERADMIN_EMAIL`: Initial superadmin email
- `SUPERADMIN_PASSWORD`: Initial superadmin password
- `VPS_HOST`: VPS server IP address
- `VPS_USER`: VPS SSH username
- `VPS_KEY`: VPS SSH private key
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database username
- `DB_PASS`: Database password
- `DB_NAME`: Database name

## 🌐 Production URLs

- **Domain**: zootel.shop
- **Frontend**: https://zootel.shop
- **Backend API**: https://api.zootel.shop

## 📝 Development Notes

- No TypeScript - uses plain JavaScript for both frontend and backend
- Uses ES modules (`"type": "module"`) in package.json
- Frontend built with Vite for fast development
- Backend uses Express with modern JavaScript features
- All references to localhost replaced with actual domain/VPS IP

## 🔧 Troubleshooting

### Common Deployment Issues

1. **SSH Connection Failed**
   - Verify your SSH key path and permissions
   - Ensure your VPS IP and username are correct
   - Check if the VPS is accessible

2. **Application Directory Not Found**
   - Make sure you've cloned the repository on your VPS first
   - Verify the APP_DIR path in the deployment script

3. **PM2 Command Not Found**
   - Install PM2 globally on your VPS: `npm install -g pm2`

4. **Port Already in Use**
   - Check running processes: `pm2 list`
   - Stop conflicting processes: `pm2 stop <app-name>`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License.
