import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Company Column */}
          <div className="footer-column">
            <h3 className="footer-title">Company</h3>
            <ul className="footer-links">
              <li>
                <Link to="/about" className="footer-link">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/careers" className="footer-link">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Products Column */}
          <div className="footer-column">
            <h3 className="footer-title">Products</h3>
            <ul className="footer-links">
              <li>
                <Link to="/marketplace" className="footer-link">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="footer-link">
                  CRM
                </Link>
              </li>
              <li>
                <Link to="/support" className="footer-link">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="footer-column">
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-links">
              <li>
                <Link to="/privacy-policy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="footer-link">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* App Download Column */}
          <div className="footer-column">
            <h3 className="footer-title">Get the App</h3>
            <div className="app-download-buttons">
              <button className="app-store-button coming-soon-app">
                <div className="app-store-content">
                  <span className="app-store-icon">📱</span>
                  <div className="app-store-text">
                    <span className="app-store-subtitle">Download on the</span>
                    <span className="app-store-title">App Store</span>
                  </div>
                </div>
                <span className="coming-soon-overlay">Coming Soon</span>
              </button>
              
              <button className="app-store-button coming-soon-app">
                <div className="app-store-content">
                  <span className="app-store-icon">🤖</span>
                  <div className="app-store-text">
                    <span className="app-store-subtitle">Get it on</span>
                    <span className="app-store-title">Google Play</span>
                  </div>
                </div>
                <span className="coming-soon-overlay">Coming Soon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-text">Zootel</span>
            </Link>
            <p className="footer-description">
              Connecting pet owners with trusted service providers
            </p>
          </div>
          
          <div className="footer-social">
            <p className="footer-copyright">
              © {currentYear} Zootel. All rights reserved.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" title="Facebook">
                📘
              </a>
              <a href="#" className="social-link" title="Twitter">
                🐦
              </a>
              <a href="#" className="social-link" title="Instagram">
                📷
              </a>
              <a href="#" className="social-link" title="LinkedIn">
                💼
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 