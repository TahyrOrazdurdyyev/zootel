import React, { useState } from 'react';
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

  const serviceCategories = [
    { id: '', name: 'All categories' },
    { id: 'grooming', name: 'Grooming' },
    { id: 'veterinary', name: 'Veterinary' },
    { id: 'boarding', name: 'Boarding' },
    { id: 'training', name: 'Training' },
    { id: 'walking', name: 'Walking' },
    { id: 'sitting', name: 'Pet Sitting' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (searchLocation) params.append('location', searchLocation);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: '#f8f4f0' }}>
      {/* Background Image - positioned on the LEFT side behind text */}
      <div className="absolute left-0 top-0 w-1/2 h-full">
        <img 
          src="/images/background-image/Backgorund.jpg" 
          alt="" 
          className="w-full h-full object-cover object-right opacity-40"
        />
        {/* Gradient overlay to blend with background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-white"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - B2C Hero */}
          <div className="text-center lg:text-left relative">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Find and book
              <span className="text-orange-600"> the best Pet Care services</span> 
              near you
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Grooming, veterinary, boarding, pet products — all in one place. 
              Simple booking, reliable specialists, happy pets.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-xl mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Category Select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                >
                  {serviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Location Input */}
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
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

            {/* Category Dropdown like in Figma */}
            <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-orange-600 mr-3">✂️</span>
                  <span className="text-gray-700">Grooming</span>
                </div>
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-orange-600 mr-3">🎾</span>
                  <span className="text-gray-700">Training</span>
                </div>
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-orange-600 mr-3">🏠</span>
                  <span className="text-gray-700">Pet Sitting</span>
                </div>
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-orange-600 mr-3">🏥</span>
                  <span className="text-gray-700">Veterinary</span>
                </div>
              </div>
            </div>

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
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <BuildingOfficeIcon className="h-16 w-16 text-orange-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Manage Pet Care business
              </h2>
              <p className="text-gray-600">
                CRM system for vet clinics, groomers, pet stores and other Pet Care services
              </p>
            </div>

            {/* B2B Features */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <ChartBarIcon className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />
                <span>Booking and schedule management</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <ChatBubbleLeftIcon className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />
                <span>Automatic reminders and customer chat</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <SparklesIcon className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />
                <span>AI assistants for customer work</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <ChartBarIcon className="h-5 w-5 text-orange-500 mr-3 flex-shrink-0" />
                <span>Detailed analytics and reports</span>
              </div>
            </div>

            {/* B2B CTA Buttons */}
            <div className="space-y-3">
              <Link
                to="/business"
                className="block w-full bg-orange-600 text-white text-center py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
              >
                Learn about CRM →
              </Link>
              <Link
                to="/demo"
                className="block w-full border border-orange-600 text-orange-600 text-center py-3 px-6 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-medium"
              >
                Request demo
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-2">Already trusted:</p>
              <div className="text-center">
                <span className="text-lg font-semibold text-orange-600">200+</span>
                <span className="text-sm text-gray-600 ml-1">Pet Care companies</span>
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