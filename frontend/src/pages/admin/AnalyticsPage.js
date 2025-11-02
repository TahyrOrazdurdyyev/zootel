import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import LocationAnalytics from '../../components/analytics/LocationAnalytics';
import {
  DocumentChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  FunnelIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('30d');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      window.location.href = '/';
    }
  }, [user]);

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: DocumentChartBarIcon,
      description: 'Platform overview statistics'
    },
    {
      id: 'users',
      name: 'Users',
      icon: UsersIcon,
      description: 'User analytics and registrations'
    },
    {
      id: 'companies',
      name: 'Companies',
      icon: BuildingOfficeIcon,
      description: 'Company performance'
    },
    {
      id: 'revenue',
      name: 'Revenue',
      icon: CurrencyDollarIcon,
      description: 'Financial analytics'
    },
    {
      id: 'location',
      name: 'Location',
      icon: GlobeAltIcon,
      description: 'Geographic user distribution and trends'
    },
    {
      id: 'cohort',
      name: 'Cohort',
      icon: CalendarDaysIcon,
      description: 'User retention analysis'
    },
    {
      id: 'segments',
      name: 'Segments',
      icon: ChartPieIcon,
      description: 'User segmentation'
    },
    {
      id: 'funnel',
      name: 'Funnel',
      icon: FunnelIcon,
      description: 'Conversion funnel analysis'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <AnalyticsDashboard isAdmin={true} />
            
            {/* Additional Overview Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivityWidget />
              <PlatformHealthWidget />
              <TopMetricsWidget />
            </div>
          </div>
        );
      
      case 'users':
        return <UserAnalyticsTab timeframe={timeframe} />;
      
      case 'companies':
        return <CompanyAnalyticsTab timeframe={timeframe} />;
      
      case 'revenue':
        return <RevenueAnalyticsTab timeframe={timeframe} />;
      
      case 'location':
        return <LocationAnalytics />;
      
      case 'bookings':
        return <BookingAnalyticsTab timeframe={timeframe} />;
      
      case 'cohort':
        return <CohortAnalyticsTab timeframe={timeframe} />;
      
      case 'segments':
        return <SegmentsAnalyticsTab timeframe={timeframe} />;
      
      case 'funnel':
        return <FunnelAnalyticsTab timeframe={timeframe} />;
      
      default:
        return <AnalyticsDashboard isAdmin={true} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive analytics and metrics for SuperAdmin
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  ${activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                  }
                `}
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </div>
                {/* Active tab indicator */}
                {activeTab === tab.id && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// Recent Activity Widget
const RecentActivityWidget = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/v1/admin/analytics/recent-activity', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
          </div>
        ) : activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
};

// Platform Health Widget
const PlatformHealthWidget = () => {
  const [healthMetrics, setHealthMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStatus();
  }, []);

  const fetchPlatformStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/admin/analytics/platform-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const statusData = data.data || {};
        
        const formattedMetrics = [
          { 
            name: 'API Response Time', 
            value: statusData.api_response_time || '120ms', 
            status: statusData.api_response_time_status || 'good' 
          },
          { 
            name: 'Availability', 
            value: statusData.availability || '99.9%', 
            status: statusData.availability_status || 'good' 
          },
          { 
            name: 'Active Sessions', 
            value: statusData.active_sessions || '0', 
            status: statusData.active_sessions_status || 'good' 
          },
          { 
            name: 'Error Rate', 
            value: statusData.error_rate || '0.0%', 
            status: statusData.error_rate_status || 'good' 
          },
        ];
        
        setHealthMetrics(formattedMetrics);
      }
    } catch (error) {
      console.error('Error fetching platform status:', error);
      // Fallback to default values
      setHealthMetrics([
        { name: 'API Response Time', value: '120ms', status: 'good' },
        { name: 'Availability', value: '99.9%', status: 'good' },
        { name: 'Active Sessions', value: '0', status: 'good' },
        { name: 'Error Rate', value: '0.0%', status: 'good' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Status</h3>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
          </div>
        ) : (
          healthMetrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{metric.name}</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{metric.value}</span>
              <div className={`w-2 h-2 rounded-full ${
                metric.status === 'good' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
};

// Top Metrics Widget
const TopMetricsWidget = () => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeyMetrics();
  }, []);

  const fetchKeyMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/admin/analytics/key-metrics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching key metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const topMetrics = [
    { name: 'Most Popular Service', value: metrics.most_popular_service || 'No data' },
    { name: 'Top City', value: metrics.top_city || 'No data' },
    { name: 'Average Check', value: metrics.average_check || '₽0' },
    { name: 'Conversion Rate', value: metrics.conversion_rate || '0%' },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
          </div>
        ) : (
          topMetrics.map((metric, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{metric.name}</span>
              <span className="text-sm font-medium text-gray-900">{metric.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Placeholder tabs - to be implemented
const UserAnalyticsTab = ({ timeframe }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0
  });
  const [filters, setFilters] = useState({
    role: '',
    country: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.page_size,
        ...(filters.role && { role: filters.role }),
        ...(filters.search && { q: filters.search })
      });

      const endpoint = filters.search 
        ? `/api/v1/auth/search-users?${params}`
        : `/api/v1/auth/users?${params}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total,
            total_pages: Math.ceil(data.pagination.total / pagination.page_size)
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'super_admin': 'bg-red-100 text-red-800',
      'company_owner': 'bg-blue-100 text-blue-800',
      'pet_owner': 'bg-green-100 text-green-800'
    };
    
    const roleLabels = {
      'super_admin': 'Super Admin',
      'company_owner': 'Company Owner', 
      'pet_owner': 'Pet Owner'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
        {roleLabels[role] || role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Roles</option>
              <option value="pet_owner">Pet Owner</option>
              <option value="company_owner">Company Owner</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              placeholder="Filter by country..."
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'pet_owner').length}</div>
            <div className="text-sm text-green-600">Pet Owners</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'company_owner').length}</div>
            <div className="text-sm text-purple-600">Company Owners</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length}</div>
            <div className="text-sm text-orange-600">New (30 days)</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Users List</h3>
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.page_size) + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-orange-600">
                                {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {[user.city, user.state, user.country].filter(Boolean).join(', ') || 'No location'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
                <div className="flex justify-between flex-1 sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{pagination.page}</span> of{' '}
                      <span className="font-medium">{pagination.total_pages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ←
                      </button>
                      {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === pagination.page
                                ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.total_pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        →
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CompanyAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Analytics</h3>
    <p className="text-gray-600">Company performance for {timeframe}</p>
    {/* Add company-specific charts and metrics here */}
  </div>
);

const RevenueAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Analytics</h3>
    <p className="text-gray-600">Revenue and financial metrics for {timeframe}</p>
    {/* Add revenue-specific charts and metrics here */}
  </div>
);

const BookingAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Analytics</h3>
    <p className="text-gray-600">Booking statistics for {timeframe}</p>
    {/* Add booking-specific charts and metrics here */}
  </div>
);

const GeographyAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Analytics</h3>
    <p className="text-gray-600">Regional distribution for {timeframe}</p>
    {/* Add geography-specific charts and maps here */}
  </div>
);

// Cohort Analysis Component
const CohortAnalyticsTab = ({ timeframe }) => {
  const [cohortData, setCohortData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedMetric, setSelectedMetric] = useState('retention');

  useEffect(() => {
    fetchCohortData();
  }, [timeframe, selectedPeriod, selectedMetric]);

  const fetchCohortData = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/v1/admin/analytics/cohort?period=${selectedPeriod}&metric=${selectedMetric}&timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCohortData(data.data);
      }
    } catch (error) {
      console.error('Error fetching cohort data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCohortTable = () => {
    if (!cohortData || !cohortData.cohorts) return null;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cohort
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedPeriod === 'weekly' ? `W${i}` : `M${i}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cohortData.cohorts.map((cohort, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {cohort.period}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cohort.total_users}
                </td>
                {cohort.retention_rates.map((rate, periodIndex) => (
                  <td key={periodIndex} className="px-3 py-4 whitespace-nowrap text-center text-sm">
                    <div 
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        rate >= 50 ? 'bg-green-100 text-green-800' :
                        rate >= 25 ? 'bg-yellow-100 text-yellow-800' :
                        rate > 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {rate ? `${rate}%` : '-'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Cohort Analysis</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="weekly">Weekly Cohorts</option>
              <option value="monthly">Monthly Cohorts</option>
            </select>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="retention">User Retention</option>
              <option value="revenue">Revenue Retention</option>
              <option value="activity">Activity Retention</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cohort Table */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading cohort data...</p>
          </div>
        ) : cohortData ? (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {selectedMetric} rates for {selectedPeriod} cohorts over {timeframe}
              </p>
            </div>
            {renderCohortTable()}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No cohort data available</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {cohortData && cohortData.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500">Average Retention (Week 1)</h4>
            <p className="text-2xl font-bold text-gray-900">{cohortData.summary.avg_week1_retention}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500">Average Retention (Month 1)</h4>
            <p className="text-2xl font-bold text-gray-900">{cohortData.summary.avg_month1_retention}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Cohorts</h4>
            <p className="text-2xl font-bold text-gray-900">{cohortData.cohorts?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const SegmentsAnalyticsTab = ({ timeframe }) => {
  const [segmentData, setSegmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSegmentType, setSelectedSegmentType] = useState('behavior');

  useEffect(() => {
    fetchSegmentData();
  }, [timeframe, selectedSegmentType]);

  const fetchSegmentData = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/v1/admin/analytics/segments?type=${selectedSegmentType}&timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSegmentData(data.data);
      }
    } catch (error) {
      console.error('Error fetching segment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">User Segments</h3>
          <select
            value={selectedSegmentType}
            onChange={(e) => setSelectedSegmentType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="behavior">Behavior Segments</option>
            <option value="demographic">Demographic Segments</option>
            <option value="geographic">Geographic Segments</option>
            <option value="revenue">Revenue Segments</option>
            <option value="engagement">Engagement Segments</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading segment data...</p>
          </div>
        </div>
      ) : segmentData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Segments Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Segment Distribution</h4>
            <div className="space-y-4">
              {segmentData.segments?.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSegmentColor(index)}`}>
                      {segment.name}
                    </div>
                    <span className="text-sm text-gray-600">{segment.description}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{segment.user_count}</div>
                    <div className="text-sm text-gray-500">{segment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Segment Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Segment Performance</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retention</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {segmentData.segments?.map((segment, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSegmentColor(index)}`}>
                          {segment.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {segment.user_count}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₽{segment.avg_revenue || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {segment.retention_rate || 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Segment Trends */}
          {segmentData.trends && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Segment Trends</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(segmentData.trends).map(([key, value]) => (
                  <div key={key} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">No segment data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

const FunnelAnalyticsTab = ({ timeframe }) => {
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFunnel, setSelectedFunnel] = useState('registration');

  useEffect(() => {
    fetchFunnelData();
  }, [timeframe, selectedFunnel]);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/v1/admin/analytics/funnel?type=${selectedFunnel}&timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFunnelData(data.data);
      }
    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFunnelStep = (step, index, totalSteps) => {
    const isLast = index === totalSteps - 1;
    const conversionRate = index > 0 ? ((step.users / funnelData.steps[0].users) * 100).toFixed(1) : 100;
    const stepConversionRate = index > 0 ? ((step.users / funnelData.steps[index - 1].users) * 100).toFixed(1) : 100;
    
    return (
      <div key={index} className="relative">
        {/* Funnel Step */}
        <div className="relative bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <h4 className="text-lg font-medium text-gray-900">{step.name}</h4>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{step.users.toLocaleString()}</div>
              <div className="text-sm text-gray-500">users</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Overall Conversion:</span>
              <span className="ml-2 font-medium text-gray-900">{conversionRate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Step Conversion:</span>
              <span className="ml-2 font-medium text-gray-900">{stepConversionRate}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${conversionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Arrow to next step */}
        {!isLast && (
          <div className="flex justify-center my-4">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[20px] border-l-transparent border-r-transparent border-t-gray-400"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
          <select
            value={selectedFunnel}
            onChange={(e) => setSelectedFunnel(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="registration">Registration Funnel</option>
            <option value="booking">Booking Funnel</option>
            <option value="payment">Payment Funnel</option>
            <option value="onboarding">Onboarding Funnel</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading funnel data...</p>
          </div>
        </div>
      ) : funnelData && funnelData.steps ? (
        <div className="space-y-6">
          {/* Funnel Visualization */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFunnel.charAt(0).toUpperCase() + selectedFunnel.slice(1)} Funnel Analysis
              </h4>
              <p className="text-sm text-gray-600">
                Showing conversion rates for {timeframe} period
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              {funnelData.steps.map((step, index) => 
                renderFunnelStep(step, index, funnelData.steps.length)
              )}
            </div>
          </div>

          {/* Funnel Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Total Entries</h4>
              <p className="text-2xl font-bold text-gray-900">
                {funnelData.steps[0]?.users.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Total Conversions</h4>
              <p className="text-2xl font-bold text-gray-900">
                {funnelData.steps[funnelData.steps.length - 1]?.users.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Overall Conversion Rate</h4>
              <p className="text-2xl font-bold text-gray-900">
                {funnelData.overall_conversion_rate || 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-500">Biggest Drop-off</h4>
              <p className="text-2xl font-bold text-red-600">
                {funnelData.biggest_dropoff?.step || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {funnelData.biggest_dropoff?.rate || 0}% drop
              </p>
            </div>
          </div>

          {/* Improvement Suggestions */}
          {funnelData.suggestions && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Optimization Suggestions</h4>
              <div className="space-y-3">
                {funnelData.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                      !
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">{suggestion.title}</p>
                      <p className="text-sm text-blue-700">{suggestion.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">No funnel data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage; 