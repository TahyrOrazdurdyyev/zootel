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
    console.log('Signup called with role:', role);
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send email verification
    if (result.user) {
      await sendEmailVerification(result.user);
    }
    
    // Store the selected role for later use (both sessionStorage and localStorage for redundancy)
    sessionStorage.setItem('pendingUserRole', role);
    localStorage.setItem(`pendingUserRole_${result.user.uid}`, role);
    console.log('Stored pendingUserRole in sessionStorage and localStorage:', role);
    
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
              // Use full backend URL in production, relative URL in development
        const apiBaseUrl = import.meta.env.DEV ? '' : 'https://zootel.shop';
        const response = await fetch(`${apiBaseUrl}/api/auth/register-role`, {
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
    let pendingRole = sessionStorage.getItem('pendingUserRole');
    
    // If not found in sessionStorage, check localStorage as backup
    if (!pendingRole && user) {
      pendingRole = localStorage.getItem(`pendingUserRole_${user.uid}`);
      if (pendingRole) {
        console.log('Found pending role in localStorage backup:', pendingRole);
        // Restore to sessionStorage for consistency
        sessionStorage.setItem('pendingUserRole', pendingRole);
      }
    }
    
    console.log('checkAndSetPendingRole called with user:', user?.email, 'pendingRole:', pendingRole);
    
    // Only set role if user is email verified and has pending role
    if (pendingRole && user && user.emailVerified) {
      try {
        console.log('Setting pending role:', pendingRole);
        
        const token = await user.getIdToken(true); // Force refresh token
        console.log('Token obtained, making API call...');
        
        // Use full backend URL in production, relative URL in development
        const apiBaseUrl = import.meta.env.DEV ? '' : 'https://zootel.shop';
        const response = await fetch(`${apiBaseUrl}/api/setRole`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: pendingRole }),
        });

        console.log('API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Role set successfully:', data.role);
          
          // Force refresh the user's token to get updated custom claims
          await user.getIdToken(true);
          
          setUserRole(data.role);
          sessionStorage.removeItem('pendingUserRole');
          localStorage.removeItem(`pendingUserRole_${user.uid}`);
          
          return true;
        } else {
          const errorData = await response.json();
          console.error('Error setting role:', errorData);
          throw new Error(errorData.message || 'Failed to set role');
        }
      } catch (error) {
        console.error('Error setting pending user role:', error);
        throw error;
      }
    }
    return false;
  };

  // Sign in function
  const signin = async (email, password) => {
    console.log('Sign in called for:', email);
    
    // Check if there's a pending role before signing in
    const pendingRole = sessionStorage.getItem('pendingUserRole');
    console.log('Pending role found during signin:', pendingRole);
    
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
      
      console.log('Getting user role for:', user.email);
      
      // Force refresh token to get latest custom claims
      const tokenResult = await user.getIdTokenResult(true);
      const role = tokenResult.claims.role;
      
      console.log('Retrieved user role from custom claims:', role);
      console.log('All custom claims:', tokenResult.claims);
      
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
        console.log('onAuthStateChanged triggered, user:', user?.email);
        
        setCurrentUser(user);
        
        if (user) {
          console.log('User authenticated:', user.email, 'Email verified:', user.emailVerified);
          
          // Check for pending role first and wait for it to complete
          const roleWasSet = await checkAndSetPendingRole(user);
          console.log('Role was set during auth state change:', roleWasSet);
          
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