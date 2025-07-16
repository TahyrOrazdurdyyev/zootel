import React, { useState, useEffect } from 'react';
import './DashboardOverview.css';

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard data and stats in parallel
      const [dashboardResponse, statsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/companies/dashboard-data`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/companies/stats`, { headers })
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
  };

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
            <div className="metric-label">Total Bookings</div>
            <div className="metric-change positive">+12% from last month</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">${stats?.monthlyRevenue?.toFixed(2) || '0.00'}</div>
            <div className="metric-label">Monthly Revenue</div>
            <div className="metric-change positive">+8% from last month</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.averageRating || '0.0'}</div>
            <div className="metric-label">Average Rating</div>
            <div className="metric-change neutral">Based on {stats?.totalReviews || 0} reviews</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.newCustomers || 0}</div>
            <div className="metric-label">New Customers</div>
            <div className="metric-change positive">+{stats?.returningCustomers || 0} returning</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="overview-grid">
        {/* Recent Bookings */}
        <div className="overview-card recent-bookings">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <a href="#" className="view-all-link">View All</a>
          </div>
          <div className="card-content">
            {dashboardData?.recentBookings?.length > 0 ? (
              <div className="bookings-list">
                {dashboardData.recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-avatar">
                      {booking.petOwnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="booking-details">
                      <div className="booking-name">{booking.petOwnerName}</div>
                      <div className="booking-service">{booking.serviceName}</div>
                      <div className="booking-meta">
                        {booking.petName} • {booking.date} at {booking.time}
                      </div>
                    </div>
                    <div className="booking-status">
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      <div className="booking-amount">${booking.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>No recent bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="overview-card revenue-chart">
          <div className="card-header">
            <h3>Monthly Earnings</h3>
            <select className="chart-period">
              <option value="6">Last 6 months</option>
              <option value="12">Last 12 months</option>
            </select>
          </div>
          <div className="card-content">
            <div className="chart-container">
              {dashboardData?.monthlyEarnings?.length > 0 ? (
                <div className="simple-chart">
                  {dashboardData.monthlyEarnings.map((item, index) => (
                    <div key={index} className="chart-bar">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${(item.earnings / Math.max(...dashboardData.monthlyEarnings.map(e => e.earnings))) * 100}%` 
                        }}
                      ></div>
                      <div className="bar-label">{item.month}</div>
                      <div className="bar-value">${item.earnings}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📈</div>
                  <p>No earnings data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="overview-card recent-reviews">
          <div className="card-header">
            <h3>Recent Reviews</h3>
            <a href="#" className="view-all-link">View All</a>
          </div>
          <div className="card-content">
            {dashboardData?.recentReviews?.length > 0 ? (
              <div className="reviews-list">
                {dashboardData.recentReviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-name">{review.petOwnerName}</div>
                      <div className="review-rating">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <div className="review-comment">"{review.comment}"</div>
                    <div className="review-meta">
                      {review.serviceName} • {review.date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <p>No recent reviews</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overview-card quick-actions">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="actions-grid">
              <button className="action-btn">
                <span className="action-icon">🐕</span>
                <span className="action-text">Add Service</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📅</span>
                <span className="action-text">View Calendar</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">💰</span>
                <span className="action-text">Revenue Report</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">👥</span>
                <span className="action-text">Customer List</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 