import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const PetTypesManagement = () => {
  const { apiCall } = useAuth();
  const [petTypes, setPetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPetType, setEditingPetType] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    fetchPetTypes();
  }, [apiCall]);

  const fetchPetTypes = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/v1/admin/pet-types');
      setPetTypes(response.pet_types || []);
    } catch (error) {
      console.error('Error fetching pet types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPetType) {
        await apiCall(`/api/v1/admin/pet-types/${editingPetType.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiCall('/api/v1/admin/pet-types', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      setShowModal(false);
      setEditingPetType(null);
      setFormData({ name: '' });
      fetchPetTypes();
    } catch (error) {
      console.error('Error saving pet type:', error);
      alert('Error saving pet type: ' + error.message);
    }
  };

  const handleEdit = (petType) => {
    setEditingPetType(petType);
    setFormData({
      name: petType.name
    });
    setShowModal(true);
  };

  const handleDelete = async (petTypeId) => {
    if (!window.confirm('Are you sure you want to delete this pet type?')) {
      return;
    }

    try {
      await apiCall(`/api/v1/admin/pet-types/${petTypeId}`, {
        method: 'DELETE'
      });
      fetchPetTypes();
    } catch (error) {
      console.error('Error deleting pet type:', error);
      alert('Error deleting pet type: ' + error.message);
    }
  };

  const openCreateModal = () => {
    setEditingPetType(null);
    setFormData({ name: '' });
    setShowModal(true);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pet Types Management</h1>
          <p className="text-gray-600">Manage pet types available for services</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Pet Type</span>
        </button>
      </div>

      {/* Pet Types List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pet Types ({petTypes.length})</h3>
        </div>
        
        {petTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🐾</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pet types</h3>
            <p className="text-gray-500 mb-4">Get started by creating a new pet type.</p>
            <button
              onClick={openCreateModal}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
            >
              Add Pet Type
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {petTypes.map((petType) => (
                  <tr key={petType.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{petType.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(petType.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(petType)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(petType.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPetType ? 'Edit Pet Type' : 'Create New Pet Type'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Type Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Dog, Cat, Bird"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPetType(null);
                      setFormData({ name: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md"
                  >
                    {editingPetType ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetTypesManagement;
