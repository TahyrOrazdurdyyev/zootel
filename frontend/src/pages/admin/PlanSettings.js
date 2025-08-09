import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlanSettings = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    billing_cycle: 'monthly',
    max_employees: '',
    max_services: '',
    max_bookings_per_month: '',
    max_storage_gb: '',
    features: [],
    included_ai_agents: [],
    ai_agent_addons: [],
    is_active: true,
    trial_days: ''
  });

  const availableFeatures = [
    'online_booking',
    'chat_support',
    'analytics',
    'inventory_management',
    'customer_management',
    'appointment_scheduling',
    'payment_processing',
    'email_notifications',
    'sms_notifications',
    'website_integration',
    'marketplace_visibility',
    'custom_branding',
    'api_access',
    'multi_location',
    'employee_management',
    'financial_reports',
    'customer_reviews',
    'loyalty_program',
    'bulk_operations',
    'data_export'
  ];

  const availableAIAgents = [
    'booking_assistant',
    'customer_support',
    'vet_consultant',
    'nutrition_advisor',
    'training_coach',
    'emergency_advisor',
    'appointment_scheduler',
    'follow_up_assistant'
  ];

  const billingCycles = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/plans', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPlans(response.data.plans || []);
    } catch (err) {
      setError('Failed to fetch plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleAIAgentToggle = (agent, type) => {
    const field = type === 'included' ? 'included_ai_agents' : 'ai_agent_addons';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(agent)
        ? prev[field].filter(a => a !== agent)
        : [...prev[field], agent]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      billing_cycle: 'monthly',
      max_employees: '',
      max_services: '',
      max_bookings_per_month: '',
      max_storage_gb: '',
      features: [],
      included_ai_agents: [],
      ai_agent_addons: [],
      is_active: true,
      trial_days: ''
    });
    setEditingPlan(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');

      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        max_employees: parseInt(formData.max_employees) || null,
        max_services: parseInt(formData.max_services) || null,
        max_bookings_per_month: parseInt(formData.max_bookings_per_month) || null,
        max_storage_gb: parseInt(formData.max_storage_gb) || null,
        trial_days: parseInt(formData.trial_days) || null
      };

      if (editingPlan) {
        await axios.put(`/api/admin/plans/${editingPlan.id}`, planData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setSuccess('Plan updated successfully!');
      } else {
        await axios.post('/api/admin/plans', planData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setSuccess('Plan created successfully!');
      }

      fetchPlans();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleEdit = (plan) => {
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price?.toString() || '',
      currency: plan.currency || 'USD',
      billing_cycle: plan.billing_cycle || 'monthly',
      max_employees: plan.max_employees?.toString() || '',
      max_services: plan.max_services?.toString() || '',
      max_bookings_per_month: plan.max_bookings_per_month?.toString() || '',
      max_storage_gb: plan.max_storage_gb?.toString() || '',
      features: plan.features || [],
      included_ai_agents: plan.included_ai_agents || [],
      ai_agent_addons: plan.ai_agent_addons || [],
      is_active: plan.is_active !== undefined ? plan.is_active : true,
      trial_days: plan.trial_days?.toString() || ''
    });
    setEditingPlan(plan);
    setShowCreateForm(true);
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/plans/${planId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSuccess('Plan deleted successfully!');
      fetchPlans();
    } catch (err) {
      setError('Failed to delete plan');
    }
  };

  const formatFeatureName = (feature) => {
    return feature.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatAIAgentName = (agent) => {
    return agent.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
        <h1 className="text-3xl font-bold text-gray-900">Plan Settings</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Create New Plan
        </button>
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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Cycle
                </label>
                <select
                  name="billing_cycle"
                  value={formData.billing_cycle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {billingCycles.map(cycle => (
                    <option key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Employees
                </label>
                <input
                  type="number"
                  name="max_employees"
                  value={formData.max_employees}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Services
                </label>
                <input
                  type="number"
                  name="max_services"
                  value={formData.max_services}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Bookings per Month
                </label>
                <input
                  type="number"
                  name="max_bookings_per_month"
                  value={formData.max_bookings_per_month}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage (GB)
                </label>
                <input
                  type="number"
                  name="max_storage_gb"
                  value={formData.max_storage_gb}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trial Days
                </label>
                <input
                  type="number"
                  name="trial_days"
                  value={formData.trial_days}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Features
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableFeatures.map(feature => (
                  <label key={feature} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{formatFeatureName(feature)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Included AI Agents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Included AI Agents
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableAIAgents.map(agent => (
                  <label key={agent} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.included_ai_agents.includes(agent)}
                      onChange={() => handleAIAgentToggle(agent, 'included')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{formatAIAgentName(agent)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Agent Add-ons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available AI Agent Add-ons
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableAIAgents.map(agent => (
                  <label key={agent} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.ai_agent_addons.includes(agent)}
                      onChange={() => handleAIAgentToggle(agent, 'addon')}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{formatAIAgentName(agent)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-gray-300"
              />
              <label className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p className="text-gray-600 mb-4">{plan.description}</p>

            <div className="mb-4">
              <span className="text-2xl font-bold">${plan.price}</span>
              <span className="text-gray-600">/{plan.billing_cycle}</span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {plan.max_employees && (
                <p>• Up to {plan.max_employees} employees</p>
              )}
              {plan.max_services && (
                <p>• Up to {plan.max_services} services</p>
              )}
              {plan.max_bookings_per_month && (
                <p>• Up to {plan.max_bookings_per_month} bookings/month</p>
              )}
              {plan.max_storage_gb && (
                <p>• {plan.max_storage_gb}GB storage</p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">AI Agents:</p>
              <div className="text-xs text-gray-600">
                {plan.included_ai_agents?.length > 0 ? (
                  plan.included_ai_agents.map(agent => formatAIAgentName(agent)).join(', ')
                ) : (
                  'None included'
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No plans found. Create your first plan to get started.</p>
        </div>
      )}
    </div>
  );
};

export default PlanSettings; 