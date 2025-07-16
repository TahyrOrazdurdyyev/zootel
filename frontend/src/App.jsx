import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Inner component to access auth context
const AppContent = () => {
  const { currentUser, userRole, isAuthenticated } = useAuth();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Zootel</h1>
        <p>Pet Services Marketplace</p>
        <p>Firebase Authentication integrated!</p>
        
        <div className="auth-status">
          {isAuthenticated() ? (
            <div>
              <p>✅ Authenticated as: {currentUser?.email}</p>
              <p>🎭 Role: {userRole || 'Loading...'}</p>
            </div>
          ) : (
            <p>🔐 Not authenticated</p>
          )}
        </div>
        
        <div className="api-info">
          <p>🔗 Backend API ready with Firebase authentication</p>
          <p>📋 Next: Implement login/signup forms</p>
        </div>
      </header>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 