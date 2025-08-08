import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';
import { Booking, BookingStatus } from '../../types';

interface BookingDetailScreenProps {
  route: {
    params: {
      bookingId: string;
    };
  };
  navigation: any;
}

const BookingDetailScreen: React.FC<BookingDetailScreenProps> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { employee } = useAuth();
  const { canManageBookings } = usePermissions();
  const queryClient = useQueryClient();

  // State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus>('confirmed');
  const [notes, setNotes] = useState('');

  // Fetch booking details
  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ['booking-detail', bookingId],
    queryFn: () => ApiService.getBooking(bookingId),
    enabled: !!bookingId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => ApiService.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-detail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowStatusModal(false);
      Alert.alert('Success', 'Booking status updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update booking status');
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: (notesText: string) => ApiService.addBookingNotes(bookingId, notesText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-detail', bookingId] });
      setShowNotesModal(false);
      setNotes('');
      Alert.alert('Success', 'Notes updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update notes');
    },
  });

  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#007bff',
      in_progress: '#fd7e14',
      completed: '#28a745',
      cancelled: '#dc3545',
      no_show: '#6c757d',
    };
    return colors[status] || '#6c757d';
  };

  const getStatusIcon = (status: BookingStatus) => {
    const icons = {
      pending: 'time-outline',
      confirmed: 'checkmark-circle-outline',
      in_progress: 'play-circle-outline',
      completed: 'checkmark-done-outline',
      cancelled: 'close-circle-outline',
      no_show: 'remove-circle-outline',
    };
    return icons[status] || 'help-circle-outline';
  };

  const handleStatusUpdate = () => {
    if (!canManageBookings()) {
      Alert.alert('Permission Denied', 'You do not have permission to update bookings');
      return;
    }
    setNewStatus(booking?.status || 'confirmed');
    setShowStatusModal(true);
  };

  const handleNotesUpdate = () => {
    setNotes(booking?.notes || '');
    setShowNotesModal(true);
  };

  const handleChatNavigation = () => {
    navigation.navigate('Chat', { bookingId: booking?.id });
  };

  const confirmStatusUpdate = () => {
    updateStatusMutation.mutate(newStatus);
  };

  const saveNotes = () => {
    updateNotesMutation.mutate(notes);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#dc3545" />
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <TouchableOpacity onPress={handleChatNavigation}>
          <Ionicons name="chatbubbles" size={24} color="#ff4500" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Ionicons name={getStatusIcon(booking.status) as any} size={20} color="white" />
              <Text style={styles.statusText}>{booking.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
            {canManageBookings() && (
              <TouchableOpacity style={styles.editButton} onPress={handleStatusUpdate}>
                <Ionicons name="create-outline" size={20} color="#ff4500" />
                <Text style={styles.editButtonText}>Update</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#6c757d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{booking.customerName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#6c757d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{booking.customerPhone}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#6c757d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{booking.customerEmail}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pet Information */}
        {booking.petInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pet Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="paw" size={20} color="#ff4500" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pet Name</Text>
                  <Text style={styles.infoValue}>{booking.petInfo.name}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="fish" size={20} color="#6c757d" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Type & Breed</Text>
                  <Text style={styles.infoValue}>
                    {booking.petInfo.type}
                    {booking.petInfo.breed && ` - ${booking.petInfo.breed}`}
                  </Text>
                </View>
              </View>
              {booking.petInfo.age && (
                <View style={styles.infoRow}>
                  <Ionicons name="time" size={20} color="#6c757d" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>{booking.petInfo.age} years</Text>
                  </View>
                </View>
              )}
              {booking.petInfo.weight && (
                <View style={styles.infoRow}>
                  <Ionicons name="fitness" size={20} color="#6c757d" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>{booking.petInfo.weight} kg</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="cut" size={20} color="#6c757d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{booking.serviceName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#6c757d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(booking.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#6c757d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>
                  {new Date(booking.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - {new Date(booking.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#6c757d" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Assigned to</Text>
                <Text style={styles.infoValue}>{booking.employeeName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cash" size={20} color="#28a745" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={[styles.infoValue, styles.priceValue]}>${booking.price.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleNotesUpdate}>
              <Ionicons name="create-outline" size={20} color="#ff4500" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notesCard}>
            {booking.notes ? (
              <Text style={styles.notesText}>{booking.notes}</Text>
            ) : (
              <Text style={styles.noNotesText}>No notes added yet</Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleChatNavigation}>
              <Ionicons name="chatbubbles" size={24} color="#007bff" />
              <Text style={styles.actionText}>Open Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={24} color="#28a745" />
              <Text style={styles.actionText}>Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="mail" size={24} color="#fd7e14" />
              <Text style={styles.actionText}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Status Update Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as BookingStatus[]).map(
                (status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newStatus === status && styles.statusOptionActive,
                    ]}
                    onPress={() => setNewStatus(status)}
                  >
                    <Ionicons
                      name={getStatusIcon(status) as any}
                      size={20}
                      color={newStatus === status ? 'white' : getStatusColor(status)}
                    />
                    <Text
                      style={[
                        styles.statusOptionText,
                        newStatus === status && styles.statusOptionTextActive,
                      ]}
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                )
              )}
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowStatusModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmStatusUpdate}
                  disabled={updateStatusMutation.isPending}
                >
                  <Text style={styles.confirmButtonText}>
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal visible={showNotesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Notes</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes about this booking..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowNotesModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={saveNotes}
                  disabled={updateNotesMutation.isPending}
                >
                  <Text style={styles.confirmButtonText}>
                    {updateNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                  </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#ff4500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff3e0',
  },
  editButtonText: {
    color: '#ff4500',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  priceValue: {
    color: '#28a745',
    fontWeight: '600',
  },
  notesCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 22,
  },
  noNotesText: {
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  actionText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontWeight: '500',
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
  modalContent: {
    padding: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusOptionActive: {
    backgroundColor: '#ff4500',
    borderColor: '#ff4500',
  },
  statusOptionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
    color: '#212529',
  },
  statusOptionTextActive: {
    color: 'white',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#ff4500',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default BookingDetailScreen; 