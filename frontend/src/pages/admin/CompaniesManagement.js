import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BuildingOfficeIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CompaniesManagement = () => {
  const { apiCall } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [featureStatus, setFeatureStatus] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/companies', 'GET');
      if (response.success) {
        setCompanies(response.data || []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCRM = async (companyId, currentStatus) => {
    try {
      const enable = !currentStatus;
      
      // Check permission
      const checkResponse = await apiCall(`/admin/companies/${companyId}/check-crm-toggle?enable=${enable}`, 'GET');
      
      if (!checkResponse.can_toggle) {
        alert(`Cannot ${enable ? 'enable' : 'disable'} CRM: ${checkResponse.reason}`);
        return;
      }

      const response = await apiCall(`/admin/companies/${companyId}/toggle-manual-crm`, 'PUT');
      if (response.success) {
        await loadCompanies(); // Reload list
        alert(`CRM ${enable ? 'enabled' : 'disabled'} for company`);
      }
    } catch (error) {
      console.error('Error toggling CRM:', error);
      alert('Error changing CRM status');
    }
  };

  const handleToggleAI = async (companyId, currentStatus) => {
    try {
      const enable = !currentStatus;
      
      // Check permission
      const checkResponse = await apiCall(`/admin/companies/${companyId}/check-ai-toggle?enable=${enable}`, 'GET');
      
      if (!checkResponse.can_toggle) {
        alert(`Cannot ${enable ? 'enable' : 'disable'} AI agents: ${checkResponse.reason}`);
        return;
      }

      const response = await apiCall(`/admin/companies/${companyId}/toggle-manual-ai`, 'PUT');
      if (response.success) {
        await loadCompanies(); // Reload list
        alert(`AI agents ${enable ? 'enabled' : 'disabled'} for company`);
      }
    } catch (error) {
      console.error('Error toggling AI:', error);
      alert('Error changing AI agents status');
    }
  };

  const showFeatureDetails = async (companyId) => {
    try {
      const response = await apiCall(`/admin/companies/${companyId}/feature-status`, 'GET');
      if (response.success) {
        setFeatureStatus(response.data);
        setSelectedCompany(companies.find(c => c.id === companyId));
        setShowFeatureModal(true);
      }
    } catch (error) {
      console.error('Error loading feature status:', error);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await apiCall('/admin/companies/available-plans', 'GET');
      if (response.success) {
        setAvailablePlans(response.data || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const showPlanManagement = async (company) => {
    setSelectedCompany(company);
    await loadAvailablePlans();
    setShowPlanModal(true);
  };

  const assignPlan = async (planId, billingCycle) => {
    try {
      const response = await apiCall(`/admin/companies/${selectedCompany.id}/assign-plan`, 'POST', {
        plan_id: planId,
        billing_cycle: billingCycle
      });
      
      if (response.success) {
        alert('Plan assigned successfully!');
        setShowPlanModal(false);
        loadCompanies(); // Reload companies to show updated data
      } else {
        alert('Error assigning plan: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning plan:', error);
      alert('Error assigning plan: ' + error.message);
    }
  };

  const removePlan = async () => {
    if (!confirm('Are you sure you want to remove the current plan from this company?')) {
      return;
    }

    try {
      const response = await apiCall(`/admin/companies/${selectedCompany.id}/remove-plan`, 'DELETE');
      
      if (response.success) {
        alert('Plan removed successfully!');
        setShowPlanModal(false);
        loadCompanies(); // Reload companies to show updated data
      } else {
        alert('Error removing plan: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error removing plan:', error);
      alert('Error removing plan: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircleIcon, 
        label: 'Active' 
      },
      trial: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: ClockIcon, 
        label: 'Trial Period' 
      },
      trial_expired: { 
        color: 'bg-red-100 text-red-800', 
        icon: ExclamationTriangleIcon, 
        label: 'Trial Expired' 
      },
      paid: { 
        color: 'bg-emerald-100 text-emerald-800', 
        icon: CreditCardIcon, 
        label: 'Paid' 
      },
      inactive: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: XCircleIcon, 
        label: 'Inactive' 
      }
    };

    const config = statusConfig[status] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₽';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  const filteredAndSortedCompanies = companies
    .filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.business_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
      const matchesPlan = planFilter === 'all' || company.plan_name === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const uniquePlans = [...new Set(companies.map(c => c.plan_name).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading companies...</p>
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
              <BuildingOfficeIcon className="h-8 w-8 mr-3 text-blue-600" />
              Company Management
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Total companies: {companies.length} | Filtered: {filteredAndSortedCompanies.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="trial_expired">Trial Expired</option>
                <option value="paid">Paid</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Plans</option>
                {uniquePlans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">By Creation Date</option>
                <option value="name">By Name</option>
                <option value="total_revenue">By Revenue</option>
                <option value="total_bookings">By Bookings</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{company.business_type}</p>
                    </div>
                  </div>
                  {getStatusBadge(company.status)}
                </div>

                {/* Owner Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Owner
                  </h4>
                  <p className="text-sm text-gray-900">
                    {company.owner_first_name} {company.owner_last_name}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <EnvelopeIcon className="h-3 w-3 mr-1" />
                    {company.owner_email}
                  </p>
                </div>

                {/* Plan Info */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <CreditCardIcon className="h-4 w-4 mr-1" />
                    Subscription Plan
                  </h4>
                  <p className="text-sm font-semibold text-blue-900">{company.plan_name || 'No plan'}</p>
                  <p className="text-sm text-blue-700">{formatCurrency(company.plan_price)}/mo</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {company.phone && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <PhoneIcon className="h-3 w-3 mr-2" />
                      {company.phone}
                    </p>
                  )}
                  {company.email && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <EnvelopeIcon className="h-3 w-3 mr-2" />
                      {company.email}
                    </p>
                  )}
                  {company.website && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <GlobeAltIcon className="h-3 w-3 mr-2" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {company.website}
                      </a>
                    </p>
                  )}
                  {(company.city || company.country) && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-2" />
                      {[company.city, company.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-green-900">{company.total_bookings}</p>
                    <p className="text-xs text-green-700">Bookings</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <UsersIcon className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-purple-900">{company.total_customers}</p>
                    <p className="text-xs text-purple-700">Clients</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <CreditCardIcon className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-yellow-900">{formatCurrency(company.total_revenue)}</p>
                    <p className="text-xs text-yellow-700">Revenue</p>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <UsersIcon className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-indigo-900">{company.employee_count}</p>
                    <p className="text-xs text-indigo-700">Employees</p>
                  </div>
                </div>

                {/* Trial Info */}
                {(company.trial_start_date || company.trial_end_date) && (
                  <div className="p-3 bg-orange-50 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-orange-700 mb-1 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      Trial Period
                    </h4>
                    {company.trial_start_date && (
                      <p className="text-xs text-orange-600">
                        Start: {formatDate(company.trial_start_date)}
                      </p>
                    )}
                    {company.trial_end_date && (
                      <p className="text-xs text-orange-600">
                        End: {formatDate(company.trial_end_date)}
                      </p>
                    )}
                  </div>
                )}

                {/* Plan Info */}
                <div className="p-3 bg-blue-50 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                    <CreditCardIcon className="h-4 w-4 mr-1" />
                    Subscription Plan
                  </h4>
                  {company.plan_name ? (
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{company.plan_name}</p>
                      <p className="text-xs text-blue-600">${company.plan_price}/month</p>
                      <p className="text-xs text-blue-600">Status: {company.status}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-600">No active plan</p>
                  )}
                  <button
                    onClick={() => showPlanManagement(company)}
                    className="mt-2 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    Manage Plan
                  </button>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => handleToggleCRM(company.id, company.manual_enabled_crm)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${
                        company.manual_enabled_crm 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      } hover:bg-opacity-80 transition-colors`}
                    >
                      CRM: {company.manual_enabled_crm ? 'ON' : 'OFF'}
                    </button>
                    
                    <button
                      onClick={() => handleToggleAI(company.id, company.manual_enabled_ai_agents)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${
                        company.manual_enabled_ai_agents 
                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      } hover:bg-opacity-80 transition-colors`}
                    >
                      AI: {company.manual_enabled_ai_agents ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => showFeatureDetails(company.id)}
                      className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(company.created_at)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated: {formatDate(company.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedCompanies.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-500">
              {companies.length === 0
                ? 'No registered companies yet.'
                : 'Try changing the filter parameters.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Feature Details Modal */}
      {showFeatureModal && featureStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Feature Status: {selectedCompany?.name}
                </h3>
                <button
                  onClick={() => setShowFeatureModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* CRM Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CogIcon className="h-5 w-5 mr-2" />
                    CRM System
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Manually enabled:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        featureStatus.manual_crm 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {featureStatus.manual_crm ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Paid:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        featureStatus.has_paid_crm 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {featureStatus.has_paid_crm ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    AI Agents
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Manually enabled:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        featureStatus.manual_ai 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {featureStatus.manual_ai ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Has paid ones:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        featureStatus.has_paid_ai 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {featureStatus.has_paid_ai ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* AI Agents from Plan */}
                  {featureStatus.included_ai_agents && featureStatus.included_ai_agents.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-sm text-gray-700 mb-2">Subscription agents (protected):</h5>
                      <div className="flex flex-wrap gap-2">
                        {featureStatus.included_ai_agents.map((agent) => (
                          <span key={agent} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Agents as Addons */}
                  {featureStatus.addon_ai_agents && featureStatus.addon_ai_agents.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-2">Additional agents (can disable):</h5>
                      <div className="flex flex-wrap gap-2">
                        {featureStatus.addon_ai_agents.map((agent) => (
                          <span key={agent} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subscription Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Subscription
                  </h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        featureStatus.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {featureStatus.subscription_status || 'No subscription'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Plan:</span>
                      <span className="ml-2 font-medium">{featureStatus.plan_id || 'Not selected'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowFeatureModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Management Modal */}
      {showPlanModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Plan Management: {selectedCompany.name}
                </h3>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Current Plan */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Plan</h4>
                {selectedCompany.plan_name ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedCompany.plan_name}</p>
                      <p className="text-sm text-gray-600">${selectedCompany.plan_price}/month</p>
                      <p className="text-sm text-gray-600">Status: {selectedCompany.status}</p>
                    </div>
                    <button
                      onClick={removePlan}
                      className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded hover:bg-red-200 transition-colors"
                    >
                      Remove Plan
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600">No active plan</p>
                )}
              </div>

              {/* Available Plans */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Assign New Plan</h4>
                {loadingPlans ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading plans...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availablePlans.map((plan) => (
                      <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-semibold text-gray-900">{plan.name}</h5>
                            <p className="text-sm text-gray-600">{plan.description}</p>
                            <div className="mt-1">
                              <span className="text-sm font-medium text-green-600">
                                ${plan.monthly_price}/month
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                or ${plan.yearly_price}/year
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => assignPlan(plan.id, 'monthly')}
                            className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200 transition-colors"
                          >
                            Assign Monthly
                          </button>
                          <button
                            onClick={() => assignPlan(plan.id, 'yearly')}
                            className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200 transition-colors"
                          >
                            Assign Yearly
                          </button>
                          <button
                            onClick={() => assignPlan(plan.id, 'lifetime')}
                            className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded hover:bg-purple-200 transition-colors"
                          >
                            Assign Lifetime
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesManagement; 