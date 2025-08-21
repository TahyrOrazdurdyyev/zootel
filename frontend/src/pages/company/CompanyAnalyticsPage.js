import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import CompanyLocationAnalytics from '../../components/analytics/CompanyLocationAnalytics';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UsersIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  PointElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CompanyAnalyticsPage = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [dateRange, setDateRange] = useState('30d');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  // Get company ID
  useEffect(() => {
    if (user?.companyId) {
      setCompanyId(user.companyId);
    } else if (user?.role === 'company_owner') {
      // Fetch user's company
      fetchUserCompany();
    }
  }, [user]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const fetchUserCompany = async () => {
    try {
      const response = await fetch('/api/companies/profile', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCompanyId(data.company.id);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  // Fetch company metrics
  useEffect(() => {
  const fetchMetrics = async () => {
    try {
        const response = await fetch(`/api/companies/${companyId}/analytics/metrics?days=${dateRange}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
      });
        
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        
      const data = await response.json();
        setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
        // Set empty metrics on error
        setMetrics({
          totalBookings: 0,
          totalRevenue: 0,
          newCustomers: 0,
          averageRating: 0,
          bookingsTrend: 0,
          revenueTrend: 0
        });
    } finally {
      setLoading(false);
    }
  };

    if (companyId) {
      fetchMetrics();
    }
  }, [companyId, dateRange]);

  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchMetrics();
    }
  }, [companyId, dateRange]);

  const views = [
    { id: 'dashboard', name: 'Overview', icon: ChartBarIcon },
    { id: 'revenue', name: 'Revenue', icon: CurrencyDollarIcon },
    { id: 'bookings', name: 'Bookings', icon: CalendarDaysIcon },
    { id: 'customers', name: 'Customers', icon: UsersIcon },
    { id: 'location', name: 'Location', icon: GlobeAltIcon },
    { id: 'performance', name: 'Performance', icon: ArrowTrendingUpIcon },
  ];

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const renderContent = () => {
    if (!companyId) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Company not found</p>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Track your business performance and insights</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.totalBookings || 0}</p>
            </div>
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                {metrics?.bookingsTrend !== undefined && (
                  <div className="flex items-center mt-2">
                    {metrics.bookingsTrend >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.bookingsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metrics.bookingsTrend)}% vs last period
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.totalRevenue)}</p>
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                {metrics?.revenueTrend !== undefined && (
                  <div className="flex items-center mt-2">
                    {metrics.revenueTrend >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metrics.revenueTrend)}% vs last period
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.newCustomers || 0}</p>
                  </div>
                  <div className="flex items-center">
                    <UsersIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{(metrics?.averageRating || 0).toFixed(1)}</p>
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Views Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveView('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'overview'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveView('bookings')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'bookings'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => setActiveView('customers')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'customers'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Customers
                  </button>
                </nav>
              </div>
            </div>

            {/* Conditional Analytics Views */}
            {activeView === 'overview' && <OverviewAnalytics companyId={companyId} dateRange={dateRange} />}
            {activeView === 'bookings' && <BookingAnalytics companyId={companyId} dateRange={dateRange} />}
            {activeView === 'customers' && <CustomerAnalytics companyId={companyId} dateRange={dateRange} />}
          </div>
        );

      case 'revenue':
        return <RevenueAnalyticsView companyId={companyId} dateRange={dateRange} />;
      
      case 'bookings':
        return <BookingAnalyticsView companyId={companyId} dateRange={dateRange} />;
      
      case 'customers':
        return <CustomerAnalyticsView companyId={companyId} dateRange={dateRange} />;
      
      case 'location':
        return <CompanyLocationAnalytics companyId={companyId} />;
      
      case 'performance':
        return <PerformanceAnalyticsView companyId={companyId} dateRange={dateRange} />;
      
      default:
        return <AnalyticsDashboard companyId={companyId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Analytics</h1>
            <p className="mt-2 text-gray-600">
              Track your business performance
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="1y">1 year</option>
            </select>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeView === view.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <view.icon className="w-5 h-5" />
                    <span>{view.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

// Quick Metric Card Component
const QuickMetricCard = ({ title, value, icon: Icon, color = "blue" }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

// Recent Bookings Widget
const RecentBookingsWidget = ({ companyId }) => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/bookings/recent?days=7`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setBookings(data.data);
      } catch (error) {
        console.error('Error fetching recent bookings:', error);
      }
    };
    fetchRecentBookings();
  }, [companyId]);

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    
    const labels = {
      confirmed: 'Confirmed',
      pending: 'Pending',
      completed: 'Completed',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
              <p className="text-sm text-gray-600">{booking.service} • {booking.time}</p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button className="text-sm text-orange-600 hover:text-orange-500">
          View all bookings →
        </button>
      </div>
    </div>
  );
};

// Top Services Widget
const TopServicesWidget = ({ companyId }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchTopServices = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/services/top?days=30`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setServices(data.data);
      } catch (error) {
        console.error('Error fetching top services:', error);
      }
    };
    fetchTopServices();
  }, [companyId]);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h3>
      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{service.name}</p>
              <p className="text-sm text-gray-600">{service.bookings} bookings</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(service.revenue)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Placeholder views - to be implemented with detailed analytics
const RevenueAnalyticsView = ({ companyId, dateRange }) => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueAnalytics = async () => {
      try {
        const [revenueResponse, avgCheckResponse] = await Promise.all([
          fetch(`/api/companies/${companyId}/analytics/revenue?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/companies/${companyId}/analytics/average-check?days=${getDaysFromRange(dateRange)}`)
        ]);

        const revenueData = await revenueResponse.json();
        const avgCheckData = await avgCheckResponse.json();

        setRevenueData({
          revenue: revenueData.data,
          averageCheck: avgCheckData.data
        });
      } catch (error) {
        console.error('Error fetching revenue analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchRevenueAnalytics();
    }
  }, [companyId, dateRange]);

  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis for {dateRange}</h3>
        
        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Total Revenue</h4>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueData?.revenue?.total_revenue || 0)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Average Check</h4>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(revenueData?.averageCheck?.overall_avg_check || 0)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Transactions</h4>
            <p className="text-2xl font-bold text-purple-600">{revenueData?.revenue?.total_transactions || 0}</p>
          </div>
        </div>

        {/* Average Check Trends Chart */}
        {revenueData?.averageCheck?.daily_trends && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Average Check Trend</h4>
            <div className="h-64">
              <Line
                data={{
                  labels: revenueData.averageCheck.daily_trends.map(item => item.date),
                  datasets: [{
                    label: 'Average Check',
                    data: revenueData.averageCheck.daily_trends.map(item => item.combined_avg_check),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: true,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BookingAnalyticsView = ({ companyId, dateRange }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingAnalytics = async () => {
      try {
        const [bookingsResponse, cancellationResponse, repeatOrdersResponse] = await Promise.all([
          fetch(`/api/companies/${companyId}/analytics/bookings?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/companies/${companyId}/analytics/cancellations?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/companies/${companyId}/analytics/repeat-orders?days=${getDaysFromRange(dateRange)}`)
        ]);

        const bookingsData = await bookingsResponse.json();
        const cancellationData = await cancellationResponse.json();
        const repeatOrdersData = await repeatOrdersResponse.json();

        setAnalyticsData({
          bookings: bookingsData.data,
          cancellations: cancellationData.data,
          repeatOrders: repeatOrdersData.data
        });
      } catch (error) {
        console.error('Error fetching booking analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchBookingAnalytics();
    }
  }, [companyId, dateRange]);

  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Booking Overview */}
      <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Total Bookings</h4>
            <p className="text-2xl font-bold text-blue-600">{analyticsData?.bookings?.total_bookings || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Completed</h4>
            <p className="text-2xl font-bold text-green-600">{analyticsData?.bookings?.completed_bookings || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Cancelled</h4>
            <p className="text-2xl font-bold text-red-600">{analyticsData?.cancellations?.cancelled_bookings || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Cancellation %</h4>
            <p className="text-2xl font-bold text-yellow-600">{(analyticsData?.cancellations?.cancellation_rate || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Repeat Orders Analytics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repeat Orders</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Total Customers</h4>
            <p className="text-2xl font-bold text-purple-600">{analyticsData?.repeatOrders?.total_customers || 0}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Repeat Customers</h4>
            <p className="text-2xl font-bold text-indigo-600">{analyticsData?.repeatOrders?.repeat_customers || 0}</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Repeat %</h4>
            <p className="text-2xl font-bold text-pink-600">{(analyticsData?.repeatOrders?.repeat_rate || 0).toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Revenue from Repeat Customers</h4>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(analyticsData?.repeatOrders?.repeat_customer_revenue || 0)}</p>
          <p className="text-sm text-gray-600">Average orders per customer: {(analyticsData?.repeatOrders?.avg_orders_per_customer || 0).toFixed(1)}</p>
        </div>
      </div>

      {/* Cancellation Trends */}
      {analyticsData?.cancellations?.cancellation_trends && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancellation Trend</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: analyticsData.cancellations.cancellation_trends.map(item => item.date),
                datasets: [{
                  label: 'Cancellations by Day',
                  data: analyticsData.cancellations.cancellation_trends.map(item => item.count),
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  borderColor: 'rgba(239, 68, 68, 1)',
                  borderWidth: 1,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerAnalyticsView = ({ companyId, dateRange }) => {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerAnalytics = async () => {
      try {
        const [segmentationResponse, refundsResponse] = await Promise.all([
          fetch(`/api/companies/${companyId}/analytics/customer-segmentation?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/companies/${companyId}/analytics/refunds?days=${getDaysFromRange(dateRange)}`)
        ]);

        const segmentationData = await segmentationResponse.json();
        const refundsData = await refundsResponse.json();

        setCustomerData({
          segmentation: segmentationData.data,
          refunds: refundsData.data
        });
      } catch (error) {
        console.error('Error fetching customer analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCustomerAnalytics();
    }
  }, [companyId, dateRange]);

  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Customer Segmentation */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Сегментация клиентов</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Новые клиенты</h4>
            <p className="text-2xl font-bold text-green-600">{customerData?.segmentation?.new_customers || 0}</p>
            <p className="text-sm text-green-600">{(customerData?.segmentation?.new_customer_rate || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Возвращающиеся</h4>
            <p className="text-2xl font-bold text-blue-600">{customerData?.segmentation?.returning_customers || 0}</p>
            <p className="text-sm text-blue-600">{(customerData?.segmentation?.returning_customer_rate || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">VIP клиенты</h4>
            <p className="text-2xl font-bold text-purple-600">{customerData?.segmentation?.high_value_customers || 0}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Средний LTV</h4>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(customerData?.segmentation?.avg_customer_lifetime_value || 0)}</p>
          </div>
        </div>

        {/* Customer Value Distribution */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{customerData?.segmentation?.high_value_customers || 0}</div>
            <div className="text-sm text-gray-600">Высокая ценность (10k+)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{customerData?.segmentation?.medium_value_customers || 0}</div>
            <div className="text-sm text-gray-600">Средняя ценность (5k-10k)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{customerData?.segmentation?.low_value_customers || 0}</div>
            <div className="text-sm text-gray-600">Низкая ценность ({'<'}5k)</div>
          </div>
        </div>
      </div>

      {/* Refunds Analytics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Анализ возвратов</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Всего платежей</h4>
            <p className="text-2xl font-bold text-gray-600">{customerData?.refunds?.total_payments || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Возвратов</h4>
            <p className="text-2xl font-bold text-red-600">{customerData?.refunds?.refunded_payments || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">% возвратов</h4>
            <p className="text-2xl font-bold text-yellow-600">{(customerData?.refunds?.refund_rate || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Сумма возвратов</h4>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(customerData?.refunds?.total_refund_amount || 0)}</p>
          </div>
        </div>

        {/* Refund Trends */}
        {customerData?.refunds?.refund_trends && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Тренд возвратов</h4>
            <div className="h-64">
              <Line
                data={{
                  labels: customerData.refunds.refund_trends.map(item => item.date),
                  datasets: [{
                    label: 'Сумма возвратов',
                    data: customerData.refunds.refund_trends.map(item => item.amount),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PerformanceAnalyticsView = ({ companyId, dateRange }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceAnalytics = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/analytics/team-workload?days=${getDaysFromRange(dateRange)}`);
        const data = await response.json();
        setPerformanceData(data.data);
      } catch (error) {
        console.error('Error fetching performance analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchPerformanceAnalytics();
    }
  }, [companyId, dateRange]);

  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Обзор команды</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Всего бронирований</h4>
            <p className="text-2xl font-bold text-blue-600">{performanceData?.total_team_bookings || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Часов работы</h4>
            <p className="text-2xl font-bold text-green-600">{(performanceData?.total_team_hours || 0).toFixed(1)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Доход команды</h4>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(performanceData?.total_team_revenue || 0)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600">Загруженность</h4>
            <p className="text-2xl font-bold text-orange-600">{(performanceData?.avg_utilization || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Производительность сотрудников</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Бронирования</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Часы работы</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Загруженность</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Доход</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData?.employee_workload?.map((employee, index) => (
                <tr key={employee.employee_id || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.completed_bookings}/{employee.total_bookings}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.work_hours.toFixed(1)}ч</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{employee.utilization.toFixed(1)}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(employee.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(employee.revenue_generated)}</div>
                  </td>
                </tr>
              )) || []}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompanyAnalyticsPage; 