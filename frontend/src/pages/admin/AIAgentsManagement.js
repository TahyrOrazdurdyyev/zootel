import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AIAgentsManagement = () => {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companiesAgents, setCompaniesAgents] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [activationData, setActivationData] = useState({
    companyId: '',
    agentKey: '',
    billingCycle: 'monthly'
  });

  const [pricingData, setPricingData] = useState({
    monthly_price: 0,
    yearly_price: 0,
    one_time_price: null,
    is_available: true
  });

  const [createData, setCreateData] = useState({
    agent_key: '',
    name: '',
    description: '',
    monthly_price: 0,
    yearly_price: 0,
    one_time_price: null,
    is_available: true
  });

  const billingCycles = [
    { value: 'free', label: 'Free (Admin)' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'one_time', label: 'One-time Payment' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [companiesResponse, agentsResponse] = await Promise.all([
        apiCall('/admin/companies/ai-agents', 'GET'),
        apiCall('/admin/ai-agents', 'GET')
      ]);

      if (companiesResponse.success) {
        setCompaniesAgents(companiesResponse.companies_agents || []);
      }

      if (agentsResponse.success) {
        setAvailableAgents(agentsResponse.agents || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAgent = async () => {
    try {
      const response = await apiCall('/admin/companies/ai-agents/activate', 'POST', {
        company_id: activationData.companyId,
        agent_key: activationData.agentKey,
        billing_cycle: activationData.billingCycle
      });

      if (response.success) {
        setShowActivateModal(false);
        setActivationData({ companyId: '', agentKey: '', billingCycle: 'monthly' });
        loadData(); // Refresh data
        alert('AI agent activated successfully!');
      } else {
        alert(`Error: ${response.error || 'Failed to activate agent'}`);
      }
    } catch (error) {
      console.error('Error activating agent:', error);
      alert('Error activating agent');
    }
  };

  const handleDeactivateAgent = async (companyId, agentKey) => {
    if (!confirm(`Are you sure you want to deactivate agent "${agentKey}"?`)) {
      return;
    }

    try {
      const response = await apiCall(`/admin/companies/${companyId}/ai-agents/${agentKey}`, 'DELETE');

      if (response.success) {
        loadData(); // Refresh data
        alert('AI agent deactivated successfully!');
      } else {
        alert(`Error: ${response.error || 'Failed to deactivate agent'}`);
      }
    } catch (error) {
      console.error('Error deactivating agent:', error);
      alert('Error deactivating agent');
    }
  };

  const handleUpdatePricing = async () => {
    try {
      const response = await apiCall(`/admin/ai-agents/${editingAgent.addon_key}/pricing`, 'PUT', pricingData);

      if (response.success) {
        setShowPricingModal(false);
        setEditingAgent(null);
        setPricingData({ monthly_price: 0, yearly_price: 0, one_time_price: null, is_available: true });
        loadData(); // Refresh data
        alert('Prices updated successfully!');
      } else {
        alert(`Error: ${response.error || 'Failed to update prices'}`);
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      alert('Error updating prices');
    }
  };

  const handleCreateAgent = async () => {
    try {
      const response = await apiCall('/admin/ai-agents', 'POST', createData);

      if (response.success) {
        setShowCreateModal(false);
        setCreateData({
          agent_key: '', name: '', description: '', 
          monthly_price: 0, yearly_price: 0, one_time_price: null, is_available: true
        });
        loadData(); // Refresh data
        alert('AI agent created successfully!');
      } else {
        alert(`Error: ${response.error || 'Failed to create agent'}`);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Error creating agent');
    }
  };

  const handleDeleteAgent = async (agentKey) => {
    if (!confirm(`Are you sure you want to delete agent "${agentKey}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiCall(`/admin/ai-agents/${agentKey}`, 'DELETE');

      if (response.success) {
        loadData(); // Refresh data
        alert('AI agent deleted successfully!');
      } else {
        alert(`Error: ${response.error || 'Failed to delete agent'}`);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Error deleting agent');
    }
  };

  const openActivateModal = (companyId = '') => {
    setActivationData({ ...activationData, companyId });
    setShowActivateModal(true);
  };

  const openPricingModal = (agent) => {
    setEditingAgent(agent);
    setPricingData({
      monthly_price: agent.monthly_price,
      yearly_price: agent.yearly_price,
      one_time_price: agent.one_time_price,
      is_available: agent.is_available
    });
    setShowPricingModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source) => {
    return source === 'plan' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <SparklesIcon className="h-8 w-8 text-orange-500 mr-3" />
                AI Agents Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage company access to AI agents
              </p>
            </div>
            <button
              onClick={() => openActivateModal()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-700 mr-3"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Activate Agent
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Create Agent
            </button>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {companiesAgents.map((companyInfo) => (
            <div key={companyInfo.company_id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {companyInfo.company_name || `Company ${companyInfo.company_id.slice(0, 8)}`}
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {companyInfo.plan_name}
                  </span>
                </div>

                {/* Plan Agents */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Agents from plan:</h4>
                  {companyInfo.plan_agents && companyInfo.plan_agents.length > 0 ? (
                    <div className="space-y-2">
                      {companyInfo.plan_agents.map((agent) => (
                        <div key={agent.agent_key} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSourceColor(agent.source)}`}>
                              Plan
                            </span>
                          </div>
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No agents in plan</p>
                  )}
                </div>

                {/* Addon Agents */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Additional agents:</h4>
                  {companyInfo.addon_agents && companyInfo.addon_agents.length > 0 ? (
                    <div className="space-y-2">
                      {companyInfo.addon_agents.map((agent) => (
                        <div key={`${agent.agent_key}-addon`} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                                {agent.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatPrice(agent.price)} / {agent.billing_cycle}
                              {agent.expires_at && (
                                <span className="ml-2">
                                  until {new Date(agent.expires_at).toLocaleDateString('en-US')}
                                </span>
                              )}
                            </div>
                          </div>
                          {agent.status === 'active' && (
                            <button
                              onClick={() => handleDeactivateAgent(companyInfo.company_id, agent.agent_key)}
                              className="ml-2 text-orange-600 hover:text-red-800"
                              title="Deactivate"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No additional agents</p>
                  )}
                </div>

                {/* Quick Activate Button */}
                <button
                  onClick={() => openActivateModal(companyInfo.company_id)}
                  className="w-full text-sm text-orange-600 hover:text-orange-800 border border-orange-600 hover:border-orange-800 rounded px-3 py-2 transition-colors"
                >
                  Add Agent
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Available Agents Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available AI Agents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableAgents.map((agent) => (
                <div key={agent.addon_key} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{agent.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                  <div className="mt-3 text-sm">
                    <div className="text-gray-700">Monthly: {formatPrice(agent.monthly_price)}</div>
                    <div className="text-gray-700">Yearly: {formatPrice(agent.yearly_price)}</div>
                    {agent.one_time_price && (
                      <div className="text-gray-700">One-time: {formatPrice(agent.one_time_price)}</div>
                    )}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      agent.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.is_available ? 'Available' : 'Unavailable'}
                    </span>
                    <button
                      onClick={() => openPricingModal(agent)}
                      className="text-orange-600 hover:text-orange-800 text-sm"
                      title="Edit Prices"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.addon_key)}
                      className="text-orange-600 hover:text-red-800 text-sm"
                      title="Delete Agent"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activate Agent Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activate AI Agent</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company ID
                </label>
                <input
                  type="text"
                  value={activationData.companyId}
                  onChange={(e) => setActivationData({...activationData, companyId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter company ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Agent
                </label>
                <select
                  value={activationData.agentKey}
                  onChange={(e) => setActivationData({...activationData, agentKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select agent</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.addon_key} value={agent.addon_key}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Type
                </label>
                <select
                  value={activationData.billingCycle}
                  onChange={(e) => setActivationData({...activationData, billingCycle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {billingCycles.map((cycle) => (
                    <option key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowActivateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleActivateAgent}
                disabled={!activationData.companyId || !activationData.agentKey}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Prices: {editingAgent?.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Price ($)
                </label>
                <input
                  type="number"
                  value={pricingData.monthly_price}
                  onChange={(e) => setPricingData({...pricingData, monthly_price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yearly Price ($)
                </label>
                <input
                  type="number"
                  value={pricingData.yearly_price}
                  onChange={(e) => setPricingData({...pricingData, yearly_price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One-time Price ($) - optional
                </label>
                <input
                  type="number"
                  value={pricingData.one_time_price || ''}
                  onChange={(e) => setPricingData({...pricingData, one_time_price: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty if not needed"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={pricingData.is_available}
                    onChange={(e) => setPricingData({...pricingData, is_available: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for purchase</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPricingModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePricing}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New AI Agent</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Key
                </label>
                <input
                  type="text"
                  value={createData.agent_key}
                  onChange={(e) => setCreateData({...createData, agent_key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g.: CustomAgent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) => setCreateData({...createData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Agent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createData.description}
                  onChange={(e) => setCreateData({...createData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Agent functionality description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    value={createData.monthly_price}
                    onChange={(e) => setCreateData({...createData, monthly_price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yearly Price ($)
                  </label>
                  <input
                    type="number"
                    value={createData.yearly_price}
                    onChange={(e) => setCreateData({...createData, yearly_price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One-time Price ($) - optional
                </label>
                <input
                  type="number"
                  value={createData.one_time_price || ''}
                  onChange={(e) => setCreateData({...createData, one_time_price: e.target.value ? parseFloat(e.target.value) : null})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty if not needed"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={createData.is_available}
                    onChange={(e) => setCreateData({...createData, is_available: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Available for purchase</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={!createData.agent_key || !createData.name}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentsManagement; 