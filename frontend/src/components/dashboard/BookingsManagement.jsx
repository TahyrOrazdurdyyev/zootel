import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import FeatureGate from '../FeatureGate';
import './BookingsManagement.css';

const BookingsManagement = () => {
  const { currentUser } = useAuth();
  const { hasFeature } = useSubscription();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    notes: '',
    notifyCustomer: true
  });

  const statusOptions = [
    { value: 'all', label: 'All Appointments', color: 'var(--text-muted)' },
    { value: 'pending', label: 'Pending', color: '#ffc107' },
    { value: 'confirmed', label: 'Confirmed', color: '#17a2b8' },
    { value: 'in_progress', label: 'In Progress', color: '#fd7e14' },
    { value: 'completed', label: 'Completed', color: '#28a745' },
    { value: 'cancelled', label: 'Cancelled', color: '#dc3545' },
    { value: 'no_show', label: 'No Show', color: '#6c757d' }
  ];

  const hasAdvancedAnalytics = hasFeature('advancedAnalytics');

  // Transform backend data to frontend format
  const transformBookingData = (bookings) => {
    return bookings.map(booking => ({
      ...booking,
      customerName: booking.petOwnerName,
      customerEmail: booking.petOwnerEmail,
      customerPhone: booking.petOwnerPhone
    }));
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const transformedData = transformBookingData(data.data || []);
        setAppointments(transformedData);
      } else {
        setError('Failed to load appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Error loading appointments');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const filterAppointments = useCallback(() => {
    let filtered = appointments;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === selectedStatus);
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(appointment => 
        appointment.date.startsWith(selectedDate)
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => 
        appointment.customerName?.toLowerCase().includes(term) ||
        appointment.customerEmail?.toLowerCase().includes(term) ||
        appointment.petName?.toLowerCase().includes(term) ||
        appointment.serviceName?.toLowerCase().includes(term)
      );
    }

    // Sort by date and time (most recent first)
    filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeB - dateTimeA;
    });

    setFilteredAppointments(filtered);
  }, [appointments, selectedStatus, selectedDate, searchTerm]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    filterAppointments();
  }, [filterAppointments]);

  const getStatusCounts = () => {
    const counts = {};
    statusOptions.forEach(option => {
      if (option.value === 'all') {
        counts[option.value] = appointments.length;
      } else {
        counts[option.value] = appointments.filter(apt => apt.status === option.value).length;
      }
    });
    return counts;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      in_progress: '🔄',
      completed: '🎉',
      cancelled: '❌',
      no_show: '👻'
    };
    return icons[status] || '📅';
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'var(--text-muted)';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const getTimeUntilAppointment = (date, time) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffMs = appointmentDateTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) {
      return 'Past';
    } else if (diffDays > 0) {
      return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return 'Soon';
    }
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const openStatusModal = (appointment) => {
    setSelectedAppointment(appointment);
    setStatusUpdateData({
      status: appointment.status,
      notes: '',
      notifyCustomer: true
    });
    setShowStatusModal(true);
    setError('');
  };

  const closeModals = () => {
    setShowDetailsModal(false);
    setShowStatusModal(false);
    setSelectedAppointment(null);
    setError('');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (!statusUpdateData.status) {
      setError('Please select a status');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/bookings/${selectedAppointment.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusUpdateData)
      });

      if (response.ok) {
        await fetchAppointments(); // Refresh appointments
        closeModals();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Error updating appointment status');
    } finally {
      setActionLoading(false);
    }
  };

  const getTodaysAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === today);
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDateTime = new Date(`${apt.date}T${apt.time}`);
      return aptDateTime > now && ['pending', 'confirmed'].includes(apt.status);
    }).slice(0, 5);
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
    });

    return {
      total: monthlyAppointments.length,
      completed: monthlyAppointments.filter(apt => apt.status === 'completed').length,
      revenue: monthlyAppointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + parseFloat(apt.price || 0), 0)
    };
  };

  // Calendar rendering function
  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // Create calendar days array
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const dayAppointments = filteredAppointments.filter(apt => apt.date === dateString);
      const isToday = dateString === today.toISOString().split('T')[0];
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? 'today' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''}`}
        >
          <div className="calendar-date">{day}</div>
          {dayAppointments.length > 0 && (
            <div className="appointment-indicators">
              {dayAppointments.slice(0, 3).map((apt) => (
                <div 
                  key={apt.id}
                  className={`appointment-indicator status-${apt.status}`}
                  title={`${apt.time} - ${apt.customerName} (${apt.serviceName})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetailsModal(apt);
                  }}
                >
                  <span className="appointment-time">{apt.time}</span>
                  <span className="appointment-name">{apt.customerName}</span>
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <div className="more-appointments">
                  +{dayAppointments.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h3>{monthNames[currentMonth]} {currentYear}</h3>
        </div>
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {days}
          </div>
        </div>
      </div>
    );
  };

  const statusCounts = getStatusCounts();
  const todaysAppointments = getTodaysAppointments();
  const upcomingAppointments = getUpcomingAppointments();
  const monthlyStats = getMonthlyStats();

  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <FeatureGate feature="basicReporting">
      <div className="bookings-management">
        <div className="bookings-header">
          <div className="header-left">
            <h2>Appointments Management</h2>
            <div className="header-stats">
              <span className="appointments-count">
                {appointments.length} total appointments
              </span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋 List
              </button>
              <button 
                className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                📅 Calendar
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Dashboard Overview */}
        <div className="appointments-overview">
          <div className="overview-cards">
            <div className="overview-card today">
              <div className="card-icon">🗓️</div>
              <div className="card-content">
                <h3>Today</h3>
                <p className="card-number">{todaysAppointments.length}</p>
                <p className="card-label">Appointments</p>
              </div>
            </div>

            <div className="overview-card upcoming">
              <div className="card-icon">⏰</div>
              <div className="card-content">
                <h3>Upcoming</h3>
                <p className="card-number">{upcomingAppointments.length}</p>
                <p className="card-label">This Week</p>
              </div>
            </div>

            <div className="overview-card monthly">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>This Month</h3>
                <p className="card-number">{monthlyStats.completed}</p>
                <p className="card-label">Completed</p>
              </div>
            </div>

            {hasAdvancedAnalytics && (
              <div className="overview-card revenue">
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <h3>Revenue</h3>
                  <p className="card-number">{formatPrice(monthlyStats.revenue)}</p>
                  <p className="card-label">This Month</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="appointments-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by customer, pet, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-row">
            <div className="date-filter">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>

            <div className="status-filters">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  className={`status-filter ${selectedStatus === status.value ? 'active' : ''}`}
                  style={{ '--status-color': status.color }}
                  onClick={() => setSelectedStatus(status.value)}
                >
                  {status.label}
                  <span className="filter-count">{statusCounts[status.value]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments List or Calendar */}
        {filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>
              {appointments.length === 0 
                ? 'No appointments yet' 
                : searchTerm || selectedStatus !== 'all' || selectedDate
                  ? 'No appointments match your filters' 
                  : 'No appointments found'
              }
            </h3>
            <p>
              {appointments.length === 0 
                ? 'Customer appointments will appear here once they start booking your services.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="calendar-view">
            {renderCalendar()}
          </div>
        ) : (
          <div className="appointments-list">
            {filteredAppointments.map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-time">
                    <div className="date">{formatDate(appointment.date)}</div>
                    <div className="time">{formatTime(appointment.time)}</div>
                    <div className="time-until">{getTimeUntilAppointment(appointment.date, appointment.time)}</div>
                  </div>
                  
                  <div className="appointment-status">
                    <span 
                      className={`status-badge status-${appointment.status}`}
                      style={{ backgroundColor: getStatusColor(appointment.status) }}
                    >
                      {getStatusIcon(appointment.status)}
                      {statusOptions.find(opt => opt.value === appointment.status)?.label}
                    </span>
                  </div>
                </div>

                <div className="appointment-details">
                  <div className="customer-info">
                    <h3 className="customer-name">{appointment.customerName}</h3>
                    <p className="customer-contact">{appointment.customerEmail} • {appointment.customerPhone}</p>
                  </div>

                  <div className="service-info">
                    <div className="service-row">
                      <div className="service-item">
                        <span className="service-label">Service:</span>
                        <span className="service-value">{appointment.serviceName}</span>
                      </div>
                      <div className="service-item">
                        <span className="service-label">Pet:</span>
                        <span className="service-value">{appointment.petName} ({appointment.petType})</span>
                      </div>
                      <div className="service-item">
                        <span className="service-label">Price:</span>
                        <span className="service-value price">{formatPrice(appointment.price)}</span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="appointment-notes">
                        <span className="notes-label">Notes:</span>
                        <span className="notes-text">{appointment.notes}</span>
                      </div>
                    )}

                    {appointment.specialRequirements && (
                      <div className="special-requirements">
                        <span className="requirements-label">Special Requirements:</span>
                        <span className="requirements-text">{appointment.specialRequirements}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="appointment-actions">
                  <button 
                    className="action-btn details"
                    onClick={() => openDetailsModal(appointment)}
                  >
                    👁️ Details
                  </button>
                  
                  <button 
                    className="action-btn status"
                    onClick={() => openStatusModal(appointment)}
                  >
                    📝 Update Status
                  </button>

                  <button 
                    className="action-btn contact"
                    onClick={() => window.location.href = `tel:${appointment.customerPhone}`}
                  >
                    📞 Call
                  </button>

                  <button 
                    className="action-btn email"
                    onClick={() => window.location.href = `mailto:${appointment.customerEmail}`}
                  >
                    ✉️ Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Appointment Details Modal */}
        {showDetailsModal && selectedAppointment && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Appointment Details</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
              </div>

              <div className="modal-content">
                <div className="details-grid">
                  <div className="details-section">
                    <h4>Appointment Information</h4>
                    <div className="detail-row">
                      <span className="detail-label">Date & Time:</span>
                      <span className="detail-value">
                        {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.time)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Service:</span>
                      <span className="detail-value">{selectedAppointment.serviceName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{selectedAppointment.duration} minutes</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Price:</span>
                      <span className="detail-value price">{formatPrice(selectedAppointment.price)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span 
                        className="detail-value status-badge"
                        style={{ backgroundColor: getStatusColor(selectedAppointment.status) }}
                      >
                        {getStatusIcon(selectedAppointment.status)}
                        {statusOptions.find(opt => opt.value === selectedAppointment.status)?.label}
                      </span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>Customer Information</h4>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedAppointment.customerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedAppointment.customerEmail}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedAppointment.customerPhone}</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>Pet Information</h4>
                    <div className="detail-row">
                      <span className="detail-label">Pet Name:</span>
                      <span className="detail-value">{selectedAppointment.petName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Pet Type:</span>
                      <span className="detail-value">{selectedAppointment.petType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Breed:</span>
                      <span className="detail-value">{selectedAppointment.petBreed}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Age:</span>
                      <span className="detail-value">{selectedAppointment.petAge}</span>
                    </div>
                  </div>

                  {(selectedAppointment.notes || selectedAppointment.specialRequirements) && (
                    <div className="details-section full-width">
                      <h4>Additional Information</h4>
                      {selectedAppointment.notes && (
                        <div className="detail-row">
                          <span className="detail-label">Customer Notes:</span>
                          <span className="detail-value">{selectedAppointment.notes}</span>
                        </div>
                      )}
                      {selectedAppointment.specialRequirements && (
                        <div className="detail-row">
                          <span className="detail-label">Special Requirements:</span>
                          <span className="detail-value">{selectedAppointment.specialRequirements}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedAppointment && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal status-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Update Appointment Status</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
              </div>

              <form onSubmit={handleStatusUpdate} className="status-form">
                <div className="appointment-summary">
                  <h4>{selectedAppointment.customerName}</h4>
                  <p>{selectedAppointment.serviceName} for {selectedAppointment.petName}</p>
                  <p>{formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.time)}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="status">New Status *</label>
                  <select
                    id="status"
                    value={statusUpdateData.status}
                    onChange={(e) => setStatusUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    {statusOptions.filter(opt => opt.value !== 'all').map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Status Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={statusUpdateData.notes}
                    onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    placeholder="Add any notes about this status change..."
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={statusUpdateData.notifyCustomer}
                      onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notifyCustomer: e.target.checked }))}
                    />
                    <span>Notify customer via email</span>
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={actionLoading}>
                    {actionLoading ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default BookingsManagement; 