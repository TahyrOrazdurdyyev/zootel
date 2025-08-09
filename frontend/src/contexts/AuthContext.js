import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  initializeApp 
} from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext();

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const token = await auth.currentUser?.getIdToken();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Get user data from backend
  const fetchUserData = async (firebaseUser) => {
    try {
      const response = await apiCall('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Register user in backend
  const registerUserInBackend = async (firebaseUser, additionalData = {}) => {
    try {
      const userData = {
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        first_name: additionalData.firstName || '',
        last_name: additionalData.lastName || '',
        role: additionalData.role || 'pet_owner',
        phone: additionalData.phone || '',
        address: additionalData.address || '',
        country: additionalData.country || '',
        state: additionalData.state || '',
        city: additionalData.city || '',
        timezone: additionalData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        notification_methods: additionalData.notificationMethods || ['email'],
        marketing_opt_in: additionalData.marketingOptIn || false,
      };

      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      return response.data;
    } catch (error) {
      console.error('Error registering user in backend:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          // Get user data from backend
          let userData = await fetchUserData(firebaseUser);
          
          if (!userData) {
            // User exists in Firebase but not in backend - this shouldn't happen in normal flow
            console.warn('User exists in Firebase but not in backend');
            await signOut(auth);
            setUser(null);
          } else {
            setUser({
              id: userData.id,
              firebaseUID: userData.firebase_uid,
              email: userData.email,
              firstName: userData.first_name,
              lastName: userData.last_name,
              name: `${userData.first_name} ${userData.last_name}`.trim(),
              role: userData.role,
              phone: userData.phone,
              address: userData.address,
              country: userData.country,
              state: userData.state,
              city: userData.city,
              avatarURL: userData.avatar_url,
              createdAt: userData.created_at,
              ...userData
            });
          }
        } catch (error) {
          console.error('Error processing authenticated user:', error);
          setError('Failed to load user data');
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // The onAuthStateChanged listener will handle fetching user data
      return firebaseUser;
    } catch (error) {
      console.error('Login error:', error);
      setError(getAuthErrorMessage(error));
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      const firebaseUser = userCredential.user;

      // Update Firebase profile
      if (userData.firstName || userData.lastName) {
        await updateProfile(firebaseUser, {
          displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        });
      }

      // Register user in backend
      await registerUserInBackend(firebaseUser, userData);

      // The onAuthStateChanged listener will handle setting the user state
      return firebaseUser;
    } catch (error) {
      console.error('Registration error:', error);
      setError(getAuthErrorMessage(error));
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(getAuthErrorMessage(error));
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);

      // Update in backend
      await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        ...updates
      }));

      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (avatarURL) => {
    try {
      await apiCall('/auth/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatar_url: avatarURL }),
      });

      setUser(prevUser => ({
        ...prevUser,
        avatarURL
      }));

      return true;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  };

  const updateNotificationPreferences = async (methods) => {
    try {
      await apiCall('/auth/notifications', {
        method: 'PUT',
        body: JSON.stringify({ notification_methods: methods }),
      });

      setUser(prevUser => ({
        ...prevUser,
        notificationMethods: methods
      }));

      return true;
    } catch (error) {
      console.error('Notification preferences error:', error);
      throw error;
    }
  };

  // Helper function to get user-friendly error messages
  const getAuthErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An authentication error occurred.';
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    uploadAvatar,
    updateNotificationPreferences,
    apiCall, // Expose for other components to make authenticated API calls
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

export { auth }; // Export auth instance for direct use if needed 