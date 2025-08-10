import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
      
      case 'geography':
        return <GeographyAnalyticsTab timeframe={timeframe} />;
      
      default:
        return <AnalyticsDashboard isAdmin={true} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Аналитика платформы</h1>
          <p className="mt-2 text-gray-600">
            Комплексная аналитика и метрики для SuperAdmin
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

  useEffect(() => {
    // Mock data - replace with API call
    setActivities([
      { id: 1, type: 'user_registration', message: 'Новый пользователь зарегистрировался', time: '5 мин назад' },
      { id: 2, type: 'company_created', message: 'Создана новая компания "Pet Care Pro"', time: '15 мин назад' },
      { id: 3, type: 'booking_completed', message: 'Завершено бронирование на сумму ₽2,500', time: '30 мин назад' },
      { id: 4, type: 'payment_processed', message: 'Обработан платеж ₽1,200', time: '1 час назад' },
    ]);
  }, []);

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Последняя активность</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Platform Health Widget
const PlatformHealthWidget = () => {
  const healthMetrics = [
    { name: 'Время отклика API', value: '120ms', status: 'good' },
    { name: 'Доступность', value: '99.9%', status: 'good' },
    { name: 'Активные сессии', value: '1,234', status: 'good' },
    { name: 'Ошибки', value: '0.1%', status: 'good' },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Состояние платформы</h3>
      <div className="space-y-3">
        {healthMetrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{metric.name}</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{metric.value}</span>
              <div className={`w-2 h-2 rounded-full ${
                metric.status === 'good' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Top Metrics Widget
const TopMetricsWidget = () => {
  const topMetrics = [
    { name: 'Самая популярная услуга', value: 'Груминг' },
    { name: 'Топ город', value: 'Москва' },
    { name: 'Средний чек', value: '₽2,450' },
    { name: 'Конверсия', value: '12.5%' },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ключевые показатели</h3>
      <div className="space-y-3">
        {topMetrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{metric.name}</span>
            <span className="text-sm font-medium text-gray-900">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Placeholder tabs - to be implemented
const UserAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Аналитика пользователей</h3>
    <p className="text-gray-600">Подробная аналитика пользователей за {timeframe}</p>
    {/* Add user-specific charts and metrics here */}
  </div>
);

const CompanyAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Аналитика компаний</h3>
    <p className="text-gray-600">Производительность компаний за {timeframe}</p>
    {/* Add company-specific charts and metrics here */}
  </div>
);

const RevenueAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Финансовая аналитика</h3>
    <p className="text-gray-600">Доходы и финансовые метрики за {timeframe}</p>
    {/* Add revenue-specific charts and metrics here */}
  </div>
);

const BookingAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Аналитика бронирований</h3>
    <p className="text-gray-600">Статистика бронирований за {timeframe}</p>
    {/* Add booking-specific charts and metrics here */}
  </div>
);

const GeographyAnalyticsTab = ({ timeframe }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Географическая аналитика</h3>
    <p className="text-gray-600">Распределение по регионам за {timeframe}</p>
    {/* Add geography-specific charts and maps here */}
  </div>
);

export default AnalyticsPage; 