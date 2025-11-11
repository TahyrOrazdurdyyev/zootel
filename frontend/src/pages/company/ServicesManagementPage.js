import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ServiceForm from '../../components/forms/ServiceForm';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ServicesManagementPage = () => {
  const { apiCall } = useAuth();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory, statusFilter]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/companies/services');
      if (response.success) {
        setServices(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      alert('Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiCall('/admin/service-categories');
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(service => service.category_id === selectedCategory);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(service => service.is_active === isActive);
    }

    setFilteredServices(filtered);
  };

  const handleCreateService = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiCall(`/companies/services/${serviceId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        await loadServices();
        alert('Service deleted successfully!');
      } else {
        alert('Failed to delete service. It may have active bookings.');
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      
      const url = editingService 
        ? `/companies/services/${editingService.id}`
        : '/companies/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await apiCall(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.success) {
        setShowForm(false);
        setEditingService(null);
        await loadServices();
        alert(`Service ${editingService ? 'updated' : 'created'} successfully!`);
      } else {
        alert(`Failed to ${editingService ? 'update' : 'create'} service. Please try again.`);
      }
    } catch (error) {
      console.error('Failed to submit service:', error);
      alert(`Failed to ${editingService ? 'update' : 'create'} service. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingService(null);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
              <p className="text-gray-600 mt-1">Manage your company's services and pricing</p>
            </div>
            <button
              onClick={handleCreateService}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Service</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="min-w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="min-w-32">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredServices.length} of {services.length} services
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {services.length === 0 ? (
                <>
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first service.</p>
                  <button
                    onClick={handleCreateService}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Create Service
                  </button>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Service Image */}
                <div className="h-48 bg-gray-200 relative">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CurrencyDollarIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(service.is_active)}
                  </div>
                </div>

                {/* Service Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">
                      {service.name}
                    </h3>
                    <span className="text-lg font-bold text-orange-600">
                      ${service.price}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {service.description || 'No description provided'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      <span>{formatDuration(service.duration)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FunnelIcon className="w-4 h-4 mr-2" />
                      <span>{getCategoryName(service.category_id)}</span>
                    </div>

                    {service.assigned_employees && service.assigned_employees.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        <span>{service.assigned_employees.length} employee(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Pet Types */}
                  {service.pet_types && service.pet_types.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {service.pet_types.slice(0, 3).map((petType, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {petType}
                          </span>
                        ))}
                        {service.pet_types.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                            +{service.pet_types.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Available Days */}
                  {service.available_days && service.available_days.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Available:</p>
                      <p className="text-sm text-gray-700">
                        {service.available_days.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.start_time} - {service.end_time}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEditService(service)}
                      className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-md text-sm hover:bg-orange-700 flex items-center justify-center space-x-1"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="px-3 py-2 border border-red-300 text-red-700 rounded-md text-sm hover:bg-orange-50 flex items-center justify-center"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Form Modal */}
        {showForm && (
          <ServiceForm
            service={editingService}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default ServicesManagementPage; 