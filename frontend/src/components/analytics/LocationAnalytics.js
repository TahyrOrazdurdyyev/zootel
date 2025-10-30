import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, UsersIcon, MapPinIcon, FlagIcon } from '@heroicons/react/24/outline';

const LocationAnalytics = () => {
  const [locationData, setLocationData] = useState(null);
  const [detailedUsers, setDetailedUsers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, trends

  useEffect(() => {
    fetchLocationAnalytics();
  }, []);

  const fetchLocationAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/analytics/location/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocationData(data.data);
      }
    } catch (error) {
      console.error('Error fetching location analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCountry) params.append('country', selectedCountry);
      if (selectedRole) params.append('role', selectedRole);
      params.append('limit', '100');

      const response = await fetch(`/api/v1/admin/analytics/location/detailed?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetailedUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching detailed users:', error);
    }
  };

  const fetchLocationTrends = async () => {
    try {
      const params = new URLSearchParams();
      params.append('period', '90');
      params.append('group_by', 'week');
      if (selectedCountry) params.append('country', selectedCountry);

      const response = await fetch(`/api/v1/admin/analytics/location/trends?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrends(data.data);
      }
    } catch (error) {
      console.error('Error fetching location trends:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'detailed') {
      fetchDetailedUsers();
    } else if (viewMode === 'trends') {
      fetchLocationTrends();
    }
  }, [viewMode, selectedCountry, selectedRole]);

  const formatRoleBreakdown = (breakdown) => {
    const countryData = {};
    
    breakdown.forEach(item => {
      if (!countryData[item.country]) {
        countryData[item.country] = {
          country: item.country,
          total: 0,
          pet_owner: 0,
          company: 0,
          states: {}
        };
      }
      
      countryData[item.country].total += item.count;
      countryData[item.country][item.role] += item.count;
      
      if (item.state) {
        if (!countryData[item.country].states[item.state]) {
          countryData[item.country].states[item.state] = { total: 0, pet_owner: 0, company: 0 };
        }
        countryData[item.country].states[item.state].total += item.count;
        countryData[item.country].states[item.state][item.role] += item.count;
      }
    });
    
    return Object.values(countryData).sort((a, b) => b.total - a.total);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'pet_owner': return 'bg-blue-100 text-blue-800';
      case 'company': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'pet_owner': return 'Pet Owners';
      case 'company': return 'Companies';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading location analytics...</span>
      </div>
    );
  }

  const formattedBreakdown = locationData?.role_breakdown ? formatRoleBreakdown(locationData.role_breakdown) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GlobeAltIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Location Analytics</h2>
              <p className="text-gray-600">Geographic distribution of users by role</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'detailed' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'trends' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Trends
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      {viewMode === 'overview' && locationData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{locationData.total_stats?.total_users || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <MapPinIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Location</p>
                  <p className="text-2xl font-bold text-gray-900">{locationData.total_stats?.users_with_location || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <FlagIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Countries</p>
                  <p className="text-2xl font-bold text-gray-900">{locationData.total_stats?.unique_countries || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <MapPinIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">States</p>
                  <p className="text-2xl font-bold text-gray-900">{locationData.total_stats?.unique_states || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <MapPinIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cities</p>
                  <p className="text-2xl font-bold text-gray-900">{locationData.total_stats?.unique_cities || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Countries with Role Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Countries by Users</h3>
              <div className="space-y-4">
                {locationData.top_countries?.slice(0, 10).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{country.country}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{country.total_users} total</p>
                        <div className="flex space-x-2 text-xs">
                          <span className="text-blue-600">{country.pet_owners} owners</span>
                          <span className="text-green-600">{country.companies} companies</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Role Distribution by Location</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {formattedBreakdown.slice(0, 15).map((country) => (
                  <div key={country.country} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{country.country}</span>
                      <span className="text-sm text-gray-600">{country.total} users</span>
                    </div>
                    <div className="flex space-x-2">
                      {country.pet_owner > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor('pet_owner')}`}>
                          {country.pet_owner} Pet Owners
                        </span>
                      )}
                      {country.company > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor('company')}`}>
                          {country.company} Companies
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detailed Users View */}
      {viewMode === 'detailed' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Detailed User Locations</h3>
            <div className="flex space-x-4">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Countries</option>
                {locationData?.top_countries?.map(country => (
                  <option key={country.country} value={country.country}>
                    {country.country}
                  </option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Roles</option>
                <option value="pet_owner">Pet Owners</option>
                <option value="company">Companies</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {[user.city, user.state, user.country].filter(Boolean).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Registration Trends by Location</h3>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Countries</option>
              {locationData?.top_countries?.map(country => (
                <option key={country.country} value={country.country}>
                  {country.country}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900">{trend.period}</span>
                  <span className="text-sm text-gray-600">{trend.country}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(trend.role)}`}>
                    {getRoleLabel(trend.role)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{trend.registrations} registrations</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAnalytics; 