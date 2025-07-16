import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('🔥 Firebase Admin SDK initialized');
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
    throw error;
  }
};

export { initializeFirebase, seedSuperadmin };
export default admin; 