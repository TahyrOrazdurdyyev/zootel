import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Pricing.css';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const { userRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mock pricing plans
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small pet service businesses',
      monthlyPrice: 29,
      yearlyPrice: 290,
      employeeLimit: 3,
      features: [
        'Up to 3 employees',
        'Basic appointment management',
        'Customer database',
        'Email notifications',
        'Mobile app access',
        'Basic reports'
      ],
      recommended: false,
      freeTrialDays: 7,
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Ideal for growing pet service companies',
      monthlyPrice: 59,
      yearlyPrice: 590,
      employeeLimit: 10,
      features: [
        'Up to 10 employees',
        'Advanced scheduling',
        'Customer management',
        'SMS & email notifications',
        'Mobile app access',
        'Advanced reporting',
        'Calendar integration',
        'Online booking widget'
      ],
      recommended: true,
      freeTrialDays: 7,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large pet service organizations',
      monthlyPrice: 99,
      yearlyPrice: 990,
      employeeLimit: 50,
      features: [
        'Up to 50 employees',
        'Full scheduling suite',
        'Complete CRM system',
        'Multi-channel notifications',
        'Mobile app access',
        'Custom reporting',
        'API access',
        'Priority support',
        'Custom integrations'
      ],
      recommended: false,
      freeTrialDays: 7,
    },
  ];

  const handleStartTrial = (planId) => {
    if (!isAuthenticated()) {
      navigate('/signup');
      return;
    }

    if (userRole !== 'pet_company') {
      // Redirect non-company users to signup as company
      navigate('/signup?type=company');
      return;
    }

    // Start trial for company users
    navigate(`/company/trial/${planId}`);
  };

  const handleSubscribe = (planId) => {
    if (!isAuthenticated()) {
      navigate('/signup');
      return;
    }

    if (userRole !== 'pet_company') {
      navigate('/signup?type=company');
      return;
    }

    navigate(`/company/subscribe/${planId}`);
  };

  const getPrice = (plan) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getPriceLabel = (plan) => {
    if (billingPeriod === 'monthly') {
      return `$${plan.monthlyPrice}/month`;
    }
    const monthlySavings = plan.monthlyPrice * 12 - plan.yearlyPrice;
    return (
      <div>
        <span className="yearly-price">${plan.yearlyPrice}/year</span>
        <span className="savings">Save ${monthlySavings}</span>
      </div>
    );
  };

  return (
    <div className="pricing">
      {/* Hero Section */}
      <div className="pricing-hero">
        <div className="hero-background">
          <div className="hero-image-placeholder">
            💼📊📈💰🚀⚡
          </div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">Zootel CRM Pricing</h1>
          <p className="hero-subtitle">
            Choose the perfect plan to grow your pet service business
          </p>
          <p className="hero-description">
            All plans include a 7-day free trial. No credit card required.
          </p>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="pricing-content">
        <div className="container">
          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={`toggle-label ${billingPeriod === 'monthly' ? 'active' : ''}`}>
              Monthly
            </span>
            <button 
              className="toggle-button"
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            >
              <div className={`toggle-slider ${billingPeriod === 'yearly' ? 'yearly' : ''}`}></div>
            </button>
            <span className={`toggle-label ${billingPeriod === 'yearly' ? 'active' : ''}`}>
              Yearly
              <span className="savings-badge">Save 17%</span>
            </span>
          </div>

          {/* Plans Grid */}
          <div className="plans-grid">
            {plans.map(plan => (
              <div 
                key={plan.id} 
                className={`plan-card ${plan.recommended ? 'recommended' : ''}`}
              >
                {plan.recommended && (
                  <div className="recommended-badge">Most Popular</div>
                )}
                
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                  
                  <div className="plan-price">
                    {getPriceLabel(plan)}
                  </div>
                  
                  <div className="plan-limits">
                    Up to {plan.employeeLimit} employees
                  </div>
                </div>

                <div className="plan-features">
                  <h4 className="features-title">Features included:</h4>
                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="feature-item">
                        <span className="feature-check">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="plan-actions">
                  <button 
                    className="trial-button"
                    onClick={() => handleStartTrial(plan.id)}
                  >
                    Start {plan.freeTrialDays} Days Free Trial
                  </button>
                  
                  <button 
                    className={`subscribe-button ${plan.recommended ? 'primary' : 'secondary'}`}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="features-comparison">
            <h2 className="comparison-title">Compare Plans</h2>
            
            <div className="comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Starter</th>
                    <th>Professional</th>
                    <th>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Employee Limit</td>
                    <td>3</td>
                    <td>10</td>
                    <td>50</td>
                  </tr>
                  <tr>
                    <td>Appointment Management</td>
                    <td>✓ Basic</td>
                    <td>✓ Advanced</td>
                    <td>✓ Full Suite</td>
                  </tr>
                  <tr>
                    <td>Customer Database</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓ + CRM</td>
                  </tr>
                  <tr>
                    <td>Mobile App</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                  </tr>
                  <tr>
                    <td>Reporting</td>
                    <td>Basic</td>
                    <td>Advanced</td>
                    <td>Custom</td>
                  </tr>
                  <tr>
                    <td>API Access</td>
                    <td>—</td>
                    <td>—</td>
                    <td>✓</td>
                  </tr>
                  <tr>
                    <td>Priority Support</td>
                    <td>—</td>
                    <td>—</td>
                    <td>✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2 className="faq-title">Frequently Asked Questions</h2>
            
            <div className="faq-grid">
              <div className="faq-item">
                <h4 className="faq-question">How does the free trial work?</h4>
                <p className="faq-answer">
                  All plans include a 7-day free trial with full access to all features. 
                  No credit card required to start.
                </p>
              </div>
              
              <div className="faq-item">
                <h4 className="faq-question">Can I change plans later?</h4>
                <p className="faq-answer">
                  Yes, you can upgrade or downgrade your plan at any time. 
                  Changes take effect immediately.
                </p>
              </div>
              
              <div className="faq-item">
                <h4 className="faq-question">What payment methods do you accept?</h4>
                <p className="faq-answer">
                  We accept all major credit cards, PayPal, and bank transfers 
                  for annual subscriptions.
                </p>
              </div>
              
              <div className="faq-item">
                <h4 className="faq-question">Is there a setup fee?</h4>
                <p className="faq-answer">
                  No setup fees. The price you see is all you pay. 
                  Cancel anytime with no penalties.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="pricing-cta">
            <h2 className="cta-title">Ready to grow your pet service business?</h2>
            <p className="cta-description">
              Join hundreds of successful pet service providers using Zootel CRM
            </p>
            <button 
              className="cta-button"
              onClick={() => handleStartTrial('professional')}
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 