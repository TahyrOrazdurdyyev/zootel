import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedApiCall } from '../../utils/api';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser, activeTab]);

  const fetchAnalytics = async () => {
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
  };

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
      <div className="metrics-overview">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <h3>${analytics?.totalRevenue?.toFixed(2) || '0.00'}</h3>
            <p>Total Revenue</p>
            <span className="metric-change positive">+{analytics?.revenueGrowth?.toFixed(1) || '0'}%</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-info">
            <h3>{analytics?.totalBookings || 0}</h3>
            <p>Total Bookings</p>
            <span className="metric-change positive">+{analytics?.bookingGrowth?.toFixed(1) || '0'}%</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-info">
            <h3>{analytics?.averageRating || '0.0'}</h3>
            <p>Average Rating</p>
            <span className="metric-detail">{analytics?.totalReviews || 0} reviews</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-info">
            <h3>{analytics?.newCustomers || 0}</h3>
            <p>New Customers</p>
            <span className="metric-detail">{analytics?.returningCustomers || 0} returning</span>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h3>Monthly Revenue Trend</h3>
          <div className="chart-container">
            {analytics?.monthlyTrends && (
              <div className="trend-chart">
                {analytics.monthlyTrends.map((item, index) => (
                  <div key={index} className="trend-bar">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${(item.revenue / Math.max(...analytics.monthlyTrends.map(t => t.revenue))) * 100}%` 
                      }}
                    ></div>
                    <span className="bar-label">{item.month}</span>
                    <span className="bar-value">${item.revenue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Popular Services</h3>
          <div className="services-list">
            {analytics?.popularServices?.map((service, index) => (
              <div key={index} className="service-item">
                <div className="service-info">
                  <h4>{service.name}</h4>
                  <p>{service.bookings} bookings</p>
                </div>
                <div className="service-revenue">
                  ${service.revenue.toFixed(2)}
                </div>
              </div>
            ))}
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