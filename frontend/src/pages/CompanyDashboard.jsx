import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import './CompanyDashboard.css';
import logoImage from '../assets/images/2.png';
import { TrialBanner, SubscriptionStatus } from '../components/FeatureGate';

// Dashboard components
import DashboardOverview from '../components/dashboard/DashboardOverview';
import ProfileManagement from '../components/dashboard/ProfileManagement';
import ServicesManagement from '../components/dashboard/ServicesManagement';
import BookingsManagement from '../components/dashboard/BookingsManagement';
import EmployeeManagement from '../components/dashboard/EmployeeManagement';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';

const CompanyDashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const { hasAccess, subscriptionData } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not a pet company
  useEffect(() => {
    if (userRole && userRole !== 'pet_company' && userRole !== 'superadmin') {
      window.location.href = '/';
    }
  }, [userRole]);

  const navigationItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: '📊',
      component: DashboardOverview
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: '🏢',
      component: ProfileManagement
    },
    {
      id: 'services',
      name: 'Services',
      icon: '🐕',
      component: ServicesManagement
    },
    {
      id: 'bookings',
      name: 'Bookings',
      icon: '📅',
      component: BookingsManagement
    },
    {
      id: 'employees',
      name: 'Employees',
      icon: '👥',
      component: EmployeeManagement
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📈',
      component: AnalyticsDashboard
    }
  ];

  const ActiveComponent = navigationItems.find(item => item.id === activeTab)?.component || DashboardOverview;

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo/Brand */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src={logoImage} alt="Zootel" className="sidebar-logo-image" />
          </Link>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        {/* User info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-name">
                {currentUser.displayName || 'Pet Company'}
              </div>
              <div className="user-email">{currentUser.email}</div>
              <div className="user-role">{userRole}</div>
              {/* Subscription Status */}
              <div className="sidebar-subscription">
                <SubscriptionStatus />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-text">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">
              {navigationItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="header-btn">
                <span>🔔</span>
                <span className="notification-badge">3</span>
              </button>
              <button className="header-btn">
                <span>❓</span>
              </button>
            </div>
            <div className="user-menu">
              <button className="user-menu-btn">
                <div className="user-avatar small">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                </div>
                <span>⌄</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="dashboard-content">
          {/* Trial Banner */}
          <TrialBanner />
          
          {/* Access Control - Show content only if has access */}
          {hasAccess() ? (
            <ActiveComponent />
          ) : (
            <div className="access-required">
              <div className="access-required-content">
                <div className="access-icon">🔒</div>
                <h2>Subscription Required</h2>
                <p>You need an active subscription to access the company dashboard.</p>
                {subscriptionData.status === 'inactive' ? (
                  <p>Start your free trial to begin managing your pet service business.</p>
                ) : (
                  <p>Your subscription has expired. Please renew to continue using the dashboard.</p>
                )}
                <div className="access-actions">
                  <button 
                    className="start-trial-btn"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    {subscriptionData.status === 'inactive' ? 'Start Free Trial' : 'Renew Subscription'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard; 