# 🚀 Zootel Production Setup Guide

This guide will help you set up Zootel on your VPS (31.187.72.39) with proper Firebase authentication.

## 🔧 Current Issue

The backend is crashing because Firebase Admin SDK credentials are missing. Users cannot sign up or sign in because the backend can't authenticate with Firebase.

## 📋 Step-by-Step Solution

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/project/zootel-crm/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Download the JSON file
4. Open the JSON file and copy the following values:
   - `project_id` (should be "zootel-crm")
   - `client_email` (looks like firebase-adminsdk-xxxxx@zootel-crm.iam.gserviceaccount.com)
   - `private_key` (long string starting with -----BEGIN PRIVATE KEY-----)

### 2. SSH to Your VPS

```bash
ssh root@31.187.72.39
cd /var/www/zootel
```

### 3. Run the Setup Script

```bash
./scripts/setup-production-env.sh
```

This creates a `.env` file template.

### 4. Edit the Environment File

```bash
nano .env
```

Replace `REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY` with your actual private key from Firebase. 

**Important**: Keep all the quotes and `\n` characters exactly as they are!

Example:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### 5. Update Dependencies and Restart

```bash
# Install any missing dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..

# Build frontend
npm run build:frontend

# Restart services
pm2 restart zootel-backend
pm2 restart zootel-frontend

# Check status
pm2 status
pm2 logs zootel-backend
```

## 🔍 Verification

After setup, you should see in the logs:
```
🔥 Firebase Admin SDK initialized successfully
📋 Project: zootel-crm
✅ Superadmin user already exists: [some-uid]
✅ Superadmin role verified
🚀 Server running on port 5000
```

## 🌐 Test Authentication

1. Visit https://zootel.shop
2. Click "Sign Up" 
3. Try creating a new account
4. Try signing in with existing accounts

## 🔥 If You See Firebase Errors

**Error**: "Service account object must contain a string 'project_id' property"
- **Solution**: Check that `FIREBASE_PROJECT_ID=zootel-crm` in your `.env` file

**Error**: "Invalid private key"
- **Solution**: Make sure the private key is copied exactly from Firebase, including all `\n` characters

**Error**: "Invalid client email"
- **Solution**: Copy the exact client_email from your Firebase service account JSON

## 📞 Troubleshooting Commands

```bash
# Check if .env file exists and has content
cat .env

# Check Firebase credentials are being read
cd backend
node -e "require('dotenv').config(); console.log('Project:', process.env.FIREBASE_PROJECT_ID); console.log('Email:', process.env.FIREBASE_CLIENT_EMAIL); console.log('Key length:', process.env.FIREBASE_PRIVATE_KEY?.length);"

# Check backend logs
pm2 logs zootel-backend --lines 50

# Restart just the backend
pm2 restart zootel-backend
```

## 🎯 Expected Result

- ✅ Users can visit zootel.shop
- ✅ Users can sign up for new accounts
- ✅ Users can sign in to existing accounts  
- ✅ Authentication works properly
- ✅ Dashboards load correctly after login
- ✅ No Firebase errors in backend logs

## 🚨 Security Notes

- **Never** commit the `.env` file to git
- Keep your Firebase private key secure
- The `.env` file should only exist on the VPS, not in your local development 