import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UsersIcon,
  StarIcon,
  TrendingUpIcon,
  ClockIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const CompanyAnalyticsPage = () => {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [dateRange, setDateRange] = useState('30d');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get company ID
  useEffect(() => {
    if (user?.companyId) {
      setCompanyId(user.companyId);
    } else if (user?.role === 'company_owner') {
      // Fetch user's company
      fetchUserCompany();
    }
  }, [user]);

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
  const fetchMetrics = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${companyId}/analytics/summary?days=${getDaysFromRange(dateRange)}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
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
    if (companyId) {
      fetchMetrics();
    }
  }, [companyId, dateRange]);

  const views = [
    { id: 'dashboard', name: 'Обзор', icon: ChartBarIcon },
    { id: 'revenue', name: 'Доходы', icon: CurrencyDollarIcon },
    { id: 'bookings', name: 'Бронирования', icon: CalendarDaysIcon },
    { id: 'customers', name: 'Клиенты', icon: UsersIcon },
    { id: 'performance', name: 'Эффективность', icon: TrendingUpIcon },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num || 0);
  };

  const renderContent = () => {
    if (!companyId) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Компания не найдена</p>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <AnalyticsDashboard companyId={companyId} />
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickMetricCard
                title="Сегодняшний доход"
                value={formatCurrency(metrics?.todayRevenue)}
                icon={CurrencyDollarIcon}
                color="green"
              />
              <QuickMetricCard
                title="Новые бронирования"
                value={formatNumber(metrics?.newBookings)}
                icon={CalendarDaysIcon}
                color="blue"
              />
              <QuickMetricCard
                title="Новые клиенты"
                value={formatNumber(metrics?.newCustomers)}
                icon={UsersIcon}
                color="purple"
              />
              <QuickMetricCard
                title="Рейтинг"
                value={`${metrics?.averageRating || 0}/5`}
                icon={StarIcon}
                color="yellow"
              />
            </div>

            {/* Recent Activity & Top Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentBookingsWidget companyId={companyId} />
              <TopServicesWidget companyId={companyId} />
            </div>
          </div>
        );

      case 'revenue':
        return <RevenueAnalyticsView companyId={companyId} dateRange={dateRange} />;
      
      case 'bookings':
        return <BookingAnalyticsView companyId={companyId} dateRange={dateRange} />;
      
      case 'customers':
        return <CustomerAnalyticsView companyId={companyId} dateRange={dateRange} />;
      
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
            <h1 className="text-3xl font-bold text-gray-900">Аналитика компании</h1>
            <p className="mt-2 text-gray-600">
              Отслеживайте производительность вашего бизнеса
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="7d">7 дней</option>
              <option value="30d">30 дней</option>
              <option value="90d">90 дней</option>
              <option value="1y">1 год</option>
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
    // Mock data - replace with API call
    setBookings([
      { id: 1, customerName: 'Анна Иванова', service: 'Груминг', time: '14:00', status: 'confirmed' },
      { id: 2, customerName: 'Петр Сидоров', service: 'Стрижка', time: '15:30', status: 'pending' },
      { id: 3, customerName: 'Мария Козлова', service: 'Мытье', time: '16:00', status: 'completed' },
    ]);
  }, [companyId]);

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    
    const labels = {
      confirmed: 'Подтверждено',
      pending: 'Ожидает',
      completed: 'Завершено',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Последние бронирования</h3>
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
          Посмотреть все бронирования →
        </button>
      </div>
    </div>
  );
};

// Top Services Widget
const TopServicesWidget = ({ companyId }) => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    // Mock data - replace with API call
    setServices([
      { name: 'Груминг', bookings: 45, revenue: 67500 },
      { name: 'Стрижка', bookings: 32, revenue: 48000 },
      { name: 'Мытье', bookings: 28, revenue: 21000 },
      { name: 'Маникюр', bookings: 15, revenue: 22500 },
    ]);
  }, [companyId]);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Популярные услуги</h3>
      <div className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{service.name}</p>
              <p className="text-sm text-gray-600">{service.bookings} бронирований</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(service.revenue)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Placeholder views - to be implemented with detailed analytics
const RevenueAnalyticsView = ({ companyId, dateRange }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Анализ доходов</h3>
    <p className="text-gray-600">Подробный анализ доходов за {dateRange}</p>
  </div>
);

const BookingAnalyticsView = ({ companyId, dateRange }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Анализ бронирований</h3>
    <p className="text-gray-600">Подробный анализ бронирований за {dateRange}</p>
  </div>
);

const CustomerAnalyticsView = ({ companyId, dateRange }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Анализ клиентов</h3>
    <p className="text-gray-600">Подробный анализ клиентской базы за {dateRange}</p>
  </div>
);

const PerformanceAnalyticsView = ({ companyId, dateRange }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Анализ эффективности</h3>
    <p className="text-gray-600">Подробный анализ эффективности за {dateRange}</p>
  </div>
);

export default CompanyAnalyticsPage; 