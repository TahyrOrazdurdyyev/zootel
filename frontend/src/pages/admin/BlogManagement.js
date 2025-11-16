import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon,
  CalendarDaysIcon,
  TagIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const BlogManagement = () => {
  const { apiCall } = useAuth();
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image_url: '',
    image_id: '',
    category: '',
    tags: [],
    author_name: '',
    author_bio: '',
    author_image: '',
    is_published: false
  });

  const categories = [
    'Pet Care',
    'Health',
    'Grooming',
    'Training',
    'Nutrition',
    'Veterinary',
    'Product Reviews',
    'Company News',
    'Tips & Guides'
  ];

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/blog');
      if (response.success) {
        setBlogPosts(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await apiCall(`/admin/blog/${editingPost.id}`, 'PUT', formData);
      } else {
        await apiCall('/admin/blog', 'POST', formData);
      }
      
      setShowModal(false);
      setEditingPost(null);
      resetForm();
      loadBlogPosts();
    } catch (error) {
      console.error('Failed to save blog post:', error);
      alert('Failed to save blog post. Please try again.');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      image_url: post.image_url || '',
      image_id: post.image_id || '',
      category: post.category || '',
      tags: post.tags || [],
      author_name: post.author_name || '',
      author_bio: post.author_bio || '',
      author_image: post.author_image || '',
      is_published: post.is_published || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await apiCall(`/admin/blog/${id}`, 'DELETE');
        loadBlogPosts();
      } catch (error) {
        console.error('Failed to delete blog post:', error);
        alert('Failed to delete blog post. Please try again.');
      }
    }
  };

  const handleImageUpload = async (e, imageType = 'post') => {
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
        if (imageType === 'post') {
          setFormData(prev => ({
            ...prev,
            image_id: uploadData.data.file_id,
            image_url: uploadData.data.file_url
          }));
        } else if (imageType === 'author') {
          setFormData(prev => ({
            ...prev,
            author_image: uploadData.data.file_url
          }));
        }
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

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      image_url: '',
      image_id: '',
      category: '',
      tags: [],
      author_name: '',
      author_bio: '',
      author_image: '',
      is_published: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Auto-generate slug when title changes
    if (name === 'title' && !editingPost) {
      setFormData(prev => ({
        ...prev,
        [name]: newValue,
        slug: generateSlug(newValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600">Create and manage blog posts and articles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPost(null);
            setShowModal(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Blog Post
        </button>
      </div>

      {/* Blog Posts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {blogPosts.map((post) => (
            <li key={post.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-16 w-16 object-cover rounded-lg mr-4"
                      />
                    )}
                    <div>
                      <p className="text-lg font-medium text-indigo-600 truncate">
                        {post.title}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <p>
                          {post.published_at 
                            ? `Published: ${new Date(post.published_at).toLocaleDateString()}`
                            : `Created: ${new Date(post.created_at).toLocaleDateString()}`
                          }
                        </p>
                        {post.category && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                              {post.category}
                            </span>
                          </>
                        )}
                        {post.view_count > 0 && (
                          <>
                            <EyeIcon className="flex-shrink-0 ml-4 mr-1.5 h-4 w-4" />
                            <p>{post.view_count} views</p>
                          </>
                        )}
                      </div>
                      {post.author_name && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          <p>By {post.author_name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {post.excerpt && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-2 flex items-center">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 5).map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {blogPosts.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No blog posts</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new blog post.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingPost ? 'Edit Blog Post' : 'Add New Blog Post'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
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
                        placeholder="Blog post title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug *
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="url-friendly-slug"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        URL: /blog/{formData.slug}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
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
                        placeholder="e.g., pet care, tips, health"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Excerpt
                      </label>
                      <textarea
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Brief excerpt for previews and SEO"
                      />
                    </div>

                    {/* Featured Image */}
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
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
                              <span>{formData.image_url ? 'Change image' : 'Upload image'}</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'post')}
                                disabled={uploadingImage}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author Name
                      </label>
                      <input
                        type="text"
                        name="author_name"
                        value={formData.author_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Author's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author Bio
                      </label>
                      <textarea
                        name="author_bio"
                        value={formData.author_bio}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Brief author biography"
                      />
                    </div>

                    {/* Author Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author Photo
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {formData.author_image ? (
                            <div className="mb-4">
                              <img
                                src={formData.author_image}
                                alt="Author"
                                className="mx-auto h-20 w-20 object-cover rounded-full"
                              />
                            </div>
                          ) : (
                            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                          )}
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
                              <span>{formData.author_image ? 'Change photo' : 'Upload photo'}</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'author')}
                                disabled={uploadingImage}
                              />
                            </label>
                          </div>
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
                  </div>
                </div>

                {/* Content - Full Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows="12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Write your blog post content here..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPost(null);
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
                    {editingPost ? 'Update Blog Post' : 'Create Blog Post'}
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

export default BlogManagement;
