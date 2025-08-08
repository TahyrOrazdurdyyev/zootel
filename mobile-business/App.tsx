import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { BusinessProvider } from './src/context/BusinessContext';
import { QueryProvider } from './src/providers/QueryProvider';
import { firebaseService } from './src/config/firebase';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    // Initialize Firebase services
    firebaseService.initialize().catch((error) => {
      console.error('Failed to initialize Firebase:', error);
    });
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <BusinessProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </BusinessProvider>
      </AuthProvider>
    </QueryProvider>
  );
} 