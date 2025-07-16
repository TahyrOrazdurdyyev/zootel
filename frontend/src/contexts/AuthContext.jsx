import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Create the authentication context
const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);

  // Sign up function
  const signup = async (email, password, role = 'pet_owner') => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send email verification
    if (result.user) {
      await sendEmailVerification(result.user);
    }
    
    // Store the selected role for later use
    sessionStorage.setItem('pendingUserRole', role);
    
    // Sign out the user immediately after account creation
    // so they don't appear signed in during email verification
    await signOut(auth);
    
    return result;
  };

  // Set user role during registration (to be called after authentication)
  const setUserRoleOnRegistration = async (role) => {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/auth/register-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set user role');
      }

      const data = await response.json();
      
      // Update local role state
      setUserRole(data.role);
      
      // Clear pending role from session storage
      sessionStorage.removeItem('pendingUserRole');
      
      return data;
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  };

  // Check and set pending role on authentication
  const checkAndSetPendingRole = async (user) => {
    const pendingRole = sessionStorage.getItem('pendingUserRole');
    if (pendingRole && user) {
      try {
        console.log('Setting pending role:', pendingRole);
        
        // Wait for user to be fully authenticated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const token = await user.getIdToken(true); // Force refresh token
        const response = await fetch('/api/auth/register-role', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: pendingRole }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Role set successfully:', data.role);
          
          // Force refresh the user's token to get updated custom claims
          await user.getIdToken(true);
          
          setUserRole(data.role);
          sessionStorage.removeItem('pendingUserRole');
          
          return true;
        } else {
          const errorData = await response.json();
          console.error('Error setting role:', errorData);
        }
      } catch (error) {
        console.error('Error setting pending user role:', error);
      }
    }
    return false;
  };

  // Sign in function
  const signin = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  };

  // Sign out function
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserRole(null);
    setIdToken(null);
  };

  // Reset password function
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Resend email verification
  const resendEmailVerification = async () => {
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
    }
  };

  // Check if email is verified
  const isEmailVerified = () => {
    return currentUser?.emailVerified || false;
  };

  // Get user role from custom claims
  const getUserRole = async (user) => {
    try {
      if (!user) return null;
      
      // Force refresh token to get latest custom claims
      const tokenResult = await user.getIdTokenResult(true);
      const role = tokenResult.claims.role;
      
      console.log('Retrieved user role:', role);
      
      return role || 'pet_owner';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'pet_owner';
    }
  };

  // Get ID token
  const getIdToken = async () => {
    try {
      if (!currentUser) return null;
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!currentUser;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return userRole === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          console.log('User authenticated:', user.email, 'Email verified:', user.emailVerified);
          
          // Check for pending role first and wait for it to complete
          const roleWasSet = await checkAndSetPendingRole(user);
          
          // Get user role and ID token
          let role;
          if (roleWasSet) {
            // If we just set the role, wait a bit more for it to propagate
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          role = await getUserRole(user);
          const token = await user.getIdToken();
          
          console.log('Final user role set to:', role);
          
          setUserRole(role);
          setIdToken(token);
        } else {
          setUserRole(null);
          setIdToken(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Refresh ID token periodically
  useEffect(() => {
    if (!currentUser) return;

    const refreshToken = async () => {
      try {
        const token = await currentUser.getIdToken(true); // Force refresh
        setIdToken(token);
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    };

    // Refresh token every 50 minutes (tokens expire after 1 hour)
    const interval = setInterval(refreshToken, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,
    userRole,
    idToken,
    loading,
    signup,
    signin,
    logout,
    resetPassword,
    resendEmailVerification,
    isEmailVerified,
    getIdToken,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    setUserRoleOnRegistration
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 