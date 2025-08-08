import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';
import { ChatMessage, Booking } from '../../types';

const ChatScreen = () => {
  const { employee } = useAuth();
  const { canViewBookings, canUseAI } = usePermissions();
  const queryClient = useQueryClient();

  // State
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Fetch bookings for chat selection
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['chat-bookings', employee?.companyId],
    queryFn: () => ApiService.getBookings(employee!.companyId, { 
      status: 'confirmed,in_progress' 
    }),
    enabled: !!employee?.companyId && canViewBookings,
  });

  // Fetch chat messages for selected booking
  const { 
    data: messages, 
    isLoading: messagesLoading,
    refetch: refetchMessages 
  } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', selectedBooking],
    queryFn: () => ApiService.getChatMessages(selectedBooking!),
    enabled: !!selectedBooking,
    refetchInterval: 3000, // Poll every 3 seconds for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ message, type }: { message: string; type: 'text' | 'image' }) =>
      ApiService.sendChatMessage(selectedBooking!, message, type),
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to send message');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedBooking) return;
    
    sendMessageMutation.mutate({
      message: newMessage.trim(),
      type: 'text'
    });
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      // In a real app, you'd upload the image and get a URL
      const imageUrl = result.assets[0].uri;
      sendMessageMutation.mutate({
        message: imageUrl,
        type: 'image'
      });
    }
  };

  const handleAIAssist = () => {
    if (!canUseAI()) {
      Alert.alert('Permission Denied', 'You do not have permission to use AI assistance');
      return;
    }
    setShowAIModal(true);
  };

  const sendAIMessage = () => {
    if (!aiPrompt.trim()) return;
    
    // In a real implementation, this would call an AI service
    const aiResponse = `AI Assistant: Based on your request "${aiPrompt}", I recommend checking the booking details and following up with the customer about their specific needs. Would you like me to help you draft a professional response?`;
    
    sendMessageMutation.mutate({
      message: aiResponse,
      type: 'text'
    });
    
    setAiPrompt('');
    setShowAIModal(false);
  };

  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    const isEmployee = message.senderType === 'employee';
    const isAI = message.senderType === 'ai';
    
    return (
      <View style={[
        styles.messageContainer,
        isEmployee ? styles.employeeMessage : styles.customerMessage,
        isAI && styles.aiMessage
      ]}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>
            {message.senderName}
            {isAI && ' 🤖'}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
        {message.messageType === 'image' ? (
          <Image source={{ uri: message.message }} style={styles.messageImage} />
        ) : (
          <Text style={[
            styles.messageText,
            isEmployee ? styles.employeeMessageText : styles.customerMessageText,
            isAI && styles.aiMessageText
          ]}>
            {message.message}
          </Text>
        )}
        
        {!message.read && !isEmployee && (
          <View style={styles.unreadIndicator} />
        )}
      </View>
    );
  };

  const renderBookingItem = ({ item: booking }: { item: Booking }) => (
    <TouchableOpacity
      style={[
        styles.bookingItem,
        selectedBooking === booking.id && styles.selectedBookingItem
      ]}
      onPress={() => {
        setSelectedBooking(booking.id);
        setShowBookingModal(false);
      }}
    >
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
        <Text style={styles.bookingService}>{booking.serviceName}</Text>
        <Text style={styles.bookingDate}>
          {new Date(booking.startTime).toLocaleDateString()}
        </Text>
      </View>
      <View style={[
        styles.bookingStatus,
        { backgroundColor: booking.status === 'confirmed' ? '#007bff' : '#fd7e14' }
      ]}>
        <Text style={styles.bookingStatusText}>
          {booking.status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!canViewBookings) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed" size={64} color="#6c757d" />
        <Text style={styles.permissionText}>
          You don't have permission to access chat
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.bookingSelector}
          onPress={() => setShowBookingModal(true)}
        >
          <Text style={styles.headerTitle}>
            {selectedBooking ? 
              bookings?.find(b => b.id === selectedBooking)?.customerName || 'Select Booking'
              : 'Select Booking'
            }
          </Text>
          <Ionicons name="chevron-down" size={20} color="#ff4500" />
        </TouchableOpacity>
        
        {selectedBooking && (
          <View style={styles.headerActions}>
            {canUseAI() && (
              <TouchableOpacity style={styles.aiButton} onPress={handleAIAssist}>
                <Ionicons name="bulb" size={20} color="#ff4500" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.attachButton} onPress={handleImagePicker}>
              <Ionicons name="camera" size={20} color="#ff4500" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {selectedBooking ? (
        <>
          {/* Messages List */}
          <FlatList
            data={messages || []}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            inverted={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={64} color="#6c757d" />
                <Text style={styles.emptyChatText}>Start the conversation</Text>
                <Text style={styles.emptyChatSubtext}>
                  Send a message to begin chatting with the customer
                </Text>
              </View>
            }
          />

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() ? 'white' : '#6c757d'} 
              />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.noBookingSelected}>
          <Ionicons name="chatbubbles-outline" size={64} color="#6c757d" />
          <Text style={styles.noBookingText}>Select a booking to start chatting</Text>
          <Text style={styles.noBookingSubtext}>
            Choose from your active bookings to communicate with customers
          </Text>
        </View>
      )}

      {/* Booking Selection Modal */}
      <Modal visible={showBookingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Booking</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={bookings || []}
              keyExtractor={(item) => item.id}
              renderItem={renderBookingItem}
              style={styles.bookingsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBookings}>
                  <Text style={styles.emptyBookingsText}>No active bookings</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* AI Assistance Modal */}
      <Modal visible={showAIModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Assistant 🤖</Text>
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.aiModalContent}>
              <Text style={styles.aiDescription}>
                Describe what you need help with, and I'll assist you with the customer conversation.
              </Text>
              
              <TextInput
                style={styles.aiInput}
                placeholder="e.g., 'Help me explain our grooming process' or 'Draft a follow-up message'"
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.aiActions}>
                <TouchableOpacity
                  style={styles.aiCancelButton}
                  onPress={() => setShowAIModal(false)}
                >
                  <Text style={styles.aiCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiSendButton}
                  onPress={sendAIMessage}
                  disabled={!aiPrompt.trim()}
                >
                  <Text style={styles.aiSendText}>Get AI Help</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  permissionText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  bookingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButton: {
    padding: 8,
    marginRight: 8,
  },
  attachButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  employeeMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff4500',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  customerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiMessage: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  employeeMessageText: {
    color: 'white',
  },
  customerMessageText: {
    color: '#212529',
  },
  aiMessageText: {
    color: '#1565c0',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 4,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#ff4500',
    borderRadius: 4,
    position: 'absolute',
    top: -4,
    right: -4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#ff4500',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  noBookingSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noBookingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
    textAlign: 'center',
  },
  noBookingSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  bookingsList: {
    flex: 1,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  selectedBookingItem: {
    backgroundColor: '#fff3e0',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  bookingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookingStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  emptyBookings: {
    padding: 32,
    alignItems: 'center',
  },
  emptyBookingsText: {
    fontSize: 16,
    color: '#6c757d',
  },
  aiModalContent: {
    padding: 20,
  },
  aiDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 22,
  },
  aiInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  aiActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  aiCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  aiSendButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#ff4500',
    alignItems: 'center',
  },
  aiSendText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ChatScreen; 