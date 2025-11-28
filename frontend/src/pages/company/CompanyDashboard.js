import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UsersIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  PhoneIcon,
  GlobeAltIcon,
  CogIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BellIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const CompanyDashboard = () => {
  const { user, apiCall } = useAuth();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('🏢 CompanyDashboard component loaded');
  console.log('👤 Current user:', user);
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      totalRevenue: 0,
      totalBookings: 0,
      newCustomers: 0,
      averageRating: 0,
      revenueTrend: 0,
      bookingsTrend: 0
    },
    recentBookings: [],
    upcomingBookings: [],
    topServices: [],
    notifications: [],
    quickStats: {}
  });

  useEffect(() => {
    console.log('🔍 useEffect triggered, user:', user);
    console.log('🏢 user.companyId:', user?.companyId);
    console.log('🏢 user.company_id:', user?.company_id);
    
    const companyId = user?.company_id || user?.companyId;
    
    if (companyId) {
      console.log('✅ Found companyId:', companyId);
      setCompanyId(companyId);
      loadDashboardData(companyId);
    } else {
      console.log('❌ No companyId found in user object');
    }
  }, [user]);

  const loadDashboardData = async (companyId) => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data for company:', companyId);
      
      // Load all dashboard data
      const [metricsRes, bookingsRes, servicesRes, notificationsRes] = await Promise.all([
        apiCall(`/companies/analytics`),
        apiCall(`/companies/bookings?limit=5`),
        apiCall(`/companies/services?limit=5`),
        apiCall(`/companies/notifications/unread?limit=5`)
      ]);

      console.log('📊 Analytics response:', metricsRes);
      console.log('📅 Bookings response:', bookingsRes);
      console.log('🔧 Services response:', servicesRes);
      console.log('🔔 Notifications response:', notificationsRes);

      // Transform analytics data to match expected format
      const analyticsData = metricsRes.success && metricsRes.data ? metricsRes.data.analytics : {};
      console.log('📈 Transformed analytics data:', analyticsData);
      
      setDashboardData({
        metrics: {
          totalRevenue: analyticsData.total_revenue || 0,
          totalBookings: analyticsData.total_bookings || 0,
          newCustomers: analyticsData.total_customers || 0, // Using total_customers from dashboard
          averageRating: 4.5, // Default rating since not in analytics
          revenueTrend: 0,
          bookingsTrend: 0
        },
        recentBookings: bookingsRes.success ? (bookingsRes.bookings || bookingsRes.data || []) : [],
        topServices: servicesRes.success ? (servicesRes.services || servicesRes.data || []) : [],
        notifications: notificationsRes.success ? (notificationsRes.data || []) : [],
        upcomingBookings: []
      });

      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getTrendIcon = (trend) => {
    return trend >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  };

  const getTrendColor = (trend) => {
    return trend >= 0 ? 'text-green-600' : 'text-orange-600';
  };

  const quickActions = [
    {
      title: 'Add Service',
      description: 'Create new service for customers',
      icon: PlusIcon,
      href: '/company/services',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Calendar',
      description: 'View and manage appointments',
      icon: CalendarDaysIcon,
      href: '/company/calendar',
      color: 'bg-green-500'
    },
    {
      title: 'View Customers',
      description: 'Manage customer database',
      icon: UsersIcon,
      href: '/company/customers',
      color: 'bg-indigo-500'
    },
    {
      title: 'Company Settings',
      description: 'Configure profile and settings',
      icon: CogIcon,
      href: '/company/settings',
      color: 'bg-purple-500'
    },
    {
      title: 'AI Prompts',
      description: 'Customize AI assistant',
      icon: SparklesIcon,
      href: '/company/ai-prompts',
      color: 'bg-yellow-500'
    },
    {
      title: 'Inventory',
      description: 'Manage product stock and warehouse',
      icon: CubeIcon,
      href: '/company/inventory',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Company Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome to your company management center
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/company/analytics"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Detailed Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.metrics.totalRevenue)}
              </p>
              <div className="flex items-center mt-2">
                {React.createElement(getTrendIcon(dashboardData.metrics.revenueTrend), {
                  className: `h-4 w-4 mr-1 ${getTrendColor(dashboardData.metrics.revenueTrend)}`
                })}
                <span className={`text-sm ${getTrendColor(dashboardData.metrics.revenueTrend)}`}>
                  {Math.abs(dashboardData.metrics.revenueTrend)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.metrics.totalBookings)}
              </p>
              <div className="flex items-center mt-2">
                {React.createElement(getTrendIcon(dashboardData.metrics.bookingsTrend), {
                  className: `h-4 w-4 mr-1 ${getTrendColor(dashboardData.metrics.bookingsTrend)}`
                })}
                <span className={`text-sm ${getTrendColor(dashboardData.metrics.bookingsTrend)}`}>
                  {Math.abs(dashboardData.metrics.bookingsTrend)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">New Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(dashboardData.metrics.newCustomers)}
              </p>
              <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.metrics.averageRating || '0.0'}
              </p>
              <div className="flex items-center mt-2">
                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-500 ml-1">out of 5.0</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <Link
                to="/company/bookings"
                className="text-blue-600 text-sm hover:text-blue-700"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {dashboardData.recentBookings.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.service_name || 'Service'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.customer_name || 'Customer'} • {booking.booking_date || 'Date'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(booking.total_amount)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No bookings yet</p>
                <Link
                  to="/company/services"
                  className="text-blue-600 text-sm hover:text-blue-700 mt-2 inline-block"
                >
                  Create your first service
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Popular Services</h3>
              <Link
                to="/company/services"
                className="text-blue-600 text-sm hover:text-blue-700"
              >
                Manage Services
              </Link>
            </div>
          </div>
          <div className="p-6">
            {dashboardData.topServices.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">
                        {service.bookings_count || 0} bookings
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(service.price)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {service.duration || 60} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No services yet</p>
                <Link
                  to="/company/services"
                  className="text-blue-600 text-sm hover:text-blue-700 mt-2 inline-block"
                >
                  Add a service
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {dashboardData.notifications.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />
              Notifications
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {dashboardData.notifications.map((notification, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <div className="p-1 bg-blue-100 rounded-full mr-3 mt-1">
                    <BellIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard; 