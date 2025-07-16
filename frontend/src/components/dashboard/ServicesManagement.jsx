import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { authenticatedApiCall } from '../../utils/api';
import FeatureGate, { UsageLimitGate } from '../FeatureGate';
import './ServicesManagement.css';

const ServicesManagement = () => {
  const { currentUser } = useAuth();
  const { getFeatureLimit, isFeatureUnlimited } = useSubscription();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'grooming',
    petTypes: [],
    duration: '',
    price: '',
    isActive: true,
    availability: {
      monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      saturday: { enabled: true, startTime: '09:00', endTime: '15:00' },
      sunday: { enabled: false, startTime: '09:00', endTime: '15:00' }
    },
    requirements: '',
    cancellationPolicy: '',
    images: []
  });

  const serviceCategories = [
    { value: 'grooming', label: 'Grooming', icon: '✂️' },
    { value: 'veterinary', label: 'Veterinary', icon: '🏥' },
    { value: 'boarding', label: 'Boarding', icon: '🏠' },
    { value: 'training', label: 'Training', icon: '🎓' },
    { value: 'walking', label: 'Walking', icon: '🚶‍♂️' },
    { value: 'sitting', label: 'Pet Sitting', icon: '👥' },
    { value: 'daycare', label: 'Daycare', icon: '🌅' },
    { value: 'other', label: 'Other', icon: '🐾' }
  ];

  const petTypeOptions = [
    { value: 'dog', label: 'Dogs', icon: '🐕' },
    { value: 'cat', label: 'Cats', icon: '🐱' },
    { value: 'bird', label: 'Birds', icon: '🐦' },
    { value: 'rabbit', label: 'Rabbits', icon: '🐰' },
    { value: 'hamster', label: 'Hamsters', icon: '🐹' },
    { value: 'fish', label: 'Fish', icon: '🐠' },
    { value: 'reptile', label: 'Reptiles', icon: '🦎' },
    { value: 'other', label: 'Other', icon: '🐾' }
  ];

  const maxServices = getFeatureLimit('maxServices');
  const unlimitedServices = isFeatureUnlimited('maxServices');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedApiCall(currentUser, '/api/companies/services');

      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      } else {
        setError('Failed to load services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Error loading services');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'grooming',
      petTypes: [],
      duration: '',
      price: '',
      isActive: true,
      availability: {
        monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
        saturday: { enabled: true, startTime: '09:00', endTime: '15:00' },
        sunday: { enabled: false, startTime: '09:00', endTime: '15:00' }
      },
      requirements: '',
      cancellationPolicy: '',
      images: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePetTypeChange = (petType) => {
    setFormData(prev => ({
      ...prev,
      petTypes: prev.petTypes.includes(petType)
        ? prev.petTypes.filter(type => type !== petType)
        : [...prev.petTypes, petType]
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value
        }
      }
    }));
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
    setError('');
  };

  const openEditModal = (service) => {
    setSelectedService(service);
    setFormData({
      ...service,
      petTypes: service.petTypes || [],
      availability: service.availability || formData.availability
    });
    setShowEditModal(true);
    setError('');
  };

  const openDeleteConfirm = (service) => {
    setSelectedService(service);
    setShowDeleteConfirm(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setSelectedService(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || formData.petTypes.length === 0) {
      setError('Name, description, price, and at least one pet type are required');
      return;
    }

    setFormLoading(true);
    setError('');

    try {
      const token = await currentUser.getIdToken();
      const url = showEditModal ? `/api/companies/services/${selectedService.id}` : '/api/companies/services';
      const method = showEditModal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchServices(); // Refresh services list
        closeModals();
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${showEditModal ? 'update' : 'add'} service`);
      }
    } catch (error) {
      console.error('Error submitting service:', error);
      setError(`Error ${showEditModal ? 'updating' : 'adding'} service`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/companies/services/${selectedService.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchServices(); // Refresh services list
        closeModals();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Error deleting service');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleServiceStatus = async (service) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/companies/services/${service.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchServices(); // Refresh services list
      } else {
        setError('Failed to toggle service status');
      }
    } catch (error) {
      console.error('Error toggling service status:', error);
      setError('Error updating service status');
    }
  };

  const getCategoryIcon = (category) => {
    return serviceCategories.find(cat => cat.value === category)?.icon || '🐾';
  };

  const getCategoryLabel = (category) => {
    return serviceCategories.find(cat => cat.value === category)?.label || 'Other';
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Not specified';
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="services-loading">
        <div className="loading-spinner"></div>
        <p>Loading your services...</p>
      </div>
    );
  }

  return (
    <FeatureGate feature="basicReporting">
      <div className="services-management">
        <div className="services-header">
          <h2>Services Management</h2>
          <div className="header-stats">
            <span className="services-count">
              {services.length} {unlimitedServices ? '' : `/ ${maxServices}`} services
            </span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Usage Limit Gate */}
        <UsageLimitGate 
          feature="maxServices" 
          currentUsage={services.length}
          warningThreshold={0.8}
        >
          <div className="services-actions">
            <button className="add-service-btn" onClick={openAddModal}>
              <span className="btn-icon">+</span>
              Add New Service
            </button>
          </div>
        </UsageLimitGate>

        {services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐕</div>
            <h3>No services yet</h3>
            <p>Create your first service to start accepting bookings from pet owners.</p>
            <UsageLimitGate feature="maxServices" currentUsage={services.length} showUpgradePrompt={false}>
              <button className="cta-button" onClick={openAddModal}>
                Create Your First Service
              </button>
            </UsageLimitGate>
          </div>
        ) : (
          <div className="services-grid">
            {services.map(service => (
              <div key={service.id} className={`service-card ${!service.isActive ? 'inactive' : ''}`}>
                <div className="service-header">
                  <div className="service-category">
                    <span className="category-icon">{getCategoryIcon(service.category)}</span>
                    <span className="category-label">{getCategoryLabel(service.category)}</span>
                  </div>
                  <div className="service-status">
                    <button 
                      className={`status-toggle ${service.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleServiceStatus(service)}
                      title={service.isActive ? 'Disable service' : 'Enable service'}
                    >
                      {service.isActive ? '●' : '○'}
                    </button>
                  </div>
                </div>

                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                  
                  <div className="service-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value price">{formatPrice(service.price)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{formatDuration(service.duration)}</span>
                      </div>
                    </div>
                    
                    <div className="pet-types">
                      <span className="pet-types-label">Pet Types:</span>
                      <div className="pet-types-list">
                        {service.petTypes?.map(type => (
                          <span key={type} className="pet-type-badge">
                            {petTypeOptions.find(opt => opt.value === type)?.icon || '🐾'}
                            {petTypeOptions.find(opt => opt.value === type)?.label || type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="service-actions">
                  <button 
                    className="action-btn edit"
                    onClick={() => openEditModal(service)}
                    title="Edit service"
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => openDeleteConfirm(service)}
                    title="Delete service"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Service Modal */}
        {(showAddModal || showEditModal) && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{showEditModal ? 'Edit Service' : 'Add New Service'}</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="service-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Service Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {serviceCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price ($) *</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="duration">Duration (minutes)</label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="15"
                      step="15"
                      placeholder="e.g., 60"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Pet Types * (Select all that apply)</label>
                  <div className="pet-types-selector">
                    {petTypeOptions.map(type => (
                      <label key={type.value} className="pet-type-option">
                        <input
                          type="checkbox"
                          checked={formData.petTypes.includes(type.value)}
                          onChange={() => handlePetTypeChange(type.value)}
                        />
                        <span className="pet-type-label">
                          <span className="pet-icon">{type.icon}</span>
                          <span className="pet-name">{type.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h4>Availability</h4>
                  <div className="availability-grid">
                    {Object.entries(formData.availability).map(([day, schedule]) => (
                      <div key={day} className="availability-day">
                        <label className="day-header">
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) => handleAvailabilityChange(day, 'enabled', e.target.checked)}
                          />
                          <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                        </label>
                        
                        {schedule.enabled && (
                          <div className="time-inputs">
                            <input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => handleAvailabilityChange(day, 'startTime', e.target.value)}
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => handleAvailabilityChange(day, 'endTime', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="requirements">Special Requirements</label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Any special requirements or notes for this service..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cancellationPolicy">Cancellation Policy</label>
                  <textarea
                    id="cancellationPolicy"
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Your cancellation policy for this service..."
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <span>Service is active and available for booking</span>
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={formLoading}>
                    {formLoading ? 'Saving...' : (showEditModal ? 'Update Service' : 'Add Service')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Delete Service</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
              </div>

              <div className="delete-content">
                <div className="warning-icon">⚠️</div>
                <p>Are you sure you want to delete <strong>{selectedService?.name}</strong>?</p>
                <p className="warning-text">This action cannot be undone and will cancel any existing bookings for this service.</p>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={handleDelete}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Deleting...' : 'Delete Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default ServicesManagement; 