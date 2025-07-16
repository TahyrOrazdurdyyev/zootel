import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedApiCall } from '../../utils/api';
import './OwnerProfile.css';

const OwnerProfile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: false
      },
      communication: 'email',
      autoBooking: false
    }
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedApiCall(currentUser, '/api/pet-owners/profile');

      if (response.ok) {
        const data = await response.json();
        const profileData = data.data;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          emergencyContact: profileData.emergencyContact || {
            name: '',
            phone: '',
            relationship: ''
          },
          preferences: profileData.preferences || {
            notifications: {
              email: true,
              sms: false,
              push: false
            },
            communication: 'email',
            autoBooking: false
          }
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'emergencyContact') {
        setFormData(prev => ({
          ...prev,
          emergencyContact: {
            ...prev.emergencyContact,
            [child]: value
          }
        }));
      } else if (parent === 'preferences') {
        if (child === 'notifications') {
          const [notifParent, notifChild] = e.target.dataset.notif.split('.');
          setFormData(prev => ({
            ...prev,
            preferences: {
              ...prev.preferences,
              notifications: {
                ...prev.preferences.notifications,
                [notifChild]: checked
              }
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            preferences: {
              ...prev.preferences,
              [child]: type === 'checkbox' ? checked : value
            }
          }));
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedApiCall(currentUser, '/api/pet-owners/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="owner-profile">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your personal information and preferences</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
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
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="form-section">
          <h3>Emergency Contact</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emergencyName">Contact Name</label>
              <input
                type="text"
                id="emergencyName"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyPhone">Contact Phone</label>
              <input
                type="tel"
                id="emergencyPhone"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="relationship">Relationship</label>
            <select
              id="relationship"
              name="emergencyContact.relationship"
              value={formData.emergencyContact.relationship}
              onChange={handleInputChange}
            >
              <option value="">Select relationship</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Preferences */}
        <div className="form-section">
          <h3>Preferences</h3>
          
          <div className="form-group">
            <label>Notification Preferences</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="preferences.notifications"
                  data-notif="notifications.email"
                  checked={formData.preferences.notifications.email}
                  onChange={handleInputChange}
                />
                Email notifications
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="preferences.notifications"
                  data-notif="notifications.sms"
                  checked={formData.preferences.notifications.sms}
                  onChange={handleInputChange}
                />
                SMS notifications
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="preferences.notifications"
                  data-notif="notifications.push"
                  checked={formData.preferences.notifications.push}
                  onChange={handleInputChange}
                />
                Push notifications
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="communication">Preferred Communication</label>
              <select
                id="communication"
                name="preferences.communication"
                value={formData.preferences.communication}
                onChange={handleInputChange}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="preferences.autoBooking"
                checked={formData.preferences.autoBooking}
                onChange={handleInputChange}
              />
              Enable automatic booking confirmations
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="save-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OwnerProfile; 