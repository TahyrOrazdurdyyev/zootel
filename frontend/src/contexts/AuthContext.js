import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Initialize Firebase Auth listener
    // For now, simulate auth check
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        // TODO: Validate token and get user data
        setUser({
          id: '1',
          email: 'test@example.com',
          role: 'pet_owner',
          name: 'Test User'
        });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // TODO: Implement Firebase Auth login
      const mockUser = {
        id: '1',
        email,
        role: 'pet_owner',
        name: 'Test User'
      };
      setUser(mockUser);
      localStorage.setItem('authToken', 'mock-token');
      return mockUser;
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (userData) => {
    try {
      // TODO: Implement Firebase Auth registration
      const mockUser = {
        id: '2',
        email: userData.email,
        role: 'pet_owner',
        name: `${userData.firstName} ${userData.lastName}`
      };
      setUser(mockUser);
      localStorage.setItem('authToken', 'mock-token');
      return mockUser;
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 