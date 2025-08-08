import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useCompanyLimits } from '../../hooks/useCompanyLimits';
import apiService from '../../services/apiService';
import CompanyLimitsCard from '../../components/CompanyLimitsCard';
import { DashboardMetrics, RootStackParamList } from '../../types';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { employee } = useAuth();
  const { canViewAnalytics, canViewBookings, canManageBookings, canUseAI } = usePermissions();
  const { hasAIAccess, hasAIAgent } = useCompanyLimits();

  // Fetch dashboard metrics
  const { 
    data: metrics, 
    isLoading, 
    refetch 
  } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', employee?.companyId],
    queryFn: () => apiService.getDashboardMetrics(employee!.companyId),
    enabled: !!employee?.companyId,
  });

  const getEmployeeName = () => {
    if (employee?.firstName && employee?.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return employee?.firstName || employee?.username || 'Team Member';
  };

  const handleAIFeaturePress = (featureName: string, agentKey?: string) => {
    if (!hasAIAccess()) {
      Alert.alert(
        'AI Features Not Available',
        'Your current plan doesn\'t include AI features. Contact support to upgrade your plan.',
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Learn More', onPress: () => {} },
        ]
      );
      return;
    }

    if (agentKey && !hasAIAgent(agentKey)) {
      Alert.alert(
        'AI Agent Not Available',
        `The ${featureName} AI agent is not included in your plan. Contact support to add this agent.`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Add Agent', onPress: () => {} },
        ]
      );
      return;
    }

    // Navigate to AI feature
    (navigation as any).navigate('AIAssistant', { agentKey });
  };

  const onRefresh = () => {
    refetch();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {getEmployeeName()}!</Text>
        <Text style={styles.subtitle}>Your business overview</Text>
      </View>

      {/* Company Limits Card */}
      <CompanyLimitsCard />

      {/* KPI Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            <Text style={styles.kpiValue}>{metrics?.todayBookings || 0}</Text>
            <Text style={styles.kpiLabel}>Today's Bookings</Text>
          </View>

          <View style={styles.kpiCard}>
            <Ionicons name="cash-outline" size={24} color="#10B981" />
            <Text style={styles.kpiValue}>${metrics?.todayRevenue || 0}</Text>
            <Text style={styles.kpiLabel}>Today's Revenue</Text>
          </View>

          <View style={styles.kpiCard}>
            <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
            <Text style={styles.kpiValue}>{metrics?.pendingBookings || 0}</Text>
            <Text style={styles.kpiLabel}>Pending Bookings</Text>
          </View>

          <View style={styles.kpiCard}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.kpiValue}>{metrics?.lowStockItems || 0}</Text>
            <Text style={styles.kpiLabel}>Low Stock Items</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {canManageBookings() && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Bookings' as never)}
            >
              <Ionicons name="add-circle" size={28} color="#3B82F6" />
              <Text style={styles.actionText}>New Booking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Calendar' as never)}
          >
            <Ionicons name="calendar-outline" size={28} color="#10B981" />
            <Text style={styles.actionText}>View Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Chat' as never)}
          >
            <Ionicons name="chatbubble-outline" size={28} color="#8B5CF6" />
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Services' as never)}
          >
            <Ionicons name="briefcase-outline" size={28} color="#F59E0B" />
            <Text style={styles.actionText}>Services</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Features Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          {hasAIAccess() && (
            <View style={styles.aiEnabledBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.aiEnabledText}>AI Enabled</Text>
            </View>
          )}
        </View>

        <View style={styles.aiActionsGrid}>
          <TouchableOpacity
            style={[
              styles.aiActionCard, 
              !hasAIAccess() && styles.aiActionDisabled
            ]}
            onPress={() => handleAIFeaturePress('Booking Assistant', 'booking_assistant')}
          >
            <Ionicons 
              name="calendar" 
              size={24} 
              color={hasAIAccess() ? "#3B82F6" : "#9CA3AF"} 
            />
            <Text style={[
              styles.aiActionText,
              !hasAIAccess() && styles.aiActionTextDisabled
            ]}>
              Booking Assistant
            </Text>
            {!hasAIAgent('booking_assistant') && hasAIAccess() && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.aiActionCard, 
              !hasAIAccess() && styles.aiActionDisabled
            ]}
            onPress={() => handleAIFeaturePress('Customer Support', 'customer_support')}
          >
            <Ionicons 
              name="headset" 
              size={24} 
              color={hasAIAccess() ? "#10B981" : "#9CA3AF"} 
            />
            <Text style={[
              styles.aiActionText,
              !hasAIAccess() && styles.aiActionTextDisabled
            ]}>
              Support AI
            </Text>
            {!hasAIAgent('customer_support') && hasAIAccess() && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.aiActionCard, 
              !hasAIAccess() && styles.aiActionDisabled
            ]}
            onPress={() => handleAIFeaturePress('Analytics Advisor', 'analytics_advisor')}
          >
            <Ionicons 
              name="analytics" 
              size={24} 
              color={hasAIAccess() ? "#8B5CF6" : "#9CA3AF"} 
            />
            <Text style={[
              styles.aiActionText,
              !hasAIAccess() && styles.aiActionTextDisabled
            ]}>
              Analytics AI
            </Text>
            {!hasAIAgent('analytics_advisor') && hasAIAccess() && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.aiActionCard, 
              !hasAIAccess() && styles.aiActionDisabled
            ]}
            onPress={() => handleAIFeaturePress('Marketing Assistant', 'marketing_assistant')}
          >
            <Ionicons 
              name="megaphone" 
              size={24} 
              color={hasAIAccess() ? "#F59E0B" : "#9CA3AF"} 
            />
            <Text style={[
              styles.aiActionText,
              !hasAIAccess() && styles.aiActionTextDisabled
            ]}>
              Marketing AI
            </Text>
            {!hasAIAgent('marketing_assistant') && hasAIAccess() && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!hasAIAccess() && (
          <View style={styles.upgradePrompt}>
            <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
            <Text style={styles.upgradeText}>
              Upgrade your plan to unlock AI features
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
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
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  aiEnabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiEnabledText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
    marginLeft: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  aiActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  aiActionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
  },
  aiActionDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  aiActionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  aiActionTextDisabled: {
    color: '#9CA3AF',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  upgradePrompt: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 16,
  },
  upgradeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen; 