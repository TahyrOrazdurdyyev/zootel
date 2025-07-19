import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import logoImage from '../assets/images/Zootel.svg';
import './CompanyDashboard.css';
import { TrialBanner, SubscriptionStatus } from '../components/FeatureGate';

// Dashboard components
import DashboardOverview from '../components/dashboard/DashboardOverview';
import ProfileManagement from '../components/dashboard/ProfileManagement';
import ServicesManagement from '../components/dashboard/ServicesManagement';
import BookingsManagement from '../components/dashboard/BookingsManagement';
import EmployeeManagement from '../components/dashboard/EmployeeManagement';
import CustomerManagement from '../components/dashboard/CustomerManagement';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';

const CompanyDashboard = () => {
  const { currentUser, userRole, logout } = useAuth();
  const { hasAccess, subscriptionData } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [companyProfile, setCompanyProfile] = useState(null);

  // Fetch company profile data
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      if (!currentUser) return;
      
      try {
        const token = await currentUser.getIdToken();
        const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
        const response = await fetch(`${baseUrl}/api/companies/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCompanyProfile(data.data);
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }
    };

    fetchCompanyProfile();
  }, [currentUser]);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      // Auto-close sidebar on mobile when window is resized
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

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
      id: 'customers',
      name: 'Customers',
      icon: '👥',
      component: CustomerManagement
    },
    {
      id: 'employees',
      name: 'Employees',
      icon: '👤',
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
    <div className={`company-dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
            {companyProfile?.logoUrl ? (
              <img 
                src={companyProfile.logoUrl} 
                alt="Company Logo" 
                className="company-avatar-image"
              />
            ) : (
              companyProfile?.name ? companyProfile.name.charAt(0).toUpperCase() : 
              currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 
              currentUser.email.charAt(0).toUpperCase()
            )}
          </div>
          <div className="sidebar-subscription">
            <SubscriptionStatus />
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                // Auto-close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}

      {/* Main content */}
      <main className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-header">
          <div className="header-left">
            {/* Mobile sidebar toggle button */}
            <button 
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span>☰</span>
            </button>
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
          <div className="content-container">
            {/* Trial Banner */}
            <TrialBanner />
            
            {/* Access Control - Show content only if has access */}
            {hasAccess() ? (
              <ActiveComponent />
            ) : (
              <div className="access-required">
                <div className="access-required-content">
                  <div className="access-icon">🔒</div>
                  <h2>Upgrade Required</h2>
                  <p>This feature requires a premium subscription. Please upgrade your plan to access this functionality.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard; 