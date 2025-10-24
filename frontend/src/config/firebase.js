import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyBoTcY6DolPLdT6w0xrNVIr2U1JoUrR3FY",
  authDomain: "zootel-be723.firebaseapp.com",
  projectId: "zootel-be723",
  storageBucket: "zootel-be723.appspot.com",
  messagingSenderId: "815616635431",
  appId: "1:815616635431:android:b606f2dbb1fbb46a721402"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
