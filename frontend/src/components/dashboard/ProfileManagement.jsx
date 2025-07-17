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
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
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
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            sunday: ''
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

  const handleBusinessHoursChange = (day, value) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: value
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
                        value={formData.businessHours[day.key] || ''}
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
                <h3>Business Photos</h3>
                <p>Add up to 5 photos to showcase your business and services</p>
                
                <div className="images-grid">
                  {formData.images.map((image, index) => (
                    <div key={index} className="image-item">
                      <img src={image} alt={`Business photo ${index + 1}`} />
                      <button
                        className="remove-image"
                        onClick={() => handleImageRemove(index)}
                        disabled={!hasFeature('profileCustomization')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {formData.images.length < 5 && hasFeature('profileCustomization') && (
                    <div className="add-image">
                      <div className="add-image-content">
                        <div className="add-icon">📷</div>
                        <p>Add Photo</p>
                        <small>Click to upload</small>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // In a real app, you'd upload this to a cloud storage service
                            // For now, we'll use a data URL for the image preview
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              handleImageAdd(e.target.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="image-guidelines">
                  <h4>Photo Guidelines:</h4>
                  <ul>
                    <li>Use high-quality images (minimum 800x600 pixels)</li>
                    <li>Show your business location, team, or services in action</li>
                    <li>Avoid blurry or dark photos</li>
                    <li>Maximum file size: 5MB per image</li>
                  </ul>
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