import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  SparklesIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CodeBracketIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const PromptsManagement = () => {
  const { apiCall } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    agent_key: '',
    prompt_type: 'system',
    content: ''
  });

  const agentTypes = [
    { key: 'booking_assistant', name: 'Booking Assistant', description: 'Manages appointment bookings and scheduling' },
    { key: 'customer_support', name: 'Customer Support Agent', description: 'Provides general customer support and information' },
    { key: 'medical_vet_assistant', name: 'Medical Veterinary Assistant', description: 'Provides veterinary medical assistance and guidance' },
    { key: 'analytics_narrator', name: 'Analytics Narrator', description: 'Provides insights from analytics data' },
    { key: 'retail_assistant', name: 'Retail Shopping Assistant', description: 'Helps customers with product selection and shopping' }
  ];

  const promptTypes = [
    { value: 'system', label: 'System Prompt', description: 'Defines the AI agent behavior and role' },
    { value: 'user', label: 'User Prompt', description: 'Template for user message processing' }
  ];

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/v1/admin/prompts', 'GET');
      if (response.success) {
        setPrompts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await apiCall('/api/v1/admin/prompts', 'POST', formData);
      if (response.success) {
        await loadPrompts();
        setShowCreateModal(false);
        setFormData({ agent_key: '', prompt_type: 'system', content: '' });
        alert('Prompt created successfully!');
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      alert('Error creating prompt');
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await apiCall(`/api/v1/admin/prompts/${editingPrompt.id}`, 'PUT', {
        agent_key: editingPrompt.agent_key,
        prompt_type: editingPrompt.prompt_type,
        content: editingPrompt.content
      });
      if (response.success) {
        await loadPrompts();
        setShowEditModal(false);
        setEditingPrompt(null);
        alert('Prompt updated successfully!');
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      alert('Error updating prompt');
    }
  };

  const filteredPrompts = prompts.filter(prompt => 
    selectedAgent === 'all' || prompt.agent_key === selectedAgent
  );

  const groupedPrompts = agentTypes.reduce((acc, agent) => {
    acc[agent.key] = filteredPrompts.filter(p => p.agent_key === agent.key);
    return acc;
  }, {});

  const getAgentInfo = (agentKey) => {
    return agentTypes.find(agent => agent.key === agentKey);
  };

  const extractVariables = (content) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1].trim())) {
        variables.push(match[1].trim());
      }
    }
    return variables;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <SparklesIcon className="h-8 w-8 mr-3 text-orange-600" />
              AI Prompts Management
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Configure global prompts for AI agents
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Prompt
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by agent:</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All agents</option>
              {agentTypes.map(agent => (
                <option key={agent.key} value={agent.key}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prompts by Agent */}
        <div className="space-y-6">
          {agentTypes.filter(agent => selectedAgent === 'all' || selectedAgent === agent.key).map(agent => (
            <div key={agent.key} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-600">{agent.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                    {groupedPrompts[agent.key]?.length || 0} prompts
                  </span>
                </div>
              </div>

              <div className="p-6">
                {groupedPrompts[agent.key]?.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {groupedPrompts[agent.key].map(prompt => (
                      <div key={prompt.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <CodeBracketIcon className="h-5 w-5 text-orange-600 mr-2" />
                            <span className="font-medium text-gray-900">
                              {promptTypes.find(pt => pt.value === prompt.prompt_type)?.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              v{prompt.version}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPrompt(prompt);
                                setShowEditModal(true);
                              }}
                              className="text-orange-600 hover:text-red-800"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Variables:</p>
                          <div className="flex flex-wrap gap-1">
                            {extractVariables(prompt.content).map(variable => (
                              <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {`{{${variable}}}`}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-600 line-clamp-3">
                            {prompt.content}
                          </p>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          Created: {new Date(prompt.created_at).toLocaleDateString('en-US')}
                          {prompt.updated_at !== prompt.created_at && (
                            <>, updated: {new Date(prompt.updated_at).toLocaleDateString('en-US')}</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No prompts for this agent</p>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, agent_key: agent.key });
                        setShowCreateModal(true);
                      }}
                      className="mt-2 text-orange-600 hover:text-red-800 text-sm"
                    >
                      Create first prompt
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Prompt</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Agent</label>
                  <select
                    value={formData.agent_key}
                    onChange={(e) => setFormData({ ...formData, agent_key: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select agent</option>
                    {agentTypes.map(agent => (
                      <option key={agent.key} value={agent.key}>{agent.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Type</label>
                  <select
                    value={formData.prompt_type}
                    onChange={(e) => setFormData({ ...formData, prompt_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    {promptTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Enter prompt content..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use variables in format: {`{{variable_name}}`}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  disabled={!formData.agent_key || !formData.content}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Prompt: {getAgentInfo(editingPrompt.agent_key)?.name} ({editingPrompt.prompt_type})
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Content</label>
                  <textarea
                    value={editingPrompt.content}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Found variables:</h4>
                  <div className="flex flex-wrap gap-1">
                    {extractVariables(editingPrompt.content).map(variable => (
                      <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptsManagement; 