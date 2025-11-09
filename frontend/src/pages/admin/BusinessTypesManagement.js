import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const BusinessTypesManagement = () => {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  const fetchBusinessTypes = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/v1/admin/business-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBusinessTypes(data.data || []);
      } else {
        toast.error('Failed to load business types');
      }
    } catch (error) {
      console.error('Error fetching business types:', error);
      toast.error('Failed to load business types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (editingType) {
        // Update existing business type
        const response = await fetch(`/api/v1/admin/business-types/${editingType.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            sort_order: parseInt(formData.sort_order) || 0
          })
        });
        
        if (response.ok) {
          toast.success('Business type updated successfully');
        } else {
          toast.error('Failed to update business type');
        }
      } else {
        // Create new business type
        const response = await fetch('/api/v1/admin/business-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            sort_order: parseInt(formData.sort_order) || 0
          })
        });
        
        if (response.ok) {
          toast.success('Business type created successfully');
        } else {
          toast.error('Failed to create business type');
        }
      }
      
      setShowModal(false);
      setEditingType(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
        sort_order: 0
      });
      fetchBusinessTypes();
    } catch (error) {
      console.error('Error saving business type:', error);
      toast.error('Failed to save business type');
    }
  };

  const handleEdit = (businessType) => {
    setEditingType(businessType);
    setFormData({
      name: businessType.name || '',
      description: businessType.description || '',
      is_active: businessType.is_active,
      sort_order: businessType.sort_order || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this business type?')) {
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/v1/admin/business-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        toast.success('Business type deleted successfully');
        fetchBusinessTypes();
      } else {
        toast.error('Failed to delete business type');
      }
    } catch (error) {
      console.error('Error deleting business type:', error);
      toast.error('Failed to delete business type');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleActive = async (businessType) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/v1/admin/business-types/${businessType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...businessType,
          is_active: !businessType.is_active,
          sort_order: parseInt(businessType.sort_order) || 0
        })
      });
      
      if (response.ok) {
        toast.success(`Business type ${!businessType.is_active ? 'activated' : 'deactivated'} successfully`);
        fetchBusinessTypes();
      } else {
        toast.error('Failed to update business type status');
      }
    } catch (error) {
      console.error('Error toggling business type status:', error);
      toast.error('Failed to update business type status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Types Management</h1>
          <p className="text-gray-600">Manage business types for company registration</p>
        </div>
        <button
          onClick={() => {
            setEditingType(null);
            setFormData({
              name: '',
              description: '',
              is_active: true,
              sort_order: businessTypes.length
            });
            setShowModal(true);
          }}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Business Type
        </button>
      </div>

      {/* Business Types Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sort Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {businessTypes.map((businessType) => (
              <tr key={businessType.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {businessType.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {businessType.description || 'No description'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {businessType.sort_order}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(businessType)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      businessType.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {businessType.is_active ? (
                      <>
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeSlashIcon className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(businessType)}
                    className="text-orange-600 hover:text-orange-900"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(businessType.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {businessTypes.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No business types</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new business type.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingType ? 'Edit Business Type' : 'Add New Business Type'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Veterinary Clinic"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Brief description of this business type"
                />
              </div>

              <div>
                <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700">
                  Sort Order
                </label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  {editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessTypesManagement;
