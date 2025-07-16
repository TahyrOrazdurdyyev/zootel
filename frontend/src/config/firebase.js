import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration for Zootel CRM
const firebaseConfig = {
  apiKey: "AIzaSyA0nqK3O6tEN3CQeg8kYhiMsbuMK1g5ZVo",
  authDomain: "zootel-crm.firebaseapp.com",
  projectId: "zootel-crm",
  storageBucket: "zootel-crm.firebasestorage.app",
  messagingSenderId: "151249939477",
  appId: "1:151249939477:web:8b778baef21acf498ff21c",
  measurementId: "G-P7NZ25KJL2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app; 