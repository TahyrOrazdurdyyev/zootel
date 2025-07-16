import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { resendEmailVerification } = useAuth();

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await resendEmailVerification();
      setMessage('Verification email sent again! Please check your inbox.');
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card verification">
        <div className="auth-header">
          <h1>Verify Your Email</h1>
          <p>We've sent you a verification link</p>
        </div>

        <div className="verification-content">
          <div className="verification-icon">📧</div>
          <h2>Check Your Email</h2>
          <p>
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p>
            Please check your email and click the verification link to activate your account.
            You can then sign in to access your dashboard.
          </p>
          
          <div className="verification-actions">
            <button 
              type="button" 
              onClick={handleResendVerification} 
              className="btn btn-outline"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </button>
            <Link to="/signin" className="btn btn-primary">
              Back to Sign In
            </Link>
          </div>
          
          {message && (
            <div className="info-message">
              {message}
            </div>
          )}
        </div>

        <div className="auth-footer">
          <p>
            Having trouble? <Link to="/support" className="auth-link">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification; 