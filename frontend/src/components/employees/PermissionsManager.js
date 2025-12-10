import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

const PermissionsManager = ({ 
  employee, 
  availablePermissions = [], 
  availableRoles = [], 
  onUpdatePermissions, 
  onClose 
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [customPermissions, setCustomPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Permission categories for better organization
  const permissionCategories = {
    bookings: {
      name: 'Bookings & Appointments',
      icon: '📅',
      permissions: [
        'view_bookings',
        'create_bookings', 
        'edit_bookings',
        'cancel_bookings',
        'view_all_bookings'
      ]
    },
    customers: {
      name: 'Customer Management',
      icon: '👥',
      permissions: [
        'view_customers',
        'edit_customers',
        'view_customer_data',
        'manage_customer_pets'
      ]
    },
    services: {
      name: 'Services & Products',
      icon: '🛍️',
      permissions: [
        'view_services',
        'manage_services',
        'view_inventory',
        'manage_inventory'
      ]
    },
    financial: {
      name: 'Financial Operations',
      icon: '💰',
      permissions: [
        'view_financials',
        'process_payments',
        'issue_refunds',
        'view_salaries'
      ]
    },
    analytics: {
      name: 'Analytics & Reports',
      icon: '📊',
      permissions: [
        'view_analytics',
        'view_reports',
        'export_data',
        'view_employees'
      ]
    },
    management: {
      name: 'Management & Settings',
      icon: '⚙️',
      permissions: [
        'manage_employees',
        'manage_settings',
        'manage_company',
        'all'
      ]
    }
  };

  // Predefined role configurations
  const roleConfigurations = {
    manager: {
      name: 'Manager',
      description: 'Full access to all company functions',
      color: 'purple',
      permissions: ['all']
    },
    veterinarian: {
      name: 'Veterinarian',
      description: 'Access to medical functions and client records',
      color: 'blue',
      permissions: [
        'view_bookings', 'edit_bookings', 'view_customers', 
        'view_customer_data', 'view_services', 'manage_customer_pets'
      ]
    },
    groomer: {
      name: 'Groomer',
      description: 'Access to grooming and own records',
      color: 'green',
      permissions: [
        'view_bookings', 'edit_bookings', 'view_customers'
      ]
    },
    receptionist: {
      name: 'Administrator',
      description: 'Management of records, clients, and payments',
      color: 'yellow',
      permissions: [
        'view_bookings', 'create_bookings', 'edit_bookings',
        'view_customers', 'edit_customers', 'process_payments'
      ]
    },
    cashier: {
      name: 'Cashier',
      description: 'Processing payments and sales',
      color: 'orange',
      permissions: [
        'view_bookings', 'view_customers', 'process_payments', 'view_inventory'
      ]
    },
    analyst: {
      name: 'Analyst',
      description: 'Access to analytics and reports',
      color: 'indigo',
      permissions: [
        'view_analytics', 'view_reports', 'export_data', 'view_employees'
      ]
    }
  };

  useEffect(() => {
    if (employee) {
      setSelectedRole(employee.role || '');
      setSelectedPermissions(employee.permissions || []);
      
      // Calculate custom permissions (not included in role)
      const rolePermissions = roleConfigurations[employee.role]?.permissions || [];
      const custom = (employee.permissions || []).filter(
        perm => !rolePermissions.includes(perm) && perm !== 'all'
      );
      setCustomPermissions(custom);
    }
  }, [employee]);

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    const roleConfig = roleConfigurations[newRole];
    if (roleConfig) {
      const rolePermissions = roleConfig.permissions;
      // Combine role permissions with existing custom permissions
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];
      setSelectedPermissions(allPermissions);
    }
  };

  const handlePermissionToggle = (permission) => {
    const rolePermissions = roleConfigurations[selectedRole]?.permissions || [];
    
    if (rolePermissions.includes(permission)) {
      // Can't remove role-based permissions
      return;
    }

    if (selectedPermissions.includes(permission)) {
      // Remove permission
      const updated = selectedPermissions.filter(p => p !== permission);
      setSelectedPermissions(updated);
      setCustomPermissions(customPermissions.filter(p => p !== permission));
    } else {
      // Add permission
      const updated = [...selectedPermissions, permission];
      setSelectedPermissions(updated);
      setCustomPermissions([...customPermissions, permission]);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdatePermissions({
        role: selectedRole,
        permissions: selectedPermissions
      });
    } catch (error) {
      console.error('Failed to update permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPermissionFromRole = (permission) => {
    const rolePermissions = roleConfigurations[selectedRole]?.permissions || [];
    return rolePermissions.includes(permission) || rolePermissions.includes('all');
  };

  const getPermissionsByCategory = (categoryKey) => {
    const category = permissionCategories[categoryKey];
    return availablePermissions.filter(perm => 
      category.permissions.includes(perm.id)
    );
  };

  const getRoleColorClass = (role) => {
    const config = roleConfigurations[role];
    if (!config) return 'bg-gray-100 text-gray-800';
    
    const colorClasses = {
      purple: 'bg-purple-100 text-purple-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      indigo: 'bg-indigo-100 text-indigo-800'
    };
    
    return colorClasses[config.color] || 'bg-gray-100 text-gray-800';
  };

  if (!employee) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-lg bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Manage Permissions
              </h3>
              <p className="text-sm text-gray-600">
                {employee.first_name} {employee.last_name} (@{employee.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Employee Role
              </h4>
              
              <div className="space-y-3">
                {Object.entries(roleConfigurations).map(([roleKey, config]) => (
                  <div
                    key={roleKey}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRole === roleKey
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleRoleChange(roleKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColorClass(roleKey)}`}>
                            {config.name}
                          </span>
                          {selectedRole === roleKey && (
                            <CheckIcon className="h-4 w-4 text-blue-600 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedRole && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Role Permissions</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Role-based permissions are automatically assigned and cannot be removed. 
                        You can add additional permissions below.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              Detailed Permissions
            </h4>

            <div className="space-y-6">
              {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                const categoryPermissions = getPermissionsByCategory(categoryKey);
                
                if (categoryPermissions.length === 0) return null;

                return (
                  <div key={categoryKey} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <span className="text-lg mr-2">{category.icon}</span>
                      {category.name}
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.id);
                        const isFromRole = isPermissionFromRole(permission.id);
                        const isLocked = isFromRole && selectedRole;

                        return (
                          <div
                            key={permission.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              isSelected
                                ? isLocked
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            } ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            onClick={() => !isLocked && handlePermissionToggle(permission.id)}
                          >
                            <div className="flex items-center flex-1">
                              <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                                isSelected
                                  ? isLocked
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-green-600 border-green-600'
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <CheckIcon className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                            
                            {isLocked && (
                              <div className="flex items-center text-blue-600">
                                <LockClosedIcon className="h-4 w-4 mr-1" />
                                <span className="text-xs">Role</span>
                              </div>
                            )}
                            
                            {!isLocked && isSelected && (
                              <LockOpenIcon className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">Permission Summary</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Role Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {(roleConfigurations[selectedRole]?.permissions || []).map(perm => (
                  <span key={perm} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    <LockClosedIcon className="h-3 w-3 mr-1" />
                    {perm}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Additional Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {customPermissions.map(perm => (
                  <span key={perm} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    <LockOpenIcon className="h-3 w-3 mr-1" />
                    {perm}
                  </span>
                ))}
                {customPermissions.length === 0 && (
                  <span className="text-xs text-gray-500 italic">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManager;
