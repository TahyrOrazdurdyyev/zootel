import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedApiCall } from '../../utils/api';
import './PlatformAnalytics.css';
import './AdminComponents.css';

const PlatformAnalytics = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('summary');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeframe]);

  const fetchAnalytics = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const response = await authenticatedApiCall(currentUser, '/api/superadmin/analytics');

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

  const generateReport = async (reportType) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zootel.shop'}/api/superadmin/reports?type=${reportType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Report generated successfully! Generated at: ${new Date(result.generatedAt).toLocaleString()}`);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
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

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const calculateGrowthRate = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getMetricColor = (metric) => {
    switch (metric) {
      case 'users': return '#7C4DFF';
      case 'companies': return '#03DAC6';
      case 'revenue': return '#4CAF50';
      case 'bookings': return '#FF9800';
      default: return '#BB86FC';
    }
  };

  const exportData = () => {
    // In a real implementation, this would download or export the data
    alert(`Exporting ${exportType} data for ${selectedTimeframe}...`);
    setShowExportModal(false);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to Load Analytics</h3>
        <p>Unable to fetch platform analytics. Please try again.</p>
        <button onClick={fetchAnalytics} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="platform-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-info">
          <h2>Platform Analytics</h2>
          <p>Comprehensive insights into platform performance and growth</p>
        </div>
        <div className="header-controls">
          <select
            className="timeframe-selector"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            className="export-btn"
            onClick={() => setShowExportModal(true)}
          >
            📊 Export Data
          </button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-card primary">
          <div className="metric-header">
            <h3>Total Users</h3>
            <span className="metric-icon">👥</span>
          </div>
          <div className="metric-value">{formatNumber(analytics.platformStats.totalUsers)}</div>
          <div className="metric-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Pet Owners</span>
              <span className="breakdown-value">{formatNumber(analytics.platformStats.totalPetOwners)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Companies</span>
              <span className="breakdown-value">{formatNumber(analytics.platformStats.totalCompanies)}</span>
            </div>
          </div>
          <div className="growth-indicator positive">
            +{formatPercentage(calculateGrowthRate(156, 142))} vs last month
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-header">
            <h3>Total Revenue</h3>
            <span className="metric-icon">💰</span>
          </div>
          <div className="metric-value">{formatCurrency(analytics.platformStats.totalRevenue)}</div>
          <div className="metric-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">This Month</span>
              <span className="breakdown-value">{formatCurrency(analytics.revenueData[0]?.revenue || 0)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Avg per Booking</span>
              <span className="breakdown-value">{formatCurrency(analytics.platformStats.totalRevenue / analytics.platformStats.totalBookings)}</span>
            </div>
          </div>
          <div className="growth-indicator negative">
            {formatPercentage(calculateGrowthRate(28450.75, 31200.50))} vs last month
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-header">
            <h3>Total Bookings</h3>
            <span className="metric-icon">📅</span>
          </div>
          <div className="metric-value">{formatNumber(analytics.platformStats.totalBookings)}</div>
          <div className="metric-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Completion Rate</span>
              <span className="breakdown-value">94.2%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Avg Rating</span>
              <span className="breakdown-value">{analytics.platformStats.averageRating}/5.0</span>
            </div>
          </div>
          <div className="growth-indicator positive">
            +{formatPercentage(calculateGrowthRate(5623, 5234))} vs last period
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-header">
            <h3>Platform Health</h3>
            <span className="metric-icon">📊</span>
          </div>
          <div className="metric-value">{analytics.platformStats.averageRating}/5.0</div>
          <div className="metric-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Active Companies</span>
              <span className="breakdown-value">87%</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">User Retention</span>
              <span className="breakdown-value">92.1%</span>
            </div>
          </div>
          <div className="growth-indicator positive">
            Stable performance
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container large">
          <div className="chart-header">
            <h3>Growth Trends</h3>
            <div className="chart-controls">
              <select
                className="metric-selector"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <option value="users">Users</option>
                <option value="companies">Companies</option>
                <option value="revenue">Revenue</option>
                <option value="bookings">Bookings</option>
              </select>
            </div>
          </div>
          <div className="growth-chart">
            {analytics.userGrowth.reverse().map((data, index) => {
              let value, maxValue;
              switch (selectedMetric) {
                case 'users':
                  value = data.users;
                  maxValue = 200;
                  break;
                case 'companies':
                  value = data.companies;
                  maxValue = 20;
                  break;
                case 'revenue':
                  value = analytics.revenueData[index]?.revenue || 0;
                  maxValue = 35000;
                  break;
                case 'bookings':
                  value = Math.floor(data.users * 4.5); // Simulated booking data
                  maxValue = 900;
                  break;
                default:
                  value = data.users;
                  maxValue = 200;
              }
              
              return (
                <div key={index} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(value / maxValue) * 100}%`,
                      backgroundColor: getMetricColor(selectedMetric)
                    }}
                    title={`${data.month}: ${selectedMetric === 'revenue' ? formatCurrency(value) : formatNumber(value)}`}
                  ></div>
                  <div className="bar-label">{data.month}</div>
                  <div className="bar-value">
                    {selectedMetric === 'revenue' ? formatCurrency(value) : formatNumber(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-container medium">
          <div className="chart-header">
            <h3>Revenue Distribution</h3>
          </div>
          <div className="revenue-breakdown">
            <div className="revenue-item">
              <div className="revenue-label">
                <span className="color-indicator primary"></span>
                Grooming Services
              </div>
              <div className="revenue-percentage">45%</div>
              <div className="revenue-amount">{formatCurrency(analytics.platformStats.totalRevenue * 0.45)}</div>
            </div>
            <div className="revenue-item">
              <div className="revenue-label">
                <span className="color-indicator success"></span>
                Pet Sitting
              </div>
              <div className="revenue-percentage">28%</div>
              <div className="revenue-amount">{formatCurrency(analytics.platformStats.totalRevenue * 0.28)}</div>
            </div>
            <div className="revenue-item">
              <div className="revenue-label">
                <span className="color-indicator info"></span>
                Dog Walking
              </div>
              <div className="revenue-percentage">18%</div>
              <div className="revenue-amount">{formatCurrency(analytics.platformStats.totalRevenue * 0.18)}</div>
            </div>
            <div className="revenue-item">
              <div className="revenue-label">
                <span className="color-indicator warning"></span>
                Other Services
              </div>
              <div className="revenue-percentage">9%</div>
              <div className="revenue-amount">{formatCurrency(analytics.platformStats.totalRevenue * 0.09)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-section">
        <div className="performance-card">
          <h3>🏆 Top Performing Companies</h3>
          <div className="companies-ranking">
            {analytics.topCompanies.map((company, index) => (
              <div key={index} className="ranking-item">
                <div className="rank-number">#{index + 1}</div>
                <div className="company-info">
                  <div className="company-name">{company.name}</div>
                  <div className="company-stats">
                    <span>{company.bookings} bookings</span>
                    <span>{formatCurrency(company.revenue)}</span>
                  </div>
                </div>
                <div className="company-rating">
                  <span className="rating-value">⭐ {company.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="performance-card">
          <h3>📈 Key Performance Indicators</h3>
          <div className="kpi-grid">
            <div className="kpi-item">
              <div className="kpi-label">Customer Acquisition Cost</div>
              <div className="kpi-value">$24.50</div>
              <div className="kpi-trend positive">-12.5%</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-label">Customer Lifetime Value</div>
              <div className="kpi-value">$487.25</div>
              <div className="kpi-trend positive">+8.3%</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-label">Monthly Recurring Revenue</div>
              <div className="kpi-value">{formatCurrency(28450.75)}</div>
              <div className="kpi-trend negative">-2.1%</div>
            </div>
            <div className="kpi-item">
              <div className="kpi-label">Churn Rate</div>
              <div className="kpi-value">5.2%</div>
              <div className="kpi-trend positive">-1.8%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="analytics-actions">
        <h3>📋 Report Generation</h3>
        <div className="actions-grid">
          <button
            className="action-card"
            onClick={() => generateReport('users')}
          >
            <div className="action-icon">👥</div>
            <div className="action-content">
              <div className="action-title">User Report</div>
              <div className="action-desc">Detailed user activity and growth metrics</div>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => generateReport('revenue')}
          >
            <div className="action-icon">💰</div>
            <div className="action-content">
              <div className="action-title">Revenue Report</div>
              <div className="action-desc">Financial performance and earnings analysis</div>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => generateReport('performance')}
          >
            <div className="action-icon">📊</div>
            <div className="action-content">
              <div className="action-title">Performance Report</div>
              <div className="action-desc">Platform metrics and company rankings</div>
            </div>
          </button>

          <button
            className="action-card"
            onClick={() => generateReport('summary')}
          >
            <div className="action-icon">📋</div>
            <div className="action-content">
              <div className="action-title">Executive Summary</div>
              <div className="action-desc">High-level overview for stakeholders</div>
            </div>
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Analytics Data</h3>
              <button 
                className="close-btn"
                onClick={() => setShowExportModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="export-options">
                <div className="option-group">
                  <label>Export Type</label>
                  <select
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    className="export-select"
                  >
                    <option value="summary">Executive Summary</option>
                    <option value="detailed">Detailed Analytics</option>
                    <option value="users">User Data</option>
                    <option value="revenue">Revenue Data</option>
                    <option value="companies">Company Performance</option>
                  </select>
                </div>

                <div className="option-group">
                  <label>Format</label>
                  <div className="format-options">
                    <label className="radio-option">
                      <input type="radio" name="format" value="pdf" defaultChecked />
                      <span>PDF Report</span>
                    </label>
                    <label className="radio-option">
                      <input type="radio" name="format" value="excel" />
                      <span>Excel Spreadsheet</span>
                    </label>
                    <label className="radio-option">
                      <input type="radio" name="format" value="csv" />
                      <span>CSV Data</span>
                    </label>
                  </div>
                </div>

                <div className="option-group">
                  <label>Time Range</label>
                  <select className="export-select">
                    <option value="current">Current Selection ({selectedTimeframe})</option>
                    <option value="custom">Custom Date Range</option>
                    <option value="all">All Available Data</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="export-confirm-btn"
                  onClick={exportData}
                >
                  📊 Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAnalytics; 