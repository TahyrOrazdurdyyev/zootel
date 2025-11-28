import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const BusinessTypeSelector = ({ currentType, onUpdate, isEditable = true }) => {
  const { apiCall } = useAuth();
  const [businessTypes, setBusinessTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(currentType || 'general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Map internal values to display names
  const internalToDisplayMap = {
    'veterinary': 'Veterinary Clinic',
    'grooming': 'Grooming Salon',
    'boarding': 'Pet Hotel', 
    'training': 'Pet Training',
    'walking': 'Dog Walking',
    'sitting': 'Pet Sitting',
    'pet_taxi': 'Pet Transportation',
    'retail': 'Pet Store',
    'general': 'General Services'
  };

  // Map display names to internal values  
  const displayToInternalMap = {
    'Veterinary Clinic': 'veterinary',
    'Grooming Salon': 'grooming',
    'Pet Hotel': 'boarding',
    'Pet Training': 'training', 
    'Dog Walking': 'walking',
    'Pet Sitting': 'sitting',
    'Pet Transportation': 'pet_taxi',
    'Pet Store': 'retail',
    'General Services': 'general'
  };

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  useEffect(() => {
    console.log('BusinessTypeSelector - currentType changed:', currentType);
    // Convert internal value to display name for UI
    const displayName = internalToDisplayMap[currentType] || currentType || 'General Services';
    console.log('Converting internal value to display:', currentType, '→', displayName);
    setSelectedType(displayName);
  }, [currentType]);

  const fetchBusinessTypes = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/marketplace/business-types');
      if (response.success) {
        setBusinessTypes(response.business_types);
      }
    } catch (error) {
      console.error('Failed to fetch business types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = async (newType) => {
    if (!isEditable || newType === selectedType) return;

    console.log('Changing business type to:', newType);

    try {
      setSaving(true);
      const response = await apiCall('/companies/business-type', {
        method: 'PUT',
        body: JSON.stringify({
          business_type: newType // Send display name to backend (backend will convert)
        })
      });

      if (response.success) {
        console.log('✅ Business type update successful, setting selectedType to:', newType);
        setSelectedType(newType);
        if (onUpdate) {
          // Send internal value to parent component
          const internalValue = displayToInternalMap[newType] || newType;
          console.log('✅ Updating parent with internal value:', internalValue);
          onUpdate(internalValue);
        } else {
          console.log('⚠️ No onUpdate callback provided');
        }
      }
    } catch (error) {
      console.error('Failed to update business type:', error);
      alert('Failed to update business type');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Business Type
      </h3>
      <p className="text-gray-600 mb-6">
        Select your company's primary type of activity. This will help our AI agents better understand your business specifics.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businessTypes.map((type) => (
          <div
            key={type.value}
            className={`
              relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
              ${selectedType === type.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${!isEditable ? 'cursor-not-allowed opacity-60' : ''}
              ${saving ? 'opacity-50 pointer-events-none' : ''}
            `}
            onClick={() => handleTypeChange(type.value)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div
                  className={`
                    h-4 w-4 rounded-full border-2 transition-colors
                    ${selectedType === type.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                    }
                  `}
                >
                  {selectedType === type.value && (
                    <div className="h-full w-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">
                  {type.label}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {type.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {saving && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-blue-600">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important to know
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Business type affects AI agents behavior and available features. 
                After changing the type, AI agents will automatically adapt to your business specifics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessTypeSelector; 