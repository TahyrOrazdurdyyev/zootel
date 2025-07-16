import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'pet_owner',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      const result = await signup(formData.email, formData.password, formData.role);
      
      // Redirect to email verification page
      navigate(`/email-verification?email=${encodeURIComponent(formData.email)}&role=${formData.role}`);
    } catch (error) {
      console.error('Sign up error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/operation-not-allowed':
        return 'Sign up is currently disabled. Please contact support.';
      default:
        return 'Sign up failed. Please try again.';
    }
  };

  const roleOptions = [
    {
      value: 'pet_owner',
      label: 'Pet Owner',
      icon: '🐾',
      description: 'Find and book pet services'
    },
    {
      value: 'pet_company',
      label: 'Service Provider',
      icon: '🏢',
      description: 'Offer pet services to customers'
    }
  ];

  return (
    <div className="auth-container">
      <div className="auth-card signup">
        <div className="auth-header">
          <h1>Join Zootel</h1>
          <p>Create your account and start connecting</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="displayName">Full Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
                minLength="6"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <div className="role-selection">
              {roleOptions.map((role) => (
                <label
                  key={role.value}
                  className={`role-option ${formData.role === role.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <div className="role-content">
                    <div className="role-header">
                      <span className="role-icon">{role.icon}</span>
                      <span className="role-label">{role.label}</span>
                    </div>
                    <p className="role-description">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <span className="checkmark"></span>
              I agree to the{' '}
              <Link to="/terms-of-service" className="link">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="link">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading || !formData.agreeToTerms}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/signin" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 