import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const HomeHero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [serviceCategories, setServiceCategories] = useState([
    { id: '', name: 'All categories' }
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/v1/marketplace/categories');
      const data = await response.json();
      if (data.success && data.categories) {
        setServiceCategories([
          { id: '', name: 'All categories' },
          ...data.categories.map(cat => ({ id: cat.id, name: cat.name }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (searchLocation) params.append('location', searchLocation);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden" style={{
      backgroundImage: 'linear-gradient(135deg, rgba(248, 244, 240, 0.7) 0%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.3) 70%), url(/images/background-image/Backgorund.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - B2C Hero */}
          <div className="text-center lg:text-left relative">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Find and book
              <span className="text-orange-600"> the best Pet Care services</span> near you
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Grooming, veterinary, boarding, pet products — all in one place. 
              Simple booking, reliable specialists, happy pets.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-xl mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Category Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-left flex items-center justify-between"
                  >
                    <span>{selectedCategory ? serviceCategories.find(cat => cat.id === selectedCategory)?.name : 'All categories'}</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {serviceCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center"
                        >
                          {category.id === 'grooming' && <span className="mr-3">✂️</span>}
                          {category.id === 'veterinary' && <span className="mr-3">🏥</span>}
                          {category.id === 'boarding' && <span className="mr-3">🏠</span>}
                          {category.id === 'training' && <span className="mr-3">🎾</span>}
                          {category.id === 'walking' && <span className="mr-3">🚶</span>}
                          {category.id === 'sitting' && <span className="mr-3">🐕</span>}
                          <span>{category.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Input */}
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Search
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">500+</div>
                <div className="text-sm text-gray-600">Verified companies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">10K+</div>
                <div className="text-sm text-gray-600">Happy customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>

          {/* Right side - B2B Hero */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BuildingOfficeIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Manage Pet Care business
              </h2>
              <p className="text-sm text-gray-600">
                CRM system for vet clinics, groomers, pet stores and other Pet Care services
              </p>
            </div>

            {/* B2B Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                  <ChartBarIcon className="h-3 w-3 text-orange-600" />
                </div>
                <span>Booking and schedule management</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                  <ChatBubbleLeftIcon className="h-3 w-3 text-orange-600" />
                </div>
                <span>Automatic reminders and customer chat</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                  <SparklesIcon className="h-3 w-3 text-orange-600" />
                </div>
                <span>AI assistants for customer work</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-5 h-5 bg-orange-100 rounded flex items-center justify-center mr-3 flex-shrink-0">
                  <ChartBarIcon className="h-3 w-3 text-orange-600" />
                </div>
                <span>Detailed analytics and reports</span>
              </div>
            </div>

            {/* B2B CTA Buttons */}
            <div className="space-y-3">
              <Link
                to="/business"
                className="block w-full bg-orange-600 text-white text-center py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium text-sm"
              >
                Learn about CRM →
              </Link>
              <Link
                to="/demo"
                className="block w-full border border-orange-600 text-orange-600 text-center py-3 px-6 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-medium text-sm"
              >
                Request demo
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-1">Already trusted:</p>
              <div className="text-center">
                <span className="text-lg font-semibold text-orange-600">200+</span>
                <span className="text-xs text-gray-600 ml-1">Pet Care companies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Try a new way to interact with the Pet Care industry
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/services"
              className="bg-white text-orange-600 border border-orange-600 px-8 py-3 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-medium"
            >
              Go to marketplace
            </Link>
            <Link
              to="/business"
              className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
            >
              Start with CRM
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero; 