import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration for Zootel CRM
const firebaseConfig = {
  apiKey: "AIzaSyBxH5x8KQXgHpQOqy9F8GxvNyJuL1mRtZc",
  authDomain: "zootel-crm.firebaseapp.com",
  projectId: "zootel-crm",
  storageBucket: "zootel-crm.appspot.com",
  messagingSenderId: "106752425403351221249",
  appId: "1:106752425403351221249:web:f8e9d7c6b5a4938291e5f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app; 