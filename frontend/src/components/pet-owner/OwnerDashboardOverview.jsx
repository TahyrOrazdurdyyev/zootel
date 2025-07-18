import React, { useState, useEffect } from 'react';
import './OwnerDashboardOverview.css';

const OwnerDashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real dashboard data from API
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.zootel.shop'}/api/pet-owners/dashboard-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        console.error('API response was not successful:', result);
        // Fallback to empty data
        setDashboardData({
          totalPets: 0,
          upcomingBookings: 0,
          totalBookings: 0,
          favoriteCompanies: 0,
          recentActivity: [],
          upcomingAppointments: [],
          petHealthReminders: []
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to empty data on error
      setDashboardData({
        totalPets: 0,
        upcomingBookings: 0,
        totalBookings: 0,
        favoriteCompanies: 0,
        recentActivity: [],
        upcomingAppointments: [],
        petHealthReminders: []
      });
      
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard-overview">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome back! 👋</h2>
        <p>Here&apos;s what&apos;s happening with your pets today.</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card pets">
          <div className="metric-icon">🐾</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardData?.totalPets || 0}</div>
            <div className="metric-label">My Pets</div>
          </div>
        </div>

        <div className="metric-card bookings">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardData?.upcomingBookings || 0}</div>
            <div className="metric-label">Upcoming Bookings</div>
          </div>
        </div>

        <div className="metric-card total-bookings">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardData?.totalBookings || 0}</div>
            <div className="metric-label">Total Bookings</div>
          </div>
        </div>

        <div className="metric-card companies">
          <div className="metric-icon">🏢</div>
          <div className="metric-content">
            <div className="metric-value">{dashboardData?.favoriteCompanies || 0}</div>
            <div className="metric-label">Favorite Companies</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="overview-grid">
        {/* Upcoming Appointments */}
        <div className="overview-card upcoming-appointments">
          <div className="card-header">
            <h3>Upcoming Appointments</h3>
            <a href="#" className="view-all-link">View All</a>
          </div>
          <div className="card-content">
            {dashboardData?.upcomingAppointments?.length > 0 ? (
              <div className="appointments-list">
                {dashboardData.upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="appointment-item">
                    <div className="appointment-date">
                      <div className="date-day">{new Date(appointment.date).getDate()}</div>
                      <div className="date-month">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                    </div>
                    <div className="appointment-details">
                      <div className="appointment-service">{appointment.serviceName}</div>
                      <div className="appointment-company">{appointment.companyName}</div>
                      <div className="appointment-meta">
                        {appointment.petName} • {appointment.time}
                      </div>
                    </div>
                    <div className="appointment-status">
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>No upcoming appointments</p>
                <button className="cta-button">Book a Service</button>
              </div>
            )}
          </div>
        </div>

        {/* Health Reminders */}
        <div className="overview-card health-reminders">
          <div className="card-header">
            <h3>Health Reminders</h3>
            <button className="add-reminder-btn">+ Add</button>
          </div>
          <div className="card-content">
            {dashboardData?.petHealthReminders?.length > 0 ? (
              <div className="reminders-list">
                {dashboardData.petHealthReminders.map((reminder) => (
                  <div key={reminder.id} className={`reminder-item priority-${reminder.priority}`}>
                    <div className="reminder-icon">
                      {reminder.type === 'vaccination' ? '💉' : '🩺'}
                    </div>
                    <div className="reminder-details">
                      <div className="reminder-pet">{reminder.petName}</div>
                      <div className="reminder-message">{reminder.message}</div>
                      <div className="reminder-date">Due: {reminder.dueDate}</div>
                    </div>
                    <div className={`priority-badge ${reminder.priority}`}>
                      {reminder.priority}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🩺</div>
                <p>No health reminders</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="overview-card recent-activity">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="card-content">
            {dashboardData?.recentActivity?.length > 0 ? (
              <div className="activity-list">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-details">
                      <div className="activity-message">{activity.message}</div>
                      <div className="activity-date">{activity.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default OwnerDashboardOverview; 