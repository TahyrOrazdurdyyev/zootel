#!/bin/bash

# Zootel Production Environment Setup Script
# This script helps set up environment variables for VPS deployment

echo "🔧 Setting up Zootel production environment..."

# Create .env file for production
cat > .env << 'EOF'
# Firebase Configuration - REPLACE WITH YOUR ACTUAL FIREBASE SERVICE ACCOUNT
FIREBASE_PROJECT_ID=zootel-crm
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-kswtb@zootel-crm.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY"

# Superadmin Configuration
SUPERADMIN_EMAIL=tahyr.orazdurdyyev@icloud.com
SUPERADMIN_PASSWORD=TSI#2024Go

# Database Configuration
DB_HOST=31.187.72.39
DB_PORT=3306
DB_NAME=zootel
DB_USER=root
DB_PASS=root123

# Server Configuration
PORT=5000
NODE_ENV=production
JWT_SECRET=zootel-super-secret-jwt-key-2024

# URLs
FRONTEND_URL=https://zootel.shop
BACKEND_URL=https://api.zootel.shop

# File Upload Configuration
UPLOAD_PATH=uploads
MAX_FILE_SIZE=5242880
EOF

echo "✅ Environment template created"
echo ""
echo "🚨 IMPORTANT: You need to replace the Firebase credentials with your actual service account key!"
echo ""
echo "📋 Steps to get your Firebase service account key:"
echo "1. Go to https://console.firebase.google.com/project/zootel-crm/settings/serviceaccounts/adminsdk"
echo "2. Click 'Generate new private key'"
echo "3. Download the JSON file"
echo "4. Copy the 'private_key' value (including the quotes and newlines)"
echo "5. Replace 'REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY' in the .env file"
echo ""
echo "📝 Example of what the private_key should look like:"
echo 'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_KEY_CONTENT_HERE\n-----END PRIVATE KEY-----\n"'
echo ""
echo "🔒 Make sure to keep this file secure and never commit it to git!" 