import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, LoginCredentials } from '../types';
import ApiService from '../services/apiService';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        const currentEmployee = await ApiService.getCurrentEmployee();
        setEmployee(currentEmployee);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      await SecureStore.deleteItemAsync('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const tokens = await ApiService.login(credentials);
      
      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
      
      // Get employee data
      const currentEmployee = await ApiService.getCurrentEmployee();
      
      // Check if employee is active
      if (!currentEmployee.active) {
        await logout();
        throw new Error('Account is disabled. Please contact your administrator.');
      }
      
      setEmployee(currentEmployee);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear local state and secure storage
      setEmployee(null);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  };

  const isAuthenticated = employee !== null && employee.active;

  return (
    <AuthContext.Provider value={{ 
      employee, 
      isLoading, 
      login, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 