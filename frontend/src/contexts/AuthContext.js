import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

// API base URL
const API_BASE_URL = "https://zootel.shop/api/v1";

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

  // Get user data from backend with retry logic
  const fetchUserData = async (firebaseUser, retryCount = 0) => {
    try {
      // Wait a bit for backend to be ready on first load
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Get fresh token from Firebase
      const token = await firebaseUser.getIdToken();
      
      // Make request with token
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If 404 and first retry, try again after delay
        if (response.status === 404 && retryCount < 2) {
          console.log(`Retrying fetchUserData (attempt ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchUserData(firebaseUser, retryCount + 1);
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Retry on network errors
      if (retryCount < 2 && (error.message.includes('Failed to fetch') || error.message.includes('404'))) {
        console.log(`Retrying fetchUserData after error (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchUserData(firebaseUser, retryCount + 1);
      }
      
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
        country: additionalData.country || null,
        state: additionalData.state || null,
        city: additionalData.city || null,
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
          // Get Firebase token and save to localStorage
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
          
          // Get user data from backend
          let userData = await fetchUserData(firebaseUser);
          
          if (userData) {
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
          } else {
            // User exists in Firebase but data fetch failed - try to set minimal user data
            console.warn('Could not fetch user data from backend, using Firebase data');
            setUser({
              id: firebaseUser.uid,
              firebaseUID: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              name: firebaseUser.displayName || '',
              role: 'pet_owner',
            });
          }
        } catch (error) {
          console.error('Error processing authenticated user:', error);
          // Don't sign out on error - user is still authenticated in Firebase
          setUser(null);
        }
      } else {
        setUser(null);
        // Clear token when user logs out
        localStorage.removeItem('token');
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
      
      // Get token and save to localStorage immediately
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('token', token);
      
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

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      
      // Check if user exists in backend
      let userData = await fetchUserData(firebaseUser);
      
      if (!userData) {
        // User doesn't exist in backend - they need to complete onboarding
        // Set minimal user data so they can proceed to onboarding
        setUser({
          id: firebaseUser.uid,
          firebaseUID: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          name: firebaseUser.displayName || '',
          role: null, // No role yet, needs onboarding
        });
        
        // Return a flag indicating onboarding is needed
        return { needsOnboarding: true, firebaseUser };
      }
      
      // User exists, return normal firebaseUser
      return firebaseUser;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setError(getAuthErrorMessage(error));
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Phone Authentication methods
  const sendPhoneVerification = async (phoneNumber) => {
    try {
      setLoading(true);
      setError(null);

      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });

      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      
      return confirmationResult;
    } catch (error) {
      console.error('Phone verification error:', error);
      setError(getAuthErrorMessage(error));
      throw new Error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneCode = async (confirmationResult, verificationCode) => {
    try {
      setLoading(true);
      setError(null);

      // Verify the code
      const result = await confirmationResult.confirm(verificationCode);
      const firebaseUser = result.user;

      return firebaseUser;
    } catch (error) {
      console.error('Phone code verification error:', error);
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
      await apiCall('/users/profile', {
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

  const completeOnboarding = async (onboardingData) => {
    try {
      setLoading(true);
      setError(null);

      // Update user in backend with onboarding data
      const response = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(onboardingData),
      });

      // Refresh user data after onboarding
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        if (userData) {
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
      }

      return true;
    } catch (error) {
      console.error('Onboarding error:', error);
      throw error;
    } finally {
      setLoading(false);
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
      // Phone Auth errors
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format.';
      case 'auth/missing-phone-number':
        return 'Phone number is required.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later.';
      case 'auth/captcha-check-failed':
        return 'reCAPTCHA verification failed. Please try again.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please check and try again.';
      case 'auth/invalid-verification-id':
        return 'Invalid verification session. Please request a new code.';
      case 'auth/code-expired':
        return 'Verification code has expired. Please request a new one.';
      case 'auth/session-expired':
        return 'Verification session expired. Please start over.';
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
    sendPhoneVerification,
    verifyPhoneCode,
    signInWithGoogle,
    completeOnboarding,
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