import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, UserIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import LocationSelector from '../../components/ui/LocationSelector';

const OnboardingPage = () => {
  const [userType, setUserType] = useState('pet_owner'); // 'pet_owner' or 'business'
  const [formData, setFormData] = useState({
    // Common fields
    firstName: '',
    lastName: '',
    phone: '',
    country: null,
    state: null,
    city: null,
    // Business-only fields
    companyName: '',
    businessType: '',
    address: '',
    taxId: '',
    website: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [businessTypes, setBusinessTypes] = useState([]);

  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.firebaseUID) {
      // User is not authenticated, redirect to login
      navigate('/login', { replace: true });
      return;
    }

    if (userType === 'business') {
      fetchBusinessTypes();
    }
    // Clear errors when switching user types
    setErrors({});
  }, [userType, user, navigate]);

  const fetchBusinessTypes = async () => {
    try {
      const response = await fetch('/api/v1/marketplace/business-types');
      if (response.ok) {
        const data = await response.json();
        setBusinessTypes(data.business_types || []);
      }
    } catch (error) {
      console.error('Failed to fetch business types:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhoneChange = (phone) => {
    setFormData(prev => ({ ...prev, phone }));
    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({
        ...prev,
        phone: ''
      }));
    }
  };

  const handleLocationChange = (location) => {
    setFormData(prev => ({
      ...prev,
      country: location.country,
      state: location.state,
      city: location.city
    }));
    
    // Clear location errors when user makes changes
    if (errors.country || errors.city) {
      setErrors(prev => ({
        ...prev,
        country: '',
        city: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Business-specific validation
    if (userType === 'business') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }

      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required';
      }

      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
    }

    // Common validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.city || !formData.city.name) {
      newErrors.city = 'City is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const onboardingData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        country: formData.country?.name || '',
        state: formData.state?.name || '',
        city: formData.city?.name || '',
        role: userType === 'business' ? 'business_owner' : 'pet_owner',
        // Business-only fields
        companyName: userType === 'business' ? formData.companyName : '',
        businessType: userType === 'business' ? formData.businessType : '',
        address: userType === 'business' ? formData.address : '',
        taxId: userType === 'business' ? formData.taxId : '',
        website: userType === 'business' ? formData.website : '',
        description: userType === 'business' ? formData.description : ''
      };
      
      await completeOnboarding(onboardingData);
      
      // Redirect based on role
      if (userType === 'business') {
        navigate('/company/dashboard', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to complete onboarding. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.firebaseUID) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/images/icons/Logo_orange.png" alt="Zootel" className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete your profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Tell us a bit about yourself to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* User Type Tabs */}
        <div className="mb-6">
          <div className="flex bg-white rounded-lg shadow overflow-hidden">
            <button
              type="button"
              onClick={() => setUserType('pet_owner')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                userType === 'pet_owner'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserIcon className="h-5 w-5 mx-auto mb-1" />
              Pet Owner
            </button>
            <button
              type="button"
              onClick={() => setUserType('business')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                userType === 'business'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BuildingStorefrontIcon className="h-5 w-5 mx-auto mb-1" />
              Business Owner
            </button>
          </div>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-orange-600 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Business Fields */}
            {userType === 'business' && (
              <>
                <div className="space-y-4 pb-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Company Information</h3>
                  
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Company Name <span className="text-orange-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        className={`input-field ${errors.companyName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Your company name"
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-sm text-orange-600">{errors.companyName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                      Business Type <span className="text-orange-500">*</span>
                    </label>
                    <div className="mt-1">
                      <select
                        id="businessType"
                        name="businessType"
                        required
                        value={formData.businessType}
                        onChange={handleChange}
                        className={`input-field ${errors.businessType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      >
                        <option value="">Select business type</option>
                        {businessTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.businessType && (
                        <p className="mt-1 text-sm text-orange-600">{errors.businessType}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Business Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Brief description of your business"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-orange-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`input-field ${errors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Your first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-orange-600">{errors.firstName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-orange-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`input-field ${errors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Your last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-orange-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-orange-500">*</span>
              </label>
              <div className="mt-1">
                <PhoneInput
                  country={'us'}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  inputClass={`input-field !pl-14 ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  containerClass="w-full"
                  dropdownClass="bg-white border border-gray-300 rounded-md shadow-lg"
                  enableSearch={true}
                  searchPlaceholder="Search countries..."
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-orange-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-orange-500">*</span>
              </label>
              <LocationSelector
                selectedCountry={formData.country}
                selectedState={formData.state}
                selectedCity={formData.city}
                onLocationChange={handleLocationChange}
                required={true}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-orange-600">{errors.country}</p>
              )}
              {errors.city && (
                <p className="mt-1 text-sm text-orange-600">{errors.city}</p>
              )}
            </div>

            {/* Business Address Fields */}
            {userType === 'business' && (
              <>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Street Address <span className="text-orange-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className={`input-field ${errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="Street address, apartment, suite, etc."
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-orange-600">{errors.address}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                      Tax ID / VAT Number
                    </label>
                    <div className="mt-1">
                      <input
                        id="taxId"
                        name="taxId"
                        type="text"
                        value={formData.taxId}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Tax identification number"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <div className="mt-1">
                      <input
                        id="website"
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Profile...
                  </div>
                ) : (
                  'Complete Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

