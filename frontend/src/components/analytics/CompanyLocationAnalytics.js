import React, { useState, useEffect } from 'react';
import { MapPinIcon, GlobeAltIcon, UsersIcon } from '@heroicons/react/24/outline';

const CompanyLocationAnalytics = ({ companyId }) => {
  const [locationStats, setLocationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocationStats();
  }, [companyId]);

  const fetchLocationStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/companies/${companyId}/analytics/customer-location`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocationStats(data.data);
      } else {
        setError('Failed to fetch location statistics');
      }
    } catch (error) {
      console.error('Error fetching location stats:', error);
      setError('Error loading location data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading customer location data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-orange-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!locationStats) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <p>No location data available</p>
        </div>
      </div>
    );
  }

  const locationPercentage = locationStats.total_customers > 0 
    ? Math.round((locationStats.customers_with_location / locationStats.total_customers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <GlobeAltIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Customer Location Analytics</h3>
            <p className="text-gray-600">Geographic distribution of your customers</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{locationStats.total_customers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <MapPinIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Location</p>
              <p className="text-2xl font-bold text-gray-900">{locationStats.customers_with_location}</p>
              <p className="text-sm text-gray-500">{locationPercentage}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <GlobeAltIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Countries</p>
              <p className="text-2xl font-bold text-gray-900">{locationStats.unique_countries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <MapPinIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">States/Regions</p>
              <p className="text-2xl font-bold text-gray-900">{locationStats.unique_states}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <MapPinIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cities</p>
              <p className="text-2xl font-bold text-gray-900">{locationStats.unique_cities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Countries and Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h4>
          {locationStats.top_countries && locationStats.top_countries.length > 0 ? (
            <div className="space-y-4">
              {locationStats.top_countries.map((country, index) => (
                <div key={country.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{country.location}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{country.count} customers</p>
                    <div className="flex space-x-2 text-xs text-gray-500">
                      <span>{country.bookings} bookings</span>
                      <span>${country.revenue.toFixed(2)} revenue</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No country data available</p>
            </div>
          )}
        </div>

        {/* Top Cities */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Top Cities</h4>
          {locationStats.top_cities && locationStats.top_cities.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {locationStats.top_cities.map((city, index) => (
                <div key={city.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="font-medium text-gray-900 text-sm">{city.location}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{city.count} customers</p>
                    <div className="flex space-x-2 text-xs text-gray-500">
                      <span>{city.bookings} bookings</span>
                      <span>${city.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No city data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Location Coverage Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Location Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{locationPercentage}%</p>
            <p className="text-sm text-gray-600">Customers with location data</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {locationStats.top_countries?.[0]?.location || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">Top customer country</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {locationStats.total_customers > 0 
                ? (locationStats.top_countries?.reduce((sum, country) => sum + country.revenue, 0) / locationStats.total_customers).toFixed(2)
                : '0.00'
              }
            </p>
            <p className="text-sm text-gray-600">Avg revenue per customer</p>
          </div>
        </div>
        
        {locationPercentage < 70 && (
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Tip:</strong> Only {locationPercentage}% of your customers have location data. 
                  Consider encouraging customers to complete their profile information for better analytics.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLocationAnalytics; 