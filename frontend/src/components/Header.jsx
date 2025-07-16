import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';
import logoImage from '../assets/images/2.png';

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
                <div className="dropdown-item coming-soon">
                  📱 Zootel App
                  <span className="coming-soon-badge">Coming Soon</span>
                </div>
                <Link to="/pricing" className="dropdown-item">
                  💼 Zootel CRM
                </Link>
                <div className="dropdown-item coming-soon">
                  🏢 Zootel Business
                  <span className="coming-soon-badge">Coming Soon</span>
                </div>
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
                <span className="profile-avatar">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="profile-name">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                </span>
                <span className="profile-role">({userRole})</span>
              </button>
              
              {showProfileDropdown && (
                <div className="dropdown-menu profile-menu">
                  <Link to="/profile" className="dropdown-item">
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