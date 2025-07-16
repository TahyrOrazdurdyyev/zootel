import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState({
    status: 'inactive', // 'trial', 'active', 'expired', 'cancelled', 'inactive'
    plan: null, // 'starter', 'professional', 'enterprise'
    trialEndsAt: null,
    subscriptionEndsAt: null,
    features: {},
    isLoading: true
  });

  // Plan configurations
  const planConfigs = {
    starter: {
      id: 'starter',
      name: 'Starter',
      price: 29,
      features: {
        maxEmployees: 3,
        maxServices: 10,
        maxBookingsPerMonth: 100,
        basicReporting: true,
        emailNotifications: true,
        smsNotifications: false,
        advancedAnalytics: false,
        apiAccess: false,
        prioritySupport: false,
        customBranding: false
      }
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      price: 59,
      features: {
        maxEmployees: 10,
        maxServices: 50,
        maxBookingsPerMonth: 500,
        basicReporting: true,
        emailNotifications: true,
        smsNotifications: true,
        advancedAnalytics: true,
        apiAccess: false,
        prioritySupport: false,
        customBranding: true
      }
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      features: {
        maxEmployees: 50,
        maxServices: -1, // unlimited
        maxBookingsPerMonth: -1, // unlimited
        basicReporting: true,
        emailNotifications: true,
        smsNotifications: true,
        advancedAnalytics: true,
        apiAccess: true,
        prioritySupport: true,
        customBranding: true
      }
    }
  };

  // Fetch subscription data when user changes
  useEffect(() => {
    if (currentUser && userRole === 'pet_company') {
      fetchSubscriptionData();
    } else {
      setSubscriptionData(prev => ({ ...prev, isLoading: false }));
    }
  }, [currentUser, userRole]);

  const fetchSubscriptionData = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/companies/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData({
          ...data.data,
          isLoading: false
        });
      } else {
        // If no subscription data, set defaults
        setSubscriptionData({
          status: 'inactive',
          plan: null,
          trialEndsAt: null,
          subscriptionEndsAt: null,
          features: {},
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscriptionData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const startTrial = async (planId) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/companies/subscription/trial', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        await fetchSubscriptionData();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      return { success: false, error: 'Failed to start trial' };
    }
  };

  const subscribe = async (planId, billingPeriod = 'monthly') => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/companies/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId, billingPeriod })
      });

      if (response.ok) {
        await fetchSubscriptionData();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      return { success: false, error: 'Failed to subscribe' };
    }
  };

  const cancelSubscription = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/companies/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchSubscriptionData();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: 'Failed to cancel subscription' };
    }
  };

  // Feature access checking
  const hasFeature = (featureName) => {
    if (!subscriptionData.plan) return false;
    
    const plan = planConfigs[subscriptionData.plan];
    if (!plan) return false;
    
    return plan.features[featureName] || false;
  };

  const getFeatureLimit = (featureName) => {
    if (!subscriptionData.plan) return 0;
    
    const plan = planConfigs[subscriptionData.plan];
    if (!plan) return 0;
    
    return plan.features[featureName] || 0;
  };

  const isFeatureUnlimited = (featureName) => {
    return getFeatureLimit(featureName) === -1;
  };

  const canAccessFeature = (featureName, currentUsage = 0) => {
    if (!hasAccess()) return false;
    
    const limit = getFeatureLimit(featureName);
    if (limit === -1) return true; // unlimited
    if (limit === 0) return false; // not available
    
    return currentUsage < limit;
  };

  // Subscription status checks
  const hasAccess = () => {
    if (userRole !== 'pet_company') return true; // Non-companies have access
    
    const now = new Date();
    
    if (subscriptionData.status === 'active') {
      return !subscriptionData.subscriptionEndsAt || new Date(subscriptionData.subscriptionEndsAt) > now;
    }
    
    if (subscriptionData.status === 'trial') {
      return !subscriptionData.trialEndsAt || new Date(subscriptionData.trialEndsAt) > now;
    }
    
    return false;
  };

  const isTrialActive = () => {
    if (subscriptionData.status !== 'trial') return false;
    
    const now = new Date();
    return !subscriptionData.trialEndsAt || new Date(subscriptionData.trialEndsAt) > now;
  };

  const isTrialExpired = () => {
    if (subscriptionData.status !== 'trial') return false;
    
    const now = new Date();
    return subscriptionData.trialEndsAt && new Date(subscriptionData.trialEndsAt) <= now;
  };

  const getTrialDaysRemaining = () => {
    if (!isTrialActive()) return 0;
    
    const now = new Date();
    const trialEnd = new Date(subscriptionData.trialEndsAt);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const getSubscriptionStatus = () => {
    if (userRole !== 'pet_company') return 'n/a';
    
    if (isTrialActive()) {
      const daysRemaining = getTrialDaysRemaining();
      return `Trial (${daysRemaining} days left)`;
    }
    
    if (isTrialExpired()) {
      return 'Trial Expired';
    }
    
    if (subscriptionData.status === 'active') {
      return `Active - ${planConfigs[subscriptionData.plan]?.name || 'Unknown Plan'}`;
    }
    
    if (subscriptionData.status === 'expired') {
      return 'Subscription Expired';
    }
    
    if (subscriptionData.status === 'cancelled') {
      return 'Subscription Cancelled';
    }
    
    return 'No Active Subscription';
  };

  const getUpgradeMessage = () => {
    if (!subscriptionData.plan) {
      return 'Start your free trial to access premium features';
    }
    
    const currentPlan = planConfigs[subscriptionData.plan];
    if (!currentPlan) return '';
    
    if (subscriptionData.plan === 'starter') {
      return 'Upgrade to Professional for advanced analytics and more features';
    }
    
    if (subscriptionData.plan === 'professional') {
      return 'Upgrade to Enterprise for unlimited access and priority support';
    }
    
    return '';
  };

  const value = {
    // Subscription data
    subscriptionData,
    planConfigs,
    
    // Actions
    startTrial,
    subscribe,
    cancelSubscription,
    fetchSubscriptionData,
    
    // Feature checking
    hasFeature,
    getFeatureLimit,
    isFeatureUnlimited,
    canAccessFeature,
    
    // Status checking
    hasAccess,
    isTrialActive,
    isTrialExpired,
    getTrialDaysRemaining,
    getSubscriptionStatus,
    getUpgradeMessage
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 