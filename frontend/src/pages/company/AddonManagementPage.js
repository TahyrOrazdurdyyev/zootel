import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  SparklesIcon,
  UserGroupIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AddonManagementPage = () => {
  const { apiCall } = useAuth();
  const [availableAddons, setAvailableAddons] = useState([]);
  const [companyAddons, setCompanyAddons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadAvailableAddons(),
        loadCompanyAddons(),
        loadPaymentSettings()
      ]);
    } catch (error) {
      console.error('Failed to load addon data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableAddons = async () => {
    try {
      const response = await apiCall('/api/addons/available');
      if (response.success) {
        setAvailableAddons(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load available addons:', error);
    }
  };

  const loadCompanyAddons = async () => {
    try {
      const response = await apiCall('/api/companies/addons');
      if (response.success) {
        setCompanyAddons(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load company addons:', error);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const response = await apiCall('/api/admin/payment-settings');
      if (response.success) {
        setPaymentSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    }
  };

  const handlePurchaseAddon = async (addon, billingCycle) => {
    try {
      setIsPurchasing(true);
      
      const response = await apiCall('/api/companies/addons/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addon_type: addon.addon_type,
          addon_key: addon.addon_key,
          billing_cycle: billingCycle
        })
      });

      if (response.success) {
        if (paymentSettings?.stripe_enabled) {
          alert('Purchase initiated! You will be redirected to payment.');
          // In a real implementation, you would redirect to Stripe Checkout
        } else {
          alert('Addon activated! Payment is currently disabled on the platform.');
        }
        await loadCompanyAddons();
        setSelectedAddon(null);
      } else {
        alert('Failed to purchase addon: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to purchase addon:', error);
      alert('Failed to purchase addon. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelAddon = async (addonId) => {
    if (!window.confirm('Are you sure you want to cancel this addon? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiCall(`/api/companies/addons/${addonId}/cancel`, {
        method: 'DELETE'
      });

      if (response.success) {
        alert('Addon cancelled successfully!');
        await loadCompanyAddons();
      } else {
        alert('Failed to cancel addon.');
      }
    } catch (error) {
      console.error('Failed to cancel addon:', error);
      alert('Failed to cancel addon. Please try again.');
    }
  };

  const getAddonIcon = (addonType) => {
    switch (addonType) {
      case 'ai_agent':
        return <SparklesIcon className="w-8 h-8" />;
      case 'extra_employee':
        return <UserGroupIcon className="w-8 h-8" />;
      case 'crm_feature':
        return <CogIcon className="w-8 h-8" />;
      default:
        return <PlusIcon className="w-8 h-8" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending Payment
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const isAddonOwned = (addon) => {
    return companyAddons.some(
      ca => ca.addon_type === addon.addon_type && 
            ca.addon_key === addon.addon_key && 
            ca.status === 'active'
    );
  };

  const getPrice = (addon, cycle) => {
    switch (cycle) {
      case 'monthly':
        return addon.monthly_price;
      case 'yearly':
        return addon.yearly_price;
      case 'one_time':
        return addon.one_time_price;
      default:
        return addon.monthly_price;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Addon Management</h1>
          <p className="text-gray-600 mt-1">
            Enhance your business with additional features and AI agents
          </p>
          
          {/* Payment Status Alert */}
          {paymentSettings && (
            <div className={`mt-4 p-4 rounded-lg ${
              paymentSettings.stripe_enabled 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex">
                {paymentSettings.stripe_enabled ? (
                  <CreditCardIcon className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
                )}
                <div>
                  <h3 className={`text-sm font-medium ${
                    paymentSettings.stripe_enabled ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {paymentSettings.stripe_enabled 
                      ? 'Payment System Active' 
                      : 'Payment System Disabled'
                    }
                  </h3>
                  <p className={`text-sm ${
                    paymentSettings.stripe_enabled ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {paymentSettings.stripe_enabled 
                      ? 'You can purchase addons with secure payment processing.'
                      : 'Addons will be activated immediately without payment. Contact support for billing questions.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Your Current Addons */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Current Addons</h2>
          
          {companyAddons.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <PlusIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addons yet</h3>
              <p className="text-gray-500">Browse available addons below to enhance your business.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyAddons.map((addon) => (
                <div key={addon.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-orange-500 mr-3">
                        {getAddonIcon(addon.addon_type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {addon.addon_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{addon.addon_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {getStatusBadge(addon.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">
                        {addon.price === 0 ? 'Free' : formatPrice(addon.price)}
                        {addon.billing_cycle !== 'one_time' && addon.billing_cycle !== 'manual' && 
                          ` / ${addon.billing_cycle}`}
                      </span>
                    </div>
                    
                    {addon.next_billing_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next billing:</span>
                        <span className="text-gray-900">
                          {new Date(addon.next_billing_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Purchased:</span>
                      <span className="text-gray-900">
                        {new Date(addon.purchased_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {addon.status === 'active' && addon.billing_cycle !== 'manual' && (
                    <button
                      onClick={() => handleCancelAddon(addon.id)}
                      className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm hover:bg-orange-50"
                    >
                      Cancel Addon
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Addons */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Addons</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableAddons.map((addon) => {
              const owned = isAddonOwned(addon);
              
              return (
                <div key={`${addon.addon_type}-${addon.addon_key}`} 
                     className={`bg-white rounded-lg shadow-sm border p-6 ${
                       owned ? 'border-green-200 bg-green-50' : 'border-gray-200'
                     }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`mr-3 ${owned ? 'text-green-500' : 'text-orange-500'}`}>
                        {getAddonIcon(addon.addon_type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{addon.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {addon.addon_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    {owned && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Owned
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{addon.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="font-medium">{formatPrice(addon.monthly_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Yearly:</span>
                      <span className="font-medium">{formatPrice(addon.yearly_price)}</span>
                    </div>
                    {addon.one_time_price && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">One-time:</span>
                        <span className="font-medium">{formatPrice(addon.one_time_price)}</span>
                      </div>
                    )}
                  </div>

                  {!owned && (
                    <button
                      onClick={() => setSelectedAddon(addon)}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                    >
                      Purchase Addon
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Purchase Modal */}
        {selectedAddon && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Purchase {selectedAddon.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">
                  {selectedAddon.description}
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Cycle
                  </label>
                  <select
                    value={selectedBillingCycle}
                    onChange={(e) => setSelectedBillingCycle(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="monthly">
                      Monthly - {formatPrice(selectedAddon.monthly_price)}
                    </option>
                    <option value="yearly">
                      Yearly - {formatPrice(selectedAddon.yearly_price)} 
                      (Save {formatPrice(selectedAddon.monthly_price * 12 - selectedAddon.yearly_price)})
                    </option>
                    {selectedAddon.one_time_price && (
                      <option value="one_time">
                        One-time - {formatPrice(selectedAddon.one_time_price)}
                      </option>
                    )}
                  </select>
                </div>

                <div className="mb-6 p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-bold text-orange-600">
                      {formatPrice(getPrice(selectedAddon, selectedBillingCycle))}
                    </span>
                  </div>
                  {selectedBillingCycle !== 'one_time' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Recurring {selectedBillingCycle} billing
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedAddon(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePurchaseAddon(selectedAddon, selectedBillingCycle)}
                    disabled={isPurchasing}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isPurchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddonManagementPage; 