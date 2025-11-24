import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';
import FileUpload from '../ui/FileUpload';
import {
  XMarkIcon,
  PhotoIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const ServiceForm = ({ service, onSubmit, onCancel, isLoading }) => {
  const { apiCall } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    originalPrice: '',
    discountPercentage: '',
    isOnSale: false,
    saleStartDate: '',
    saleEndDate: '',
    duration: '60',
    petTypes: ['dog'], // Default to dog
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // Default weekdays
    startTime: '09:00',
    endTime: '17:00',
    assignedEmployees: [],
    maxBookingsPerSlot: '1',
    bufferTimeBefore: '0',
    bufferTimeAfter: '0',
    advanceBookingDays: '30',
    cancellationPolicy: 'Cancellation allowed up to 24 hours before appointment',
    isActive: true,
  });
  
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isManualSubmit, setIsManualSubmit] = useState(false); // Флаг для предотвращения автоматической отправки

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (service) {
      console.log('🔍 ServiceForm - Loading service for editing:', service);
      console.log('📋 Service data structure:', {
        name: service.name,
        description: service.description,
        category_id: service.category_id,
        pet_types: service.pet_types,
        price: service.price,
        duration: service.duration,
        image_id: service.image_id,
        image_url: service.image_url,
        available_days: service.available_days,
        start_time: service.start_time,
        end_time: service.end_time,
        assigned_employees: service.assigned_employees,
        max_bookings_per_slot: service.max_bookings_per_slot,
        buffer_time_before: service.buffer_time_before,
        buffer_time_after: service.buffer_time_after,
        advance_booking_days: service.advance_booking_days,
        cancellation_policy: service.cancellation_policy,
        is_active: service.is_active
      });

      setFormData({
        name: service.name || '',
        description: service.description || '',
        category_id: service.category_id || '',
        petTypes: service.pet_types || [],
        price: service.price?.toString() || '',
        duration: service.duration?.toString() || '60',
        image_id: service.image_id || '',
        availableDays: service.available_days || [], // ← ИСПРАВЛЕНО
        startTime: service.start_time || '09:00', // ← ИСПРАВЛЕНО
        endTime: service.end_time || '17:00', // ← ИСПРАВЛЕНО
        assignedEmployees: service.assigned_employees || [], // ← ИСПРАВЛЕНО
        maxBookingsPerSlot: service.max_bookings_per_slot?.toString() || '1', // ← ИСПРАВЛЕНО
        bufferTimeBefore: service.buffer_time_before?.toString() || '15', // ← ИСПРАВЛЕНО
        bufferTimeAfter: service.buffer_time_after?.toString() || '15', // ← ИСПРАВЛЕНО
        advanceBookingDays: service.advance_booking_days?.toString() || '7', // ← ИСПРАВЛЕНО
        cancellationPolicy: service.cancellation_policy || 'Free cancellation up to 24 hours before appointment', // ← ИСПРАВЛЕНО
        isActive: service.is_active !== undefined ? service.is_active : true // ← ИСПРАВЛЕНО
      });
      
      console.log('✅ FormData set for editing');
      
      // Set uploaded images if service has image
      if (service.image_url) {
        console.log('🖼️ Setting uploaded image:', service.image_url);
        setUploadedImages([{
          id: service.image_id,
          fileName: 'service-image',
          url: service.image_url
        }]);
      }
    }
  }, [service]);

  const loadFormData = async () => {
    // Load service categories from companies API
    try {
      const categoriesResponse = await apiCall('/companies/service-categories');
      console.log('🔍 ServiceForm - Categories response:', categoriesResponse);
      if (categoriesResponse && categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
        console.log('✅ ServiceForm - Categories loaded:', categoriesResponse.data.length);
        setCategories(categoriesResponse.data);
      } else {
        console.error('❌ ServiceForm - Invalid categories response:', categoriesResponse);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ ServiceForm - Failed to load categories:', error);
      setCategories([]);
    }

    // Load company employees
    try {
      const employeesResponse = await apiCall('/companies/employees');
      if (employeesResponse && Array.isArray(employeesResponse.employees)) {
        setEmployees(employeesResponse.employees);
      } else {
        console.error('Invalid employees response:', employeesResponse);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
    }

    // Load pet types
    try {
      const petTypesResponse = await apiCall('/companies/pet-types');
      if (petTypesResponse && petTypesResponse.success && Array.isArray(petTypesResponse.data)) {
        setPetTypes(petTypesResponse.data);
      } else {
        console.error('Invalid pet types response:', petTypesResponse);
        setPetTypes([]);
      }
    } catch (error) {
      console.error('Failed to load pet types:', error);
      setPetTypes([]);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayChange = (name, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked 
        ? [...prev[name], value]
        : prev[name].filter(item => item !== value)
    }));
  };

  const handleImageUpload = async (files) => {
    console.log('🖼️ handleImageUpload called with:', files);
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const file = files[0];
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      console.log('📤 Uploading file:', file.name);

      // Upload to temporary upload endpoint first
      const token = await auth.currentUser?.getIdToken();
      const uploadResponse = await fetch('/api/v1/uploads/temp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });
      
      const uploadData = await uploadResponse.json();
      console.log('📥 Upload response:', uploadData);

      if (uploadData.success && uploadData.data) {
        const uploadedFile = uploadData.data;
        console.log('✅ File uploaded successfully:', uploadedFile);
        
        setFormData(prev => {
          const newFormData = {
            ...prev,
            image_id: uploadedFile.file_id
          };
          console.log('📝 Updated formData with image_id:', newFormData.image_id);
          return newFormData;
        });
        
        setUploadedImages([{
          id: uploadedFile.file_id,
          fileName: uploadedFile.original_name,
          url: uploadedFile.file_url
        }]);
      } else {
        console.error('Upload failed:', uploadData);
        alert('Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = (fileId) => {
    setFormData(prev => ({
      ...prev,
      image_id: ''
    }));
    setUploadedImages([]);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Valid duration is required';
    }

    if (formData.availableDays.length === 0) {
      newErrors.availableDays = 'At least one available day is required';
    }

    if (formData.petTypes.length === 0) {
      newErrors.petTypes = 'At least one pet type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🚀 Form submitted!');
    console.log('📋 Form data:', formData);
    console.log('🔍 Available days:', formData.availableDays);
    console.log('🐾 Pet types:', formData.petTypes);
    console.log('🖼️ Image ID:', formData.image_id);
    console.log('📸 Uploaded images:', uploadedImages);
    console.log('🎯 Event target:', e.target);
    console.log('🎯 Event type:', e.type);
    console.log('🎯 Stack trace:', new Error().stack);
    console.log('✋ Manual submit flag:', isManualSubmit);
    
    // Предотвращаем автоматическую отправку
    if (!isManualSubmit) {
      console.log('❌ Preventing automatic form submission');
      return;
    }
    
    if (!validateForm()) {
      console.log('❌ Validation failed!');
      console.log('🚨 Errors:', errors);
      return;
    }

    console.log('✅ Validation passed!');

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      start_time: formData.startTime ? formData.startTime + ':00' : '', // Convert HH:MM to HH:MM:SS
      end_time: formData.endTime ? formData.endTime + ':00' : '', // Convert HH:MM to HH:MM:SS
      max_bookings_per_slot: parseInt(formData.maxBookingsPerSlot),
      buffer_time_before: parseInt(formData.bufferTimeBefore),
      buffer_time_after: parseInt(formData.bufferTimeAfter),
      advance_booking_days: parseInt(formData.advanceBookingDays),
      pet_types: formData.petTypes,
      available_days: formData.availableDays,
      assigned_employees: formData.assignedEmployees,
      cancellation_policy: formData.cancellationPolicy,
      is_active: formData.isActive,
      image_id: formData.image_id || '' // ← ДОБАВЛЯЕМ image_id!
    };

    // Remove the camelCase versions to avoid confusion
    delete submitData.startTime;
    delete submitData.endTime;
    delete submitData.maxBookingsPerSlot;
    delete submitData.bufferTimeBefore;
    delete submitData.bufferTimeAfter;
    delete submitData.advanceBookingDays;
    delete submitData.petTypes;
    delete submitData.availableDays;
    delete submitData.assignedEmployees;
    delete submitData.cancellationPolicy;
    delete submitData.isActive;

    console.log('📤 Submitting data:', submitData);
    onSubmit(submitData);
    
    // Сбрасываем флаг после отправки
    setIsManualSubmit(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            {service ? 'Edit Service' : 'Create New Service'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-700 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                Basic Information
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Dog Grooming"
                />
                {errors.name && <p className="text-orange-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe your service..."
                />
              </div>

              {/* Service Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Image
                </label>
                <FileUpload
                  onFilesSelected={handleImageUpload}
                  maxFiles={1}
                  acceptedTypes={['image/*']}
                  maxSizePerFile={5 * 1024 * 1024} // 5MB
                  showPreview={true}
                  uploadedFiles={uploadedImages}
                  onFileRemove={handleImageRemove}
                  isUploading={isUploadingImage}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload an image that will represent your service in the marketplace. Max 5MB.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.length === 0 && (
                    <option disabled>Loading categories...</option>
                  )}
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    🔄 Loading categories... ({categories.length} loaded)
                  </p>
                )}
                {errors.category_id && <p className="text-orange-500 text-xs mt-1">{errors.category_id}</p>}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-orange-500 text-xs mt-1">{errors.price}</p>}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="60"
                />
                {errors.duration && <p className="text-orange-500 text-xs mt-1">{errors.duration}</p>}
              </div>

              {/* Discount Section */}
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Enable Sale/Discount
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOnSale}
                      onChange={(e) => handleInputChange('isOnSale', e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer ${formData.isOnSale ? 'bg-orange-600' : 'bg-gray-200'} relative`}>
                      <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${formData.isOnSale ? 'translate-x-full border-white' : ''}`}></div>
                    </div>
                  </label>
                </div>

                {formData.isOnSale && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => {
                          const originalPrice = parseFloat(e.target.value) || 0;
                          const discountPercentage = parseInt(formData.discountPercentage) || 0;
                          const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);
                          
                          handleInputChange('originalPrice', e.target.value);
                          if (discountPercentage > 0) {
                            handleInputChange('price', discountedPrice.toFixed(2));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.originalPrice && <p className="text-orange-500 text-xs mt-1">{errors.originalPrice}</p>}
                    </div>

                    {/* Discount Percentage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Percentage (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={formData.discountPercentage}
                        onChange={(e) => {
                          const discountPercentage = parseInt(e.target.value) || 0;
                          const originalPrice = parseFloat(formData.originalPrice) || 0;
                          const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);
                          
                          handleInputChange('discountPercentage', e.target.value);
                          if (originalPrice > 0) {
                            handleInputChange('price', discountedPrice.toFixed(2));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          errors.discountPercentage ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., 30"
                      />
                      {errors.discountPercentage && <p className="text-orange-500 text-xs mt-1">{errors.discountPercentage}</p>}
                    </div>

                    {/* Sale Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.saleStartDate}
                        onChange={(e) => handleInputChange('saleStartDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* Sale End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.saleEndDate}
                        onChange={(e) => handleInputChange('saleEndDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}

                {/* Price Preview */}
                {formData.isOnSale && formData.originalPrice && formData.discountPercentage && (
                  <div className="bg-white p-3 rounded-md border">
                    <div className="text-sm text-gray-600 mb-1">Price Preview:</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">
                        ${formData.price}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ${formData.originalPrice}
                      </span>
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        -{formData.discountPercentage}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pet Types & Availability */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-700 flex items-center">
                <CalendarDaysIcon className="w-5 h-5 mr-2" />
                Availability & Settings
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Types *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {petTypes.map(petType => (
                    <label key={petType.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.petTypes.includes(petType.id)}
                        onChange={(e) => handleArrayChange('petTypes', petType.id, e.target.checked)}
                        className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{petType.name}</span>
                    </label>
                  ))}
                </div>
                {errors.petTypes && <p className="text-orange-500 text-xs mt-1">{errors.petTypes}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Days *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.availableDays.includes(day.value)}
                        onChange={(e) => handleArrayChange('availableDays', day.value, e.target.checked)}
                        className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
                {errors.available_days && <p className="text-orange-500 text-xs mt-1">{errors.available_days}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-700 flex items-center mb-4">
              <ClockIcon className="w-5 h-5 mr-2" />
              Advanced Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Bookings per Slot
                </label>
                <input
                  type="number"
                  name="max_bookings_per_slot"
                  value={formData.max_bookings_per_slot}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer Before (min)
                </label>
                <input
                  type="number"
                  name="buffer_time_before"
                  value={formData.buffer_time_before}
                  onChange={handleInputChange}
                  min="0"
                  step="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buffer After (min)
                </label>
                <input
                  type="number"
                  name="buffer_time_after"
                  value={formData.buffer_time_after}
                  onChange={handleInputChange}
                  min="0"
                  step="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Booking (days)
                </label>
                <input
                  type="number"
                  name="advance_booking_days"
                  value={formData.advance_booking_days}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Employees
                </label>
                <select
                  multiple
                  name="assigned_employees"
                  value={formData.assigned_employees}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData(prev => ({ ...prev, assigned_employees: values }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  size={Math.min(employees.length, 4)}
                >
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} ({employee.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple employees</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Policy
              </label>
              <textarea
                name="cancellation_policy"
                value={formData.cancellation_policy}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Define your cancellation policy..."
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Service is active</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('🖱️ Submit button clicked manually');
                setIsManualSubmit(true);
                // Trigger form submission
                const form = document.querySelector('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
              }}
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm; 