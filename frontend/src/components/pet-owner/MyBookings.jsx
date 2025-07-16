import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedApiCall } from '../../utils/api';
import './MyBookings.css';

const MyBookings = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Rating states
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  const statusOptions = [
    { value: 'all', label: 'All Bookings', count: 0 },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'confirmed', label: 'Confirmed', count: 0 },
    { value: 'completed', label: 'Completed', count: 0 },
    { value: 'cancelled', label: 'Cancelled', count: 0 }
  ];

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedApiCall(currentUser, '/api/pet-owners/bookings');

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      } else {
        setError('Failed to load bookings');
      }
    } catch (error) {
      setError('Error loading bookings');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const filterBookings = useCallback(() => {
    let filtered = bookings;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }
    
    setFilteredBookings(filtered);
  }, [bookings, selectedStatus]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const getStatusCounts = () => {
    const counts = {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };
    return counts;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      completed: '🎉',
      cancelled: '❌'
    };
    return icons[status] || '📅';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      confirmed: 'status-confirmed', 
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return colors[status] || '';
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

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  const canCancelBooking = (booking) => {
    const bookingDate = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
    
    return ['pending', 'confirmed'].includes(booking.status) && hoursUntilBooking > 24;
  };

  const canRateBooking = (booking) => {
    return booking.status === 'completed' && !booking.hasRating;
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
    setError('');
  };

  const openRatingModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setReview('');
    setShowRatingModal(true);
    setError('');
  };

  const closeModals = () => {
    setShowCancelModal(false);
    setShowRatingModal(false);
    setSelectedBooking(null);
    setError('');
  };

  const handleCancelBooking = async () => {
    setActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/pet-owners/bookings/${selectedBooking.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchBookings(); // Refresh bookings
        closeModals();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Error cancelling booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (!review.trim()) {
      setError('Please provide a review');
      return;
    }

    setActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/pet-owners/bookings/${selectedBooking.id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          review: review.trim()
        })
      });

      if (response.ok) {
        await fetchBookings(); // Refresh bookings
        closeModals();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Error submitting review');
    } finally {
      setActionLoading(false);
    }
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="loading-spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="my-bookings">
      <div className="bookings-header">
        <h2>My Bookings</h2>
        <div className="header-stats">
          <span className="total-bookings">{bookings.length} total bookings</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bookings-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by service, company, or pet name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="status-filters">
          {statusOptions.map(status => (
            <button
              key={status.value}
              className={`status-filter ${selectedStatus === status.value ? 'active' : ''}`}
              onClick={() => setSelectedStatus(status.value)}
            >
              {status.label}
              <span className="filter-count">{statusCounts[status.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>
            {bookings.length === 0 
              ? 'No bookings yet' 
              : searchTerm || selectedStatus !== 'all' 
                ? 'No bookings match your filters' 
                : 'No bookings found'
            }
          </h3>
          <p>
            {bookings.length === 0 
              ? 'Book your first service from the marketplace to get started.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {bookings.length === 0 && (
            <button 
              className="cta-button"
              onClick={() => window.location.href = '/marketplace'}
            >
              Browse Services
            </button>
          )}
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="service-info">
                  <h3 className="service-name">{booking.serviceName}</h3>
                  <p className="company-name">{booking.companyName}</p>
                </div>
                <div className={`booking-status ${getStatusColor(booking.status)}`}>
                  <span className="status-icon">{getStatusIcon(booking.status)}</span>
                  <span className="status-text">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Pet:</span>
                    <span className="detail-value">{booking.petName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(booking.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{booking.time}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value price">{formatPrice(booking.price)}</span>
                  </div>
                </div>

                {booking.notes && (
                  <div className="booking-notes">
                    <span className="notes-label">Notes:</span>
                    <span className="notes-text">{booking.notes}</span>
                  </div>
                )}

                {booking.specialRequirements && (
                  <div className="special-requirements">
                    <span className="requirements-label">Special Requirements:</span>
                    <span className="requirements-text">{booking.specialRequirements}</span>
                  </div>
                )}
              </div>

              <div className="booking-actions">
                {canCancelBooking(booking) && (
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => openCancelModal(booking)}
                  >
                    Cancel Booking
                  </button>
                )}
                
                {canRateBooking(booking) && (
                  <button 
                    className="action-btn rate-btn"
                    onClick={() => openRatingModal(booking)}
                  >
                    Rate & Review
                  </button>
                )}

                <button 
                  className="action-btn contact-btn"
                  onClick={() => window.location.href = `tel:${booking.companyPhone || ''}`}
                >
                  Contact Provider
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Booking</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>

            <div className="modal-content">
              <div className="warning-icon">⚠️</div>
              <p>Are you sure you want to cancel this booking?</p>
              
              <div className="booking-summary">
                <div className="summary-item">
                  <strong>{selectedBooking?.serviceName}</strong>
                </div>
                <div className="summary-item">
                  {formatDate(selectedBooking?.date)} at {selectedBooking?.time}
                </div>
                <div className="summary-item">
                  Pet: {selectedBooking?.petName}
                </div>
              </div>

              <p className="cancellation-note">
                You can cancel bookings up to 24 hours before the scheduled time.
                Please contact the service provider if you need to cancel with less notice.
              </p>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button className="cancel-action-btn" onClick={closeModals}>
                  Keep Booking
                </button>
                <button 
                  className="confirm-cancel-btn"
                  onClick={handleCancelBooking}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rate & Review Service</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>

            <form onSubmit={handleSubmitRating} className="rating-form">
              <div className="service-summary">
                <h4>{selectedBooking?.serviceName}</h4>
                <p>{selectedBooking?.companyName}</p>
                <p>Service for {selectedBooking?.petName} on {formatDate(selectedBooking?.date)}</p>
              </div>

              <div className="rating-section">
                <label className="rating-label">Your Rating</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= rating ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div className="rating-text">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'} 
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </div>
              </div>

              <div className="review-section">
                <label htmlFor="review" className="review-label">Your Review</label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with this service..."
                  rows="4"
                  className="review-textarea"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="cancel-action-btn" onClick={closeModals}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-rating-btn"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings; 