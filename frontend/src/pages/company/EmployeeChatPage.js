import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  ComputerDesktopIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  PaperClipIcon,
  SparklesIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const EmployeeChatPage = () => {
  const { user, apiCall } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAssistMode, setAiAssistMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCompanyChats();
    loadAvailableAgents();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadChatMessages(activeChat.id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadChatMessages(activeChat.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCompanyChats = async () => {
    try {
      const response = await apiCall('/companies/chats');
      if (response.success) {
        setChats(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      const response = await apiCall('/api/ai/agents');
      if (response.success) {
        setAvailableAgents(response.data.agents || []);
        // Auto-select customer support agent
        const supportAgent = response.data.agents?.find(agent => 
          agent.key === 'customer_support'
        );
        if (supportAgent) {
          setSelectedAgent(supportAgent);
        }
      }
    } catch (error) {
      console.error('Failed to load AI agents:', error);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const response = await apiCall(`/api/chat/${chatId}/messages`);
      if (response.success) {
        setMessages(response.data.messages || []);
        // Mark messages as read
        await apiCall(`/api/chat/${chatId}/read`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async (messageText, senderType = 'employee') => {
    if (!messageText.trim() || !activeChat) return;

    setIsLoading(true);
    try {
      const response = await apiCall(`/api/chat/${activeChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: activeChat.id,
          sender_type: senderType,
          sender_id: user.id,
          message_text: messageText.trim(),
          ai_agent_key: senderType === 'ai' ? selectedAgent?.key : undefined
        }),
      });

      if (response.success) {
        // Reload messages to get the new one
        await loadChatMessages(activeChat.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage('');
    await sendMessage(messageText, 'employee');
  };

  const handleAIAssist = async () => {
    if (!aiPrompt.trim() || !selectedAgent) return;

    try {
      setIsLoading(true);
      // First, get AI suggestion
      const aiResponse = await apiCall('/api/ai/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_key: selectedAgent.key,
          user_message: aiPrompt,
          conversation_history: messages.slice(-5) // Last 5 messages for context
        }),
      });

      if (aiResponse.success) {
        // Send AI-generated message
        await sendMessage(aiResponse.data.message, 'ai');
      }
    } catch (error) {
      console.error('Failed to get AI assistance:', error);
      alert('AI assistance failed. Please try again.');
    } finally {
      setAiPrompt('');
      setAiAssistMode(false);
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (senderType) => {
    switch (senderType) {
      case 'ai':
        return <ComputerDesktopIcon className="w-4 h-4 text-blue-500" />;
      case 'employee':
        return <UserIcon className="w-4 h-4 text-orange-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMessageStatusIcon = (message) => {
    if (message.sender_type === 'employee' || message.sender_type === 'ai') {
      return message.is_read ? (
        <CheckIcon className="w-3 h-3 text-blue-500" />
      ) : (
        <ClockIcon className="w-3 h-3 text-gray-400" />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customer Chat</h1>
          <p className="text-gray-600">Manage conversations with your customers</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '700px' }}>
          <div className="flex h-full">
            {/* Chat List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Active Conversations</h2>
                <p className="text-sm text-gray-600">{chats.length} conversations</p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No active conversations</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        activeChat?.id === chat.id ? 'bg-orange-50 border-orange-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {chat.customer_name || 'Unknown Customer'}
                        </h3>
                        {chat.unread_count > 0 && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {chat.last_message || 'No messages yet'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {chat.last_message_at ? formatTime(chat.last_message_at) : ''}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          chat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {chat.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {activeChat.customer_name || 'Customer'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Booking: {activeChat.subject || 'General inquiry'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {availableAgents.length > 0 && (
                          <button
                            onClick={() => setAiAssistMode(!aiAssistMode)}
                            className={`p-2 rounded-lg ${
                              aiAssistMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            } hover:bg-blue-50`}
                            title="AI Assistant"
                          >
                            <SparklesIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Assist Mode */}
                  {aiAssistMode && (
                    <div className="p-4 bg-blue-50 border-b border-blue-200">
                      <div className="flex items-start space-x-3">
                        <ComputerDesktopIcon className="w-5 h-5 text-blue-500 mt-1" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            AI Assistant {selectedAgent ? `(${selectedAgent.name})` : ''}
                          </h4>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Ask AI to help with this conversation..."
                              className="flex-1 text-sm border border-blue-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleAIAssist()}
                            />
                            <button
                              onClick={handleAIAssist}
                              disabled={!aiPrompt.trim() || isLoading}
                              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">Start the conversation</p>
                        <p className="text-sm">Send a message to begin chatting with this customer</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_type === 'user' ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                              message.sender_type === 'user'
                                ? 'bg-gray-200 text-gray-900'
                                : message.sender_type === 'ai'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-orange-500 text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {getMessageIcon(message.sender_type)}
                              <span className="text-xs font-medium opacity-75">
                                {message.sender_name || 
                                  (message.sender_type === 'user' ? 'Customer' : 
                                   message.sender_type === 'ai' ? 'AI Assistant' : 'You')}
                              </span>
                              <span className="text-xs opacity-60">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                            
                            <p className="text-sm leading-relaxed">
                              {message.message_text}
                            </p>
                            
                            <div className="flex justify-end mt-1">
                              {getMessageStatusIcon(message)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <PaperAirplaneIcon className="w-4 h-4" />
                        )}
                        <span>Send</span>
                      </button>
                    </div>
                    
                    {selectedAgent && (
                      <div className="mt-2 text-xs text-gray-500">
                        AI Assistant ({selectedAgent.name}) is available to help with responses
                      </div>
                    )}
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-sm">Choose a customer conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeChatPage; 