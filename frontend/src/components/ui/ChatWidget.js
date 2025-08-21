import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  UserIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import moment from 'moment';

const ChatWidget = ({ 
  companyId, 
  isOpen, 
  onToggle, 
  position = 'bottom-right',
  aiEnabled = true,
  className = '' 
}) => {
  const { user, apiCall } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  // Initialize chat
  useEffect(() => {
    if (isOpen && user && companyId) {
      initializeChat();
      loadAvailableAgents();
    }
  }, [isOpen, user, companyId]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available AI agents
  const loadAvailableAgents = async () => {
    try {
      const response = await apiCall(`/api/ai/agents/company/${companyId}`);
      if (response.success) {
        setAvailableAgents(response.data.agents || []);
        
        // Auto-select customer support agent if available
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

  // Initialize or get existing chat
  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Try to get existing chat first
      const chatsResponse = await apiCall('/api/chat/user');
      const existingChat = chatsResponse.data?.find(chat => 
        chat.company_id === companyId && chat.status === 'active'
      );

      if (existingChat) {
        setCurrentChat(existingChat);
        loadChatMessages(existingChat.id);
      } else {
        // Create new chat
        await createNewChat();
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast.error('Не удалось подключиться к чату');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new chat
  const createNewChat = async () => {
    try {
      const response = await apiCall('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          ai_agent_key: selectedAgent?.key,
          initial_message: 'Здравствуйте! Как дела?'
        }),
      });

      if (response.success) {
        setCurrentChat(response.data);
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          sender_type: 'ai',
          sender_name: selectedAgent?.name || 'Ассистент',
          message_text: 'Здравствуйте! Я ваш виртуальный помощник. Чем могу помочь?',
          created_at: new Date().toISOString(),
          is_read: false
        }]);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  };

  // Load chat messages
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

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      sender_type: 'user',
      sender_name: user.name || 'Вы',
      message_text: messageText,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send message to backend
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: currentChat.id,
          sender_type: 'user',
          message_text: messageText
        }),
      });

      if (response.success) {
        // Update message with server response
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id ? { ...response.data, id: response.data.id } : msg
        ));

        // If AI is enabled, show typing indicator and wait for AI response
        if (selectedAgent) {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            // AI response will be handled by the backend automatically
            // We'll poll for new messages or use WebSocket in production
            pollForNewMessages();
          }, 1000 + Math.random() * 2000); // Simulate thinking time
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Не удалось отправить сообщение');
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for new messages (in production, use WebSocket)
  const pollForNewMessages = useCallback(async () => {
    if (!currentChat) return;

    try {
      const response = await apiCall(`/api/chat/${currentChat.id}/messages?limit=10`);
      if (response.success && response.data.messages) {
        const newMessages = response.data.messages;
        setMessages(prev => {
          const lastMessageTime = prev.length > 0 ? prev[prev.length - 1].created_at : null;
          const freshMessages = newMessages.filter(msg => 
            !lastMessageTime || new Date(msg.created_at) > new Date(lastMessageTime)
          );
          
          return freshMessages.length > 0 ? [...prev, ...freshMessages] : prev;
        });
      }
    } catch (error) {
      console.error('Failed to poll messages:', error);
    }
  }, [currentChat, apiCall]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentChat) return;

    // For now, just show a placeholder message
    // In production, you'd upload the file and send the URL
    const fileMessage = {
      id: Date.now(),
      sender_type: 'user',
      sender_name: user.name || 'Вы',
      message_text: `📎 ${file.name}`,
      created_at: new Date().toISOString(),
      is_read: false,
      message_data: {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      }
    };

    setMessages(prev => [...prev, fileMessage]);
    toast.success('Файл отправлен (демо)');
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    return moment(timestamp).format('HH:mm');
  };

  // Get message icon
  const getMessageIcon = (senderType) => {
    switch (senderType) {
      case 'ai':
        return <ComputerDesktopIcon className="w-4 h-4" />;
      case 'employee':
        return <UserIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  // Get message status icon
  const getMessageStatus = (message) => {
    if (message.sender_type === 'user') {
      return message.is_read ? (
        <CheckCircleIcon className="w-3 h-3 text-blue-500" />
      ) : (
        <CheckIcon className="w-3 h-3 text-gray-400" />
      );
    }
    return null;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed ${positionClasses[position]} z-50 bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-colors ${className}`}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 h-96 flex flex-col">
        {/* Header */}
        <div className="bg-primary-500 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="font-medium">Чат поддержки</h3>
            <p className="text-xs opacity-90">
              {isConnected ? (
                selectedAgent ? `${selectedAgent.name} • Онлайн` : 'Онлайн'
              ) : 'Подключение...'}
            </p>
          </div>
          <button
            onClick={onToggle}
            className="text-white hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.sender_type === 'user'
                      ? 'bg-primary-500 text-white'
                      : message.sender_type === 'ai'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.sender_type !== 'user' && (
                      <div className="flex items-center space-x-1 mb-1">
                        {getMessageIcon(message.sender_type)}
                        <span className="text-xs font-medium">
                          {message.sender_name}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap">
                      {message.message_text}
                    </p>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs opacity-75">
                        {formatMessageTime(message.created_at)}
                      </span>
                      {getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      {getMessageIcon('ai')}
                      <span className="text-xs font-medium">
                        {selectedAgent?.name || 'Ассистент'}
                      </span>
                    </div>
                    <div className="flex space-x-1 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Прикрепить файл"
            >
              <PaperClipIcon className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              disabled={isLoading || !isConnected}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
            />

            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isLoading || !isConnected}
              className="p-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Agent selector */}
          {availableAgents.length > 1 && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs text-gray-500">Помощник:</span>
              <select
                value={selectedAgent?.key || ''}
                onChange={(e) => {
                  const agent = availableAgents.find(a => a.key === e.target.value);
                  setSelectedAgent(agent);
                }}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {availableAgents.map((agent) => (
                  <option key={agent.key} value={agent.key}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWidget; 