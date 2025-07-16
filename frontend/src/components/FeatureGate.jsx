import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import './FeatureGate.css';

const FeatureGate = ({ 
  feature, 
  children, 
  fallback = null,
  showUpgradePrompt = true,
  requiredPlan = null,
  customMessage = null
}) => {
  const { 
    hasAccess, 
    hasFeature, 
    canAccessFeature, 
    subscriptionData,
    planConfigs,
    getUpgradeMessage,
    getSubscriptionStatus 
  } = useSubscription();
  const navigate = useNavigate();

  // Check if user has general access
  if (!hasAccess()) {
    if (!showUpgradePrompt) return fallback;
    
    return (
      <div className="feature-gate">
        <div className="access-denied">
          <div className="access-icon">🔒</div>
          <h3>Access Required</h3>
          <p>
            {subscriptionData.status === 'inactive' 
              ? 'Start your free trial to access this feature'
              : 'Your subscription has expired. Please renew to continue using this feature.'
            }
          </p>
          <div className="access-actions">
            <button 
              className="upgrade-button"
              onClick={() => navigate('/pricing')}
            >
              {subscriptionData.status === 'inactive' ? 'Start Free Trial' : 'Renew Subscription'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check specific feature access
  if (feature && !hasFeature(feature)) {
    if (!showUpgradePrompt) return fallback;
    
    const upgradeMessage = customMessage || getUpgradeMessage();
    
    return (
      <div className="feature-gate">
        <div className="feature-locked">
          <div className="lock-icon">⭐</div>
          <h3>Premium Feature</h3>
          <p>{upgradeMessage}</p>
          <div className="current-plan">
            <span className="plan-label">Current Plan:</span>
            <span className="plan-name">{getSubscriptionStatus()}</span>
          </div>
          <div className="upgrade-actions">
            <button 
              className="upgrade-button"
              onClick={() => navigate('/pricing')}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if specific plan is required
  if (requiredPlan && subscriptionData.plan !== requiredPlan) {
    if (!showUpgradePrompt) return fallback;
    
    const requiredPlanConfig = planConfigs[requiredPlan];
    
    return (
      <div className="feature-gate">
        <div className="plan-required">
          <div className="plan-icon">🎯</div>
          <h3>{requiredPlanConfig?.name} Required</h3>
          <p>This feature requires the {requiredPlanConfig?.name} plan or higher.</p>
          <div className="plan-comparison">
            <div className="current-plan">
              <span>Current: {subscriptionData.plan ? planConfigs[subscriptionData.plan]?.name : 'None'}</span>
            </div>
            <div className="required-plan">
              <span>Required: {requiredPlanConfig?.name}</span>
            </div>
          </div>
          <div className="upgrade-actions">
            <button 
              className="upgrade-button"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to {requiredPlanConfig?.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has access, render children
  return children;
};

// Usage limit component
export const UsageLimitGate = ({ 
  feature, 
  currentUsage, 
  children, 
  showUpgradePrompt = true,
  warningThreshold = 0.8 
}) => {
  const { 
    getFeatureLimit, 
    isFeatureUnlimited, 
    canAccessFeature,
    planConfigs,
    subscriptionData 
  } = useSubscription();
  const navigate = useNavigate();

  const limit = getFeatureLimit(feature);
  const unlimited = isFeatureUnlimited(feature);
  const canAccess = canAccessFeature(feature, currentUsage);
  
  // Show warning when approaching limit
  const showWarning = !unlimited && limit > 0 && currentUsage >= (limit * warningThreshold);
  
  if (!canAccess) {
    if (!showUpgradePrompt) return null;
    
    return (
      <div className="feature-gate">
        <div className="usage-limit-reached">
          <div className="limit-icon">📊</div>
          <h3>Usage Limit Reached</h3>
          <p>
            You've reached your {feature.replace(/([A-Z])/g, ' $1').toLowerCase()} limit of {limit}.
          </p>
          <div className="usage-stats">
            <div className="usage-bar">
              <div className="usage-fill" style={{ width: '100%' }}></div>
            </div>
            <div className="usage-text">{currentUsage} / {limit}</div>
          </div>
          <div className="upgrade-actions">
            <button 
              className="upgrade-button"
              onClick={() => navigate('/pricing')}
            >
              Upgrade for More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showWarning && (
        <div className="usage-warning">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              Approaching limit: {currentUsage} / {unlimited ? '∞' : limit} {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>
            <button 
              className="warning-upgrade-btn"
              onClick={() => navigate('/pricing')}
            >
              Upgrade
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

// Trial banner component
export const TrialBanner = () => {
  const { 
    isTrialActive, 
    isTrialExpired, 
    getTrialDaysRemaining,
    subscriptionData 
  } = useSubscription();
  const navigate = useNavigate();

  if (!isTrialActive() && !isTrialExpired()) return null;

  const daysRemaining = getTrialDaysRemaining();
  const isExpired = isTrialExpired();

  return (
    <div className={`trial-banner ${isExpired ? 'expired' : daysRemaining <= 3 ? 'warning' : 'info'}`}>
      <div className="trial-content">
        <div className="trial-info">
          <span className="trial-icon">
            {isExpired ? '⏰' : daysRemaining <= 3 ? '⚠️' : '🎉'}
          </span>
          <span className="trial-text">
            {isExpired 
              ? 'Your trial has expired. Subscribe to continue using premium features.'
              : `Trial active: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
            }
          </span>
        </div>
        <button 
          className="trial-action-btn"
          onClick={() => navigate('/pricing')}
        >
          {isExpired ? 'Subscribe Now' : 'Choose Plan'}
        </button>
      </div>
    </div>
  );
};

// Subscription status indicator
export const SubscriptionStatus = () => {
  const { 
    getSubscriptionStatus, 
    subscriptionData, 
    planConfigs,
    hasAccess 
  } = useSubscription();
  const navigate = useNavigate();

  const status = getSubscriptionStatus();
  const hasActiveAccess = hasAccess();

  return (
    <div className="subscription-status">
      <div className={`status-indicator ${hasActiveAccess ? 'active' : 'inactive'}`}>
        <span className="status-dot"></span>
        <span className="status-text">{status}</span>
      </div>
      {!hasActiveAccess && (
        <button 
          className="status-action-btn"
          onClick={() => navigate('/pricing')}
        >
          Upgrade
        </button>
      )}
    </div>
  );
};

export default FeatureGate; 