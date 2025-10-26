# Environment Variables Configuration for Zootel Frontend

## Overview
This document describes the environment variables required for the Zootel frontend application.

## Setup Instructions

1. Create `.env.development` file in the frontend root directory
2. Create `.env.production` file for production deployment
3. Copy the appropriate template below and fill in your actual values

## Development Environment (.env.development)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=ws://localhost:4000

# Firebase Configuration (Development)
REACT_APP_FIREBASE_API_KEY=<your-dev-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<dev-project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<dev-project-id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<dev-project>.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<dev-sender-id>
REACT_APP_FIREBASE_APP_ID=1:<dev-sender-id>:web:<dev-app-id>
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Payment Configuration
REACT_APP_STRIPE_ENABLED=false
REACT_APP_STRIPE_PUBLISHABLE_KEY=

# Feature Flags
REACT_APP_AI_ENABLED=false
REACT_APP_DEMO_MODE=true
REACT_APP_DEBUG_MODE=true
REACT_APP_ENVIRONMENT=development
```

## Production Environment (.env.production)

```bash
# API Configuration
REACT_APP_API_URL=https://zootel.shop
REACT_APP_WS_URL=wss://zootel.shop

# Firebase Configuration (Production)
REACT_APP_FIREBASE_API_KEY=AIzaSyBoTcY6DolPLdT6w0xrNVIr2U1JoUrR3FY
REACT_APP_FIREBASE_AUTH_DOMAIN=zootel-be723.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=zootel-be723
REACT_APP_FIREBASE_STORAGE_BUCKET=zootel-be723.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=815616635431
REACT_APP_FIREBASE_APP_ID=1:815616635431:web:c767e4af63e207c4721402
REACT_APP_FIREBASE_MEASUREMENT_ID=G-8BNJZQVHKB

# Payment Configuration
REACT_APP_STRIPE_ENABLED=false
REACT_APP_STRIPE_PUBLISHABLE_KEY=

# Feature Flags
REACT_APP_AI_ENABLED=true
REACT_APP_DEMO_MODE=false
REACT_APP_DEBUG_MODE=false
REACT_APP_ENVIRONMENT=production
```

## Security Notes

### ⚠️ IMPORTANT SECURITY CONSIDERATIONS

1. **Never commit real environment files to Git**
   - `.env.development` and `.env.production` should be in `.gitignore`
   - Only commit `.env.example` templates

2. **Frontend vs Backend Variables**
   - Frontend: Only `REACT_APP_*` variables are exposed to the browser
   - Backend variables (DB_CONNECTION, JWT_SECRET, etc.) should NOT be in frontend .env

3. **Production Keys Management**
   - Store sensitive keys in secure environment variable systems
   - Use CI/CD tools or deployment platforms for production env injection
   - Never hardcode production keys in source code

4. **Firebase Security**
   - API keys in frontend are public by design
   - Security is enforced by Firebase Security Rules
   - Restrict domains in Firebase Console for production

## Backend Environment Variables

The following variables belong in the **backend** environment files:

```bash
# Database
DB_CONNECTION=postgres://user:pass@host:5432/db_name

# Security
JWT_SECRET=your_jwt_secret_here
GOOGLE_APPLICATION_CREDENTIALS=./config/serviceAccountKey.json

# API Configuration
API_HOST=127.0.0.1
API_PORT=4000
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Payment (Backend)
STRIPE_ENABLED=false
COMMISSION_ENABLED=false
COMMISSION_PERCENTAGE=10
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# AI Configuration
AI_ENABLED=false
AI_API_KEY=sk-proj-your_openai_api_key
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

## Usage in Code

```javascript
// Accessing environment variables in React
const apiUrl = process.env.REACT_APP_API_URL;
const isAiEnabled = process.env.REACT_APP_AI_ENABLED === 'true';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ... other config
};
```

## Deployment Checklist

- [ ] Create production `.env.production` file
- [ ] Verify all REACT_APP_* variables are set
- [ ] Test Firebase connection with production credentials
- [ ] Configure CORS origins for production domain
- [ ] Set up SSL certificates for WSS connections
- [ ] Enable Stripe in production (when ready)
- [ ] Configure CI/CD environment variable injection 