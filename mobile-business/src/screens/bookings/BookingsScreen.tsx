import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';
import { Booking, BookingStatus } from '../../types';

const BookingsScreen = () => {
  const { employee } = useAuth();
  const { canViewBookings, canManageBookings, hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  // State
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>('confirmed');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch bookings
  const {
    data: bookings,
    isLoading,
    refetch,
  } = useQuery<Booking[]>({
    queryKey: ['bookings', employee?.companyId, selectedFilter],
    queryFn: () => {
      const filters: any = {};
      if (selectedFilter !== 'all') filters.status = selectedFilter;
      if (!hasPermission('view_all_bookings')) {
        filters.employeeId = employee?.id;
      }
      return ApiService.getBookings(employee!.companyId, filters);
    },
    enabled: !!employee?.companyId && canViewBookings,
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      ApiService.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setModalVisible(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update booking status');
    },
  });

  // Filter bookings based on search
  const filteredBookings = bookings?.filter(booking =>
    booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

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

  const handleStatusUpdate = (booking: Booking) => {
    if (!canManageBookings()) {
      Alert.alert('Permission Denied', 'You do not have permission to update bookings');
      return;
    }
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setModalVisible(true);
  };

  const confirmStatusUpdate = () => {
    if (selectedBooking) {
      updateStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: newStatus,
      });
    }
  };

  const renderBookingCard = ({ item: booking }: { item: Booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => handleStatusUpdate(booking)}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <Text style={styles.serviceName}>{booking.serviceName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Ionicons
            name={getStatusIcon(booking.status) as any}
            size={16}
            color="white"
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6c757d" />
          <Text style={styles.detailText}>
            {new Date(booking.startTime).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6c757d" />
          <Text style={styles.detailText}>
            {new Date(booking.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })} - {new Date(booking.endTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#6c757d" />
          <Text style={styles.detailText}>{booking.employeeName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#6c757d" />
          <Text style={styles.detailText}>${booking.price.toFixed(2)}</Text>
        </View>
      </View>

      {booking.petInfo && (
        <View style={styles.petInfo}>
          <Ionicons name="paw-outline" size={16} color="#ff4500" />
          <Text style={styles.petText}>
            {booking.petInfo.name} ({booking.petInfo.type})
          </Text>
        </View>
      )}

      {booking.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2}>
            {booking.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={statusOptions}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === item.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (!canViewBookings) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed" size={64} color="#6c757d" />
        <Text style={styles.permissionText}>
          You don't have permission to view bookings
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Ionicons name="search" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  selectedFilter === status && styles.filterChipActive
                ]}
                onPress={() => setSelectedFilter(status)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === status && styles.filterChipTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'New bookings will appear here'}
            </Text>
          </View>
        }
      />

      {/* Status Update Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Booking Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <View style={styles.modalContent}>
                <Text style={styles.modalSubtitle}>
                  {selectedBooking.customerName} - {selectedBooking.serviceName}
                </Text>

                <View style={styles.statusOptions}>
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
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmStatusUpdate}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Text style={styles.confirmButtonText}>
                      {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#ff4500',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#212529',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#ff4500',
    borderColor: '#ff4500',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    color: '#6c757d',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  petText: {
    fontSize: 14,
    color: '#ff4500',
    marginLeft: 8,
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
  },
  emptySubtext: {
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
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  modalSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
  },
  statusOptions: {
    marginBottom: 24,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginRight: 10,
  },
  searchButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
});

export default BookingsScreen; 