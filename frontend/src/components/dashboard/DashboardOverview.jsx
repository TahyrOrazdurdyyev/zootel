import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedApiCall } from '../../utils/api';
import './DashboardOverview.css';

const DashboardOverview = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);

      // Fetch dashboard data and stats in parallel
      const [dashboardResponse, statsResponse] = await Promise.all([
        authenticatedApiCall(currentUser, '/api/companies/dashboard-data'),
        authenticatedApiCall(currentUser, '/api/companies/stats')
      ]);

      if (dashboardResponse.ok && statsResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        const statsResult = await statsResponse.json();
        
        setDashboardData(dashboardResult.data);
        setStats(statsResult.data);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.totalBookings || 0}</div>
            <div className="metric-label">TOTAL BOOKINGS</div>
            <div className="metric-change positive">+12% from last month</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">${stats?.monthlyRevenue?.toFixed(2) || '0.00'}</div>
            <div className="metric-label">MONTHLY REVENUE</div>
            <div className="metric-change positive">+8% from last month</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.averageRating || '0.0'}</div>
            <div className="metric-label">AVERAGE RATING</div>
            <div className="metric-change neutral">Based on {stats?.totalReviews || 0} reviews</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.newCustomers || 0}</div>
            <div className="metric-label">NEW CUSTOMERS</div>
            <div className="metric-change positive">+{stats?.returningCustomers || 0} returning</div>
          </div>
        </div>
      </div>

      {/* Revenue Line Chart */}
      <div className="revenue-chart-container">
        <div className="chart-header">
          <h3>Monthly Earnings</h3>
          <select className="chart-period">
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </select>
        </div>
        <div className="line-chart">
          {dashboardData?.monthlyEarnings?.length > 0 ? (
            <div className="chart-wrapper">
              <svg className="line-chart-svg" viewBox="0 0 800 300">
                {/* Chart grid lines */}
                <defs>
                  <pattern id="grid" width="100" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 60" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Chart line */}
                <polyline
                  fill="none"
                  stroke="#ff6b35"
                  strokeWidth="3"
                  points={dashboardData.monthlyEarnings.map((item, index) => {
                    const x = (index + 1) * (800 / (dashboardData.monthlyEarnings.length + 1));
                    
                    // Safely get earnings values and handle null/undefined
                    const validEarnings = dashboardData.monthlyEarnings
                      .map(e => Number(e.earnings) || 0)
                      .filter(val => !isNaN(val) && isFinite(val));
                    
                    const maxEarnings = validEarnings.length > 0 ? Math.max(...validEarnings) : 1;
                    const safeEarnings = Number(item.earnings) || 0;
                    
                    // Prevent division by zero and ensure valid coordinates
                    const normalizedValue = maxEarnings > 0 ? (safeEarnings / maxEarnings) : 0;
                    const y = 250 - (normalizedValue * 200);
                    
                    // Ensure coordinates are valid numbers
                    const safeX = isNaN(x) ? 0 : x;
                    const safeY = isNaN(y) ? 250 : y;
                    
                    return `${safeX},${safeY}`;
                  }).join(' ')}
                />
                
                {/* Data points */}
                {dashboardData.monthlyEarnings.map((item, index) => {
                  const x = (index + 1) * (800 / (dashboardData.monthlyEarnings.length + 1));
                  
                  // Safely get earnings values and handle null/undefined
                  const validEarnings = dashboardData.monthlyEarnings
                    .map(e => Number(e.earnings) || 0)
                    .filter(val => !isNaN(val) && isFinite(val));
                  
                  const maxEarnings = validEarnings.length > 0 ? Math.max(...validEarnings) : 1;
                  const safeEarnings = Number(item.earnings) || 0;
                  
                  // Prevent division by zero and ensure valid coordinates
                  const normalizedValue = maxEarnings > 0 ? (safeEarnings / maxEarnings) : 0;
                  const y = 250 - (normalizedValue * 200);
                  
                  // Ensure coordinates are valid numbers
                  const safeX = isNaN(x) ? 0 : x;
                  const safeY = isNaN(y) ? 250 : y;
                  
                  return (
                    <g key={index}>
                      <circle cx={safeX} cy={safeY} r="6" fill="#ff6b35" />
                      <text x={safeX} y="280" textAnchor="middle" fontSize="12" fill="#666">
                        {item.month || 'N/A'}
                      </text>
                      <text x={safeX} y={safeY - 15} textAnchor="middle" fontSize="11" fill="#333">
                        ${safeEarnings.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <p>No earnings data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings - Simple List */}
      <div className="recent-bookings-section">
        <div className="section-header">
          <h3>Recent</h3>
          <a href="#" className="view-all-link">View All</a>
        </div>
        <div className="bookings-list">
          {dashboardData?.recentBookings?.length > 0 ? (
            dashboardData.recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="booking-list-item">
                <div className="booking-avatar">
                  <span className="avatar-initial">
                    {booking.petOwnerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="booking-info">
                  <div className="booking-header">
                    <span className="customer-name">{booking.petOwnerName}</span>
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="booking-details">
                    <span className="service-name">{booking.serviceName}</span>
                  </div>
                  <div className="booking-meta">
                    {booking.petName} • {booking.date} at {booking.time}
                  </div>
                </div>
                <div className="booking-amount">
                  ${booking.amount}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>No recent bookings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 