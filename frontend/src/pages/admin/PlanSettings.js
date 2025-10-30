import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  UserGroupIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const PlanSettings = () => {
  const { apiCall } = useAuth();
  const [plans, setPlans] = useState([]);
  const [addonPricing, setAddonPricing] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingAddon, setEditingAddon] = useState(null);
  const [activeTab, setActiveTab] = useState('plans');

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    max_employees: 1,
    features: [],
    included_ai_agents: [],
    free_trial_enabled: true,
    free_trial_days: 30,
    is_active: true
  });

  const [addonForm, setAddonForm] = useState({
    addon_type: 'ai_agent',
    addon_key: '',
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    one_time_price: null,
    is_available: true
  });

  const addonTypes = [
    { value: 'ai_agent', label: 'AI Agent', icon: SparklesIcon },
    { value: 'extra_employee', label: 'Extra Employee', icon: UserGroupIcon },
    { value: 'crm_feature', label: 'CRM Feature', icon: CogIcon }
  ];

  const availableAIAgents = [
    'BookingAssistant',
    'CustomerSupportAgent', 
    'ReminderFollowUpBot',
    'MedicalVetAssistant',
    'MarketingContentGenerator',
    'UpsellCrossSellAgent',
    'FeedbackSentimentAnalyzer',
    'AnalyticsNarrator'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadPlans(), loadAddonPricing()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await apiCall('/api/admin/plans');
      if (response.success) {
        setPlans(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadAddonPricing = async () => {
    try {
      const response = await apiCall('/api/admin/addon-pricing');
      if (response.success) {
        setAddonPricing(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load addon pricing:', error);
    }
  };

  const handleSavePlan = async () => {
    try {
      const url = editingPlan 
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans';
      
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await apiCall(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm)
      });

      if (response.success) {
        await loadPlans();
        setShowPlanModal(false);
        setEditingPlan(null);
        resetPlanForm();
      } else {
        alert('Failed to save plan');
      }
    } catch (error) {
      console.error('Failed to save plan:', error);
      alert('Failed to save plan');
    }
  };

  const handleSaveAddon = async () => {
    try {
      const url = editingAddon 
        ? `/api/admin/addon-pricing/${editingAddon.id}`
        : '/api/admin/addon-pricing';
      
      const method = editingAddon ? 'PUT' : 'POST';

      const response = await apiCall(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addonForm)
      });

      if (response.success) {
        await loadAddonPricing();
        setShowAddonModal(false);
        setEditingAddon(null);
        resetAddonForm();
      } else {
        alert('Failed to save addon pricing');
      }
    } catch (error) {
      console.error('Failed to save addon pricing:', error);
      alert('Failed to save addon pricing');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await apiCall(`/api/admin/plans/${planId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        await loadPlans();
      } else {
        alert('Failed to delete plan');
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete plan');
    }
  };

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm('Are you sure you want to delete this addon pricing?')) return;

    try {
      const response = await apiCall(`/api/admin/addon-pricing/${addonId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        await loadAddonPricing();
      } else {
        alert('Failed to delete addon pricing');
      }
    } catch (error) {
      console.error('Failed to delete addon pricing:', error);
      alert('Failed to delete addon pricing');
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      description: '',
      monthly_price: 0,
      yearly_price: 0,
      max_employees: 1,
      features: [],
      included_ai_agents: [],
      free_trial_enabled: true,
      free_trial_days: 30,
      is_active: true
    });
  };

  const resetAddonForm = () => {
    setAddonForm({
      addon_type: 'ai_agent',
      addon_key: '',
      name: '',
      description: '',
      monthly_price: 0,
      yearly_price: 0,
      one_time_price: null,
      is_available: true
    });
  };

  const openPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name || '',
        description: plan.description || '',
        monthly_price: plan.monthly_price || 0,
        yearly_price: plan.yearly_price || 0,
        max_employees: plan.max_employees || 1,
        features: plan.features || [],
        included_ai_agents: plan.included_ai_agents || [],
        free_trial_enabled: plan.free_trial_enabled ?? true,
        free_trial_days: plan.free_trial_days || 30,
        is_active: plan.is_active ?? true
      });
    } else {
      setEditingPlan(null);
      resetPlanForm();
    }
    setShowPlanModal(true);
  };

  const openAddonModal = (addon = null) => {
    if (addon) {
      setEditingAddon(addon);
      setAddonForm({
        addon_type: addon.addon_type || 'ai_agent',
        addon_key: addon.addon_key || '',
        name: addon.name || '',
        description: addon.description || '',
        monthly_price: addon.monthly_price || 0,
        yearly_price: addon.yearly_price || 0,
        one_time_price: addon.one_time_price,
        is_available: addon.is_available ?? true
      });
    } else {
      setEditingAddon(null);
      resetAddonForm();
    }
    setShowAddonModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getAddonIcon = (addonType) => {
    const type = addonTypes.find(t => t.value === addonType);
    const IconComponent = type?.icon || CogIcon;
    return <IconComponent className="w-5 h-5" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Plan & Addon Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage subscription plans and addon pricing
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('plans')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'plans'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subscription Plans
              </button>
              <button
                onClick={() => setActiveTab('addons')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'addons'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Addon Pricing
              </button>
            </nav>
          </div>
        </div>

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
              <button
                onClick={() => openPlanModal()}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openPlanModal(plan)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-400 hover:text-orange-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="font-medium">{formatPrice(plan.monthly_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Yearly:</span>
                      <span className="font-medium">{formatPrice(plan.yearly_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Max Employees:</span>
                      <span className="font-medium">{plan.max_employees}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Free Trial:</span>
                      <span className="font-medium">
                        {plan.free_trial_enabled ? `${plan.free_trial_days} days` : 'No'}
                      </span>
                    </div>
                  </div>

                  {plan.included_ai_agents && plan.included_ai_agents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Included AI Agents:</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.included_ai_agents.map((agent) => (
                          <span
                            key={agent}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plan.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Addons Tab */}
        {activeTab === 'addons' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Addon Pricing</h2>
              <button
                onClick={() => openAddonModal()}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Addon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addonPricing.map((addon) => (
                <div key={addon.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="text-orange-500 mr-3">
                        {getAddonIcon(addon.addon_type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{addon.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {addon.addon_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openAddonModal(addon)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddon(addon.id)}
                        className="text-red-400 hover:text-orange-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
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

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Key: {addon.addon_key}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      addon.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {addon.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingPlan ? 'Edit Plan' : 'Create Plan'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter plan name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Employees
                    </label>
                    <input
                      type="number"
                      value={planForm.max_employees}
                      onChange={(e) => setPlanForm({...planForm, max_employees: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.monthly_price}
                      onChange={(e) => setPlanForm({...planForm, monthly_price: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yearly Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.yearly_price}
                      onChange={(e) => setPlanForm({...planForm, yearly_price: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Trial Days
                    </label>
                    <input
                      type="number"
                      value={planForm.free_trial_days}
                      onChange={(e) => setPlanForm({...planForm, free_trial_days: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={planForm.free_trial_enabled}
                        onChange={(e) => setPlanForm({...planForm, free_trial_enabled: e.target.checked})}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Free Trial Enabled</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={planForm.is_active}
                        onChange={(e) => setPlanForm({...planForm, is_active: e.target.checked})}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter plan description"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included AI Agents
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableAIAgents.map((agent) => (
                      <label key={agent} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={planForm.included_ai_agents.includes(agent)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPlanForm({
                                ...planForm,
                                included_ai_agents: [...planForm.included_ai_agents, agent]
                              });
                            } else {
                              setPlanForm({
                                ...planForm,
                                included_ai_agents: planForm.included_ai_agents.filter(a => a !== agent)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{agent}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePlan}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Addon Modal */}
        {showAddonModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingAddon ? 'Edit Addon Pricing' : 'Create Addon Pricing'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Addon Type
                    </label>
                    <select
                      value={addonForm.addon_type}
                      onChange={(e) => setAddonForm({...addonForm, addon_type: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {addonTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Addon Key
                    </label>
                    <input
                      type="text"
                      value={addonForm.addon_key}
                      onChange={(e) => setAddonForm({...addonForm, addon_key: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={addonForm.addon_type === 'ai_agent' ? 'e.g., BookingAssistant' : 'Enter addon key'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={addonForm.name}
                      onChange={(e) => setAddonForm({...addonForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter addon name"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={addonForm.is_available}
                        onChange={(e) => setAddonForm({...addonForm, is_available: e.target.checked})}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Available for Purchase</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addonForm.monthly_price}
                      onChange={(e) => setAddonForm({...addonForm, monthly_price: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yearly Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addonForm.yearly_price}
                      onChange={(e) => setAddonForm({...addonForm, yearly_price: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      One-time Price ($) - Optional
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={addonForm.one_time_price || ''}
                      onChange={(e) => setAddonForm({
                        ...addonForm, 
                        one_time_price: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Leave empty if not available"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={addonForm.description}
                    onChange={(e) => setAddonForm({...addonForm, description: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter addon description"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddonModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAddon}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    {editingAddon ? 'Update Addon' : 'Create Addon'}
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

export default PlanSettings; 