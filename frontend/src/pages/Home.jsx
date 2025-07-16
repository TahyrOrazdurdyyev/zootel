import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { userRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }

    // Route based on user role
    switch (userRole) {
      case 'superadmin':
        navigate('/admin/dashboard');
        break;
      case 'pet_company':
        navigate('/company/dashboard');
        break;
      case 'pet_owner':
        navigate('/marketplace');
        break;
      default:
        navigate('/marketplace');
    }
  };

  // Content varies by user role
  const getWhyChooseCards = () => {
    const baseCards = [
      {
        icon: '🐾',
        title: 'Trusted Providers',
        description: 'All service providers are verified and reviewed by pet owners like you.',
      },
      {
        icon: '📱',
        title: 'Easy Booking',
        description: 'Book appointments instantly with our user-friendly platform.',
      },
      {
        icon: '💝',
        title: 'Happy Pets',
        description: 'Join thousands of satisfied pet owners who trust Zootel.',
      },
    ];

    if (userRole === 'pet_company') {
      return [
        {
          icon: '💼',
          title: 'Grow Your Business',
          description: 'Reach more pet owners and manage your services efficiently.',
        },
        {
          icon: '📊',
          title: 'Smart Analytics',
          description: 'Track your performance and optimize your services with detailed insights.',
        },
        {
          icon: '🎯',
          title: 'Target Customers',
          description: 'Connect with pet owners actively looking for your services.',
        },
      ];
    }

    if (userRole === 'superadmin') {
      return [
        {
          icon: '👑',
          title: 'Platform Management',
          description: 'Oversee the entire Zootel ecosystem with powerful admin tools.',
        },
        {
          icon: '📈',
          title: 'Business Insights',
          description: 'Monitor growth, revenue, and user engagement across the platform.',
        },
        {
          icon: '🛡️',
          title: 'Quality Control',
          description: 'Ensure the highest standards for both providers and pet owners.',
        },
      ];
    }

    return baseCards;
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background"></div>
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Welcome to Zootel</h1>
            <div className="hero-overlay">
              <h2 className="hero-subtitle">Thousands of Happy Pets</h2>
              <p className="hero-description">
                {userRole === 'pet_company' ? 
                  'Grow your pet service business and reach more customers' :
                  userRole === 'superadmin' ? 
                  'Manage the complete pet services ecosystem' :
                  'Find trusted pet services in your area instantly'
                }
              </p>
            </div>
            
            <button className="cta-button" onClick={handleGetStarted}>
              {isAuthenticated() ? 
                (userRole === 'pet_company' ? 'Go to Dashboard' : 
                 userRole === 'superadmin' ? 'Admin Panel' : 
                 'Explore Services') : 
                'Get Started'
              }
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Zootel Section */}
      <section className="why-choose">
        <div className="container">
          <h2 className="section-title">Why Choose Zootel?</h2>
          
          <div className="cards-grid">
            {getWhyChooseCards().map((card, index) => (
              <div key={index} className="feature-card">
                <div className="card-icon">{card.icon}</div>
                <h3 className="card-title">{card.title}</h3>
                <p className="card-description">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Happy Pets</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Service Providers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Cities</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4.8★</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              {userRole === 'pet_company' ? 
                'Ready to Grow Your Business?' :
                'Ready to Find the Perfect Service for Your Pet?'
              }
            </h2>
            <p className="cta-description">
              {userRole === 'pet_company' ? 
                'Join hundreds of successful pet service providers on Zootel.' :
                'Join thousands of pet owners who trust Zootel for their furry friends.'
              }
            </p>
            <button className="cta-button secondary" onClick={handleGetStarted}>
              {isAuthenticated() ? 
                (userRole === 'pet_company' ? 'Manage Services' : 'Browse Marketplace') : 
                'Join Zootel Today'
              }
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 