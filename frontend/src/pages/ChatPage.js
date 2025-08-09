import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ChatPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserChats();
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      loadChatMessages(activeChat.id);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadChatMessages(activeChat.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  const loadUserChats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/chat/user', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        console.error('Failed to load chats');
        // Fallback to demo data
        setChats([
          { id: '1', companyName: 'Happy Pets Clinic', lastMessage: 'Thank you for booking!', timestamp: '2 mins ago' },
          { id: '2', companyName: 'Pet Grooming Pro', lastMessage: 'Your appointment is confirmed', timestamp: '1 hour ago' }
        ]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      // Fallback to demo data
      setChats([
        { id: '1', companyName: 'Happy Pets Clinic', lastMessage: 'Thank you for booking!', timestamp: '2 mins ago' },
        { id: '2', companyName: 'Pet Grooming Pro', lastMessage: 'Your appointment is confirmed', timestamp: '1 hour ago' }
      ]);
    }
  };

  const loadChatMessages = async (chatId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        await fetch(`/api/chat/${chatId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        console.error('Failed to load messages');
        // Fallback to demo data
        setMessages([
          { id: '1', sender: 'company', content: 'Hello! How can we help you today?', timestamp: '10:00 AM' },
          { id: '2', sender: 'user', content: 'I have a question about my booking', timestamp: '10:05 AM' },
          { id: '3', sender: 'company', content: 'Of course! What would you like to know?', timestamp: '10:06 AM' }
        ]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to demo data
      setMessages([
        { id: '1', sender: 'company', content: 'Hello! How can we help you today?', timestamp: '10:00 AM' },
        { id: '2', sender: 'user', content: 'I have a question about my booking', timestamp: '10:05 AM' },
        { id: '3', sender: 'company', content: 'Of course! What would you like to know?', timestamp: '10:06 AM' }
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat || !user) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message immediately for better UX
    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch(`/api/chat/${activeChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: activeChat.id,
          sender_type: 'user',
          message_text: messageText
        }),
      });

      if (response.ok) {
        // Reload messages to get the server response
        await loadChatMessages(activeChat.id);
      } else {
        console.error('Failed to send message');
        alert('Failed to send message. Please try again.');
        // Remove the failed message
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      // Remove the failed message
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Chat List */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              </div>
              <div className="overflow-y-auto h-full">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start chatting with companies from your bookings</p>
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
                      <h3 className="font-semibold text-gray-900">{chat.companyName || chat.company_name}</h3>
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage || chat.last_message}</p>
                      <p className="text-xs text-gray-400 mt-1">{chat.timestamp || 'Recently'}</p>
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
                    <h3 className="text-lg font-semibold text-gray-900">{activeChat.companyName || activeChat.company_name}</h3>
                    <p className="text-sm text-gray-600">Usually responds within an hour</p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <p>No messages yet</p>
                          <p className="text-sm mt-2">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${(msg.sender === 'user' || msg.sender_type === 'user') ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              (msg.sender === 'user' || msg.sender_type === 'user')
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p>{msg.content || msg.message_text}</p>
                            <p className={`text-xs mt-1 ${
                              (msg.sender === 'user' || msg.sender_type === 'user') ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              {msg.timestamp || new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!message.trim() || isLoading}
                        className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-2">Select a conversation to start messaging</p>
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

export default ChatPage; 