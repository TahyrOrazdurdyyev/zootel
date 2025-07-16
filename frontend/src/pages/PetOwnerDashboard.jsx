import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PetOwnerDashboard.css';

// Dashboard components
import OwnerDashboardOverview from '../components/pet-owner/OwnerDashboardOverview';
import MyPets from '../components/pet-owner/MyPets';
import MyBookings from '../components/pet-owner/MyBookings';
import BrowseServices from '../components/pet-owner/BrowseServices';
import OwnerProfile from '../components/pet-owner/OwnerProfile';

const PetOwnerDashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not a pet owner
  useEffect(() => {
    if (userRole && userRole !== 'pet_owner' && userRole !== 'superadmin') {
      window.location.href = '/';
    }
  }, [userRole]);

  const navigationItems = [
    {
      id: 'overview',
      name: 'Dashboard',
      icon: '🏠',
      component: OwnerDashboardOverview
    },
    {
      id: 'pets',
      name: 'My Pets',
      icon: '🐾',
      component: MyPets
    },
    {
      id: 'bookings',
      name: 'My Bookings',
      icon: '📅',
      component: MyBookings
    },
    {
      id: 'browse',
      name: 'Browse Services',
      icon: '🔍',
      component: BrowseServices
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: '👤',
      component: OwnerProfile
    }
  ];

  const ActiveComponent = navigationItems.find(item => item.id === activeTab)?.component || OwnerDashboardOverview;

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
    <div className="pet-owner-dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo/Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🐾</span>
            {sidebarOpen && <span className="logo-text">Zootel</span>}
          </div>
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
                {currentUser.displayName || 'Pet Owner'}
              </div>
              <div className="user-email">{currentUser.email}</div>
              <div className="user-role">{userRole}</div>
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

        {/* Quick Actions */}
        {sidebarOpen && (
          <div className="sidebar-quick-actions">
            <button className="quick-action-btn primary">
              <span className="action-icon">📅</span>
              <span className="action-text">Book Service</span>
            </button>
            <button className="quick-action-btn secondary">
              <span className="action-icon">🐕</span>
              <span className="action-text">Add Pet</span>
            </button>
          </div>
        )}

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
                <span className="notification-badge">2</span>
              </button>
              <button className="header-btn" title="Emergency Contacts">
                <span>🚨</span>
              </button>
              <button className="header-btn" title="Help">
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
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};

export default PetOwnerDashboard; 