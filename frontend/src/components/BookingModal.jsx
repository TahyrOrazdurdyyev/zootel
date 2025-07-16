import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, service, onBookingSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    selectedPet: '',
    selectedDate: '',
    selectedTime: '',
    notes: '',
    specialRequirements: ''
  });

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Fetch user's pets when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchUserPets();
    }
  }, [isOpen, currentUser]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        selectedPet: '',
        selectedDate: '',
        selectedTime: '',
        notes: '',
        specialRequirements: ''
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen, service]);

  const fetchUserPets = async () => {
    setPetsLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/pet-owners/pets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPets(data.data || []);
      } else {
        console.error('Failed to fetch pets');
        setPets([]);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.selectedPet) {
      setError('Please select a pet for this service.');
      return false;
    }
    if (!formData.selectedDate) {
      setError('Please select a date for the appointment.');
      return false;
    }
    if (!formData.selectedTime) {
      setError('Please select a time for the appointment.');
      return false;
    }

    // Check if selected date is in the future
    const selectedDateTime = new Date(`${formData.selectedDate}T${formData.selectedTime}`);
    const now = new Date();
    if (selectedDateTime <= now) {
      setError('Please select a future date and time.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      
      const bookingData = {
        companyId: service.companyId,
        serviceId: service.id,
        petId: formData.selectedPet,
        date: formData.selectedDate,
        time: formData.selectedTime,
        notes: formData.notes,
        specialRequirements: formData.specialRequirements
      };

      const response = await fetch('/api/pet-owners/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Booking created successfully! The service provider will confirm your appointment shortly.');
        
        // Call success callback if provided
        if (onBookingSuccess) {
          onBookingSuccess(data.data);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('An error occurred while creating the booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = () => {
    if (!formData.selectedDate || !formData.selectedTime) return '';
    
    const date = new Date(`${formData.selectedDate}T${formData.selectedTime}`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelectedPet = () => {
    return pets.find(pet => pet.id === formData.selectedPet);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h2>Book Service</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="booking-modal-content">
          {/* Service Details */}
          <div className="service-summary">
            <div className="service-icon">{service?.image}</div>
            <div className="service-info">
              <h3>{service?.name}</h3>
              <p className="service-company">{service?.companyName} • {service?.location}</p>
              <p className="service-price">${service?.price}</p>
              <div className="service-meta">
                <span className="service-duration">
                  Duration: {Math.floor((service?.duration || 60) / 60)}h {(service?.duration || 60) % 60}m
                </span>
                <div className="pet-types">
                  Suitable for: {service?.petTypes?.map((pet, index) => (
                    <span key={index} className="pet-icon">{pet}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="booking-form">
            {/* Pet Selection */}
            <div className="form-group">
              <label className="form-label">Select Pet *</label>
              {petsLoading ? (
                <div className="loading-pets">Loading your pets...</div>
              ) : pets.length > 0 ? (
                <div className="pets-grid">
                  {pets.map(pet => (
                    <label key={pet.id} className={`pet-option ${formData.selectedPet === pet.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="selectedPet"
                        value={pet.id}
                        checked={formData.selectedPet === pet.id}
                        onChange={handleInputChange}
                      />
                      <div className="pet-card">
                        <div className="pet-avatar">
                          {pet.type === 'Dog' ? '🐕' : pet.type === 'Cat' ? '🐱' : '🐾'}
                        </div>
                        <div className="pet-details">
                          <div className="pet-name">{pet.name}</div>
                          <div className="pet-info">{pet.breed} • {pet.age}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="no-pets">
                  <p>No pets found. Please add a pet to your profile first.</p>
                  <button type="button" className="add-pet-button" onClick={() => window.location.href = '/pet-owner/dashboard'}>
                    Add Pet
                  </button>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div className="form-group">
              <label htmlFor="selectedDate" className="form-label">Preferred Date *</label>
              <input
                type="date"
                id="selectedDate"
                name="selectedDate"
                value={formData.selectedDate}
                onChange={handleInputChange}
                min={getMinDate()}
                className="form-input"
                required
              />
            </div>

            {/* Time Selection */}
            <div className="form-group">
              <label className="form-label">Preferred Time *</label>
              <div className="time-slots">
                {timeSlots.map(time => (
                  <label key={time} className={`time-slot ${formData.selectedTime === time ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="selectedTime"
                      value={time}
                      checked={formData.selectedTime === time}
                      onChange={handleInputChange}
                    />
                    {time}
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional information about your pet or preferences..."
                className="form-textarea"
                rows="3"
              />
            </div>

            {/* Special Requirements */}
            <div className="form-group">
              <label htmlFor="specialRequirements" className="form-label">Special Requirements</label>
              <textarea
                id="specialRequirements"
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                placeholder="Any special needs, allergies, or instructions for the service provider..."
                className="form-textarea"
                rows="2"
              />
            </div>

            {/* Booking Summary */}
            {formData.selectedPet && formData.selectedDate && formData.selectedTime && (
              <div className="booking-summary">
                <h4>Booking Summary</h4>
                <div className="summary-details">
                  <div className="summary-item">
                    <span className="summary-label">Service:</span>
                    <span>{service?.name}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Pet:</span>
                    <span>{getSelectedPet()?.name} ({getSelectedPet()?.breed})</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Date & Time:</span>
                    <span>{formatDateTime()}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Price:</span>
                    <span className="summary-price">${service?.price}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Action Buttons */}
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="book-button" 
                disabled={loading || pets.length === 0}
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;