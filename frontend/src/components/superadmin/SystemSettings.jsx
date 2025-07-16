import React, { useState, useEffect } from 'react';
import './SystemSettings.css';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [activeSection, setActiveSection] = useState('general');
  const [saveLoading, setSaveLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Mock settings data - in real app would fetch from API
      setTimeout(() => {
        setSettings({
          general: {
            platformName: 'Zootel',
            platformDescription: 'Pet Services Marketplace',
            maintenanceMode: false,
            allowNewRegistrations: true,
            defaultTimezone: 'UTC',
            defaultLanguage: 'en',
            maxFileUploadSize: 10, // MB
            sessionTimeout: 30 // minutes
          },
          security: {
            passwordMinLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxLoginAttempts: 5,
            lockoutDuration: 15, // minutes
            twoFactorRequired: false,
            ipWhitelist: '',
            allowedDomains: 'gmail.com,outlook.com,company.com'
          },
          api: {
            rateLimit: 1000, // requests per hour
            enableApiKeys: true,
            requireAuthentication: true,
            allowCors: true,
            maxRequestSize: 5, // MB
            cacheEnabled: true,
            cacheExpiry: 300 // seconds
          },
          notifications: {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            adminAlerts: true,
            userWelcomeEmail: true,
            companyApprovalEmail: true,
            bookingConfirmationEmail: true,
            weeklyReports: true
          },
          integrations: {
            stripeEnabled: true,
            stripePublicKey: 'pk_test_...',
            emailProvider: 'sendgrid',
            smsProvider: 'twilio',
            storageProvider: 'aws-s3',
            analyticsEnabled: true,
            backupEnabled: true,
            backupFrequency: 'daily'
          }
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    try {
      setSaveLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCriticalAction = (action) => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    try {
      setShowConfirmModal(false);
      setSaveLoading(true);
      
      switch (pendingAction) {
        case 'maintenance':
          handleSettingChange('general', 'maintenanceMode', !settings.general.maintenanceMode);
          alert(`Maintenance mode ${settings.general.maintenanceMode ? 'disabled' : 'enabled'}`);
          break;
        case 'clearCache':
          alert('Cache cleared successfully');
          break;
        case 'resetApi':
          alert('API keys reset successfully');
          break;
        case 'exportData':
          alert('Data export initiated');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Failed to execute action');
    } finally {
      setSaveLoading(false);
      setPendingAction(null);
    }
  };

  const sections = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'api', name: 'API Settings', icon: '🔌' },
    { id: 'notifications', name: 'Notifications', icon: '📧' },
    { id: 'integrations', name: 'Integrations', icon: '🔗' }
  ];

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="system-settings">
      {/* Header */}
      <div className="settings-header">
        <div className="header-info">
          <h2>System Settings</h2>
          <p>Configure platform settings, security, and integrations</p>
        </div>
        <div className="header-actions">
          <button
            className="save-btn"
            onClick={saveSettings}
            disabled={saveLoading}
          >
            {saveLoading ? '💾 Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      <div className="settings-container">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <div className="settings-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className="nav-icon">{section.icon}</span>
                <span className="nav-text">{section.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <button
              className="action-btn maintenance"
              onClick={() => handleCriticalAction('maintenance')}
            >
              {settings.general?.maintenanceMode ? '🟢 Exit Maintenance' : '🔴 Maintenance Mode'}
            </button>
            <button
              className="action-btn secondary"
              onClick={() => handleCriticalAction('clearCache')}
            >
              🗑️ Clear Cache
            </button>
            <button
              className="action-btn warning"
              onClick={() => handleCriticalAction('resetApi')}
            >
              🔄 Reset API Keys
            </button>
            <button
              className="action-btn info"
              onClick={() => handleCriticalAction('exportData')}
            >
              📤 Export Data
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>⚙️ General Settings</h3>
                <p>Basic platform configuration and preferences</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>Platform Name</label>
                  <input
                    type="text"
                    value={settings.general?.platformName || ''}
                    onChange={(e) => handleSettingChange('general', 'platformName', e.target.value)}
                    className="setting-input"
                  />
                </div>

                <div className="setting-group">
                  <label>Platform Description</label>
                  <textarea
                    value={settings.general?.platformDescription || ''}
                    onChange={(e) => handleSettingChange('general', 'platformDescription', e.target.value)}
                    className="setting-textarea"
                    rows="3"
                  />
                </div>

                <div className="setting-group">
                  <label>Default Timezone</label>
                  <select
                    value={settings.general?.defaultTimezone || 'UTC'}
                    onChange={(e) => handleSettingChange('general', 'defaultTimezone', e.target.value)}
                    className="setting-select"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Default Language</label>
                  <select
                    value={settings.general?.defaultLanguage || 'en'}
                    onChange={(e) => handleSettingChange('general', 'defaultLanguage', e.target.value)}
                    className="setting-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Max File Upload Size (MB)</label>
                  <input
                    type="number"
                    value={settings.general?.maxFileUploadSize || 10}
                    onChange={(e) => handleSettingChange('general', 'maxFileUploadSize', parseInt(e.target.value))}
                    className="setting-input"
                    min="1"
                    max="100"
                  />
                </div>

                <div className="setting-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.general?.sessionTimeout || 30}
                    onChange={(e) => handleSettingChange('general', 'sessionTimeout', parseInt(e.target.value))}
                    className="setting-input"
                    min="5"
                    max="480"
                  />
                </div>
              </div>

              <div className="toggle-settings">
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Allow New Registrations</label>
                    <p>Enable new users to register on the platform</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.general?.allowNewRegistrations || false}
                      onChange={(e) => handleSettingChange('general', 'allowNewRegistrations', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Maintenance Mode</label>
                    <p>Put the platform in maintenance mode</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.general?.maintenanceMode || false}
                      onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>🔒 Security Settings</h3>
                <p>Configure security policies and authentication requirements</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>Minimum Password Length</label>
                  <input
                    type="number"
                    value={settings.security?.passwordMinLength || 8}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="setting-input"
                    min="6"
                    max="32"
                  />
                </div>

                <div className="setting-group">
                  <label>Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.security?.maxLoginAttempts || 5}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="setting-input"
                    min="3"
                    max="10"
                  />
                </div>

                <div className="setting-group">
                  <label>Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    value={settings.security?.lockoutDuration || 15}
                    onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                    className="setting-input"
                    min="5"
                    max="60"
                  />
                </div>

                <div className="setting-group full-width">
                  <label>Allowed Email Domains</label>
                  <input
                    type="text"
                    value={settings.security?.allowedDomains || ''}
                    onChange={(e) => handleSettingChange('security', 'allowedDomains', e.target.value)}
                    className="setting-input"
                    placeholder="gmail.com,outlook.com,company.com"
                  />
                  <small>Comma-separated list of allowed email domains</small>
                </div>

                <div className="setting-group full-width">
                  <label>IP Whitelist</label>
                  <textarea
                    value={settings.security?.ipWhitelist || ''}
                    onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.value)}
                    className="setting-textarea"
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    rows="3"
                  />
                  <small>One IP address or CIDR block per line</small>
                </div>
              </div>

              <div className="toggle-settings">
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Require Uppercase Letters</label>
                    <p>Passwords must contain uppercase letters</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.security?.requireUppercase || false}
                      onChange={(e) => handleSettingChange('security', 'requireUppercase', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Require Numbers</label>
                    <p>Passwords must contain numeric characters</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.security?.requireNumbers || false}
                      onChange={(e) => handleSettingChange('security', 'requireNumbers', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Require Special Characters</label>
                    <p>Passwords must contain special characters</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.security?.requireSpecialChars || false}
                      onChange={(e) => handleSettingChange('security', 'requireSpecialChars', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Require Two-Factor Authentication</label>
                    <p>Force all users to enable 2FA</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.security?.twoFactorRequired || false}
                      onChange={(e) => handleSettingChange('security', 'twoFactorRequired', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeSection === 'api' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>🔌 API Settings</h3>
                <p>Configure API limits, authentication, and caching</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>Rate Limit (requests/hour)</label>
                  <input
                    type="number"
                    value={settings.api?.rateLimit || 1000}
                    onChange={(e) => handleSettingChange('api', 'rateLimit', parseInt(e.target.value))}
                    className="setting-input"
                    min="100"
                    max="10000"
                  />
                </div>

                <div className="setting-group">
                  <label>Max Request Size (MB)</label>
                  <input
                    type="number"
                    value={settings.api?.maxRequestSize || 5}
                    onChange={(e) => handleSettingChange('api', 'maxRequestSize', parseInt(e.target.value))}
                    className="setting-input"
                    min="1"
                    max="50"
                  />
                </div>

                <div className="setting-group">
                  <label>Cache Expiry (seconds)</label>
                  <input
                    type="number"
                    value={settings.api?.cacheExpiry || 300}
                    onChange={(e) => handleSettingChange('api', 'cacheExpiry', parseInt(e.target.value))}
                    className="setting-input"
                    min="60"
                    max="3600"
                  />
                </div>
              </div>

              <div className="toggle-settings">
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Enable API Keys</label>
                    <p>Allow access via API keys</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.api?.enableApiKeys || false}
                      onChange={(e) => handleSettingChange('api', 'enableApiKeys', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Require Authentication</label>
                    <p>All API requests must be authenticated</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.api?.requireAuthentication || false}
                      onChange={(e) => handleSettingChange('api', 'requireAuthentication', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Allow CORS</label>
                    <p>Enable Cross-Origin Resource Sharing</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.api?.allowCors || false}
                      onChange={(e) => handleSettingChange('api', 'allowCors', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Enable Caching</label>
                    <p>Cache API responses for better performance</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.api?.cacheEnabled || false}
                      onChange={(e) => handleSettingChange('api', 'cacheEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>📧 Notification Settings</h3>
                <p>Configure email, SMS, and push notification preferences</p>
              </div>

              <div className="toggle-settings">
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Email Notifications</label>
                    <p>Enable email notification system</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.emailEnabled || false}
                      onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>SMS Notifications</label>
                    <p>Enable SMS notification system</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.smsEnabled || false}
                      onChange={(e) => handleSettingChange('notifications', 'smsEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Push Notifications</label>
                    <p>Enable browser push notifications</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.pushEnabled || false}
                      onChange={(e) => handleSettingChange('notifications', 'pushEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Admin Alerts</label>
                    <p>Send critical alerts to administrators</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.adminAlerts || false}
                      onChange={(e) => handleSettingChange('notifications', 'adminAlerts', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>User Welcome Emails</label>
                    <p>Send welcome email to new users</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.userWelcomeEmail || false}
                      onChange={(e) => handleSettingChange('notifications', 'userWelcomeEmail', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Company Approval Emails</label>
                    <p>Send emails when companies are approved</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.companyApprovalEmail || false}
                      onChange={(e) => handleSettingChange('notifications', 'companyApprovalEmail', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Booking Confirmation Emails</label>
                    <p>Send confirmation emails for bookings</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.bookingConfirmationEmail || false}
                      onChange={(e) => handleSettingChange('notifications', 'bookingConfirmationEmail', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Weekly Reports</label>
                    <p>Send weekly summary reports to admins</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.weeklyReports || false}
                      onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Settings */}
          {activeSection === 'integrations' && (
            <div className="settings-section">
              <div className="section-header">
                <h3>🔗 Integrations</h3>
                <p>Configure third-party services and integrations</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>Email Provider</label>
                  <select
                    value={settings.integrations?.emailProvider || 'sendgrid'}
                    onChange={(e) => handleSettingChange('integrations', 'emailProvider', e.target.value)}
                    className="setting-select"
                  >
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                    <option value="postmark">Postmark</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>SMS Provider</label>
                  <select
                    value={settings.integrations?.smsProvider || 'twilio'}
                    onChange={(e) => handleSettingChange('integrations', 'smsProvider', e.target.value)}
                    className="setting-select"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="nexmo">Nexmo</option>
                    <option value="aws-sns">AWS SNS</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Storage Provider</label>
                  <select
                    value={settings.integrations?.storageProvider || 'aws-s3'}
                    onChange={(e) => handleSettingChange('integrations', 'storageProvider', e.target.value)}
                    className="setting-select"
                  >
                    <option value="aws-s3">AWS S3</option>
                    <option value="google-cloud">Google Cloud Storage</option>
                    <option value="azure">Azure Blob Storage</option>
                    <option value="local">Local Storage</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Backup Frequency</label>
                  <select
                    value={settings.integrations?.backupFrequency || 'daily'}
                    onChange={(e) => handleSettingChange('integrations', 'backupFrequency', e.target.value)}
                    className="setting-select"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="setting-group full-width">
                  <label>Stripe Public Key</label>
                  <input
                    type="text"
                    value={settings.integrations?.stripePublicKey || ''}
                    onChange={(e) => handleSettingChange('integrations', 'stripePublicKey', e.target.value)}
                    className="setting-input"
                    placeholder="pk_test_..."
                  />
                </div>
              </div>

              <div className="toggle-settings">
                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Stripe Payments</label>
                    <p>Enable Stripe payment processing</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.integrations?.stripeEnabled || false}
                      onChange={(e) => handleSettingChange('integrations', 'stripeEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Analytics Tracking</label>
                    <p>Enable Google Analytics and tracking</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.integrations?.analyticsEnabled || false}
                      onChange={(e) => handleSettingChange('integrations', 'analyticsEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <label>Automatic Backups</label>
                    <p>Enable scheduled data backups</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.integrations?.backupEnabled || false}
                      onChange={(e) => handleSettingChange('integrations', 'backupEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Action</h3>
              <button 
                className="close-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="confirm-message">
                <div className="confirm-icon">⚠️</div>
                <p>Are you sure you want to perform this action? This may affect platform operation.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={executeAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings; 