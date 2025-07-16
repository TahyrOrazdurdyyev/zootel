import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Marketplace.css';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPetType, setSelectedPetType] = useState('all');
  const [priceSort, setPriceSort] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const navigate = useNavigate();

  // Mock data for categories
  const categories = [
    { id: 'all', name: 'All Services', emoji: '🏪' },
    { id: 'grooming', name: 'Grooming', emoji: '✂️' },
    { id: 'veterinary', name: 'Veterinary', emoji: '🏥' },
    { id: 'boarding', name: 'Boarding', emoji: '🏠' },
    { id: 'training', name: 'Training', emoji: '🎓' },
    { id: 'walking', name: 'Walking', emoji: '🚶' },
    { id: 'sitting', name: 'Pet Sitting', emoji: '👥' },
  ];

  // Mock data for services
  const mockServices = [
    {
      id: 1,
      name: 'Premium Dog Grooming',
      description: 'Complete grooming service including bath, nail trim, and styling',
      price: 75,
      rating: 4.8,
      reviewCount: 127,
      category: 'grooming',
      petTypes: ['🐕', '🐩'],
      image: '🐕‍🦺',
      companyName: 'Paws & Claws Spa',
      companyId: 'company1',
      location: 'Downtown',
    },
    {
      id: 2,
      name: 'Cat Health Checkup',
      description: 'Comprehensive health examination for your feline friend',
      price: 120,
      rating: 4.9,
      reviewCount: 89,
      category: 'veterinary',
      petTypes: ['🐱'],
      image: '🐱',
      companyName: 'City Vet Clinic',
      companyId: 'company2',
      location: 'Medical District',
    },
    {
      id: 3,
      name: 'Weekend Pet Boarding',
      description: 'Safe and comfortable boarding for your pets while you travel',
      price: 45,
      rating: 4.7,
      reviewCount: 203,
      category: 'boarding',
      petTypes: ['🐕', '🐱', '🐰'],
      image: '🏠',
      companyName: 'Happy Tails Lodge',
      companyId: 'company3',
      location: 'Suburbs',
    },
    {
      id: 4,
      name: 'Basic Obedience Training',
      description: 'Foundation training for puppies and young dogs',
      price: 200,
      rating: 4.6,
      reviewCount: 156,
      category: 'training',
      petTypes: ['🐕', '🐩'],
      image: '🎓',
      companyName: 'Smart Paws Academy',
      companyId: 'company4',
      location: 'Park Area',
    },
    {
      id: 5,
      name: 'Daily Dog Walking',
      description: '30-minute walks to keep your dog active and healthy',
      price: 25,
      rating: 4.5,
      reviewCount: 342,
      category: 'walking',
      petTypes: ['🐕'],
      image: '🚶‍♂️',
      companyName: 'Active Paws Service',
      companyId: 'company5',
      location: 'All Areas',
    },
    {
      id: 6,
      name: 'Exotic Pet Care',
      description: 'Specialized care for birds, reptiles, and small mammals',
      price: 90,
      rating: 4.8,
      reviewCount: 67,
      category: 'veterinary',
      petTypes: ['🦎', '🐦', '🐰'],
      image: '🦎',
      companyName: 'Exotic Animal Hospital',
      companyId: 'company6',
      location: 'University Area',
    },
  ];

  // Filter services based on search and filters
  const filteredServices = mockServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    const matchesPetType = selectedPetType === 'all' || 
                          service.petTypes.some(pet => pet === selectedPetType);
    
    const matchesRating = ratingFilter === '' || service.rating >= parseFloat(ratingFilter);
    
    return matchesSearch && matchesCategory && matchesPetType && matchesRating;
  });

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (priceSort === 'low-to-high') return a.price - b.price;
    if (priceSort === 'high-to-low') return b.price - a.price;
    if (priceSort === 'rating') return b.rating - a.rating;
    return 0;
  });

  const handleBookService = (serviceId) => {
    // Navigate to booking page (placeholder)
    navigate(`/booking/${serviceId}`);
  };

  const handleCompanyClick = (companyId) => {
    // Navigate to company page (placeholder)
    navigate(`/company/${companyId}`);
  };

  return (
    <div className="marketplace">
      {/* Search Header */}
      <div className="search-header">
        <div className="container">
          <h1 className="page-title">Pet Services Marketplace</h1>
          <p className="page-subtitle">Find trusted pet services in your area</p>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for services, companies, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-button">🔍</button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="container">
          <div className="categories-grid">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="category-emoji">{category.emoji}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="marketplace-content">
        <div className="container">
          <div className="marketplace-layout">
            {/* Sidebar Filters */}
            <aside className="filters-sidebar">
              <h3 className="sidebar-title">Filters</h3>
              
              {/* Pet Type Filter */}
              <div className="filter-group">
                <h4 className="filter-title">Pet Type</h4>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="petType"
                      value="all"
                      checked={selectedPetType === 'all'}
                      onChange={(e) => setSelectedPetType(e.target.value)}
                    />
                    All Pets
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="petType"
                      value="🐕"
                      checked={selectedPetType === '🐕'}
                      onChange={(e) => setSelectedPetType(e.target.value)}
                    />
                    🐕 Dogs
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="petType"
                      value="🐱"
                      checked={selectedPetType === '🐱'}
                      onChange={(e) => setSelectedPetType(e.target.value)}
                    />
                    🐱 Cats
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="petType"
                      value="🐰"
                      checked={selectedPetType === '🐰'}
                      onChange={(e) => setSelectedPetType(e.target.value)}
                    />
                    🐰 Small Pets
                  </label>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="petType"
                      value="🦎"
                      checked={selectedPetType === '🦎'}
                      onChange={(e) => setSelectedPetType(e.target.value)}
                    />
                    🦎 Exotic Pets
                  </label>
                </div>
              </div>

              {/* Price Sort */}
              <div className="filter-group">
                <h4 className="filter-title">Sort by Price</h4>
                <select 
                  value={priceSort} 
                  onChange={(e) => setPriceSort(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Default</option>
                  <option value="low-to-high">Price: Low to High</option>
                  <option value="high-to-low">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="filter-group">
                <h4 className="filter-title">Minimum Rating</h4>
                <select 
                  value={ratingFilter} 
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                </select>
              </div>
            </aside>

            {/* Services Grid */}
            <main className="services-content">
              <div className="services-header">
                <h2 className="services-count">
                  {sortedServices.length} services found
                </h2>
              </div>

              <div className="services-grid">
                {sortedServices.map(service => (
                  <div key={service.id} className="service-card">
                    <div className="service-image">
                      <span className="service-icon">{service.image}</span>
                    </div>
                    
                    <div className="service-content">
                      <h3 className="service-name">{service.name}</h3>
                      <p className="service-description">{service.description}</p>
                      
                      <div className="service-meta">
                        <div className="pet-types">
                          {service.petTypes.map((pet, index) => (
                            <span key={index} className="pet-icon">{pet}</span>
                          ))}
                        </div>
                        
                        <div className="service-rating">
                          <span className="rating-star">⭐</span>
                          <span className="rating-value">{service.rating}</span>
                          <span className="rating-count">({service.reviewCount})</span>
                        </div>
                      </div>

                      <button 
                        className="company-button"
                        onClick={() => handleCompanyClick(service.companyId)}
                      >
                        {service.companyName} • {service.location}
                      </button>

                      <div className="service-footer">
                        <div className="service-price">
                          <span className="price-value">${service.price}</span>
                        </div>
                        
                        <button 
                          className="book-button"
                          onClick={() => handleBookService(service.id)}
                        >
                          {service.category === 'training' || service.category === 'boarding' ? 'Order' : 'Book'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sortedServices.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No services found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace; 