import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PermissionsManager from '../../components/employees/PermissionsManager';
import EmployeeAnalytics from '../../components/employees/EmployeeAnalytics';
import EmployeeSchedule from '../../components/employees/EmployeeSchedule';
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const EmployeesManagementPage = () => {
  const { apiCall } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // list, analytics

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    permissions: [],
    hireDate: '',
    salary: ''
  });

  const departments = [
    { value: 'management', label: 'Management' },
    { value: 'medical', label: 'Medical' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'reception', label: 'Reception' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'analytics', label: 'Analytics' }
  ];

  const predefinedRoles = [
    { value: 'manager', label: 'Менеджер', department: 'management' },
    { value: 'veterinarian', label: 'Ветеринар', department: 'medical' },
    { value: 'groomer', label: 'Грумер', department: 'grooming' },
    { value: 'receptionist', label: 'Администратор', department: 'reception' },
    { value: 'cashier', label: 'Кассир', department: 'reception' },
    { value: 'analyst', label: 'Аналитик', department: 'analytics' }
  ];

  useEffect(() => {
    loadEmployees();
    loadRolesAndPermissions();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, roleFilter, departmentFilter, statusFilter]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/companies/employees', 'GET');
      if (response.success) {
        setEmployees(response.employees || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
      // Show mock data for demonstration
      setEmployees([
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          username: 'john.doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: 'veterinarian',
          department: 'medical',
          permissions: ['view_bookings', 'edit_bookings', 'view_customers'],
          hire_date: '2023-01-15',
          salary: 75000,
          is_active: true,
          last_login: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          username: 'jane.smith',
          email: 'jane@example.com',
          phone: '+1234567891',
          role: 'groomer',
          department: 'grooming',
          permissions: ['view_bookings', 'edit_bookings'],
          hire_date: '2023-03-20',
          salary: 45000,
          is_active: true,
          last_login: '2024-01-14T16:45:00Z'
        },
        {
          id: '3',
          first_name: 'Mike',
          last_name: 'Johnson',
          username: 'mike.johnson',
          email: 'mike@example.com',
          phone: '+1234567892',
          role: 'manager',
          department: 'management',
          permissions: ['all'],
          hire_date: '2022-06-10',
          salary: 85000,
          is_active: true,
          last_login: '2024-01-15T09:15:00Z'
        }
      ]);
      alert('Using demo data - API connection failed. Please check server status.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRolesAndPermissions = async () => {
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiCall('/companies/employees/reference/roles', 'GET'),
        apiCall('/companies/employees/reference/permissions', 'GET')
      ]);
      
      if (rolesResponse.success) {
        setAvailableRoles(rolesResponse.roles || []);
      }
      if (permissionsResponse.success) {
        setAvailablePermissions(permissionsResponse.permissions || []);
      }
    } catch (error) {
      console.error('Failed to load roles and permissions:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(employee =>
        employee.first_name?.toLowerCase().includes(term) ||
        employee.last_name?.toLowerCase().includes(term) ||
        employee.email?.toLowerCase().includes(term) ||
        employee.username?.toLowerCase().includes(term) ||
        employee.phone?.includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(employee => employee.role === roleFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee => employee.department === departmentFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(employee => employee.is_active === isActive);
    }

    setFilteredEmployees(filtered);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      permissions: [],
      hireDate: '',
      salary: ''
    });
  };

  const handleCreateEmployee = () => {
    resetForm();
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = (employee) => {
    setFormData({
      username: employee.username || '',
      password: '', // Don't populate password for editing
      firstName: employee.first_name || '',
      lastName: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || '',
      department: employee.department || '',
      permissions: employee.permissions || [],
      hireDate: employee.hire_date ? employee.hire_date.split('T')[0] : '',
      salary: employee.salary || ''
    });
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        permissions: formData.permissions,
        hire_date: formData.hireDate || null,
        salary: formData.salary ? parseFloat(formData.salary) : null
      };

      // Add password only for new employees
      if (!editingEmployee) {
        payload.password = formData.password;
      }

      const endpoint = editingEmployee 
        ? `/companies/employees/${editingEmployee.id}`
        : '/companies/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      console.log('🚀 Sending request:', { endpoint, method, payload });
      const response = await apiCall(endpoint, method, payload);
      console.log('📥 Response received:', response);
      
      if (response.success) {
        alert(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!');
        setShowForm(false);
        resetForm();
        loadEmployees();
      } else {
        alert(response.error || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('Failed to save employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateEmployee = async (employee) => {
    if (!confirm(`Are you sure you want to deactivate ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }

    try {
      const response = await apiCall(`/companies/employees/${employee.id}`, 'DELETE');
      if (response.success) {
        alert('Employee deactivated successfully!');
        loadEmployees();
      } else {
        alert(response.error || 'Failed to deactivate employee');
      }
    } catch (error) {
      console.error('Failed to deactivate employee:', error);
      alert('Failed to deactivate employee. Please try again.');
    }
  };

  const handleManagePermissions = (employee) => {
    setSelectedEmployee(employee);
    setShowPermissionsModal(true);
  };

  const handleViewSchedule = (employee) => {
    setSelectedEmployee(employee);
    setShowScheduleModal(true);
  };

  const handleUpdatePermissions = async (updateData) => {
    try {
      // Update both role and permissions
      const response = await apiCall(
        `/companies/employees/${selectedEmployee.id}`,
        'PUT',
        {
          role: updateData.role,
          permissions: updateData.permissions
        }
      );
      
      if (response.success) {
        alert('Permissions updated successfully!');
        setShowPermissionsModal(false);
        loadEmployees();
      } else {
        alert(response.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Failed to update permissions:', error);
      alert('Failed to update permissions. Please try again.');
    }
  };

  const handleRoleChange = (role) => {
    setFormData(prev => {
      const selectedRole = predefinedRoles.find(r => r.value === role);
      return {
        ...prev,
        role,
        department: selectedRole ? selectedRole.department : prev.department
      };
    });
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(salary);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="w-4 h-4 mr-1" />
        Inactive
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      manager: 'bg-purple-100 text-purple-800',
      veterinarian: 'bg-blue-100 text-blue-800',
      groomer: 'bg-green-100 text-green-800',
      receptionist: 'bg-yellow-100 text-yellow-800',
      cashier: 'bg-orange-100 text-orange-800',
      analyst: 'bg-indigo-100 text-indigo-800'
    };

    const roleLabel = predefinedRoles.find(r => r.value === role)?.label || role;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {roleLabel}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  // Show analytics view
  if (currentView === 'analytics') {
    return <EmployeeAnalytics />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UsersIcon className="h-8 w-8 mr-3 text-orange-600" />
              Employee Management
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Total employees: {employees.length} | Active: {employees.filter(e => e.is_active).length} | 
              Filtered: {filteredEmployees.length}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setCurrentView('list')}
                className={`px-4 py-2 text-sm font-medium flex items-center ${
                  currentView === 'list'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Employees
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-4 py-2 text-sm font-medium flex items-center border-l border-gray-300 ${
                  currentView === 'analytics'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Analytics
              </button>
            </div>
            
            <button
              onClick={handleCreateEmployee}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              {predefinedRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setDepartmentFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hire Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{employee.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getRoleBadge(employee.role)}
                        <div className="text-sm text-gray-500 capitalize">
                          {employee.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {employee.email}
                        </div>
                        {employee.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(employee.hire_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(employee.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.last_login ? (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {formatDate(employee.last_login)}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-orange-600 hover:text-orange-900 p-1 rounded"
                          title="Edit Employee"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleManagePermissions(employee)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Manage Permissions"
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewSchedule(employee)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="View Schedule"
                        >
                          <CalendarDaysIcon className="h-4 w-4" />
                        </button>
                        {employee.is_active && (
                          <button
                            onClick={() => handleDeactivateEmployee(employee)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Deactivate Employee"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {employees.length === 0 
                  ? "Get started by creating your first employee."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {employees.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={handleCreateEmployee}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Employee
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Password */}
                  {!editingEmployee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required={!editingEmployee}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}

                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Role</option>
                      {predefinedRoles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Hire Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Salary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Create Employee')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedEmployee && (
        <PermissionsManager
          employee={selectedEmployee}
          availablePermissions={availablePermissions}
          availableRoles={availableRoles}
          onUpdatePermissions={handleUpdatePermissions}
          onClose={() => setShowPermissionsModal(false)}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedEmployee && (
        <EmployeeSchedule
          employeeId={selectedEmployee.id}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};

export default EmployeesManagementPage;
