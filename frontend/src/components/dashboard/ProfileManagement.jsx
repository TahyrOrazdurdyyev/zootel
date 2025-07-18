import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import FeatureGate from '../FeatureGate';
import './ProfileManagement.css';

const ProfileManagement = () => {
  const { currentUser } = useAuth();
  const { hasFeature } = useSubscription();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    logoUrl: '',
    logoFile: null,
    businessHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { closed: true },
      sunday: { closed: true }
    },
    images: []
  });

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📋' },
    { id: 'hours', name: 'Business Hours', icon: '🕒' },
    { id: 'images', name: 'Photos', icon: '📷' },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/companies/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          address: data.data.address || '',
          city: data.data.city || '',
          state: data.data.state || '',
          zipCode: data.data.zipCode || '',
          description: data.data.description || '',
          logoUrl: data.data.logoUrl || '',
          logoFile: null,
          businessHours: data.data.businessHours || {
            monday: { open: '09:00', close: '17:00' },
            tuesday: { open: '09:00', close: '17:00' },
            wednesday: { open: '09:00', close: '17:00' },
            thursday: { open: '09:00', close: '17:00' },
            friday: { open: '09:00', close: '17:00' },
            saturday: { closed: true },
            sunday: { closed: true }
          },
          images: data.data.images || []
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/companies/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({ ...prev, ...data.data }));
        
        // Check if profile is now complete for auto-verification
        const isComplete = !!(formData.name && formData.address && formData.city && formData.description);
        if (isComplete) {
          setSuccess('Profile updated and verified successfully! Your services will now appear in the marketplace.');
        } else {
          setSuccess('Profile updated successfully! Complete all required fields (name, address, city, description) to get verified and appear in marketplace.');
        }
        setTimeout(() => setSuccess(''), 5000);
      } else {
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend is running and try again.');
      } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Error updating profile: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const parseBusinessHours = (value) => {
    if (!value || value.toLowerCase().includes('closed')) {
      return { closed: true };
    }
    
    // Parse time range like "9:00 AM - 6:00 PM" or "09:00 - 17:00"
    const timePattern = /(\d{1,2}):?(\d{0,2})\s*(AM|PM)?\s*-\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)?/i;
    const match = value.match(timePattern);
    
    if (match) {
      let [, startHour, startMin = '00', startPeriod, endHour, endMin = '00', endPeriod] = match;
      
      // Convert to 24-hour format
      startHour = parseInt(startHour);
      endHour = parseInt(endHour);
      
      if (startPeriod && startPeriod.toLowerCase() === 'pm' && startHour !== 12) {
        startHour += 12;
      } else if (startPeriod && startPeriod.toLowerCase() === 'am' && startHour === 12) {
        startHour = 0;
      }
      
      if (endPeriod && endPeriod.toLowerCase() === 'pm' && endHour !== 12) {
        endHour += 12;
      } else if (endPeriod && endPeriod.toLowerCase() === 'am' && endHour === 12) {
        endHour = 0;
      }
      
      const open = `${startHour.toString().padStart(2, '0')}:${startMin.padStart(2, '0')}`;
      const close = `${endHour.toString().padStart(2, '0')}:${endMin.padStart(2, '0')}`;
      
      return { open, close };
    }
    
    // If parsing fails, return a default open hours
    return { open: '09:00', close: '17:00' };
  };

  const formatBusinessHoursForDisplay = (hoursObj) => {
    if (!hoursObj || hoursObj.closed) {
      return 'Closed';
    }
    
    if (hoursObj.open && hoursObj.close) {
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${period}`;
      };
      
      return `${formatTime(hoursObj.open)} - ${formatTime(hoursObj.close)}`;
    }
    
    return '';
  };

  const handleBusinessHoursChange = (day, value) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: parseBusinessHours(value)
      }
    }));
  };

  const handleImageAdd = (imageUrl) => {
    if (formData.images.length < 5) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleLogoUpload = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          logoUrl: e.target.result,
          logoFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-management">
      <div className="profile-header">
        <div className="header-info">
          <h2>Company Profile</h2>
          <p>Manage your business information and settings</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="profile-content">
        {activeTab === 'basic' && (
          <div className="tab-content basic-info">
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Company Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter company name"
                    disabled={!hasFeature('profileCustomization')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="readonly"
                  />
                  <small>Email cannot be changed as it&apos;s linked to your account</small>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    disabled={!hasFeature('profileCustomization')}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Business Address *</label>
                  <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete business address"
                    disabled={!hasFeature('profileCustomization')}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city"
                      disabled={!hasFeature('profileCustomization')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                      disabled={!hasFeature('profileCustomization')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="Enter ZIP code"
                      disabled={!hasFeature('profileCustomization')}
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="logoFile">Company Logo (Optional)</label>
                  <div className="logo-upload-container">
                    {formData.logoUrl && (
                      <div className="logo-preview">
                        <img src={formData.logoUrl} alt="Company Logo" />
                      </div>
                    )}
                    <div className="upload-area">
                      <input
                        type="file"
                        id="logoFile"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleLogoUpload(file);
                          }
                        }}
                        disabled={!hasFeature('profileCustomization')}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="logoFile" className="upload-label">
                        <div className="upload-icon">📷</div>
                        <div className="upload-text">
                          {formData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </div>
                        <div className="upload-hint">Click to select image from your computer</div>
                      </label>
                    </div>
                  </div>
                  <small>Upload a logo image file from your computer (PNG, JPG, max 5MB)</small>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Business Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your business, services, and what makes you special..."
                    rows="4"
                    disabled={!hasFeature('profileCustomization')}
                  />
                </div>

                {hasFeature('profileCustomization') && (
                  <div className="form-actions">
                    <button 
                      className="save-btn"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="tab-content business-hours">
            <div className="form-section">
              <h3>Business Hours</h3>
              <p>Set your operating hours for each day of the week</p>
              
              <div className="hours-grid">
                {daysOfWeek.map(day => (
                  <div key={day.key} className="hours-row">
                    <label className="day-label">{day.label}</label>
                    <div className="hours-inputs">
                      <input
                        type="text"
                        value={formatBusinessHoursForDisplay(formData.businessHours[day.key]) || ''}
                        onChange={(e) => handleBusinessHoursChange(day.key, e.target.value)}
                        placeholder="e.g., 9:00 AM - 6:00 PM or Closed"
                        disabled={!hasFeature('profileCustomization')}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="hours-examples">
                <h4>Examples:</h4>
                <ul>
                  <li><strong>Regular hours:</strong> 9:00 AM - 6:00 PM</li>
                  <li><strong>Split hours:</strong> 9:00 AM - 12:00 PM, 2:00 PM - 6:00 PM</li>
                  <li><strong>Closed:</strong> Closed</li>
                  <li><strong>24 hours:</strong> 24 Hours</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <FeatureGate
            feature="profileImages"
            fallback={
              <div className="feature-locked">
                <div className="lock-icon">🔒</div>
                <h3>Profile Images</h3>
                <p>Upgrade your plan to add photos of your business and services</p>
              </div>
            }
          >
            <div className="tab-content images-section">
              <div className="form-section">
                <div className="photos-header">
                  <div className="photos-title-section">
                    <h3>Business Photos</h3>
                    <div className="photos-subtitle">
                      <span className="photos-count">{formData.images.length}/5</span>
                      <span>Showcase your business and services with stunning photos</span>
                    </div>
                  </div>
                  <div className="photos-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(formData.images.length / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="photos-upload-area">
                  {formData.images.length < 5 && hasFeature('profileCustomization') && (
                    <div className="upload-zone">
                      <div className="upload-content">
                        <div className="upload-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <h4>Add Photos</h4>
                        <p>Drag & drop your images here, or click to browse</p>
                        <div className="upload-formats">
                          <span>PNG</span>
                          <span>JPG</span>
                          <span>WEBP</span>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="upload-input"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          files.forEach(file => {
                            if (formData.images.length < 5 && file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                handleImageAdd(e.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="images-grid">
                  {formData.images.map((image, index) => (
                    <div key={index} className="photo-card">
                      <div className="photo-container">
                        <img src={image} alt={`Business photo ${index + 1}`} />
                        <div className="photo-overlay">
                          <button
                            className="remove-photo-btn"
                            onClick={() => handleImageRemove(index)}
                            disabled={!hasFeature('profileCustomization')}
                            title="Remove photo"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="photo-info">
                        <span className="photo-number">Photo {index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="photo-guidelines">
                  <div className="guidelines-header">
                    <h4>
                      <span className="guidelines-icon">💡</span>
                      Photo Guidelines
                    </h4>
                  </div>
                  <div className="guidelines-grid">
                    <div className="guideline-item">
                      <div className="guideline-icon">📐</div>
                      <div className="guideline-content">
                        <h5>High Quality</h5>
                        <p>Minimum 800×600 pixels for crisp, clear images</p>
                      </div>
                    </div>
                    <div className="guideline-item">
                      <div className="guideline-icon">🎯</div>
                      <div className="guideline-content">
                        <h5>Show Your Business</h5>
                        <p>Include your location, team, or services in action</p>
                      </div>
                    </div>
                    <div className="guideline-item">
                      <div className="guideline-icon">🌟</div>
                      <div className="guideline-content">
                        <h5>Bright & Clear</h5>
                        <p>Avoid blurry, dark, or low-quality photos</p>
                      </div>
                    </div>
                    <div className="guideline-item">
                      <div className="guideline-icon">💾</div>
                      <div className="guideline-content">
                        <h5>File Size</h5>
                        <p>Maximum 5MB per image for optimal loading</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FeatureGate>
        )}

        {activeTab === 'stats' && (
          <div className="tab-content stats-section">
            <div className="stats-overview">
              <h3>Business Statistics</h3>
              <p>Overview of your business performance and metrics</p>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <div className="stat-value">{profile?.rating || '0.0'}</div>
                    <div className="stat-label">Average Rating</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <div className="stat-value">{profile?.totalBookings || 0}</div>
                    <div className="stat-label">Total Bookings</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🐕</div>
                  <div className="stat-content">
                    <div className="stat-value">{profile?.services?.length || 0}</div>
                    <div className="stat-label">Active Services</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-value">{profile?.verified ? 'Yes' : 'Pending'}</div>
                    <div className="stat-label">Verified Status</div>
                  </div>
                </div>
              </div>

              <div className="business-info">
                <h4>Business Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Member Since:</span>
                    <span className="info-value">{formatDate(profile?.joinedDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Business Type:</span>
                    <span className="info-value">Pet Service Provider</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Account Status:</span>
                    <span className={`info-value status ${profile?.verified ? 'verified' : 'pending'}`}>
                      {profile?.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              {profile?.services && profile.services.length > 0 && (
                <div className="services-list">
                  <h4>Your Services</h4>
                  <div className="services-tags">
                    {profile.services.map((service, index) => (
                      <span key={index} className="service-tag">{service}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!hasFeature('profileCustomization') && (
        <div className="upgrade-notice">
          <div className="notice-content">
            <div className="notice-icon">⚡</div>
            <div className="notice-text">
              <h4>Unlock Full Profile Customization</h4>
              <p>Upgrade your plan to edit your profile, add business hours, and upload photos</p>
            </div>
            <button className="upgrade-btn">Upgrade Plan</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement; 