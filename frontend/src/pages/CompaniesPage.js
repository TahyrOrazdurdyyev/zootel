import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [businessTypes, setBusinessTypes] = useState([
    { value: 'all', label: 'All Types' }
  ]);

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'moscow', label: 'Moscow' },
    { value: 'spb', label: 'St. Petersburg' },
    { value: 'kazan', label: 'Kazan' },
    { value: 'ekaterinburg', label: 'Ekaterinburg' }
  ];

  useEffect(() => {
    fetchCompanies();
    fetchCategories();
  }, []);

  // Refetch companies when filters change
  useEffect(() => {
    fetchCompanies();
  }, [categoryFilter, locationFilter, searchTerm, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/marketplace/categories');
      const data = await response.json();
      if (data.success && data.categories) {
        setBusinessTypes([
          { value: 'all', label: 'All Types' },
          ...data.categories.map(cat => ({ 
            value: cat.name.toLowerCase().replace(' ', '_'), 
            label: cat.name 
          }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (locationFilter && locationFilter !== 'all') {
        params.append('city', locationFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const queryString = params.toString();
      const url = `/api/v1/public/companies${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔍 Fetching companies with URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies || []);
      } else {
        console.error('Failed to fetch companies:', data.error);
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || company.business_type === categoryFilter;
    const matchesLocation = locationFilter === 'all' || 
                           (company.city || company.location || '')?.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      case 'reviews':
        return (b.review_count || 0) - (a.review_count || 0);
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      default:
        return 0;
    }
  });

  const formatRating = (rating) => {
    return (rating || 0).toFixed(1);
  };

  const getBusinessTypeLabel = (type) => {
    const typeObj = businessTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                </div>
              ))}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pet Service Companies</h1>
          <p className="text-gray-600">Discover trusted pet care providers in your area</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {businessTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {locations.map(location => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">Sort by Rating</option>
              <option value="reviews">Sort by Reviews</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {sortedCompanies.length} of {companies.length} companies
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Cover Image */}
              <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                {(company.media_gallery && company.media_gallery.length > 0) ? (
                  <img
                    src={company.media_gallery[0]}
                    alt={company.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-16 w-16 text-white" />
                  </div>
                )}
                {company.is_verified && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Verified
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Company Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="h-12 w-12 rounded-lg object-cover mr-3"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{getBusinessTypeLabel(company.business_type)}</p>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.floor(company.avg_rating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {formatRating(company.avg_rating)}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">
                    ({company.review_count || 0} reviews)
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {company.description}
                </p>

                {/* Location */}
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {company.location}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{company.services_count} services</span>
                  <span>24/7 support</span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {company.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {company.phone}
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {company.email}
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GlobeAltIcon className="h-4 w-4 mr-2" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/companies/${company.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/booking/${company.id}`}
                    className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {!loading && sortedCompanies.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {companies.length === 0 ? 'No companies available' : 'No companies found'}
            </h3>
            <p className="text-gray-500">
              {companies.length === 0 
                ? 'Check back later for new pet service providers' 
                : 'Try adjusting your search criteria'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;
