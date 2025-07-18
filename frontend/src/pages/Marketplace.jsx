import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BookingModal from '../components/BookingModal';
import './Marketplace.css';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPetType, setSelectedPetType] = useState('all');
  const [priceSort, setPriceSort] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Fetch services from API
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use full backend URL in production, relative URL in development
      const apiBaseUrl = import.meta.env.DEV ? '' : 'https://zootel.shop';
      const response = await fetch(`${apiBaseUrl}/api/services/public`);

      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      } else {
        setError('Failed to load services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Error loading services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Categories data
  const categories = [
    { id: 'all', name: 'All Services', emoji: '🏪' },
    { id: 'grooming', name: 'Grooming', emoji: '✂️' },
    { id: 'veterinary', name: 'Veterinary', emoji: '🏥' },
    { id: 'boarding', name: 'Boarding', emoji: '🏠' },
    { id: 'training', name: 'Training', emoji: '🎓' },
    { id: 'walking', name: 'Walking', emoji: '🚶' },
    { id: 'pet sitting', name: 'Pet Sitting', emoji: '👥' },
  ];

  // Helper function to convert pet types to emojis
  const getPetTypeEmoji = (petType) => {
    const emojiMap = {
      'Dog': '🐕',
      'Cat': '🐱', 
      'Bird': '🐦',
      'Rabbit': '🐰',
      'Fish': '🐠',
      'Reptile': '🦎',
      'Other': '🐾'
    };
    return emojiMap[petType] || '🐾';
  };

  // Helper function to get service icon based on category
  const getServiceIcon = (category) => {
    const iconMap = {
      'grooming': '✂️',
      'veterinary': '🏥',
      'boarding': '🏠',
      'training': '🎓',
      'walking': '🚶‍♂️',
      'pet sitting': '👥',
      'exercise': '🏃‍♂️',
      'transportation': '🚗',
      'photography': '📸',
      'other': '🐾'
    };
    return iconMap[category.toLowerCase()] || '🐾';
  };

  // Filter services based on search and filters
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    const matchesPetType = selectedPetType === 'all' || 
                          service.petTypes.some(pet => getPetTypeEmoji(pet) === selectedPetType);
    
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
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }

    // Find the service and open booking modal
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setBookingModalOpen(true);
    }
  };

  const handleCompanyClick = (companyId) => {
    // Navigate to company page (placeholder)
    navigate(`/company/${companyId}`);
  };

  const handleBookingSuccess = (bookingData) => {
    console.log('Booking successful:', bookingData);
    // Could show a success notification or redirect to bookings page
    // navigate('/pet-owner/dashboard?tab=bookings');
  };

  const closeBookingModal = () => {
    setBookingModalOpen(false);
    setSelectedService(null);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="marketplace">
        <div className="search-header">
          <div className="container">
            <h1 className="page-title">Pet Services Marketplace</h1>
            <p className="page-subtitle">Loading services...</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Finding the best pet services for you...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="marketplace">
        <div className="search-header">
          <div className="container">
            <h1 className="page-title">Pet Services Marketplace</h1>
            <p className="page-subtitle">Oops! Something went wrong</p>
          </div>
        </div>
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <h3>Unable to load services</h3>
            <p>{error}</p>
            <button onClick={fetchServices} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                      {service.companyLogoUrl ? (
                        <img 
                          src={service.companyLogoUrl} 
                          alt={`${service.companyName} logo`}
                          className="company-logo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span className="service-icon" style={{ display: service.companyLogoUrl ? 'none' : 'block' }}>
                        {getServiceIcon(service.category)}
                      </span>
                    </div>
                    
                    <div className="service-content">
                      <h3 className="service-name">{service.name}</h3>
                      <p className="service-description">{service.description}</p>
                      
                      <div className="service-meta">
                        <div className="pet-types">
                          {service.petTypes.map((petType, index) => (
                            <span key={index} className="pet-icon" title={petType}>
                              {getPetTypeEmoji(petType)}
                            </span>
                          ))}
                        </div>
                        
                        <div className="service-rating">
                          <span className="rating-star">⭐</span>
                          <span className="rating-value">{service.rating.toFixed(1)}</span>
                          <span className="rating-count">({service.reviewCount})</span>
                        </div>
                      </div>

                      <button 
                        className="company-button"
                        onClick={() => handleCompanyClick(service.companyId)}
                      >
                        {service.companyName || 'Unknown Company'} • {service.location}
                      </button>

                      <div className="service-footer">
                        <div className="service-price">
                          <span className="price-value">${service.price}</span>
                          <span className="price-duration">/{service.duration}min</span>
                        </div>
                        
                        <button 
                          className="book-button"
                          onClick={() => handleBookService(service.id)}
                        >
                          Book Now
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

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={closeBookingModal}
        service={selectedService}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default Marketplace; 