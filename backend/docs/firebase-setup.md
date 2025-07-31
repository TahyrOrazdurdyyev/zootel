# Firebase Setup Guide for Zootel

This guide explains how to set up Firebase for authentication in the Zootel platform.

## Prerequisites

- Firebase account
- Node.js and npm installed
- Firebase CLI installed: `npm install -g firebase-tools`

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `zootel-be723` (or your preferred name)
4. Enable Google Analytics if desired
5. Wait for project creation

## Step 2: Enable Authentication

1. In Firebase console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable the following providers:
   - Email/Password
   - Google (optional)

## Step 3: Create Service Account

1. Go to Project Settings (gear icon)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Rename it to `serviceAccountKey.json`
6. Place it in `backend/config/` directory

**IMPORTANT**: Never commit this file to version control!

## Step 4: Get Web App Configuration

1. In Project Settings, go to "General" tab
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app
4. Register app with name "Zootel Frontend"
5. Copy the configuration object

## Step 5: Update Environment Variables

### Backend (.env files)

Add to `backend/.env.development` and `backend/.env.production`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./config/serviceAccountKey.json
```

### Frontend (.env files)

Add to `frontend/.env.development`:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

For production, use the production values in `frontend/.env.production`:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyBoTcY6DolPLdT6w0xrNVIr2U1JoUrR3FY
REACT_APP_FIREBASE_AUTH_DOMAIN=zootel-be723.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=zootel-be723
REACT_APP_FIREBASE_STORAGE_BUCKET=zootel-be723.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=815616635431
REACT_APP_FIREBASE_APP_ID=1:815616635431:web:c767e4af63e207c4721402
REACT_APP_FIREBASE_MEASUREMENT_ID=G-8BNJZQVHKB
```

## Step 6: Create SuperAdmin User

Run the SuperAdmin creation script:

```bash
cd backend
go run scripts/createSuperAdmin.go
```

This will create a SuperAdmin user with:
- Email: `tahyr.orazdurdyyev@zootel.shop`
- Password: `ChangeMe123`
- Role: `super_admin`

You can also specify custom credentials:

```bash
go run scripts/createSuperAdmin.go custom@email.com customPassword123
```

## Step 7: Set Firebase Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // SuperAdmins can access everything
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.role == "super_admin";
    }
    
    // Company owners can access their company data
    match /companies/{companyId} {
      allow read, write: if request.auth != null && 
        (request.auth.token.role == "company_owner" || 
         request.auth.token.role == "super_admin");
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload their own avatars and pet photos
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Company owners can upload company media
    match /companies/{companyId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        (request.auth.token.role == "company_owner" || 
         request.auth.token.role == "super_admin");
    }
    
    // Public read access for company logos and service images
    match /public/{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 8: Test Authentication

1. Start the backend server:
   ```bash
   cd backend
   go run cmd/main.go
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Try to login with the SuperAdmin credentials
4. Check the browser console for any errors

## Custom Claims

The platform uses Firebase custom claims for role-based access:

- `super_admin`: Full platform access
- `company_owner`: Company management access
- `employee`: Limited company access based on permissions
- `pet_owner`: Customer access (default)

## Troubleshooting

### Common Issues

1. **"Project not found" error**
   - Verify the project ID in environment variables
   - Check if the service account key is correct

2. **"Permission denied" error**
   - Verify Firebase rules are set correctly
   - Check if the user has the correct custom claims

3. **"Invalid API key" error**
   - Verify the API key in frontend environment variables
   - Check if the key is for the correct Firebase project

4. **"Service account key not found"**
   - Ensure `serviceAccountKey.json` is in `backend/config/`
   - Check the path in `GOOGLE_APPLICATION_CREDENTIALS`

### Useful Commands

```bash
# Login to Firebase CLI
firebase login

# Select project
firebase use --add

# Deploy Firebase rules
firebase deploy --only firestore:rules
firebase deploy --only storage

# View logs
firebase functions:log
```

## Security Considerations

1. **Never commit service account keys** to version control
2. **Use environment-specific configurations** for different stages
3. **Regularly rotate API keys** and service account keys
4. **Monitor authentication logs** for suspicious activity
5. **Set up Firebase App Check** for production
6. **Enable 2FA** for Firebase console access

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK for Go](https://firebase.google.com/docs/admin/setup#go)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims) 