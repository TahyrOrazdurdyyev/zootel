import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [settings, setSettings] = useState({
    stripe_enabled: false,
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    commission_enabled: false,
    commission_percentage: 10,
    commission_fixed_fee: 0,
    minimum_payout: 50,
    payout_schedule: 'weekly',
    currency: 'USD',
    tax_enabled: false,
    tax_percentage: 0,
    payment_methods: {
      card: true,
      bank_transfer: false,
      digital_wallet: false,
      cash: true
    },
    refund_policy: {
      enabled: true,
      refund_window_hours: 24,
      automatic_refunds: false,
      partial_refunds_enabled: true
    },
    late_payment: {
      enabled: true,
      grace_period_days: 7,
      late_fee_percentage: 5,
      maximum_late_fee: 100
    }
  });

  const [testMode, setTestMode] = useState(true);
  const [showWebhookTest, setShowWebhookTest] = useState(false);

  const payoutSchedules = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const supportedCurrencies = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/payment-settings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.settings) {
        setSettings(prev => ({
          ...prev,
          ...response.data.settings
        }));
      }
    } catch (err) {
      setError('Failed to fetch payment settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const cleanedSettings = {
        ...settings,
        commission_percentage: parseFloat(settings.commission_percentage),
        commission_fixed_fee: parseFloat(settings.commission_fixed_fee),
        minimum_payout: parseFloat(settings.minimum_payout),
        tax_percentage: parseFloat(settings.tax_percentage)
      };

      await axios.put('/api/admin/payment-settings', cleanedSettings, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess('Payment settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    try {
      setShowWebhookTest(true);
      const response = await axios.post('/api/admin/payment-settings/test-webhook', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setSuccess('Webhook test successful!');
      } else {
        setError('Webhook test failed: ' + response.data.message);
      }
    } catch (err) {
      setError('Webhook test failed: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setShowWebhookTest(false);
    }
  };

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/stripe`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Test Mode</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Stripe Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
            Stripe Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  name="stripe_enabled"
                  checked={settings.stripe_enabled}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                />
                <span className="font-medium">Enable Stripe Payments</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publishable Key {testMode ? '(Test)' : '(Live)'}
              </label>
              <input
                type="text"
                name="stripe_publishable_key"
                value={settings.stripe_publishable_key}
                onChange={handleInputChange}
                disabled={!settings.stripe_enabled}
                placeholder={testMode ? "pk_test_..." : "pk_live_..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secret Key {testMode ? '(Test)' : '(Live)'}
              </label>
              <input
                type="password"
                name="stripe_secret_key"
                value={settings.stripe_secret_key}
                onChange={handleInputChange}
                disabled={!settings.stripe_enabled}
                placeholder={testMode ? "sk_test_..." : "sk_live_..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Secret
              </label>
              <input
                type="password"
                name="stripe_webhook_secret"
                value={settings.stripe_webhook_secret}
                onChange={handleInputChange}
                disabled={!settings.stripe_enabled}
                placeholder="whsec_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <p className="text-sm text-gray-600 mt-1">
                Webhook URL: <code className="bg-gray-100 px-2 py-1 rounded">{generateWebhookUrl()}</code>
              </p>
              <button
                type="button"
                onClick={testWebhook}
                disabled={!settings.stripe_enabled || showWebhookTest}
                className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {showWebhookTest ? 'Testing...' : 'Test Webhook'}
              </button>
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Commission Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  name="commission_enabled"
                  checked={settings.commission_enabled}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                />
                <span className="font-medium">Enable Commission</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Percentage (%)
              </label>
              <input
                type="number"
                name="commission_percentage"
                value={settings.commission_percentage}
                onChange={handleInputChange}
                disabled={!settings.commission_enabled}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Fee ({settings.currency})
              </label>
              <input
                type="number"
                name="commission_fixed_fee"
                value={settings.commission_fixed_fee}
                onChange={handleInputChange}
                disabled={!settings.commission_enabled}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Payout ({settings.currency})
              </label>
              <input
                type="number"
                name="minimum_payout"
                value={settings.minimum_payout}
                onChange={handleInputChange}
                disabled={!settings.commission_enabled}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Schedule
              </label>
              <select
                name="payout_schedule"
                value={settings.payout_schedule}
                onChange={handleInputChange}
                disabled={!settings.commission_enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                {payoutSchedules.map(schedule => (
                  <option key={schedule.value} value={schedule.value}>
                    {schedule.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">General Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {supportedCurrencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="tax_enabled"
                  checked={settings.tax_enabled}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                />
                <span className="font-medium">Enable Tax</span>
              </label>
              {settings.tax_enabled && (
                <input
                  type="number"
                  name="tax_percentage"
                  value={settings.tax_percentage}
                  onChange={handleInputChange}
                  placeholder="Tax percentage"
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Accepted Payment Methods</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.payment_methods.card}
                onChange={(e) => handleNestedChange('payment_methods', 'card', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Credit/Debit Card</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.payment_methods.bank_transfer}
                onChange={(e) => handleNestedChange('payment_methods', 'bank_transfer', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Bank Transfer</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.payment_methods.digital_wallet}
                onChange={(e) => handleNestedChange('payment_methods', 'digital_wallet', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Digital Wallet</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.payment_methods.cash}
                onChange={(e) => handleNestedChange('payment_methods', 'cash', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Cash</span>
            </label>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Refund Policy</h2>

          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.refund_policy.enabled}
                onChange={(e) => handleNestedChange('refund_policy', 'enabled', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="font-medium">Enable Refunds</span>
            </label>

            {settings.refund_policy.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Window (hours)
                  </label>
                  <input
                    type="number"
                    value={settings.refund_policy.refund_window_hours}
                    onChange={(e) => handleNestedChange('refund_policy', 'refund_window_hours', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.refund_policy.automatic_refunds}
                    onChange={(e) => handleNestedChange('refund_policy', 'automatic_refunds', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Automatic Refunds</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.refund_policy.partial_refunds_enabled}
                    onChange={(e) => handleNestedChange('refund_policy', 'partial_refunds_enabled', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Partial Refunds</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            type="button"
            onClick={fetchSettings}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentSettings; 