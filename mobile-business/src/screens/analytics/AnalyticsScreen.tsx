import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;

type DateRange = '7d' | '30d' | '90d' | '1y';

const AnalyticsScreen = () => {
  const { employee } = useAuth();
  const { canViewAnalytics } = usePermissions();

  // State
  const [selectedRange, setSelectedRange] = useState<DateRange>('30d');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', employee?.companyId, selectedRange],
    queryFn: () => ApiService.getDashboardMetrics(employee!.companyId),
    enabled: !!employee?.companyId && canViewAnalytics,
  });

  const dateRanges = [
    { label: '7 Days', value: '7d' as DateRange },
    { label: '30 Days', value: '30d' as DateRange },
    { label: '90 Days', value: '90d' as DateRange },
    { label: '1 Year', value: '1y' as DateRange },
  ];

  // Mock data for charts (in real app, this would come from API)
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [450, 620, 380, 890, 730, 920, 650],
        color: (opacity = 1) => `rgba(255, 69, 0, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const bookingsData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        data: [45, 67, 52, 78],
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
      },
    ],
  };

  const serviceDistribution = [
    { name: 'Grooming', population: 45, color: '#ff4500', legendFontColor: '#7F7F7F' },
    { name: 'Boarding', population: 30, color: '#007bff', legendFontColor: '#7F7F7F' },
    { name: 'Training', population: 15, color: '#28a745', legendFontColor: '#7F7F7F' },
    { name: 'Veterinary', population: 10, color: '#ffc107', legendFontColor: '#7F7F7F' },
  ];

  // Mock team analytics data
  const teamWorkload = [
    { employeeName: 'Sarah Johnson', totalBookings: 45, workloadPercent: 35, revenue: 2250 },
    { employeeName: 'Mike Chen', totalBookings: 38, workloadPercent: 29, revenue: 1900 },
    { employeeName: 'Lisa Wilson', totalBookings: 32, workloadPercent: 25, revenue: 1600 },
    { employeeName: 'Tom Davis', totalBookings: 14, workloadPercent: 11, revenue: 700 },
  ];

  const teamEfficiency = [
    { employeeName: 'Sarah Johnson', completionRate: 95, customerSatisfaction: 4.8, productivityScore: 92 },
    { employeeName: 'Mike Chen', completionRate: 88, customerSatisfaction: 4.6, productivityScore: 85 },
    { employeeName: 'Lisa Wilson', completionRate: 92, customerSatisfaction: 4.7, productivityScore: 89 },
    { employeeName: 'Tom Davis', completionRate: 75, customerSatisfaction: 4.2, productivityScore: 68 },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const handleExport = () => {
    Alert.alert(
      'Export Analytics',
      'Choose export format',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF Report', onPress: () => exportData('pdf') },
        { text: 'Excel Sheet', onPress: () => exportData('excel') },
      ]
    );
  };

  const exportData = (format: string) => {
    // In real app, this would call the export API
    Alert.alert('Export Started', `Your ${format.toUpperCase()} report is being generated and will be emailed to you shortly.`);
  };

  if (!canViewAnalytics) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed" size={64} color="#6c757d" />
        <Text style={styles.permissionText}>
          You don't have permission to view analytics
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Ionicons name="download" size={20} color="#ff4500" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dateRanges.map((range) => (
            <TouchableOpacity
              key={range.value}
              style={[
                styles.dateRangeButton,
                selectedRange === range.value && styles.dateRangeButtonActive,
              ]}
              onPress={() => setSelectedRange(range.value)}
            >
              <Text
                style={[
                  styles.dateRangeText,
                  selectedRange === range.value && styles.dateRangeTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Ionicons name="calendar" size={24} color="#007bff" />
                <Text style={styles.kpiValue}>{analytics?.todayBookings || 24}</Text>
              </View>
              <Text style={styles.kpiLabel}>Total Bookings</Text>
              <Text style={styles.kpiChange}>+12% from last period</Text>
            </View>
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Ionicons name="cash" size={24} color="#28a745" />
                <Text style={styles.kpiValue}>${analytics?.todayRevenue?.toFixed(0) || '5,420'}</Text>
              </View>
              <Text style={styles.kpiLabel}>Revenue</Text>
              <Text style={styles.kpiChange}>+8% from last period</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Ionicons name="people" size={24} color="#6f42c1" />
                <Text style={styles.kpiValue}>156</Text>
              </View>
              <Text style={styles.kpiLabel}>New Customers</Text>
              <Text style={styles.kpiChange}>+23% from last period</Text>
            </View>
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Ionicons name="star" size={24} color="#ffc107" />
                <Text style={styles.kpiValue}>4.8</Text>
              </View>
              <Text style={styles.kpiLabel}>Avg Rating</Text>
              <Text style={styles.kpiChange}>+0.2 from last period</Text>
            </View>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Trend</Text>
          <LineChart
            data={revenueData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisLabel="$"
          />
        </View>

        {/* Bookings Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weekly Bookings</Text>
          <BarChart
            data={bookingsData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        {/* Service Distribution */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Service Distribution</Text>
          <PieChart
            data={serviceDistribution}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Customer Retention Rate</Text>
              <Text style={styles.metricValue}>78%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '78%' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Service Time</Text>
              <Text style={styles.metricValue}>45 min</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '65%', backgroundColor: '#28a745' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Booking Completion Rate</Text>
              <Text style={styles.metricValue}>92%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '92%', backgroundColor: '#007bff' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Customer Satisfaction</Text>
              <Text style={styles.metricValue}>4.8/5</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '96%', backgroundColor: '#ffc107' }]} />
            </View>
          </View>
        </View>

        {/* Top Services */}
        <View style={styles.topServicesContainer}>
          <Text style={styles.sectionTitle}>Top Services</Text>
          
          {[
            { name: 'Pet Grooming', bookings: 145, revenue: 3250 },
            { name: 'Dog Walking', bookings: 98, revenue: 1960 },
            { name: 'Pet Boarding', bookings: 67, revenue: 2010 },
            { name: 'Veterinary Care', bookings: 34, revenue: 1700 },
            { name: 'Training', bookings: 23, revenue: 920 },
          ].map((service, index) => (
            <View key={service.name} style={styles.serviceCard}>
              <View style={styles.serviceRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceStats}>
                  {service.bookings} bookings • ${service.revenue}
                </Text>
              </View>
              <View style={styles.serviceArrow}>
                <Ionicons name="chevron-forward" size={20} color="#6c757d" />
              </View>
            </View>
          ))}
        </View>

        {/* Team Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Performance</Text>
          
          {/* Team Workload */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team Workload</Text>
            {teamWorkload.map((employee, index) => (
              <View key={index} style={styles.teamMemberRow}>
                <View style={styles.teamMemberInfo}>
                  <Text style={styles.teamMemberName}>{employee.employeeName}</Text>
                  <Text style={styles.teamMemberStats}>
                    {employee.totalBookings} bookings • ${employee.revenue}
                  </Text>
                </View>
                <View style={styles.workloadBar}>
                  <View 
                    style={[
                      styles.workloadFill, 
                      { width: `${employee.workloadPercent}%` }
                    ]} 
                  />
                  <Text style={styles.workloadPercent}>{employee.workloadPercent}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Team Efficiency */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team Efficiency</Text>
            {teamEfficiency.map((employee, index) => (
              <View key={index} style={styles.efficiencyRow}>
                <View style={styles.efficiencyInfo}>
                  <Text style={styles.teamMemberName}>{employee.employeeName}</Text>
                  <View style={styles.efficiencyMetrics}>
                    <Text style={styles.efficiencyMetric}>
                      Completion: {employee.completionRate}%
                    </Text>
                    <Text style={styles.efficiencyMetric}>
                      Rating: {employee.customerSatisfaction}/5
                    </Text>
                    <Text style={styles.efficiencyMetric}>
                      Score: {employee.productivityScore}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.scoreCircle,
                  { backgroundColor: employee.productivityScore >= 85 ? '#28a745' : 
                    employee.productivityScore >= 70 ? '#ffc107' : '#dc3545' }
                ]}>
                  <Text style={styles.scoreText}>{employee.productivityScore}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Refund Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refund Analytics</Text>
          <View style={styles.refundCards}>
            <View style={styles.refundCard}>
              <Text style={styles.refundNumber}>12</Text>
              <Text style={styles.refundLabel}>Total Refunds</Text>
            </View>
            <View style={styles.refundCard}>
              <Text style={styles.refundNumber}>$1,240</Text>
              <Text style={styles.refundLabel}>Refund Amount</Text>
            </View>
            <View style={styles.refundCard}>
              <Text style={styles.refundNumber}>2.8%</Text>
              <Text style={styles.refundLabel}>Refund Rate</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportText: {
    color: '#ff4500',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  dateRangeContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dateRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateRangeButtonActive: {
    backgroundColor: '#ff4500',
    borderColor: '#ff4500',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  dateRangeTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  kpiContainer: {
    padding: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kpiCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  kpiLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  kpiChange: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  metricsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  metricCard: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff4500',
    borderRadius: 3,
  },
  topServicesContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  serviceStats: {
    fontSize: 14,
    color: '#6c757d',
  },
  serviceArrow: {
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 32,
  },
  // New styles for Team Analytics and Refund Analytics
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  teamMemberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  teamMemberStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  workloadBar: {
    width: 100,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workloadFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 10,
  },
  workloadPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    zIndex: 1,
  },
  efficiencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  efficiencyInfo: {
    flex: 1,
  },
  efficiencyMetrics: {
    flexDirection: 'row',
    marginTop: 4,
  },
  efficiencyMetric: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
  },
  scoreCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  refundCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  refundCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  refundNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  refundLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default AnalyticsScreen; 