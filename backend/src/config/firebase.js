import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Check if we have all required Firebase credentials
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('❌ Firebase credentials missing!');
      console.error('Required environment variables:');
      console.error('- FIREBASE_PROJECT_ID:', projectId ? '✅' : '❌');
      console.error('- FIREBASE_CLIENT_EMAIL:', clientEmail ? '✅' : '❌');
      console.error('- FIREBASE_PRIVATE_KEY:', privateKey ? '✅' : '❌');
      console.error('');
      console.error('🔧 To fix this issue:');
      console.error('1. Run: ./scripts/setup-production-env.sh');
      console.error('2. Get your Firebase service account key from:');
      console.error('   https://console.firebase.google.com/project/zootel-crm/settings/serviceaccounts/adminsdk');
      console.error('3. Update the .env file with your actual credentials');
      
      throw new Error('Firebase credentials not configured. Please set up your environment variables.');
    }

    try {
      const serviceAccount = {
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('🔥 Firebase Admin SDK initialized successfully');
      console.log(`📋 Project: ${projectId}`);
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      
      if (error.message.includes('project_id')) {
        console.error('🔍 The FIREBASE_PROJECT_ID seems to be invalid or missing');
      }
      if (error.message.includes('private_key')) {
        console.error('🔍 The FIREBASE_PRIVATE_KEY seems to be invalid or malformed');
        console.error('   Make sure it includes the full key with BEGIN/END markers and newlines');
      }
      if (error.message.includes('client_email')) {
        console.error('🔍 The FIREBASE_CLIENT_EMAIL seems to be invalid');
      }
      
      throw error;
    }
  }
  return admin;
};

// Seed superadmin user
const seedSuperadmin = async () => {
  try {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!email || !password) {
      console.warn('⚠️ Superadmin credentials not provided in environment variables');
      console.warn('   SUPERADMIN_EMAIL:', email ? '✅' : '❌');
      console.warn('   SUPERADMIN_PASSWORD:', password ? '✅' : '❌');
      return;
    }

    // Check if superadmin already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      console.log('✅ Superadmin user already exists:', existingUser.uid);
      
      // Ensure superadmin role is set
      await admin.auth().setCustomUserClaims(existingUser.uid, { role: 'superadmin' });
      console.log('✅ Superadmin role verified');
      
      return existingUser;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create superadmin user
        const userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          emailVerified: true,
          displayName: 'Super Admin',
        });

        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'superadmin' });
        
        console.log('✅ Superadmin user created successfully:', userRecord.uid);
        return userRecord;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.error('   The superadmin email is already in use');
    } else if (error.code === 'auth/weak-password') {
      console.error('   The superadmin password is too weak');
    } else if (error.code === 'auth/invalid-email') {
      console.error('   The superadmin email is invalid');
    }
    
    throw error;
  }
};

export { initializeFirebase, seedSuperadmin };
export default admin; 