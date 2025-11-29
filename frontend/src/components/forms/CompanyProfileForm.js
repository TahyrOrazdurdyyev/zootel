import React, { useState, useEffect } from 'react';
import { MapPinIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LocationMap from '../ui/LocationMap';
import GooglePlacesAutocomplete from '../ui/GooglePlacesAutocomplete';
import GoogleMap from '../ui/GoogleMap';
import { auth } from '../../config/firebase';
import { toast } from 'react-hot-toast';

const CompanyProfileForm = ({ 
  company, 
  onSave, 
  onCancel, 
  loading = false,
  section = "general" 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    latitude: null,
    longitude: null,
    phone: '',
    email: '',
    website: '',
    business_hours: '',
    categories: [],
    media_gallery: [],
    publish_to_marketplace: false,
    website_integration_enabled: false
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        country: company.country || '',
        latitude: company.latitude || null,
        longitude: company.longitude || null,
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        logo_url: company.logo_url || '',
        business_hours: company.business_hours || '',
        categories: company.categories || [],
        media_gallery: company.media_gallery || [],
        publish_to_marketplace: company.publish_to_marketplace || false,
        website_integration_enabled: company.website_integration_enabled || false
      });
    }
  }, [company]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceSelect = (placeData) => {
    console.log('🔍 Place selected:', placeData);
    
    // Update form data with address components
    setFormData(prev => ({
      ...prev,
      address: placeData.formatted_address,
      city: placeData.address_components.city || prev.city,
      state: placeData.address_components.state || prev.state,
      country: placeData.address_components.country || prev.country,
      latitude: placeData.coordinates?.lat || prev.latitude,
      longitude: placeData.coordinates?.lng || prev.longitude
    }));

    toast.success('Address updated with location details');
  };

  const handleLocationFromAddress = async () => {
    if (!formData.address || !formData.city) {
      alert('Please enter address and city first');
      return;
    }

    setGettingLocation(true);
    try {
      // Use a geocoding service to get coordinates
      const query = `${formData.address}, ${formData.city}, ${formData.country}`.trim();
      
      // For demo purposes, we'll use a mock geocoding
      // In production, use Google Geocoding API, Mapbox, or similar
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=YOUR_MAPBOX_TOKEN`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude
          }));
        } else {
          alert('Location not found. Please check your address.');
        }
      } else {
        throw new Error('Geocoding failed');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Could not get location from address. You can set it manually.');
    } finally {
      setGettingLocation(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your current location');
        setGettingLocation(false);
      }
    );
  };

  const uploadImages = async (files) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('purpose', 'company_gallery');

        const response = await fetch('/api/v1/companies/upload-gallery', {
          method: 'POST',
          body: formDataUpload,
          headers: {
            'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          return result.file.url;
        }
        throw new Error('Upload failed');
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        media_gallery: [...prev.media_gallery, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      media_gallery: prev.media_gallery.filter((_, i) => i !== index)
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/v1/companies/upload-gallery', {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          logo_url: result.file.url
        }));
        toast.success('Logo uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.error('Form validation errors:', validationErrors);
      alert('Please fill in all required fields correctly');
      return;
    }
    
    onSave(formData);
  };

  const renderSection = () => {
    switch (section) {
      case 'general':
        return renderGeneralSection();
      case 'location':
        return renderLocationSection();
      case 'media':
        return renderMediaSection();
      case 'online':
        return renderOnlineSection();
      default:
        return renderGeneralSection();
    }
  };

  const renderGeneralSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Company Logo */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          <div className="flex items-center space-x-4">
            {formData.logo_url && (
              <div className="relative">
                <img 
                  src={formData.logo_url} 
                  alt="Company Logo" 
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: Square image, max 2MB (JPG, PNG, GIF)
              </p>
            </div>
          </div>
          {uploadingLogo && (
            <div className="mt-2 text-sm text-blue-600">
              Uploading logo...
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your business..."
          />
        </div>
    </div>
  );

  const renderLocationSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Location</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <GooglePlacesAutocomplete
              value={formData.address}
              onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Start typing your address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Geolocation */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Coordinates</h4>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleLocationFromAddress}
                disabled={gettingLocation || !formData.address || !formData.city}
                className="btn-secondary text-sm py-1 px-3"
              >
                {gettingLocation ? 'Getting...' : 'Get from Address'}
              </button>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="btn-secondary text-sm py-1 px-3"
              >
                <MapPinIcon className="w-4 h-4 inline mr-1" />
                Current Location
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  latitude: e.target.value ? parseFloat(e.target.value) : null
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 40.7128"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  longitude: e.target.value ? parseFloat(e.target.value) : null
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>

          {/* Map Preview */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Preview
            </label>
            <GoogleMap
              address={formData.address}
              coordinates={formData.latitude && formData.longitude ? {
                lat: parseFloat(formData.latitude),
                lng: parseFloat(formData.longitude)
              } : null}
              height="300px"
              className="border border-gray-300 rounded-md"
              markerTitle={formData.name || 'Company Location'}
            />
          </div>
        </div>
    </div>
  );

  const renderMediaSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Photo Gallery</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {formData.media_gallery.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-orange-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {/* Upload new images */}
          <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50">
            <CameraIcon className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500 mt-1">Add Photo</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => uploadImages(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {uploading && (
          <div className="text-center text-sm text-gray-500">
            Uploading images...
          </div>
        )}
    </div>
  );

  const renderOnlineSection = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Online Presence</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="publish_to_marketplace"
            checked={formData.publish_to_marketplace}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              publish_to_marketplace: e.target.checked
            }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            Publish to marketplace (make visible to customers)
          </span>
        </label>
      </div>

      <div className="mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="website_integration_enabled"
            checked={formData.website_integration_enabled}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              website_integration_enabled: e.target.checked
            }))}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            Enable website integration
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderSection()}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default CompanyProfileForm; 