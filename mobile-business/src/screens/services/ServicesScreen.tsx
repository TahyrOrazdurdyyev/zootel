import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  FlatList,
  Switch,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import apiService from '../../services/apiService';
import { Service } from '../../types';

const ServicesScreen = ({ navigation }: any) => {
  const { employee } = useAuth();
  const { canManageServices } = usePermissions();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showInactiveServices, setShowInactiveServices] = useState(false);

  const categories = [
    'All Categories',
    'Veterinary Care',
    'Pet Grooming',
    'Pet Training',
    'Pet Boarding',
    'Pet Sitting',
    'Dog Walking',
    'Pet Products',
    'Emergency Care'
  ];

  // Fetch services
  const { 
    data: services, 
    isLoading, 
    refetch 
  } = useQuery<Service[]>({
    queryKey: ['company-services', employee?.companyId],
    queryFn: () => apiService.getCompanyServices(employee!.companyId),
    enabled: !!employee?.companyId,
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: (serviceId: string) => apiService.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services'] });
      Alert.alert('Success', 'Service deleted successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to delete service');
    },
  });

  // Toggle service status mutation
  const toggleServiceMutation = useMutation({
    mutationFn: ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) => 
      apiService.updateService(serviceId, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update service status');
    },
  });

  const onRefresh = () => {
    refetch();
  };

  const filteredServices = services?.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All Categories' || 
                           service.category === selectedCategory;
    const matchesStatus = showInactiveServices || service.isActive;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const handleCreateService = () => {
    if (!canManageServices()) {
      Alert.alert('Access Denied', 'You don\'t have permission to create services');
      return;
    }
    navigation.navigate('ServiceForm', { mode: 'create' });
  };

  const handleEditService = (service: Service) => {
    if (!canManageServices()) {
      Alert.alert('Access Denied', 'You don\'t have permission to edit services');
      return;
    }
    navigation.navigate('ServiceForm', { mode: 'edit', service });
  };

  const handleDeleteService = (service: Service) => {
    if (!canManageServices()) {
      Alert.alert('Access Denied', 'You don\'t have permission to delete services');
      return;
    }

    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteServiceMutation.mutate(service.id)
        }
      ]
    );
  };

  const handleToggleStatus = (service: Service) => {
    if (!canManageServices()) {
      Alert.alert('Access Denied', 'You don\'t have permission to modify services');
      return;
    }

    toggleServiceMutation.mutate({
      serviceId: service.id,
      isActive: !service.isActive
    });
  };

  const renderServiceCard = ({ item: service }: { item: Service }) => (
    <View style={[styles.serviceCard, !service.isActive && styles.inactiveCard]}>
      {/* Service Image */}
      {service.imageUrl && (
        <Image 
          source={{ uri: service.imageUrl }} 
          style={styles.serviceImage}
          resizeMode="cover"
        />
      )}
      
      {/* Service Header */}
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceCategory}>{service.category}</Text>
        </View>
        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditService(service)}
          >
            <Ionicons name="pencil" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteService(service)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.serviceDetails}>
        {service.description && (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>
        )}
        
        <View style={styles.serviceMetrics}>
          <View style={styles.metricItem}>
            <Ionicons name="cash" size={16} color="#10B981" />
            <Text style={styles.metricText}>${service.price}</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="time" size={16} color="#8B5CF6" />
            <Text style={styles.metricText}>{service.duration} min</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons 
              name={service.isActive ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={service.isActive ? "#10B981" : "#EF4444"} 
            />
            <Text style={[styles.metricText, { color: service.isActive ? "#10B981" : "#EF4444" }]}>
              {service.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Toggle */}
      <View style={styles.serviceFooter}>
        <Text style={styles.toggleLabel}>Service Active</Text>
        <Switch
          value={service.isActive}
          onValueChange={() => handleToggleStatus(service)}
          trackColor={{ false: '#F3F4F6', true: '#DBEAFE' }}
          thumbColor={service.isActive ? '#3B82F6' : '#9CA3AF'}
        />
      </View>
    </View>
  );

  if (!canManageServices()) {
    return (
      <View style={styles.noAccess}>
        <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
        <Text style={styles.noAccessText}>Access Denied</Text>
        <Text style={styles.noAccessSubtext}>
          You don't have permission to manage services
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Services Management</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateService}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>New Service</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category === 'All Categories' ? '' : category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Show Inactive Toggle */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show Inactive Services</Text>
          <Switch
            value={showInactiveServices}
            onValueChange={setShowInactiveServices}
            trackColor={{ false: '#F3F4F6', true: '#DBEAFE' }}
            thumbColor={showInactiveServices ? '#3B82F6' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceCard}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.servicesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No Services Found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory ? 
                'Try adjusting your filters' : 
                'Create your first service to get started'
              }
            </Text>
            {!searchQuery && !selectedCategory && (
              <TouchableOpacity 
                style={styles.emptyAction}
                onPress={handleCreateService}
              >
                <Text style={styles.emptyActionText}>Create Service</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  servicesList: {
    padding: 20,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  inactiveCard: {
    opacity: 0.6,
  },
  serviceImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  serviceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  serviceDetails: {
    marginBottom: 12,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 4,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAction: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noAccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  noAccessText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ServicesScreen; 