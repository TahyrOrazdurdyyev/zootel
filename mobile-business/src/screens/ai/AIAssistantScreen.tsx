import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCompanyLimits } from '../../hooks/useCompanyLimits';
import apiService from '../../services/apiService';

interface AIAssistantRoute {
  params: {
    agentKey?: string;
  };
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AI_AGENTS = {
  booking_assistant: {
    name: 'Booking Assistant',
    description: 'Help with scheduling and booking management',
    icon: 'calendar',
    color: '#3B82F6',
  },
  customer_support: {
    name: 'Customer Support AI',
    description: 'Automated customer service responses',
    icon: 'headset',
    color: '#10B981',
  },
  analytics_advisor: {
    name: 'Analytics Advisor',
    description: 'Business insights and analytics',
    icon: 'analytics',
    color: '#8B5CF6',
  },
  marketing_assistant: {
    name: 'Marketing Assistant',
    description: 'Marketing campaigns and content creation',
    icon: 'megaphone',
    color: '#F59E0B',
  },
};

const AIAssistantScreen = () => {
  const route = useRoute() as AIAssistantRoute;
  const navigation = useNavigation();
  const { employee } = useAuth();
  const { hasAIAgent } = useCompanyLimits();
  
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const agentKey = route.params?.agentKey || 'booking_assistant';
  const agent = AI_AGENTS[agentKey as keyof typeof AI_AGENTS];

  useEffect(() => {
    // Check if user has access to this AI agent
    if (!hasAIAgent(agentKey)) {
      Alert.alert(
        'AI Agent Not Available',
        `The ${agent.name} is not included in your plan. Contact support to add this agent.`,
        [
          { text: 'Go Back', onPress: () => navigation.goBack() },
          { text: 'Upgrade Plan', onPress: () => {} },
        ]
      );
      return;
    }

    // Initialize with welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your ${agent.name}. ${agent.description}. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  }, [agentKey, agent, hasAIAgent, navigation]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call AI service
      const response = await apiService.sendAIMessage(employee!.companyId, {
        agentKey,
        message: userMessage.content,
        conversationHistory: messages,
      });

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Message Error:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: '1',
                role: 'assistant',
                content: `Hello! I'm your ${agent.name}. ${agent.description}. How can I help you today?`,
                timestamp: new Date(),
              },
            ]);
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!agent) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color="#F59E0B" />
        <Text style={styles.errorText}>AI Agent Not Found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: agent.color }]}>
        <TouchableOpacity 
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Ionicons name={agent.icon as any} size={24} color="#FFFFFF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{agent.name}</Text>
            <Text style={styles.headerSubtitle}>{agent.description}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearConversation}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text style={[
              styles.messageText,
              message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
            ]}>
              {message.content}
            </Text>
            <Text style={[
              styles.messageTime,
              message.role === 'user' ? styles.userMessageTime : styles.assistantMessageTime,
            ]}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={agent.color} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Ask ${agent.name}...`}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: agent.color },
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backIcon: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'right',
  },
  assistantMessageTime: {
    color: '#6B7280',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AIAssistantScreen; 