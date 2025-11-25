import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  ArrowPathIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const CompanyAnalyticsDashboard = ({ companyId, dateRange = '30d' }) => {
  const { apiCall } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Date range conversion
  const getDaysFromRange = (range) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Fetching company analytics for:', companyId);
      
      const [dashboard, revenue, bookings, customers] = await Promise.all([
        apiCall(`/companies/analytics/dashboard?days=${getDaysFromRange(dateRange)}`),
        apiCall(`/companies/analytics/revenue?days=${getDaysFromRange(dateRange)}`),
        apiCall(`/companies/analytics/bookings?days=${getDaysFromRange(dateRange)}`),
        apiCall(`/companies/analytics/customers?days=${getDaysFromRange(dateRange)}`)
      ]);

      console.log('📊 Analytics responses:', { dashboard, revenue, bookings, customers });

      setDashboardData({
        dashboard: dashboard?.data || {},
        revenue: revenue?.data || {},
        bookings: bookings?.data || {},
        customers: customers?.data || {}
      });
    } catch (err) {
      console.error('❌ Analytics fetch error:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [companyId, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="w-5 h-5 animate-spin text-orange-500" />
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={fetchAnalytics}
            className="ml-4 text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { dashboard } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(dashboard?.total_revenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Bookings
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboard?.total_bookings || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Customers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboard?.total_customers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Rating
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboard?.average_rating ? dashboard.average_rating.toFixed(1) : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trends */}
      {dashboardData?.revenue?.daily_trends && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
          <div className="space-y-3">
            {dashboardData.revenue.daily_trends.slice(0, 7).map((trend, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{trend.date}</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(trend.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trend.bookings} bookings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Status Distribution */}
      {dashboardData?.bookings?.status_distribution && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Status</h3>
          <div className="space-y-3">
            {dashboardData.bookings.status_distribution.map((status, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{status.status}</span>
                <span className="text-sm font-medium text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Analytics */}
      {dashboardData?.customers && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Analytics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.customers.new_customers || 0}
              </div>
              <div className="text-sm text-gray-500">New Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData.customers.returning_customers || 0}
              </div>
              <div className="text-sm text-gray-500">Returning Customers</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyAnalyticsDashboard;
