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

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/companies/profile');
      if (response.success) {
        setCompany(response.company);
      }
    } catch (error) {
      console.error('Failed to fetch company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessTypeUpdate = (newType) => {
    setCompany(prev => ({ ...prev, business_type: newType }));
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      const response = await apiCall('/companies/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });
      
      if (response.success) {
        setCompany(response.company);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
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