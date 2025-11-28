import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessTypeSelector from '../../components/forms/BusinessTypeSelector';
import CompanyProfileForm from '../../components/forms/CompanyProfileForm';
import {
  BuildingOfficeIcon,
  CogIcon,
  UserIcon,
  MapPinIcon,
  PhotoIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const CompanySettingsPage = () => {
  const { user, apiCall } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('business-type');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/companies/profile');
      console.log('📋 Company profile response:', response);
      if (response.success) {
        console.log('📋 Company data:', response.company);
        console.log('📋 Business type from API:', response.company?.business_type);
        console.log('📋 Business type type:', typeof response.company?.business_type);
        setCompany(response.company);
      } else {
        setError('Failed to load company profile');
      }
    } catch (error) {
      console.error('Failed to fetch company profile:', error);
      setError('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessTypeUpdate = async (newType) => {
    console.log('🔄 handleBusinessTypeUpdate called with:', newType);
    setCompany(prev => {
      console.log('🔄 Previous company business_type:', prev?.business_type);
      const updated = { ...prev, business_type: newType };
      console.log('🔄 Updated company business_type:', updated.business_type);
      return updated;
    });
    // Refresh company data to ensure consistency
    console.log('🔄 Refreshing company profile...');
    await fetchCompanyProfile();
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await apiCall('/companies/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });
      
      if (response.success) {
        setCompany(response.company);
        // Refresh company data to ensure consistency
        await fetchCompanyProfile();
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Profile updated successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => document.body.removeChild(successDiv), 3000);
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: 'business-type',
      name: 'Business Type',
      icon: BuildingOfficeIcon,
      description: 'Configure business type for AI agents'
    },
    {
      id: 'general',
      name: 'General Information',
      icon: UserIcon,
      description: 'Name, description, contacts'
    },
    {
      id: 'location',
      name: 'Location',
      icon: MapPinIcon,
      description: 'Address and coordinates'
    },
    {
      id: 'media',
      name: 'Media',
      icon: PhotoIcon,
      description: 'Logo and photo gallery'
    },
    {
      id: 'online',
      name: 'Online Presence',
      icon: GlobeAltIcon,
      description: 'Website and social media'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your company profile and settings
          </p>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Saving Indicator */}
          {saving && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">Saving changes...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon 
                      className={`
                        -ml-0.5 mr-2 h-5 w-5
                        ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'business-type' && (
              <div>
                <BusinessTypeSelector
                  currentType={company?.business_type}
                  onUpdate={handleBusinessTypeUpdate}
                />
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                <CompanyProfileForm
                  company={company}
                  onSave={handleProfileUpdate}
                  section="general"
                />
              </div>
            )}

            {activeTab === 'location' && (
              <div>
                <CompanyProfileForm
                  company={company}
                  onSave={handleProfileUpdate}
                  section="location"
                />
              </div>
            )}

            {activeTab === 'media' && (
              <div>
                <CompanyProfileForm
                  company={company}
                  onSave={handleProfileUpdate}
                  section="media"
                />
              </div>
            )}

            {activeTab === 'online' && (
              <div>
                <CompanyProfileForm
                  company={company}
                  onSave={handleProfileUpdate}
                  section="online"
                />
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Info */}
        {company?.business_type && company.business_type !== 'general' && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CogIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">
                  AI agents configured for your business
                </h3>
                <p className="mt-2 text-blue-700">
                  Your AI agents are now specialized for "{company.business_type}" business type. 
                  They will provide more accurate and relevant responses to customers.
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettingsPage; 