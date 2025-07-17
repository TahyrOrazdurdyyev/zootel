import React, { useState } from 'react';
import { authenticatedApiCall } from '../utils/api';
import './ZootelApp.css';

const ZootelApp = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zootel.shop'}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim() || null,
          type: 'mobile_app'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
        setEmail('');
        setPhone('');
      } else {
        setError(data.message || 'Failed to join waitlist');
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="zootel-app-page">
      {/* Hero Section */}
      <section className="app-hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Zootel Mobile App</h1>
              <p className="hero-subtitle">
                Find and book pet care services on the go
              </p>
              <p className="hero-description">
                The Zootel mobile app will make it easier than ever for pet owners to discover, 
                compare, and book trusted pet care services in their area. From dog walking to 
                grooming, veterinary care to pet sitting - everything your pet needs, right at your fingertips.
              </p>
              
              <form onSubmit={handleJoinWaitlist} className="waitlist-form">
                <div className="form-inputs">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="email-input"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="phone-input"
                  />
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="join-waitlist-btn"
                  >
                    {loading ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </div>
                {error && <div className="error-message">{error}</div>}
              </form>
            </div>
            
            <div className="hero-image">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-preview">
                    <div className="app-header">
                      <div className="app-logo">🐾</div>
                      <h3>Zootel</h3>
                    </div>
                    <div className="app-content">
                      <div className="service-card">
                        <div className="service-icon">✂️</div>
                        <div className="service-info">
                          <h4>Pet Grooming</h4>
                          <p>$45 - 2 hours</p>
                        </div>
                      </div>
                      <div className="service-card">
                        <div className="service-icon">🚶</div>
                        <div className="service-info">
                          <h4>Dog Walking</h4>
                          <p>$25 - 1 hour</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Coming Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Location-Based Search</h3>
              <p>Find pet services near you with GPS-enabled location search and real-time availability.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Reviews & Ratings</h3>
              <p>Read genuine reviews from other pet owners and rate your experiences to help the community.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>In-App Messaging</h3>
              <p>Chat directly with service providers, share pet photos, and get updates on your bookings.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Easy Booking</h3>
              <p>Book services in just a few taps with our streamlined booking process and instant confirmations.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payments</h3>
              <p>Pay safely with our encrypted payment system supporting multiple payment methods.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Smart Notifications</h3>
              <p>Get timely reminders for appointments, updates from providers, and special offers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Store Section */}
      <section className="app-store-section">
        <div className="container">
          <h2 className="section-title">Download Coming Soon</h2>
          <p className="section-subtitle">
            Be the first to know when the Zootel mobile app launches!
          </p>
          <div className="app-store-buttons">
            <div className="app-store-button ios disabled">
              <div className="app-button-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div className="app-button-text">
                <div className="app-button-subtitle">Download on the</div>
                <div className="app-button-title">App Store</div>
              </div>
              <div className="coming-soon-overlay">Coming Soon</div>
            </div>
            
            <div className="app-store-button android disabled">
              <div className="app-button-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
              </div>
              <div className="app-button-text">
                <div className="app-button-subtitle">GET IT ON</div>
                <div className="app-button-title">Google Play</div>
              </div>
              <div className="coming-soon-overlay">Coming Soon</div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={closeSuccessModal}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="success-icon">✅</div>
              <h3>Successfully Joined!</h3>
            </div>
            <div className="modal-content">
              <p>Thank you for joining our waitlist!</p>
              <p>You'll be among the first to know when the Zootel mobile app is available for download.</p>
            </div>
            <div className="modal-actions">
              <button onClick={closeSuccessModal} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZootelApp; 