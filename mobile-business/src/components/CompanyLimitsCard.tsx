import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompanyLimits } from '../hooks/useCompanyLimits';

interface CompanyLimitsCardProps {
  onUpgradePress?: () => void;
}

const CompanyLimitsCard: React.FC<CompanyLimitsCardProps> = ({ onUpgradePress }) => {
  const { limits, isLoading, hasAIAccess, getEmployeeSlotInfo, getAIAgentInfo } = useCompanyLimits();

  if (isLoading || !limits) {
    return null;
  }

  const employeeInfo = getEmployeeSlotInfo();
  const aiInfo = getAIAgentInfo();

  const handleUpgradePress = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      Alert.alert(
        'Upgrade Plan',
        'Contact support to upgrade your plan and unlock additional features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Contact Support', onPress: () => {} },
        ]
      );
    }
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return '#EF4444'; // Red
    if (percentage >= 75) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan Limits</Text>
        <Text style={styles.planName}>{limits.plan_name}</Text>
      </View>

      {/* Employee Slots */}
      {employeeInfo && (
        <View style={styles.limitSection}>
          <View style={styles.limitHeader}>
            <Ionicons name="people" size={20} color="#3B82F6" />
            <Text style={styles.limitTitle}>Team Members</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(employeeInfo.percentage, 100)}%`,
                    backgroundColor: getProgressBarColor(employeeInfo.percentage)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {employeeInfo.current} / {employeeInfo.max}
            </Text>
          </View>

          {employeeInfo.remaining <= 2 && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                {employeeInfo.remaining === 0 
                  ? 'Employee limit reached' 
                  : `Only ${employeeInfo.remaining} slots remaining`
                }
              </Text>
            </View>
          )}
        </View>
      )}

      {/* AI Access */}
      <View style={styles.limitSection}>
        <View style={styles.limitHeader}>
          <Ionicons 
            name="hardware-chip" 
            size={20} 
            color={aiInfo?.hasAccess ? '#8B5CF6' : '#9CA3AF'} 
          />
          <Text style={styles.limitTitle}>AI Features</Text>
        </View>

        {aiInfo?.hasAccess ? (
          <View>
            <Text style={styles.aiStatusActive}>
              ✓ AI enabled ({aiInfo.count} agents)
            </Text>
            <View style={styles.aiAgentsList}>
              {aiInfo.available.map((agent, index) => (
                <View key={index} style={styles.aiAgentChip}>
                  <Text style={styles.aiAgentText}>{agent.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.aiDisabledContainer}>
            <Text style={styles.aiStatusDisabled}>AI features not available</Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgradePress}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Additional Addons */}
      {limits.additional_slots > 0 && (
        <View style={styles.addonsSection}>
          <Text style={styles.addonsTitle}>Active Add-ons</Text>
          <View style={styles.addonItem}>
            <Ionicons name="add-circle" size={16} color="#10B981" />
            <Text style={styles.addonText}>
              +{limits.additional_slots} employee slots
            </Text>
          </View>
        </View>
      )}

      {/* Upgrade CTA */}
      {(!aiInfo?.hasAccess || employeeInfo?.remaining === 0) && (
        <TouchableOpacity 
          style={styles.upgradeCard}
          onPress={handleUpgradePress}
        >
          <View style={styles.upgradeContent}>
            <Ionicons name="arrow-up-circle" size={24} color="#3B82F6" />
            <View style={styles.upgradeTextContainer}>
              <Text style={styles.upgradeTitle}>Need more?</Text>
              <Text style={styles.upgradeSubtitle}>
                Upgrade your plan or add features
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  planName: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  limitSection: {
    marginBottom: 16,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
    fontWeight: '500',
  },
  aiStatusActive: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 8,
  },
  aiStatusDisabled: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  aiAgentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiAgentChip: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiAgentText: {
    fontSize: 12,
    color: '#7C3AED',
    textTransform: 'capitalize',
  },
  aiDisabledContainer: {
    alignItems: 'flex-start',
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addonsSection: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addonText: {
    fontSize: 12,
    color: '#047857',
    marginLeft: 6,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeTextContainer: {
    marginLeft: 12,
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default CompanyLimitsCard; 