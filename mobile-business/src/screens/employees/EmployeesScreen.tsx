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
  Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';
import { Employee, Permission, EmployeeRole } from '../../types';

const EmployeesScreen = () => {
  const { employee } = useAuth();
  const { canManageEmployees } = usePermissions();
  const queryClient = useQueryClient();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'employee' as EmployeeRole,
    permissions: [] as Permission[],
    active: true,
  });

  // Available permissions
  const availablePermissions: { permission: Permission; label: string; description: string }[] = [
    { permission: 'view_own_bookings', label: 'View Own Bookings', description: 'Can view their assigned bookings' },
    { permission: 'view_all_bookings', label: 'View All Bookings', description: 'Can view all company bookings' },
    { permission: 'start_booking', label: 'Start Bookings', description: 'Can mark bookings as started' },
    { permission: 'complete_booking', label: 'Complete Bookings', description: 'Can mark bookings as completed' },
    { permission: 'cancel_booking', label: 'Cancel Bookings', description: 'Can cancel bookings' },
    { permission: 'send_notifications', label: 'Send Notifications', description: 'Can send notifications to customers' },
    { permission: 'manage_inventory', label: 'Manage Inventory', description: 'Can manage products and stock' },
    { permission: 'view_analytics', label: 'View Analytics', description: 'Can access analytics and reports' },
    { permission: 'use_ai_agent', label: 'Use AI Assistant', description: 'Can use AI assistance features' },
    { permission: 'manage_employees', label: 'Manage Employees', description: 'Can manage other employees' },
    { permission: 'manage_settings', label: 'Manage Settings', description: 'Can modify company settings' },
  ];

  // Fetch employees
  const {
    data: employees,
    isLoading,
    refetch,
  } = useQuery<Employee[]>({
    queryKey: ['employees', employee?.companyId],
    queryFn: () => ApiService.getEmployees(employee!.companyId),
    enabled: !!employee?.companyId && canManageEmployees,
  });

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) =>
      ApiService.createEmployee(employee!.companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Employee created successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create employee');
    },
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      ApiService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Employee updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update employee');
    },
  });

  // Deactivate employee mutation
  const deactivateMutation = useMutation({
    mutationFn: (employeeId: string) => ApiService.deactivateEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      Alert.alert('Success', 'Employee deactivated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to deactivate employee');
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      permissions: [],
      active: true,
    });
    setEditingEmployee(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      username: emp.username,
      email: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      role: emp.role,
      permissions: emp.permissions,
      active: emp.active,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.username.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const employeeData = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      companyId: employee!.companyId,
      role: formData.role,
      permissions: formData.permissions,
      active: formData.active,
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: employeeData });
    } else {
      createMutation.mutate(employeeData);
    }
  };

  const handleDeactivate = (emp: Employee) => {
    Alert.alert(
      'Deactivate Employee',
      `Are you sure you want to deactivate ${emp.firstName} ${emp.lastName}? They will not be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => deactivateMutation.mutate(emp.id) },
      ]
    );
  };

  const togglePermission = (permission: Permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getRoleColor = (role: EmployeeRole) => {
    const colors = {
      admin: '#dc3545',
      manager: '#fd7e14',
      employee: '#007bff',
      viewer: '#6c757d',
    };
    return colors[role] || '#6c757d';
  };

  const getRolePermissionCount = (emp: Employee) => {
    if (emp.role === 'admin' || emp.role === 'manager') {
      return 'All permissions';
    }
    return `${emp.permissions.length} permissions`;
  };

  const renderEmployeeCard = ({ item: emp }: { item: Employee }) => (
    <TouchableOpacity
      style={[styles.employeeCard, !emp.active && styles.employeeCardInactive]}
      onPress={() => openEditModal(emp)}
      activeOpacity={0.7}
    >
      <View style={styles.employeeHeader}>
        <View style={styles.employeeAvatar}>
          <Text style={styles.avatarText}>
            {emp.firstName[0]}{emp.lastName[0]}
          </Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{emp.firstName} {emp.lastName}</Text>
          <Text style={styles.employeeEmail}>{emp.email}</Text>
          <Text style={styles.employeeUsername}>@{emp.username}</Text>
        </View>
        <View style={styles.employeeActions}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(emp.role) }]}>
            <Text style={styles.roleText}>{emp.role.toUpperCase()}</Text>
          </View>
          {!emp.active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>INACTIVE</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.employeeDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="shield-checkmark" size={16} color="#6c757d" />
          <Text style={styles.detailText}>{getRolePermissionCount(emp)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={16} color="#6c757d" />
          <Text style={styles.detailText}>
            Joined {new Date(emp.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.employeeFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            openEditModal(emp);
          }}
        >
          <Ionicons name="create-outline" size={16} color="#007bff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        {emp.active && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerAction]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeactivate(emp);
            }}
          >
            <Ionicons name="ban-outline" size={16} color="#dc3545" />
            <Text style={[styles.actionText, styles.dangerText]}>Deactivate</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!canManageEmployees) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed" size={64} color="#6c757d" />
        <Text style={styles.permissionText}>
          You don't have permission to manage employees
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {employees && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{employees.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{employees.filter(e => e.active).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{employees.filter(e => e.role === 'admin').length}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{employees.filter(e => e.role === 'manager').length}</Text>
            <Text style={styles.statLabel}>Managers</Text>
          </View>
        </View>
      )}

      {/* Employees List */}
      <FlatList
        data={employees || []}
        keyExtractor={(item) => item.id}
        renderItem={renderEmployeeCard}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyText}>No employees found</Text>
            <Text style={styles.emptySubtext}>Add your first employee to get started</Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="First Name *"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Username *"
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                autoCapitalize="none"
              />

              {/* Role Selection */}
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleContainer}>
                {(['admin', 'manager', 'employee', 'viewer'] as EmployeeRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      formData.role === role && styles.roleOptionActive,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, role }))}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === role && styles.roleOptionTextActive,
                      ]}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Permissions */}
              {formData.role !== 'admin' && formData.role !== 'manager' && (
                <View style={styles.permissionsSection}>
                  <View style={styles.permissionsHeader}>
                    <Text style={styles.fieldLabel}>Permissions</Text>
                    <TouchableOpacity
                      style={styles.managePermissionsButton}
                      onPress={() => setShowPermissionsModal(true)}
                    >
                      <Text style={styles.managePermissionsText}>
                        Manage ({formData.permissions.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Active</Text>
                <Switch
                  value={formData.active}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, active: value }))}
                  trackColor={{ false: '#e9ecef', true: '#ff4500' }}
                  thumbColor={formData.active ? '#fff' : '#f4f3f4'}
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

      {/* Permissions Modal */}
      <Modal visible={showPermissionsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Permissions</Text>
              <TouchableOpacity onPress={() => setShowPermissionsModal(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <View style={styles.permissionsModalContent}>
              {availablePermissions.map((perm) => (
                <TouchableOpacity
                  key={perm.permission}
                  style={styles.permissionItem}
                  onPress={() => togglePermission(perm.permission)}
                >
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionLabel}>{perm.label}</Text>
                    <Text style={styles.permissionDescription}>{perm.description}</Text>
                  </View>
                  <Switch
                    value={formData.permissions.includes(perm.permission)}
                    onValueChange={() => togglePermission(perm.permission)}
                    trackColor={{ false: '#e9ecef', true: '#ff4500' }}
                    thumbColor={formData.permissions.includes(perm.permission) ? '#fff' : '#f4f3f4'}
                  />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.permissionsDoneButton}
                onPress={() => setShowPermissionsModal(false)}
              >
                <Text style={styles.permissionsDoneText}>Done</Text>
              </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  employeeCard: {
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
  employeeCardInactive: {
    opacity: 0.6,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 1,
  },
  employeeUsername: {
    fontSize: 12,
    color: '#6c757d',
  },
  employeeActions: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 10,
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
    fontSize: 9,
    color: 'white',
    fontWeight: '600',
  },
  employeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  employeeFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  dangerAction: {
    backgroundColor: '#fff5f5',
  },
  actionText: {
    fontSize: 12,
    color: '#007bff',
    marginLeft: 4,
    fontWeight: '500',
  },
  dangerText: {
    color: '#dc3545',
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
    maxHeight: '85%',
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 8,
    marginBottom: 8,
  },
  roleOptionActive: {
    backgroundColor: '#ff4500',
    borderColor: '#ff4500',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  roleOptionTextActive: {
    color: 'white',
  },
  permissionsSection: {
    marginBottom: 16,
  },
  permissionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  managePermissionsButton: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  managePermissionsText: {
    color: '#ff4500',
    fontSize: 14,
    fontWeight: '500',
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
  permissionsModalContent: {
    padding: 20,
    maxHeight: 500,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  permissionsDoneButton: {
    backgroundColor: '#ff4500',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  permissionsDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default EmployeesScreen; 