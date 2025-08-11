import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const AIPromptsCustomization = () => {
  const { apiCall } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [originalContent, setOriginalContent] = useState('');

  useEffect(() => {
    loadAvailableAgents();
  }, []);

  const loadAvailableAgents = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/v1/ai/agents', 'GET');
      if (response.success) {
        // Загружаем информацию о промптах для каждого агента
        const agentsWithPrompts = await Promise.all(
          response.data.map(async (agent) => {
            try {
              const promptsResponse = await apiCall(`/api/v1/company/ai-prompts/${agent.agent_key}`, 'GET');
              return promptsResponse.success ? promptsResponse.data : { ...agent, error: true };
            } catch (error) {
              return { ...agent, error: true };
            }
          })
        );
        setAgents(agentsWithPrompts.filter(agent => !agent.error));
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrompt = (agent, promptType) => {
    const prompt = promptType === 'system' ? agent.SystemPrompt : agent.UserPrompt;
    setEditingPrompt({
      agentKey: agent.AgentKey,
      promptType: promptType,
      content: prompt.Content,
      source: prompt.Source,
      canEdit: prompt.CanEdit
    });
    setOriginalContent(prompt.Content);
    setShowEditModal(true);
  };

  const handleSavePrompt = async () => {
    try {
      const endpoint = editingPrompt.source === 'company' 
        ? `/api/v1/company/ai-prompts/${editingPrompt.agentKey}/${editingPrompt.promptType}`
        : '/api/v1/company/ai-prompts';

      const method = editingPrompt.source === 'company' ? 'PUT' : 'POST';
      
      const requestData = {
        agent_key: editingPrompt.agentKey,
        prompt_type: editingPrompt.promptType,
        content: editingPrompt.content
      };

      const response = await apiCall(endpoint, method, requestData);
      
      if (response.success) {
        await loadAvailableAgents();
        setShowEditModal(false);
        setEditingPrompt(null);
        alert('Промпт сохранен успешно!');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Ошибка при сохранении промпта');
    }
  };

  const handleDeleteCustomPrompt = async (agentKey, promptType) => {
    if (!confirm('Вы уверены, что хотите удалить кастомный промпт? Будет восстановлен глобальный промпт.')) {
      return;
    }

    try {
      const response = await apiCall(`/api/v1/company/ai-prompts/${agentKey}/${promptType}`, 'DELETE');
      if (response.success) {
        await loadAvailableAgents();
        alert('Кастомный промпт удален. Восстановлен глобальный промпт.');
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('Ошибка при удалении промпта');
    }
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

  const getSourceBadge = (source) => {
    switch (source) {
      case 'company':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Кастомный</span>;
      case 'global':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Глобальный</span>;
      case 'hardcoded':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">По умолчанию</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка AI агентов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-8 w-8 mr-3 text-red-600" />
            Кастомизация AI промптов
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Настройте AI агентов под нужды вашей компании
          </p>
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <div className="text-sm text-blue-700">
                <p><strong>Как работает кастомизация:</strong></p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Создайте кастомные промпты для своей компании</li>
                  <li>Кастомные промпты заменяют глобальные для вашей компании</li>
                  <li>Удаление кастомного промпта восстанавливает глобальный</li>
                  <li>Используйте переменные в формате: {`{{variable_name}}`}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Agents List */}
        <div className="space-y-6">
          {agents.map(agent => (
            <div key={agent.AgentKey} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{agent.AgentName}</h3>
                    <p className="text-sm text-gray-600">{agent.AgentDescription}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {agent.HasCustomPrompts && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        Кастомизирован
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                      {agent.AgentKey}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* System Prompt */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <CodeBracketIcon className="h-5 w-5 text-red-600 mr-2" />
                        <span className="font-medium text-gray-900">System Prompt</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSourceBadge(agent.SystemPrompt.Source)}
                        <button
                          onClick={() => handleEditPrompt(agent, 'system')}
                          className="text-red-600 hover:text-red-800"
                          title="Редактировать"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {agent.SystemPrompt.Source === 'company' && (
                          <button
                            onClick={() => handleDeleteCustomPrompt(agent.AgentKey, 'system')}
                            className="text-gray-400 hover:text-red-600"
                            title="Удалить кастомный промпт"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Переменные:</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.SystemPrompt.Variables?.map(variable => (
                          <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 line-clamp-4">
                        {agent.SystemPrompt.Content}
                      </p>
                    </div>
                  </div>

                  {/* User Prompt */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <CodeBracketIcon className="h-5 w-5 text-red-600 mr-2" />
                        <span className="font-medium text-gray-900">User Prompt</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSourceBadge(agent.UserPrompt.Source)}
                        <button
                          onClick={() => handleEditPrompt(agent, 'user')}
                          className="text-red-600 hover:text-red-800"
                          title="Редактировать"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {agent.UserPrompt.Source === 'company' && (
                          <button
                            onClick={() => handleDeleteCustomPrompt(agent.AgentKey, 'user')}
                            className="text-gray-400 hover:text-red-600"
                            title="Удалить кастомный промпт"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Переменные:</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.UserPrompt.Variables?.map(variable => (
                          <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-600 line-clamp-4">
                        {agent.UserPrompt.Content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Редактировать {editingPrompt.promptType === 'system' ? 'System' : 'User'} Prompt
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({editingPrompt.agentKey})
                  </span>
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {editingPrompt.source !== 'company' && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                    <div className="text-sm text-yellow-700">
                      <p><strong>Создание кастомного промпта</strong></p>
                      <p>Вы создаете кастомную версию промпта. Она заменит {editingPrompt.source === 'global' ? 'глобальный' : 'стандартный'} промпт для вашей компании.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Содержимое промпта
                  </label>
                  <textarea
                    value={editingPrompt.content}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                    placeholder="Введите содержимое промпта..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Используйте переменные в формате: {`{{variable_name}}`}
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Найденные переменные:</h4>
                  <div className="flex flex-wrap gap-1">
                    {extractVariables(editingPrompt.content).map(variable => (
                      <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                {originalContent !== editingPrompt.content && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">✓ Промпт был изменен</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setEditingPrompt({ ...editingPrompt, content: originalContent })}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  disabled={originalContent === editingPrompt.content}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Сброс
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSavePrompt}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    disabled={!editingPrompt.content.trim()}
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPromptsCustomization; 