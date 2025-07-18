import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/images/Zootel.svg';
import './Header.css';

const Header = () => {
  const { currentUser, userRole, logout, isAuthenticated } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSolutionsDropdown, setShowSolutionsDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get the appropriate profile URL based on user role
  const getProfileUrl = () => {
    switch (userRole) {
      case 'pet_owner':
        return '/pet-owner/dashboard';
      case 'pet_company':
        return '/company/dashboard';
      case 'superadmin':
        return '/admin/dashboard';
      default:
        return '/profile';
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <img src={logoImage} alt="Zootel" className="logo-image" />
        </Link>

        {/* Navigation */}
        <nav className="nav">
          <Link to="/marketplace" className="nav-link">
            Marketplace
          </Link>
          
          {/* Solutions Dropdown */}
          <div 
            className="dropdown"
            onMouseEnter={() => setShowSolutionsDropdown(true)}
            onMouseLeave={() => setShowSolutionsDropdown(false)}
          >
            <button className="nav-link dropdown-toggle">
              Solutions <span className="arrow">▼</span>
            </button>
            {showSolutionsDropdown && (
              <div className="dropdown-menu">
                <Link to="/zootel-app" className="dropdown-item">
                  📱 Zootel App
                </Link>
                <Link to="/pricing" className="dropdown-item">
                  💼 Zootel CRM
                </Link>
                <Link to="/zootel-business" className="dropdown-item">
                  🏢 Zootel Business
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Auth Section */}
        <div className="auth-section">
          {isAuthenticated() ? (
            <div 
              className="profile-dropdown"
              onMouseEnter={() => setShowProfileDropdown(true)}
              onMouseLeave={() => setShowProfileDropdown(false)}
            >
              <button className="profile-button">
                <span className="profile-icon">👤</span>
                <span className="profile-name">My Profile</span>
                <span className="profile-role" style={{ display: 'none' }}>({userRole})</span>
              </button>
              
              {showProfileDropdown && (
                <div className="dropdown-menu profile-menu">
                  <Link to={getProfileUrl()} className="dropdown-item">
                    👤 Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    ⚙️ Settings
                  </Link>
                  {userRole === 'superadmin' && (
                    <Link to="/admin/dashboard" className="dropdown-item">
                      👑 Admin Dashboard
                    </Link>
                  )}
                  {userRole === 'pet_company' && (
                    <Link to="/company/dashboard" className="dropdown-item">
                      🏢 Company Dashboard
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/signin" className="btn btn-outline">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 