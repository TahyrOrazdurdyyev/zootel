import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedApiCall } from '../../utils/api';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      let endpoint = '/api/analytics/overview';
      
      if (activeTab === 'revenue') endpoint = '/api/analytics/revenue';
      else if (activeTab === 'customers') endpoint = '/api/analytics/customers';
      else if (activeTab === 'services') endpoint = '/api/analytics/services';
      else if (activeTab === 'performance') endpoint = '/api/analytics/performance';

      const response = await authenticatedApiCall(currentUser, endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="analytics-content">
      <div className="metrics-overview modern-metrics">
        <div className="metric-card modern-revenue-card">
          <div className="card-background">
            <div className="card-pattern"></div>
          </div>
          <div className="card-content">
            <div className="metric-header">
              <div className="metric-icon revenue-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2V22M17 5H9.5C8.83696 5 8.20107 5.26339 7.73223 5.73223C7.26339 6.20107 7 6.83696 7 7.5C7 8.16304 7.26339 8.79893 7.73223 9.26777C8.20107 9.73661 8.83696 10 9.5 10H14.5C15.163 10 15.7989 10.2634 16.2678 10.7322C16.7366 11.2011 17 11.837 17 12.5C17 13.163 16.7366 13.7989 16.2678 14.2678C15.7989 14.7366 15.163 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="metric-trend positive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                +{analytics?.revenueGrowth?.toFixed(1) || '0'}%
              </div>
            </div>
            <div className="metric-value">${analytics?.totalRevenue?.toFixed(2) || '0.00'}</div>
            <div className="metric-label">Total Revenue</div>
          </div>
        </div>
        
        <div className="metric-card modern-bookings-card">
          <div className="card-background">
            <div className="card-pattern"></div>
          </div>
          <div className="card-content">
            <div className="metric-header">
              <div className="metric-icon bookings-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="metric-trend positive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                +{analytics?.bookingGrowth?.toFixed(1) || '0'}%
              </div>
            </div>
            <div className="metric-value">{analytics?.totalBookings || 0}</div>
            <div className="metric-label">Total Bookings</div>
          </div>
        </div>
        
        <div className="metric-card modern-rating-card">
          <div className="card-background">
            <div className="card-pattern"></div>
          </div>
          <div className="card-content">
            <div className="metric-header">
              <div className="metric-icon rating-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <polygon points="12 2 15.09 8.26 22 9 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="metric-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 12H16M9 16H15M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {analytics?.totalReviews || 0} reviews
              </div>
            </div>
            <div className="metric-value">{analytics?.averageRating || '0.0'}</div>
            <div className="metric-label">Average Rating</div>
          </div>
        </div>
        
        <div className="metric-card modern-customers-card">
          <div className="card-background">
            <div className="card-pattern"></div>
          </div>
          <div className="card-content">
            <div className="metric-header">
              <div className="metric-icon customers-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="metric-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8L15 8M15 8C16.1046 8 17 7.10457 17 6C17 4.89543 16.1046 4 15 4C13.8954 4 13 4.89543 13 6C13 7.10457 13.8954 8 15 8ZM9 16L21 16M9 16C7.89543 16 7 16.8954 7 18C7 19.1046 7.89543 20 9 20C10.1046 20 11 19.1046 11 18C11 16.8954 10.1046 16 9 16Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {analytics?.returningCustomers || 0} returning
              </div>
            </div>
            <div className="metric-value">{analytics?.newCustomers || 0}</div>
            <div className="metric-label">New Customers</div>
          </div>
        </div>
      </div>

      <div className="analytics-charts modern-charts">
        <div className="chart-card modern-chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <div className="chart-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Monthly Revenue Trend</h3>
            </div>
            <div className="chart-actions">
              <button className="chart-filter active">6M</button>
              <button className="chart-filter">1Y</button>
            </div>
          </div>
          <div className="chart-container modern-chart-container">
            {analytics?.monthlyTrends && analytics.monthlyTrends.length > 0 ? (
              <div className="trend-chart modern-trend-chart">
                {analytics.monthlyTrends.map((item, index) => (
                  <div key={index} className="trend-bar modern-trend-bar">
                    <div 
                      className="bar modern-bar" 
                      style={{ 
                        height: `${(item.revenue / Math.max(...analytics.monthlyTrends.map(t => t.revenue))) * 100}%` 
                      }}
                      title={`${item.month}: $${item.revenue}`}
                    ></div>
                    <span className="bar-label">{item.month}</span>
                    <span className="bar-value">${item.revenue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-chart">
                <div className="empty-chart-icon">📊</div>
                <p>No revenue data available</p>
                <span>Revenue trends will appear here once you have bookings</span>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card modern-services-card">
          <div className="chart-header">
            <div className="chart-title">
              <div className="chart-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Popular Services</h3>
            </div>
            <div className="services-count">
              {analytics?.popularServices?.length || 0} services
            </div>
          </div>
          <div className="services-list modern-services-list">
            {analytics?.popularServices && analytics.popularServices.length > 0 ? (
              analytics.popularServices.map((service, index) => (
                <div key={index} className="service-item modern-service-item">
                  <div className="service-rank">#{index + 1}</div>
                  <div className="service-content">
                    <div className="service-info">
                      <h4>{service.name}</h4>
                      <div className="service-meta">
                        <span className="bookings-count">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {service.bookings} bookings
                        </span>
                      </div>
                    </div>
                    <div className="service-revenue">
                      <span className="revenue-amount">${service.revenue.toFixed(2)}</span>
                      <span className="revenue-label">Revenue</span>
                    </div>
                  </div>
                  <div className="service-progress">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${(service.revenue / Math.max(...analytics.popularServices.map(s => s.revenue))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-services">
                <div className="empty-services-icon">🐕</div>
                <p>No services data available</p>
                <span>Popular services will appear here after bookings</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="analytics-content">
      <div className="revenue-metrics">
        <div className="revenue-card">
          <h3>Monthly Revenue</h3>
          <div className="revenue-amount">${analytics?.monthlyRevenue?.toFixed(2) || '0.00'}</div>
          <div className="revenue-change positive">+{analytics?.revenueGrowth?.toFixed(1) || '0'}%</div>
        </div>
        
        <div className="revenue-card">
          <h3>Yearly Revenue</h3>
          <div className="revenue-amount">${analytics?.yearlyRevenue?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="revenue-card">
          <h3>Avg per Booking</h3>
          <div className="revenue-amount">${(analytics?.totalRevenue / analytics?.totalBookings || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="analytics-content">
      <div className="services-analytics">
        {analytics?.map((service, index) => (
          <div key={index} className="service-analytics-card">
            <div className="service-header">
              <h3>{service.name}</h3>
              <span className="service-category">{service.category}</span>
            </div>
            <div className="service-metrics">
              <div className="service-metric">
                <span className="metric-label">Bookings</span>
                <span className="metric-value">{service.totalBookings}</span>
              </div>
              <div className="service-metric">
                <span className="metric-label">Revenue</span>
                <span className="metric-value">${service.totalRevenue?.toFixed(2)}</span>
              </div>
              <div className="service-metric">
                <span className="metric-label">Rating</span>
                <span className="metric-value">{service.averageRating} ⭐</span>
              </div>
              <div className="service-metric">
                <span className="metric-label">Trend</span>
                <span className={`metric-value trend-${service.bookingTrend}`}>
                  {service.bookingTrend === 'up' ? '📈' : service.bookingTrend === 'down' ? '📉' : '➡️'}
                  {service.bookingTrendPercentage?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )) || <p>No service analytics available</p>}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="analytics-content">
      <div className="performance-metrics">
        <div className="performance-grid">
          <div className="performance-card">
            <h4>Conversion Rate</h4>
            <div className="performance-value">{analytics?.bookingConversionRate?.toFixed(1) || '0'}%</div>
          </div>
          <div className="performance-card">
            <h4>Customer Satisfaction</h4>
            <div className="performance-value">{analytics?.customerSatisfactionScore || '0.0'} ⭐</div>
          </div>
          <div className="performance-card">
            <h4>Response Time</h4>
            <div className="performance-value">{analytics?.averageResponseTime || '0'} hrs</div>
          </div>
          <div className="performance-card">
            <h4>Completion Rate</h4>
            <div className="performance-value">{analytics?.serviceCompletionRate?.toFixed(1) || '0'}%</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <p>Comprehensive insights into your business performance</p>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Revenue
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🐕 Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          📈 Performance
        </button>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'revenue' && renderRevenue()}
      {activeTab === 'services' && renderServices()}
      {activeTab === 'performance' && renderPerformance()}
    </div>
  );
};

export default AnalyticsDashboard; 