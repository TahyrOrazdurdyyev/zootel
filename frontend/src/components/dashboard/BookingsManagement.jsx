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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    notes: '',
    notifyCustomer: true
  });

  const [assignmentData, setAssignmentData] = useState({
    employeeId: '',
    notes: ''
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
      // Customer details are already correctly named in backend response
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      // Map price field correctly
      price: booking.servicePrice,
      // Ensure all required fields are present
      serviceName: booking.serviceName,
      petName: booking.petName,
      petType: booking.petType
    }));
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [currentUser]);

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
    fetchEmployees();
  }, [fetchAppointments, fetchEmployees]);

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
    if (price === null || price === undefined || isNaN(price)) {
      return '$0.00';
    }
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

  const openAssignModal = (appointment) => {
    setSelectedAppointment(appointment);
    setAssignmentData({
      employeeId: appointment.employeeId || '',
      notes: ''
    });
    setShowAssignModal(true);
    setError('');
  };

  const closeModals = () => {
    setShowDetailsModal(false);
    setShowStatusModal(false);
    setShowAssignModal(false);
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

  const handleEmployeeAssignment = async (e) => {
    e.preventDefault();
    
    setActionLoading(true);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/bookings/${selectedAppointment.id}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: assignmentData.employeeId || null
        })
      });

      if (response.ok) {
        await fetchAppointments(); // Refresh appointments
        closeModals();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to assign employee');
      }
    } catch (error) {
      console.error('Error assigning employee:', error);
      setError('Error assigning employee');
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

        {/* Enhanced Dashboard Overview */}
        <div className="appointments-overview">
          <div className="overview-cards">
            <div className="overview-card today-card">
              <div className="card-background">
                <div className="card-pattern"></div>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <div className="card-icon today-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3>Today</h3>
                </div>
                <div className="card-stats">
                  <div className="stat-number">{todaysAppointments.length}</div>
                  <div className="stat-label">Appointments</div>
                  <div className="stat-change positive">
                    {todaysAppointments.filter(apt => apt.status === 'confirmed').length} confirmed
                  </div>
                </div>
              </div>
            </div>

            <div className="overview-card upcoming-card">
              <div className="card-background">
                <div className="card-pattern"></div>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <div className="card-icon upcoming-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h3>Upcoming</h3>
                </div>
                <div className="card-stats">
                  <div className="stat-number">{upcomingAppointments.length}</div>
                  <div className="stat-label">This Week</div>
                  <div className="stat-change neutral">
                    Next: {upcomingAppointments.length > 0 ? upcomingAppointments[0]?.time || 'N/A' : 'None'}
                  </div>
                </div>
              </div>
            </div>

            <div className="overview-card monthly-card">
              <div className="card-background">
                <div className="card-pattern"></div>
              </div>
              <div className="card-content">
                <div className="card-header">
                  <div className="card-icon monthly-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3V21H21V3H3ZM9 17L5 13L6.5 11.5L9 14L17.5 5.5L19 7L9 17Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3>This Month</h3>
                </div>
                <div className="card-stats">
                  <div className="stat-number">{monthlyStats.completed}</div>
                  <div className="stat-label">Completed</div>
                  <div className="stat-change positive">
                    {Math.round((monthlyStats.completed / Math.max(monthlyStats.total, 1)) * 100)}% completion rate
                  </div>
                </div>
              </div>
            </div>

            {hasAdvancedAnalytics && (
              <div className="overview-card revenue-card">
                <div className="card-background">
                  <div className="card-pattern"></div>
                </div>
                <div className="card-content">
                  <div className="card-header">
                    <div className="card-icon revenue-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2V22M17 5H9.5C8.83696 5 8.20107 5.26339 7.73223 5.73223C7.26339 6.20107 7 6.83696 7 7.5C7 8.16304 7.26339 8.79893 7.73223 9.26777C8.20107 9.73661 8.83696 10 9.5 10H14.5C15.163 10 15.7989 10.2634 16.2678 10.7322C16.7366 11.2011 17 11.837 17 12.5C17 13.163 16.7366 13.7989 16.2678 14.2678C15.7989 14.7366 15.163 15 14.5 15H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <h3>Revenue</h3>
                  </div>
                  <div className="card-stats">
                    <div className="stat-number">{formatPrice(monthlyStats.revenue)}</div>
                    <div className="stat-label">This Month</div>
                    <div className="stat-change positive">
                      Average: {formatPrice(monthlyStats.revenue / Math.max(monthlyStats.completed, 1))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Filters and Controls */}
        <div className="appointments-controls">
          <div className="controls-header">
            <h3>Find & Filter Appointments</h3>
            <div className="active-filters">
              {(searchTerm || selectedDate || selectedStatus !== 'all') && (
                <span className="active-indicator">
                  {[
                    searchTerm && 'Search',
                    selectedDate && 'Date',
                    selectedStatus !== 'all' && 'Status'
                  ].filter(Boolean).join(', ')} active
                </span>
              )}
            </div>
          </div>

          <div className="search-section">
            <div className="search-bar">
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by customer name, pet, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="date-filter">
              <div className="date-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
                placeholder="Filter by date"
              />
              {selectedDate && (
                <button 
                  className="clear-date"
                  onClick={() => setSelectedDate('')}
                  title="Clear date filter"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="status-filters-section">
            <div className="filters-header">
              <span className="filters-label">Filter by Status</span>
              {selectedStatus !== 'all' && (
                <button 
                  className="clear-filters"
                  onClick={() => setSelectedStatus('all')}
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="status-filters">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  className={`status-filter ${selectedStatus === status.value ? 'active' : ''}`}
                  style={{ '--status-color': status.color }}
                  onClick={() => setSelectedStatus(status.value)}
                >
                  <span className="filter-label">{status.label}</span>
                  <span className="filter-count">{statusCounts[status.value] || 0}</span>
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
              <div key={appointment.id} className="appointment-card modern-card">
                <div className="card-border-accent"></div>
                
                <div className="appointment-header">
                  <div className="appointment-datetime">
                    <div className="date-section">
                      <div className="date-primary">{formatDate(appointment.date)}</div>
                      <div className="time-primary">{formatTime(appointment.time)}</div>
                    </div>
                    <div className="time-info">
                      <div className="time-until">{getTimeUntilAppointment(appointment.date, appointment.time)}</div>
                      <div className="duration">{appointment.duration || 60} min</div>
                    </div>
                  </div>
                  
                  <div className="appointment-status">
                    <span 
                      className={`status-badge modern-badge status-${appointment.status}`}
                      style={{ backgroundColor: getStatusColor(appointment.status) }}
                    >
                      <span className="status-icon">{getStatusIcon(appointment.status)}</span>
                      <span className="status-text">{statusOptions.find(opt => opt.value === appointment.status)?.label}</span>
                    </span>
                  </div>
                </div>

                <div className="appointment-content">
                  <div className="customer-section">
                    <div className="customer-avatar">
                      <span className="avatar-initial">
                        {appointment.customerName?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="customer-details">
                      <h3 className="customer-name">{appointment.customerName}</h3>
                      <div className="contact-info">
                        <div className="contact-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{appointment.customerEmail}</span>
                        </div>
                        <div className="contact-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M22 16.92V19.92C22 20.92 21.11 21.92 19.95 21.92C8.91 21.92 2 14.92 2 3.92C2 2.76 3 1.92 4 1.92H7C8.1 1.92 9 2.82 9 3.92V6.92C9 7.92 8.1 8.92 7 8.92H5C5 12.92 8.13 16.92 12 16.92V14.92C12 13.82 12.9 12.92 14 12.92H17C18.1 12.92 19 13.82 19 14.92V16.92H22Z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>{appointment.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="service-section">
                    <div className="service-grid">
                      <div className="service-item">
                        <div className="service-icon">🐕</div>
                        <div className="service-content">
                          <span className="service-label">Service</span>
                          <span className="service-value">{appointment.serviceName}</span>
                        </div>
                      </div>
                      <div className="service-item">
                        <div className="service-icon">🐾</div>
                        <div className="service-content">
                          <span className="service-label">Pet</span>
                          <span className="service-value">{appointment.petName} ({appointment.petType})</span>
                        </div>
                      </div>
                      <div className="service-item">
                        <div className="service-icon">💰</div>
                        <div className="service-content">
                          <span className="service-label">Price</span>
                          <span className="service-value price">{formatPrice(appointment.price)}</span>
                        </div>
                      </div>
                    </div>

                    {(appointment.notes || appointment.specialRequirements) && (
                      <div className="additional-info">
                        {appointment.notes && (
                          <div className="info-item notes">
                            <div className="info-header">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>Notes</span>
                            </div>
                            <p className="info-text">{appointment.notes}</p>
                          </div>
                        )}

                        {appointment.specialRequirements && (
                          <div className="info-item requirements">
                            <div className="info-header">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>Special Requirements</span>
                            </div>
                            <p className="info-text">{appointment.specialRequirements}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="appointment-actions">
                  <button 
                    className="action-btn primary-action"
                    onClick={() => openDetailsModal(appointment)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Details
                  </button>
                  
                  <button 
                    className="action-btn secondary-action"
                    onClick={() => openStatusModal(appointment)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H16C17.1 20 18 19.1 18 18V13" stroke="currentColor" strokeWidth="2"/>
                      <path d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Update Status
                  </button>

                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <button 
                      className="action-btn assign-action"
                      onClick={() => openAssignModal(appointment)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M16 21V19C16 17.9 15.1 17 14 17H6C4.9 17 4 17.9 4 19V21" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2"/>
                        <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {appointment.employeeName ? `Assigned: ${appointment.employeeName}` : 'Assign Employee'}
                    </button>
                  )}

                  <button 
                    className="action-btn contact-action"
                    onClick={() => window.location.href = `tel:${appointment.customerPhone}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92V19.92C22 20.92 21.11 21.92 19.95 21.92C8.91 21.92 2 14.92 2 3.92C2 2.76 3 1.92 4 1.92H7C8.1 1.92 9 2.82 9 3.92V6.92C9 7.92 8.1 8.92 7 8.92H5C5 12.92 8.13 16.92 12 16.92V14.92C12 13.82 12.9 12.92 14 12.92H17C18.1 12.92 19 13.82 19 14.92V16.92H22Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Call
                  </button>

                  <button 
                    className="action-btn email-action"
                    onClick={() => window.location.href = `mailto:${appointment.customerEmail}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Email
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
                    <h4>Assignment Information</h4>
                    <div className="detail-row">
                      <span className="detail-label">Assigned Employee:</span>
                      <span className="detail-value">
                        {selectedAppointment.employeeName || 'Not assigned'}
                      </span>
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

        {/* Employee Assignment Modal */}
        {showAssignModal && selectedAppointment && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal assign-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Assign Employee</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
              </div>

              <form onSubmit={handleEmployeeAssignment} className="assign-form">
                <div className="appointment-summary">
                  <h4>{selectedAppointment.customerName}</h4>
                  <p>{selectedAppointment.serviceName} for {selectedAppointment.petName}</p>
                  <p>{formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.time)}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="employeeId">Select Employee</label>
                  <select
                    id="employeeId"
                    value={assignmentData.employeeId}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, employeeId: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="assignNotes">Assignment Notes (Optional)</label>
                  <textarea
                    id="assignNotes"
                    value={assignmentData.notes}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    placeholder="Add any notes for the assigned employee..."
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={actionLoading}>
                    {actionLoading ? 'Assigning...' : assignmentData.employeeId ? 'Assign Employee' : 'Remove Assignment'}
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