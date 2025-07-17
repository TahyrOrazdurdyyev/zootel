import React, { useState, useEffect } from 'react';
import './AdminOverview.css';

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [waitlistStats, setWaitlistStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState('healthy');

  useEffect(() => {
    fetchAnalytics();
    fetchWaitlistStats();
    checkSystemStatus();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zootel.shop'}/api/superadmin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlistStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zootel.shop'}/api/waitlist/stats`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setWaitlistStats(result.data);
      } else {
        console.error('Failed to fetch waitlist stats');
      }
    } catch (error) {
      console.error('Error fetching waitlist stats:', error);
    }
  };

  const checkSystemStatus = () => {
    // In a real app, this would check various system health indicators
    setSystemStatus('healthy');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered': return '👤';
      case 'company_verified': return '✅';
      case 'booking_completed': return '📅';
      case 'payment_processed': return '💳';
      case 'dispute_resolved': return '⚖️';
      default: return '📋';
    }
  };

  const getActivityTypeText = (type) => {
    switch (type) {
      case 'user_registered': return 'User Registration';
      case 'company_verified': return 'Company Verification';
      case 'booking_completed': return 'Booking Completed';
      case 'payment_processed': return 'Payment Processed';
      case 'dispute_resolved': return 'Dispute Resolved';
      default: return 'Platform Activity';
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'generate_report':
        // Would open report generation modal
        alert('Report generation feature coming soon');
        break;
      case 'user_analytics':
        // Would navigate to user analytics
        alert('User analytics feature coming soon');
        break;
      case 'system_maintenance':
        // Would open system maintenance panel
        alert('System maintenance feature coming soon');
        break;
      case 'emergency_stop':
        // Would trigger emergency system stop
        if (confirm('Are you sure you want to trigger emergency stop? This will affect all platform operations.')) {
          alert('Emergency stop feature coming soon');
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading platform overview...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="admin-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to Load Analytics</h3>
        <p>Unable to fetch platform data. Please try again.</p>
        <button onClick={fetchAnalytics} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-overview">
      {/* System Status Bar */}
      <div className={`system-status ${systemStatus}`}>
        <div className="status-indicator">
          <span className="status-icon">
            {systemStatus === 'healthy' ? '🟢' : systemStatus === 'warning' ? '🟡' : '🔴'}
          </span>
          <span className="status-text">
            System Status: {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
          </span>
        </div>
        <div className="system-actions">
          <button 
            className="action-btn emergency"
            onClick={() => handleQuickAction('emergency_stop')}
          >
            🚨 Emergency Stop
          </button>
          <button 
            className="action-btn maintenance"
            onClick={() => handleQuickAction('system_maintenance')}
          >
            🔧 Maintenance
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <div className="metric-value">{formatNumber(analytics.platformStats.totalUsers)}</div>
            <div className="metric-sub">
              <span>{formatNumber(analytics.platformStats.totalPetOwners)} Pet Owners</span>
              <span>{formatNumber(analytics.platformStats.totalCompanies)} Companies</span>
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <div className="metric-value">{formatCurrency(analytics.platformStats.totalRevenue)}</div>
            <div className="metric-sub">
              <span>Monthly: {formatCurrency(analytics.revenueData[0]?.revenue || 0)}</span>
            </div>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>Total Bookings</h3>
            <div className="metric-value">{formatNumber(analytics.platformStats.totalBookings)}</div>
            <div className="metric-sub">
              <span>Avg Rating: {analytics.platformStats.averageRating}/5.0</span>
            </div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <h3>Platform Health</h3>
            <div className="metric-value">{analytics.platformStats.averageRating}/5.0</div>
            <div className="metric-sub">
              <span>Service Quality</span>
            </div>
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <h3>Waitlist Signups</h3>
            <div className="metric-value">{waitlistStats ? formatNumber(waitlistStats.overall.total) : '...'}</div>
            <div className="metric-sub">
              <span>Mobile App: {waitlistStats?.byType?.mobile_app?.total || 0}</span>
              <span>Business: {waitlistStats?.byType?.business_app?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="analytics-section">
        <div className="analytics-row">
          {/* User Growth Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>User Growth (Last 6 Months)</h3>
              <button 
                className="chart-action"
                onClick={() => handleQuickAction('user_analytics')}
              >
                View Details
              </button>
            </div>
            <div className="simple-chart">
              {analytics.userGrowth.reverse().map((data, index) => (
                <div key={index} className="chart-bar">
                  <div className="bar-container">
                    <div 
                      className="bar users"
                      style={{ height: `${(data.users / 200) * 100}%` }}
                      title={`${data.users} users`}
                    ></div>
                    <div 
                      className="bar companies"
                      style={{ height: `${(data.companies / 20) * 100}%` }}
                      title={`${data.companies} companies`}
                    ></div>
                  </div>
                  <div className="bar-label">{data.month}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-color users"></span>
                Users
              </span>
              <span className="legend-item">
                <span className="legend-color companies"></span>
                Companies
              </span>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Revenue Trend (Last 6 Months)</h3>
              <button 
                className="chart-action"
                onClick={() => handleQuickAction('generate_report')}
              >
                Generate Report
              </button>
            </div>
            <div className="revenue-chart">
              {analytics.revenueData.reverse().map((data, index) => (
                <div key={index} className="revenue-bar">
                  <div 
                    className="revenue-fill"
                    style={{ height: `${(data.revenue / 35000) * 100}%` }}
                    title={formatCurrency(data.revenue)}
                  ></div>
                  <div className="revenue-label">{data.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Companies and Recent Activity */}
      <div className="bottom-section">
        <div className="companies-card">
          <div className="card-header">
            <h3>🏆 Top Performing Companies</h3>
          </div>
          <div className="companies-list">
            {analytics.topCompanies.map((company, index) => (
              <div key={index} className="company-item">
                <div className="company-rank">#{index + 1}</div>
                <div className="company-info">
                  <div className="company-name">{company.name}</div>
                  <div className="company-stats">
                    <span>{company.bookings} bookings</span>
                    <span>{formatCurrency(company.revenue)}</span>
                    <span>⭐ {company.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <h3>📊 Recent Platform Activity</h3>
          </div>
          <div className="activity-list">
            {analytics.recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <div className="activity-message">{activity.message}</div>
                  <div className="activity-meta">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="activity-type">
                  {getActivityTypeText(activity.type)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>🚀 Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-card primary"
            onClick={() => handleQuickAction('generate_report')}
          >
            <div className="action-icon">📋</div>
            <div className="action-text">
              <div className="action-title">Generate Report</div>
              <div className="action-desc">Create comprehensive platform reports</div>
            </div>
          </button>
          
          <button 
            className="action-card info"
            onClick={() => handleQuickAction('user_analytics')}
          >
            <div className="action-icon">👥</div>
            <div className="action-text">
              <div className="action-title">User Analytics</div>
              <div className="action-desc">Deep dive into user behavior</div>
            </div>
          </button>
          
          <button 
            className="action-card warning"
            onClick={() => handleQuickAction('system_maintenance')}
          >
            <div className="action-icon">🔧</div>
            <div className="action-text">
              <div className="action-title">System Maintenance</div>
              <div className="action-desc">Manage system health and updates</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview; 