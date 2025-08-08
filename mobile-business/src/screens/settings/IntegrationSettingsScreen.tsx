import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import apiService from '../../services/apiService';

interface IntegrationSettings {
  integration_enabled: boolean;
  publish_to_marketplace: boolean;
  api_key?: string;
  allowed_domains: string[];
  available_features: string[];
  recent_analytics?: any;
  can_toggle_marketplace?: boolean; // NEW: Can company control marketplace visibility
  marketplace_eligibility?: any; // NEW: Detailed eligibility info
}

const IntegrationSettingsScreen = () => {
  const { employee } = useAuth();
  const { canManageSettings } = usePermissions();
  const queryClient = useQueryClient();

  // State
  const [publishToMarketplace, setPublishToMarketplace] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);

  // Fetch integration settings
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery<IntegrationSettings>({
    queryKey: ['integration-settings', employee?.companyId],
    queryFn: async () => {
      const response = await apiService.getIntegrationSettings(employee!.companyId);
      return response.data;
    },
    enabled: !!employee?.companyId,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiService.updateIntegrationSettings(employee!.companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] });
      Alert.alert('Success', 'Integration settings updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update integration settings');
    },
  });

  // Regenerate API key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: () => apiService.regenerateAPIKey(employee!.companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] });
      Alert.alert('Success', 'API key regenerated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to regenerate API key');
    },
  });

  useEffect(() => {
    if (settings) {
      setPublishToMarketplace(settings.publish_to_marketplace);
      setAllowedDomains(settings.allowed_domains || []);
    }
  }, [settings]);

  const handleToggleMarketplace = () => {
    // Проверяем, может ли компания управлять видимостью
    if (!settings?.can_toggle_marketplace) {
      Alert.alert(
        'Cannot Change Setting',
        'Marketplace visibility can only be controlled by companies with website integration enabled. Companies without website integration must remain visible in the marketplace.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newValue = !publishToMarketplace;
    setPublishToMarketplace(newValue);
    
    updateSettingsMutation.mutate({
      publish_to_marketplace: newValue,
    });
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      Alert.alert('Error', 'Please enter a valid domain');
      return;
    }

    const updatedDomains = [...allowedDomains, newDomain.trim()];
    setAllowedDomains(updatedDomains);
    setNewDomain('');
    setShowAddDomain(false);

    updateSettingsMutation.mutate({
      allowed_domains: updatedDomains,
    });
  };

  const handleRemoveDomain = (index: number) => {
    const updatedDomains = allowedDomains.filter((_, i) => i !== index);
    setAllowedDomains(updatedDomains);

    updateSettingsMutation.mutate({
      allowed_domains: updatedDomains,
    });
  };

  const handleCopyAPIKey = async () => {
    if (settings?.api_key) {
      await Clipboard.setString(settings.api_key);
      Alert.alert('Copied', 'API key copied to clipboard');
    }
  };

  const handleShareIntegrationGuide = () => {
    const guideText = `
🚀 Zootel Website Integration Guide

1. Add this script to your website:
<script src="https://cdn.zootel.com/widgets/booking-widget.js"></script>

2. Add the booking widget:
<div data-zootel-booking data-company-id="${employee?.companyId}" data-api-key="${settings?.api_key}"></div>

3. For more widgets (chat, analytics), visit: https://docs.zootel.com/integration

Your API Key: ${settings?.api_key}
Company ID: ${employee?.companyId}

Need help? Contact support@zootel.com
    `;

    Share.share({
      message: guideText,
      title: 'Zootel Integration Guide',
    });
  };

  const handleRegenerateAPIKey = () => {
    Alert.alert(
      'Regenerate API Key',
      'This will invalidate your current API key. All existing integrations will need to be updated. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          style: 'destructive',
          onPress: () => regenerateKeyMutation.mutate()
        },
      ]
    );
  };

  if (!canManageSettings()) {
    return (
      <View style={styles.container}>
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
          <Text style={styles.noAccessText}>
            You don't have permission to manage integration settings
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading integration settings...</Text>
      </View>
    );
  }

  if (error || !settings) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color="#EF4444" />
        <Text style={styles.errorText}>
          {settings?.integration_enabled === false 
            ? 'Website integration is not available in your current plan'
            : 'Failed to load integration settings'
          }
        </Text>
        {settings?.integration_enabled === false && (
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Website Integration</Text>
        <Text style={styles.subtitle}>
          Embed Zootel widgets on your website
        </Text>
      </View>

      {/* Integration Status */}
      <View style={styles.section}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={settings.integration_enabled ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={settings.integration_enabled ? "#10B981" : "#EF4444"} 
            />
            <Text style={styles.statusTitle}>
              {settings.integration_enabled ? 'Integration Active' : 'Integration Disabled'}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {settings.integration_enabled 
              ? 'Your website integration is active and ready to use'
              : 'Website integration is not enabled for your account'
            }
          </Text>
        </View>
      </View>

      {settings.integration_enabled && (
        <>
          {/* API Key Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Configuration</Text>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>API Key</Text>
                <TouchableOpacity onPress={handleRegenerateAPIKey}>
                  <Ionicons name="refresh" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.apiKeyContainer}>
                <Text style={styles.apiKey} numberOfLines={1}>
                  {settings.api_key || 'No API key generated'}
                </Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={handleCopyAPIKey}
                >
                  <Ionicons name="copy" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.apiKeyDescription}>
                Use this key to authenticate your website widgets
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Company ID</Text>
              <View style={styles.apiKeyContainer}>
                <Text style={styles.companyId}>{employee?.companyId}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={() => {
                    Clipboard.setString(employee?.companyId || '');
                    Alert.alert('Copied', 'Company ID copied to clipboard');
                  }}
                >
                  <Ionicons name="copy" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Marketplace Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marketplace Settings</Text>
            
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Publish to Zootel Marketplace</Text>
                  <Text style={styles.settingDescription}>
                    {settings?.can_toggle_marketplace 
                      ? "Choose whether to show your services in the public Zootel marketplace"
                      : "Your services are always visible in the marketplace (website integration required to control this setting)"
                    }
                  </Text>
                </View>
                <Switch 
                  value={publishToMarketplace}
                  onValueChange={handleToggleMarketplace}
                  disabled={!settings?.can_toggle_marketplace}
                  trackColor={{ 
                    false: settings?.can_toggle_marketplace ? '#E5E7EB' : '#F3F4F6', 
                    true: '#3B82F6' 
                  }}
                  thumbColor={settings?.can_toggle_marketplace ? "#FFFFFF" : "#D1D5DB"}
                />
              </View>
              
              {!settings?.can_toggle_marketplace && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={16} color="#3B82F6" />
                  <Text style={styles.infoText}>
                    Enable website integration to control marketplace visibility
                  </Text>
                </View>
              )}
              
              {settings?.marketplace_eligibility?.reason && (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonText}>
                    {settings.marketplace_eligibility.reason}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Domain Restrictions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Domain Restrictions</Text>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Allowed Domains</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddDomain(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              
              {allowedDomains.length === 0 ? (
                <Text style={styles.emptyText}>
                  No domain restrictions - widgets can be used on any domain
                </Text>
              ) : (
                <View style={styles.domainsList}>
                  {allowedDomains.map((domain, index) => (
                    <View style={styles.domainItem}>
                      <Text style={styles.domainText}>{domain}</Text>
                      <TouchableOpacity 
                        onPress={() => handleRemoveDomain(index)}
                        style={styles.removeDomainButton}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Available Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Features</Text>
            
            <View style={styles.card}>
              <View style={styles.featuresList}>
                {settings.available_features.map((feature, index) => (
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.featureText}>
                      {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Integration Guide */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.guideButton}
              onPress={handleShareIntegrationGuide}
            >
              <Ionicons name="document-text" size={24} color="#3B82F6" />
              <View style={styles.guideButtonContent}>
                <Text style={styles.guideButtonTitle}>Integration Guide</Text>
                <Text style={styles.guideButtonSubtitle}>
                  Get code snippets and setup instructions
                </Text>
              </View>
              <Ionicons name="share" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Add Domain Modal */}
      {showAddDomain && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Allowed Domain</Text>
            <TextInput
              style={styles.domainInput}
              value={newDomain}
              onChangeText={setNewDomain}
              placeholder="example.com"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddDomain(false);
                  setNewDomain('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalAddButton}
                onPress={handleAddDomain}
              >
                <Text style={styles.modalAddText}>Add Domain</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAccessText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  upgradeButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  apiKey: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
  },
  companyId: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
  },
  copyButton: {
    padding: 8,
  },
  apiKeyDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  domainsList: {
    gap: 8,
  },
  domainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  domainText: {
    fontSize: 14,
    color: '#374151',
  },
  removeDomainButton: {
    padding: 4,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  guideButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  guideButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  guideButtonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  domainInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  modalAddButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalAddText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  reasonBox: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  reasonText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export default IntegrationSettingsScreen; 