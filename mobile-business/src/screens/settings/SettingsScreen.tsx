import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';
import { Company } from '../../types';

const SettingsScreen = () => {
  const { employee, logout } = useAuth();
  const { canManageSettings } = usePermissions();
  const queryClient = useQueryClient();

  // State
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  });

  // Fetch company data
  const { data: company } = useQuery<Company>({
    queryKey: ['company', employee?.companyId],
    queryFn: () => ApiService.getCompany(employee!.companyId),
    enabled: !!employee?.companyId,
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: (data: Partial<Company>) =>
      ApiService.updateCompany(employee!.companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      setShowCompanyModal(false);
      Alert.alert('Success', 'Company information updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update company information');
    },
  });

  const openCompanyModal = () => {
    if (company) {
      setCompanyData({
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
        website: company.website || '',
        description: company.description || '',
      });
    }
    setShowCompanyModal(true);
  };

  const saveCompanyData = () => {
    updateCompanyMutation.mutate(companyData);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Company',
      items: [
        {
          icon: 'business-outline',
          title: 'Company Profile',
          subtitle: 'Manage company information and details',
          action: () => canManageSettings() ? openCompanyModal() : showPermissionAlert(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'location-outline',
          title: 'Business Hours',
          subtitle: 'Set your operating hours',
          action: () => canManageSettings() ? handleBusinessHours() : showPermissionAlert(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'grid-outline',
          title: 'Service Categories',
          subtitle: 'Manage service types and categories',
          action: () => canManageSettings() ? handleServiceCategories() : showPermissionAlert(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
      ],
    },
    {
      title: 'Payment & Billing',
      items: [
        {
          icon: 'card-outline',
          title: 'Payment Methods',
          subtitle: 'Configure accepted payment options',
          action: () => canManageSettings() ? handlePaymentMethods() : showPermissionAlert(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'pricetag-outline',
          title: 'Pricing & Coupons',
          subtitle: 'Manage pricing and promotional codes',
          action: () => canManageSettings() ? handlePricingCoupons() : showPermissionAlert(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'receipt-outline',
          title: 'Tax Settings',
          subtitle: 'Configure tax rates and billing',
          action: () => canManageSettings() ? handleTaxSettings() : showPermissionAlert(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Push Notifications',
          subtitle: 'Booking reminders and updates',
          action: () => {},
          rightElement: <Switch value={true} trackColor={{ false: '#e9ecef', true: '#ff4500' }} />,
        },
        {
          icon: 'mail-outline',
          title: 'Email Notifications',
          subtitle: 'Email alerts and reports',
          action: () => {},
          rightElement: <Switch value={false} trackColor={{ false: '#e9ecef', true: '#ff4500' }} />,
        },
        {
          icon: 'chatbubble-outline',
          title: 'SMS Notifications',
          subtitle: 'Text message alerts',
          action: () => {},
          rightElement: <Switch value={true} trackColor={{ false: '#e9ecef', true: '#ff4500' }} />,
        },
      ],
    },
    {
      title: 'Integrations',
      items: [
        {
          icon: 'calendar-outline',
          title: 'Calendar Sync',
          subtitle: 'Sync with Google Calendar, Outlook',
          action: () => handleCalendarSync(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'storefront-outline',
          title: 'Marketplace',
          subtitle: 'Publish services to public marketplace',
          action: () => {},
          rightElement: <Switch value={true} trackColor={{ false: '#e9ecef', true: '#ff4500' }} />,
        },
        {
          icon: 'analytics-outline',
          title: 'Analytics Tracking',
          subtitle: 'Enable advanced analytics',
          action: () => {},
          rightElement: <Switch value={true} trackColor={{ false: '#e9ecef', true: '#ff4500' }} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          title: 'My Profile',
          subtitle: 'Update personal information',
          action: () => handleMyProfile(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'shield-outline',
          title: 'Privacy & Security',
          subtitle: 'Password and security settings',
          action: () => handlePrivacySecurity(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          action: () => handleHelpSupport(),
          rightElement: <Ionicons name="chevron-forward" size={20} color="#6c757d" />,
        },
        {
          icon: 'log-out-outline',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          action: handleLogout,
          rightElement: <Ionicons name="chevron-forward" size={20} color="#dc3545" />,
          danger: true,
        },
      ],
    },
  ];

  const showPermissionAlert = () => {
    Alert.alert('Permission Denied', 'You do not have permission to modify settings');
  };

  const handleBusinessHours = () => {
    Alert.alert('Business Hours', 'Business hours management will be available in the next update');
  };

  const handleServiceCategories = () => {
    Alert.alert('Service Categories', 'Service categories management will be available in the next update');
  };

  const handlePaymentMethods = () => {
    Alert.alert('Payment Methods', 'Payment methods configuration will be available in the next update');
  };

  const handlePricingCoupons = () => {
    Alert.alert('Pricing & Coupons', 'Pricing and coupons management will be available in the next update');
  };

  const handleTaxSettings = () => {
    Alert.alert('Tax Settings', 'Tax settings configuration will be available in the next update');
  };

  const handleCalendarSync = () => {
    Alert.alert('Calendar Sync', 'Calendar synchronization will be available in the next update');
  };

  const handleMyProfile = () => {
    Alert.alert('My Profile', 'Profile management will be available in the next update');
  };

  const handlePrivacySecurity = () => {
    Alert.alert('Privacy & Security', 'Privacy and security settings will be available in the next update');
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'For support, please contact: support@zootel.com');
  };

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      key={item.title}
      style={[styles.settingItem, item.danger && styles.dangerItem]}
      onPress={item.action}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, item.danger && styles.dangerIcon]}>
          <Ionicons 
            name={item.icon} 
            size={22} 
            color={item.danger ? '#dc3545' : '#ff4500'} 
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, item.danger && styles.dangerText]}>
            {item.title}
          </Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      {item.rightElement}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Company Info Card */}
      {company && (
        <View style={styles.companyCard}>
          <View style={styles.companyHeader}>
            <View style={styles.companyAvatar}>
              <Text style={styles.companyInitial}>{company.name[0]}</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyAddress}>{company.address}</Text>
              <Text style={styles.employeeRole}>
                {employee?.firstName} {employee?.lastName} • {employee?.role}
              </Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Zootel Business v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Zootel. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Company Profile Modal */}
      <Modal visible={showCompanyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Company Profile</Text>
              <TouchableOpacity onPress={() => setShowCompanyModal(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Company Name"
                value={companyData.name}
                onChangeText={(text) => setCompanyData(prev => ({ ...prev, name: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Address"
                value={companyData.address}
                onChangeText={(text) => setCompanyData(prev => ({ ...prev, address: text }))}
                multiline
              />

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Phone"
                  value={companyData.phone}
                  onChangeText={(text) => setCompanyData(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Email"
                  value={companyData.email}
                  onChangeText={(text) => setCompanyData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Website (optional)"
                value={companyData.website}
                onChangeText={(text) => setCompanyData(prev => ({ ...prev, website: text }))}
                autoCapitalize="none"
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                value={companyData.description}
                onChangeText={(text) => setCompanyData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCompanyModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveCompanyData}
                  disabled={updateCompanyMutation.isPending}
                >
                  <Text style={styles.saveButtonText}>
                    {updateCompanyMutation.isPending ? 'Saving...' : 'Save Changes'}
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  companyCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyInitial: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 14,
    color: '#ff4500',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: '#fff5f5',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  dangerText: {
    color: '#dc3545',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appVersion: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#6c757d',
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
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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

export default SettingsScreen; 