import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  NewspaperIcon,
  PhotoIcon,
  CalendarDaysIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const PressManagement = () => {
  const { apiCall } = useAuth();
  const [pressReleases, setPressReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPress, setEditingPress] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    summary: '',
    image_url: '',
    image_id: '',
    tags: [],
    is_published: false
  });

  useEffect(() => {
    loadPressReleases();
  }, []);

  const loadPressReleases = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/press');
      if (response.success) {
        setPressReleases(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load press releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPress) {
        await apiCall(`/admin/press/${editingPress.id}`, 'PUT', formData);
      } else {
        await apiCall('/admin/press', 'POST', formData);
      }
      
      setShowModal(false);
      setEditingPress(null);
      resetForm();
      loadPressReleases();
    } catch (error) {
      console.error('Failed to save press release:', error);
      alert('Failed to save press release. Please try again.');
    }
  };

  const handleEdit = (press) => {
    setEditingPress(press);
    setFormData({
      title: press.title || '',
      subtitle: press.subtitle || '',
      content: press.content || '',
      summary: press.summary || '',
      image_url: press.image_url || '',
      image_id: press.image_id || '',
      tags: press.tags || [],
      is_published: press.is_published || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this press release?')) {
      try {
        await apiCall(`/admin/press/${id}`, 'DELETE');
        loadPressReleases();
      } catch (error) {
        console.error('Failed to delete press release:', error);
        alert('Failed to delete press release. Please try again.');
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const token = await auth.currentUser?.getIdToken();
      const uploadResponse = await fetch('/api/v1/uploads/temp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success && uploadData.data) {
        setFormData(prev => ({
          ...prev,
          image_id: uploadData.data.file_id,
          image_url: uploadData.data.file_url
        }));
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      summary: '',
      image_url: '',
      image_id: '',
      tags: [],
      is_published: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
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
          <h1 className="text-2xl font-bold text-gray-900">Press Center Management</h1>
          <p className="text-gray-600">Manage press releases and news announcements</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPress(null);
            setShowModal(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Press Release
        </button>
      </div>

      {/* Press Releases List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {pressReleases.map((press) => (
            <li key={press.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {press.image_url && (
                      <img
                        src={press.image_url}
                        alt={press.title}
                        className="h-16 w-16 object-cover rounded-lg mr-4"
                      />
                    )}
                    <div>
                      <p className="text-lg font-medium text-indigo-600 truncate">
                        {press.title}
                      </p>
                      {press.subtitle && (
                        <p className="text-sm text-gray-600 mt-1">
                          {press.subtitle}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>
                          {press.published_at 
                            ? `Published: ${new Date(press.published_at).toLocaleDateString()}`
                            : `Created: ${new Date(press.created_at).toLocaleDateString()}`
                          }
                        </p>
                        {press.tags && press.tags.length > 0 && (
                          <>
                            <TagIcon className="flex-shrink-0 ml-4 mr-1.5 h-4 w-4" />
                            <p>{press.tags.slice(0, 3).join(', ')}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      press.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {press.is_published ? 'Published' : 'Draft'}
                    </span>
                    <button
                      onClick={() => handleEdit(press)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(press.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {press.summary && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {press.summary}
                    </p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {pressReleases.length === 0 && (
        <div className="text-center py-12">
          <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No press releases</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new press release.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPress ? 'Edit Press Release' : 'Add New Press Release'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Press release title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Brief subtitle or tagline"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <textarea
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Brief summary for previews and social media"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Full press release content..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., funding, product launch, partnership"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {formData.image_url ? (
                        <div className="mb-4">
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="mx-auto h-32 w-auto object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                          <span>{formData.image_url ? 'Change image' : 'Upload image'}</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      {uploadingImage && (
                        <p className="text-xs text-orange-600">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Publish immediately
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPress(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    {editingPress ? 'Update Press Release' : 'Create Press Release'}
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

export default PressManagement;
