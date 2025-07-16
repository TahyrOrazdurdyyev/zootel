import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const Settings = () => {
  const { currentUser, userRole, isEmailVerified, resendEmailVerification } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    bookingReminders: true,
    profileVisibility: 'public',
    twoFactorAuth: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load user settings from backend
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // This would fetch settings from backend
    // For now, using default values
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // Save settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await resendEmailVerification();
      setMessage('Verification email sent!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage('Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and privacy settings</p>
        </div>

        {message && (
          <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="settings-content">
          {/* Account Settings */}
          <div className="settings-section">
            <h2>Account</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>Email Address</h3>
                <p>{currentUser?.email}</p>
              </div>
              <div className="setting-control">
                {isEmailVerified() ? (
                  <span className="status verified">✅ Verified</span>
                ) : (
                  <div className="verification-warning">
                    <span className="status unverified">⚠️ Unverified</span>
                    <button 
                      onClick={handleResendVerification}
                      className="btn btn-small"
                      disabled={loading}
                    >
                      Resend Verification
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Account Type</h3>
                <p>{userRole?.replace('_', ' ')}</p>
              </div>
              <div className="setting-control">
                <span className="account-badge">{userRole}</span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Two-Factor Authentication</h3>
                <p>Add an extra layer of security to your account</p>
              </div>
              <div className="setting-control">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="settings-section">
            <h2>Notifications</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>Email Notifications</h3>
                <p>Receive updates and important information via email</p>
              </div>
              <div className="setting-control">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>SMS Notifications</h3>
                <p>Get booking updates and reminders via text message</p>
              </div>
              <div className="setting-control">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Booking Reminders</h3>
                <p>Receive reminders about upcoming appointments</p>
              </div>
              <div className="setting-control">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.bookingReminders}
                    onChange={(e) => handleSettingChange('bookingReminders', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Marketing Emails</h3>
                <p>Receive promotional offers and product updates</p>
              </div>
              <div className="setting-control">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.marketingEmails}
                    onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="settings-section">
            <h2>Privacy</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>Profile Visibility</h3>
                <p>Control who can see your profile information</p>
              </div>
              <div className="setting-control">
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  className="setting-select"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section danger-zone">
            <h2>Danger Zone</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all associated data</p>
              </div>
              <div className="setting-control">
                <button className="btn btn-danger">
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button 
              onClick={handleSaveSettings}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 