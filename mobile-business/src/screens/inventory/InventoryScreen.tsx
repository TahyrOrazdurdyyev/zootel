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
  Image,
  Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';
import { InventoryItem } from '../../types';

const InventoryScreen = () => {
  const { employee } = useAuth();
  const { canManageInventory } = usePermissions();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    lowStockThreshold: '',
    categoryName: '',
    isActive: true,
  });

  // Fetch inventory items
  const {
    data: items,
    isLoading,
    refetch,
  } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', employee?.companyId],
    queryFn: () => ApiService.getInventoryItems(employee!.companyId),
    enabled: !!employee?.companyId && canManageInventory,
  });

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<InventoryItem, 'id'>) =>
      ApiService.createInventoryItem(employee!.companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Item created successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      ApiService.updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Item updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update item');
    },
  });

  // Filter items
  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLowStock = !showLowStock || item.stock <= item.lowStockThreshold;
    
    return matchesSearch && matchesLowStock;
  }) || [];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      price: '',
      cost: '',
      stock: '',
      lowStockThreshold: '',
      categoryName: '',
      isActive: true,
    });
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku,
      price: item.price.toString(),
      cost: item.cost.toString(),
      stock: item.stock.toString(),
      lowStockThreshold: item.lowStockThreshold.toString(),
      categoryName: item.categoryName,
      isActive: item.isActive,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim() || !formData.sku.trim() || !formData.price || !formData.stock) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const itemData: Omit<InventoryItem, 'id'> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      sku: formData.sku.trim(),
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock),
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
      categoryId: '1', // TODO: Get from category selection
      categoryName: formData.categoryName.trim() || 'General',
      isActive: formData.isActive,
      images: [],
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { text: 'Out of Stock', color: '#dc3545' };
    if (item.stock <= item.lowStockThreshold) return { text: 'Low Stock', color: '#fd7e14' };
    return { text: 'In Stock', color: '#28a745' };
  };

  const renderInventoryCard = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    const profit = item.price - item.cost;
    const profitMargin = item.cost > 0 ? ((profit / item.cost) * 100).toFixed(1) : '0.0';

    return (
      <TouchableOpacity
        style={[styles.itemCard, !item.isActive && styles.itemCardInactive]}
        onPress={() => openEditModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
            <Text style={styles.itemCategory}>{item.categoryName}</Text>
          </View>
          <View style={styles.itemActions}>
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.color }]}>
              <Text style={styles.stockText}>{stockStatus.text}</Text>
            </View>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>INACTIVE</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Stock</Text>
              <Text style={styles.detailValue}>{item.stock} units</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>${item.price.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cost</Text>
              <Text style={styles.detailValue}>${item.cost.toFixed(2)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Margin</Text>
              <Text style={[styles.detailValue, { color: profit > 0 ? '#28a745' : '#dc3545' }]}>
                {profitMargin}%
              </Text>
            </View>
          </View>
        </View>

        {item.description && (
          <View style={styles.itemDescription}>
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!canManageInventory) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed" size={64} color="#6c757d" />
        <Text style={styles.permissionText}>
          You don't have permission to manage inventory
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
      <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show low stock only</Text>
          <Switch
            value={showLowStock}
            onValueChange={setShowLowStock}
            trackColor={{ false: '#e9ecef', true: '#ff4500' }}
            thumbColor={showLowStock ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Stats Summary */}
      {items && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {items.filter(item => item.stock <= item.lowStockThreshold).length}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {items.filter(item => item.stock === 0).length}
            </Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ${items.reduce((sum, item) => sum + (item.price * item.stock), 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
        </View>
      )}

      {/* Inventory List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderInventoryCard}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyText}>No inventory items found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first product to get started'}
            </Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Product Name *"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="SKU *"
                value={formData.sku}
                onChangeText={(text) => setFormData(prev => ({ ...prev, sku: text }))}
              />

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Price *"
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Cost"
                  value={formData.cost}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cost: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Stock *"
                  value={formData.stock}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text }))}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Low Stock Alert"
                  value={formData.lowStockThreshold}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, lowStockThreshold: text }))}
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Category"
                value={formData.categoryName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, categoryName: text }))}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                  trackColor={{ false: '#e9ecef', true: '#ff4500' }}
                  thumbColor={formData.isActive ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Text style={styles.saveButtonText}>
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
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
    backgroundColor: 'white',
    marginHorizontal: 16,
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  itemCard: {
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
  itemCardInactive: {
    opacity: 0.6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 14,
    color: '#ff4500',
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inactiveText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  itemDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  itemDescription: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
  },
  descriptionText: {
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
    maxHeight: '80%',
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
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
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
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#ff4500',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default InventoryScreen; 