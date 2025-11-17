import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const EmployeeAnalytics = () => {
  const { apiCall } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('overview'); // overview, individual, comparison

  useEffect(() => {
    loadEmployees();
    loadAnalytics();
  }, [timeRange]);

  const loadEmployees = async () => {
    try {
      const response = await apiCall('/companies/employees', 'GET');
      if (response.success) {
        setEmployees(response.employees || []);
        if (response.employees?.length > 0 && !selectedEmployee) {
          setSelectedEmployee(response.employees[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall(`/companies/analytics/employees?days=${timeRange}`, 'GET');
      if (response.success) {
        setAnalytics(response.data || {});
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration (replace with real API data)
  const generateMockAnalytics = (employee) => {
    const baseMetrics = {
      totalBookings: Math.floor(Math.random() * 100) + 20,
      completedBookings: Math.floor(Math.random() * 80) + 15,
      cancelledBookings: Math.floor(Math.random() * 10) + 1,
      totalRevenue: (Math.random() * 5000) + 1000,
      averageRating: (Math.random() * 2) + 3,
      totalReviews: Math.floor(Math.random() * 50) + 5,
      hoursWorked: Math.floor(Math.random() * 160) + 40,
      utilizationRate: (Math.random() * 40) + 60, // 60-100%
      responseTime: Math.floor(Math.random() * 30) + 5, // minutes
      repeatCustomers: Math.floor(Math.random() * 20) + 5,
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      weeklyTrend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10) + 1)
    };

    return {
      ...baseMetrics,
      completionRate: ((baseMetrics.completedBookings / baseMetrics.totalBookings) * 100).toFixed(1),
      averageCheck: (baseMetrics.totalRevenue / baseMetrics.completedBookings).toFixed(2),
      efficiency: ((baseMetrics.hoursWorked / (parseInt(timeRange) * 8)) * 100).toFixed(1)
    };
  };

  const getEmployeeMetrics = (employee) => {
    return analytics[employee.id] || generateMockAnalytics(employee);
  };

  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds.excellent) return 'text-green-600';
    if (value >= thresholds.good) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (value, thresholds) => {
    if (value >= thresholds.excellent) return ArrowTrendingUpIcon;
    if (value >= thresholds.good) return ArrowPathIcon;
    return ArrowTrendingDownIcon;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'text-gray-600', trend = null }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
        {trend && (
          <div className="mt-4 flex items-center">
            {trend > 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
          <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend)}% vs last period
          </span>
        </div>
      )}
    </div>
  );

  const EmployeeCard = ({ employee, metrics, onClick, isSelected }) => (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-orange-500 bg-orange-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onClick(employee)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <p className="font-medium text-gray-900">
              {employee.first_name} {employee.last_name}
            </p>
            <p className="text-sm text-gray-500 capitalize">{employee.role}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium">{metrics.averageRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">{metrics.totalBookings}</p>
          <p className="text-xs text-gray-500">Bookings</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-blue-600">{metrics.completionRate}%</p>
          <p className="text-xs text-gray-500">Completion</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Last login: {formatDate(metrics.lastLogin)}</span>
        <span className={`px-2 py-1 rounded ${
          employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {employee.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="h-8 w-8 mr-3 text-orange-600" />
              Employee Analytics
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Performance metrics and insights for your team
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>

            {/* View Mode Selector */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'overview'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                  viewMode === 'individual'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                  viewMode === 'comparison'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Comparison
              </button>
            </div>
          </div>
        </div>

        {/* Overview Mode */}
        {viewMode === 'overview' && (
          <div className="space-y-6">
            {/* Team Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Employees"
                value={employees.length}
                subtitle={`${employees.filter(e => e.is_active).length} active`}
                icon={UserIcon}
                color="text-blue-600"
              />
              <MetricCard
                title="Total Bookings"
                value={employees.reduce((sum, emp) => sum + getEmployeeMetrics(emp).totalBookings, 0)}
                subtitle="This period"
                icon={CalendarDaysIcon}
                color="text-green-600"
                trend={12}
              />
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(employees.reduce((sum, emp) => sum + getEmployeeMetrics(emp).totalRevenue, 0))}
                subtitle="Generated by team"
                icon={CurrencyDollarIcon}
                color="text-purple-600"
                trend={8}
              />
              <MetricCard
                title="Average Rating"
                value={(employees.reduce((sum, emp) => sum + getEmployeeMetrics(emp).averageRating, 0) / employees.length).toFixed(1)}
                subtitle="Team performance"
                icon={StarIcon}
                color="text-yellow-600"
                trend={-2}
              />
            </div>

            {/* Employee Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(employee => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    metrics={getEmployeeMetrics(employee)}
                    onClick={setSelectedEmployee}
                    isSelected={selectedEmployee?.id === employee.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Individual Mode */}
        {viewMode === 'individual' && selectedEmployee && (
          <div className="space-y-6">
            {/* Employee Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserIcon className="h-12 w-12 text-gray-400 mr-4" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h2>
                    <p className="text-gray-600 capitalize">{selectedEmployee.role} • {selectedEmployee.department}</p>
                    <p className="text-sm text-gray-500">@{selectedEmployee.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <select
                    value={selectedEmployee.id}
                    onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Individual Metrics */}
            {(() => {
              const metrics = getEmployeeMetrics(selectedEmployee);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Bookings Completed"
                    value={metrics.completedBookings}
                    subtitle={`${metrics.completionRate}% completion rate`}
                    icon={CheckCircleIcon}
                    color="text-green-600"
                  />
                  <MetricCard
                    title="Revenue Generated"
                    value={formatCurrency(metrics.totalRevenue)}
                    subtitle={`${formatCurrency(metrics.averageCheck)} avg check`}
                    icon={CurrencyDollarIcon}
                    color="text-purple-600"
                  />
                  <MetricCard
                    title="Customer Rating"
                    value={`${metrics.averageRating.toFixed(1)}/5.0`}
                    subtitle={`${metrics.totalReviews} reviews`}
                    icon={StarIcon}
                    color="text-yellow-600"
                  />
                  <MetricCard
                    title="Utilization Rate"
                    value={`${metrics.utilizationRate.toFixed(1)}%`}
                    subtitle={`${metrics.hoursWorked}h worked`}
                    icon={ClockIcon}
                    color="text-blue-600"
                  />
                </div>
              );
            })()}

            {/* Detailed Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Indicators */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Indicators</h3>
                {(() => {
                  const metrics = getEmployeeMetrics(selectedEmployee);
                  const indicators = [
                    {
                      name: 'Completion Rate',
                      value: parseFloat(metrics.completionRate),
                      thresholds: { excellent: 90, good: 75 },
                      unit: '%'
                    },
                    {
                      name: 'Customer Satisfaction',
                      value: metrics.averageRating,
                      thresholds: { excellent: 4.5, good: 4.0 },
                      unit: '/5'
                    },
                    {
                      name: 'Response Time',
                      value: metrics.responseTime,
                      thresholds: { excellent: 10, good: 20 },
                      unit: 'min',
                      reverse: true
                    },
                    {
                      name: 'Utilization Rate',
                      value: parseFloat(metrics.utilizationRate),
                      thresholds: { excellent: 80, good: 60 },
                      unit: '%'
                    }
                  ];

                  return (
                    <div className="space-y-4">
                      {indicators.map((indicator, index) => {
                        const thresholds = indicator.reverse 
                          ? { excellent: indicator.thresholds.good, good: indicator.thresholds.excellent }
                          : indicator.thresholds;
                        const color = getPerformanceColor(indicator.value, thresholds);
                        const Icon = getPerformanceIcon(indicator.value, thresholds);

                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <Icon className={`h-5 w-5 mr-3 ${color}`} />
                              <span className="font-medium text-gray-900">{indicator.name}</span>
                            </div>
                            <span className={`font-semibold ${color}`}>
                              {indicator.value}{indicator.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {(() => {
                  const metrics = getEmployeeMetrics(selectedEmployee);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-sm text-gray-900">Bookings completed</span>
                        </div>
                        <span className="font-semibold text-green-600">{metrics.completedBookings}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                          <XCircleIcon className="h-5 w-5 text-red-600 mr-3" />
                          <span className="text-sm text-gray-900">Bookings cancelled</span>
                        </div>
                        <span className="font-semibold text-red-600">{metrics.cancelledBookings}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-blue-600 mr-3" />
                          <span className="text-sm text-gray-900">Repeat customers</span>
                        </div>
                        <span className="font-semibold text-blue-600">{metrics.repeatCustomers}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-gray-600 mr-3" />
                          <span className="text-sm text-gray-900">Last login</span>
                        </div>
                        <span className="font-medium text-gray-600">{formatDate(metrics.lastLogin)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Mode */}
        {viewMode === 'comparison' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bookings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilization %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => {
                      const metrics = getEmployeeMetrics(employee);
                      return (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.first_name} {employee.last_name}
                                </div>
                                <div className="text-sm text-gray-500 capitalize">{employee.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metrics.totalBookings}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(metrics.totalRevenue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-sm text-gray-900">{metrics.averageRating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metrics.completionRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {metrics.utilizationRate.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAnalytics;
