import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './SuperadminDashboard.css';

// Dashboard components
import AdminOverview from '../components/superadmin/AdminOverview';
import UserManagement from '../components/superadmin/UserManagement';
import CompanyManagement from '../components/superadmin/CompanyManagement';
import PlatformAnalytics from '../components/superadmin/PlatformAnalytics';
import SystemSettings from '../components/superadmin/SystemSettings';

const SuperadminDashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect if not a superadmin
  useEffect(() => {
    if (userRole && userRole !== 'superadmin') {
      window.location.href = '/';
    }
  }, [userRole]);

  const navigationItems = [
    {
      id: 'overview',
      name: 'Overview',
      icon: '📊',
      component: AdminOverview
    },
    {
      id: 'users',
      name: 'Users',
      icon: '👥',
      component: UserManagement
    },
    {
      id: 'companies',
      name: 'Companies',
      icon: '🏢',
      component: CompanyManagement
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📈',
      component: PlatformAnalytics
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: '⚙️',
      component: SystemSettings
    }
  ];

  const ActiveComponent = navigationItems.find(item => item.id === activeTab)?.component || AdminOverview;

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
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="superadmin-dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo/Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">👑</span>
            {sidebarOpen && <span className="logo-text">Zootel Admin</span>}
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
          <div className="user-avatar admin">
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-name">
                {currentUser.displayName || 'Superadmin'}
              </div>
              <div className="user-email">{currentUser.email}</div>
              <div className="user-role admin-role">{userRole}</div>
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

        {/* Admin Quick Actions */}
        {sidebarOpen && (
          <div className="sidebar-quick-actions">
            <button className="quick-action-btn emergency">
              <span className="action-icon">🚨</span>
              <span className="action-text">Emergency Stop</span>
            </button>
            <button className="quick-action-btn primary">
              <span className="action-icon">📋</span>
              <span className="action-text">Generate Report</span>
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
              {navigationItems.find(item => item.id === activeTab)?.name || 'Admin Dashboard'}
            </h1>
            <div className="admin-badge">
              <span className="badge-icon">👑</span>
              <span className="badge-text">Superadmin</span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="header-btn" title="Critical Alerts">
                <span>🚨</span>
                <span className="notification-badge critical">5</span>
              </button>
              <button className="header-btn" title="System Status">
                <span>🟢</span>
              </button>
              <button className="header-btn" title="Help">
                <span>❓</span>
              </button>
            </div>
            <div className="user-menu">
              <button className="user-menu-btn">
                <div className="user-avatar small admin">
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

export default SuperadminDashboard; 