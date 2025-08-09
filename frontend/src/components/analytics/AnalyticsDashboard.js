import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = ({ 
  companyId = null, 
  isAdmin = false,
  className = "" 
}) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Date range options
  const dateRanges = [
    { value: '7d', label: '7 дней' },
    { value: '30d', label: '30 дней' },
    { value: '90d', label: '90 дней' },
    { value: '1y', label: '1 год' }
  ];

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoints = [];
      
      if (isAdmin) {
        // Global analytics for admin
        endpoints.push(
          fetch('/api/admin/analytics/global-dashboard'),
          fetch(`/api/admin/analytics/revenue-trends?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/admin/analytics/user-registration-trends?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/admin/analytics/booking-trends?days=${getDaysFromRange(dateRange)}`),
          fetch('/api/admin/analytics/top-companies?limit=10'),
          fetch('/api/admin/analytics/service-category-performance')
        );
      } else if (companyId) {
        // Company-specific analytics
        endpoints.push(
          fetch(`/api/companies/${companyId}/analytics/dashboard`),
          fetch(`/api/companies/${companyId}/analytics/revenue?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/companies/${companyId}/analytics/bookings?days=${getDaysFromRange(dateRange)}`),
          fetch(`/api/companies/${companyId}/analytics/customers?days=${getDaysFromRange(dateRange)}`)
        );
      }

      const responses = await Promise.all(endpoints);
      const data = await Promise.all(responses.map(r => r.json()));
      
      setDashboardData({
        global: data[0]?.data || data[0],
        revenue: data[1]?.data || data[1],
        registrations: data[2]?.data || data[2],
        bookings: data[3]?.data || data[3],
        topCompanies: data[4]?.data || data[4],
        categories: data[5]?.data || data[5],
      });
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchAnalytics();
  }, [dateRange, companyId, isAdmin]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  // Format number with abbreviations
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Calculate percentage change
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  // Metric Card Component
  const MetricCard = ({ title, value, change, icon: Icon, color = "blue" }) => {
    const isPositive = parseFloat(change) >= 0;
    
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <TrendingUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change)}%
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <ArrowPathIcon className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="btn-primary mt-4"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Глобальная аналитика' : 'Аналитика компании'}
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Обновить</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData?.global && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Общий доход"
            value={formatCurrency(dashboardData.global.totalRevenue || 0)}
            change={calculateChange(
              dashboardData.global.totalRevenue, 
              dashboardData.global.previousRevenue
            )}
            icon={CurrencyDollarIcon}
            color="green"
          />
          <MetricCard
            title="Всего пользователей"
            value={formatNumber(dashboardData.global.totalUsers || 0)}
            change={calculateChange(
              dashboardData.global.totalUsers,
              dashboardData.global.previousUsers
            )}
            icon={UserIcon}
            color="blue"
          />
          <MetricCard
            title="Бронирования"
            value={formatNumber(dashboardData.global.totalBookings || 0)}
            change={calculateChange(
              dashboardData.global.totalBookings,
              dashboardData.global.previousBookings
            )}
            icon={CalendarIcon}
            color="purple"
          />
          <MetricCard
            title="Активных компаний"
            value={formatNumber(dashboardData.global.activeCompanies || 0)}
            change={calculateChange(
              dashboardData.global.activeCompanies,
              dashboardData.global.previousCompanies
            )}
            icon={ChartBarIcon}
            color="orange"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        {dashboardData?.revenue && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Тренд доходов</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: dashboardData.revenue.labels || [],
                  datasets: [{
                    label: 'Доход',
                    data: dashboardData.revenue.data || [],
                    borderColor: 'rgb(255, 69, 0)',
                    backgroundColor: 'rgba(255, 69, 0, 0.1)',
                    fill: true,
                  }]
                }}
                options={chartOptions}
              />
            </div>
          </div>
        )}

        {/* Bookings Chart */}
        {dashboardData?.bookings && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Бронирования</h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: dashboardData.bookings.labels || [],
                  datasets: [{
                    label: 'Бронирования',
                    data: dashboardData.bookings.data || [],
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                  }]
                }}
                options={chartOptions}
              />
            </div>
          </div>
        )}

        {/* User Registration Chart */}
        {dashboardData?.registrations && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Регистрации пользователей</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: dashboardData.registrations.labels || [],
                  datasets: [{
                    label: 'Новые пользователи',
                    data: dashboardData.registrations.data || [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    fill: true,
                  }]
                }}
                options={chartOptions}
              />
            </div>
          </div>
        )}

        {/* Service Categories Performance */}
        {dashboardData?.categories && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Производительность категорий</h3>
            <div className="h-64">
              <Doughnut
                data={{
                  labels: dashboardData.categories.labels || [],
                  datasets: [{
                    data: dashboardData.categories.data || [],
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0',
                      '#9966FF',
                      '#FF9F40'
                    ],
                  }]
                }}
                options={pieChartOptions}
              />
            </div>
          </div>
        )}
      </div>

      {/* Top Companies Table (Admin only) */}
      {isAdmin && dashboardData?.topCompanies && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Топ компании</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Компания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Доход
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Бронирования
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Рейтинг
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.topCompanies.map((company, index) => (
                  <tr key={company.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {company.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(company.revenue || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {company.bookings || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {company.rating ? `${company.rating}/5` : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 