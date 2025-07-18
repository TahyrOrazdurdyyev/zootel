import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BookingModal from '../components/BookingModal';
import './CompanyDescription.css';

const CompanyDescription = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiBaseUrl = import.meta.env.DEV ? '' : 'https://zootel.shop';
      
      // Fetch company details
      const companyResponse = await fetch(`${apiBaseUrl}/api/companies/${companyId}/public`);
      const servicesResponse = await fetch(`${apiBaseUrl}/api/companies/${companyId}/services/public`);
      
      if (companyResponse.ok && servicesResponse.ok) {
        const companyData = await companyResponse.json();
        const servicesData = await servicesResponse.json();
        
        setCompany(companyData.data);
        setServices(servicesData.data || []);
      } else {
        setError('Company not found');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Error loading company information');
    } finally {
      setLoading(false);
    }
  };

  const handleImageNavigation = (direction) => {
    if (!company?.images || company.images.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => 
        prev === company.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === 0 ? company.images.length - 1 : prev - 1
      );
    }
  };

  const handleBookService = (serviceId) => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }

    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedService(service);
      setBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = (bookingData) => {
    console.log('Booking successful:', bookingData);
    setBookingModalOpen(false);
    setSelectedService(null);
  };

  const closeBookingModal = () => {
    setBookingModalOpen(false);
    setSelectedService(null);
  };

  if (loading) {
    return (
      <div className="company-description">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading company information...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="company-description">
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <h3>Company Not Found</h3>
            <p>{error || 'The company you are looking for does not exist.'}</p>
            <button onClick={() => navigate('/marketplace')} className="back-button">
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="company-description">
      {/* Hero Section with Background */}
      <div className="company-hero">
        <div className="hero-background">
          {company.images && company.images.length > 0 ? (
            <img 
              src={company.images[0]} 
              alt={`${company.name} background`}
              className="hero-bg-image"
            />
          ) : (
            <div className="hero-bg-gradient"></div>
          )}
          <div className="hero-overlay"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <div className="company-main-info">
              {company.logoUrl && (
                <div className="company-avatar">
                  <img src={company.logoUrl} alt={`${company.name} logo`} />
                  <div className="avatar-ring"></div>
                </div>
              )}
              
              <div className="company-title">
                <h1 className="company-name">{company.name}</h1>
                <div className="company-badges">
                  {company.verified && (
                    <span className="verified-badge">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Verified
                    </span>
                  )}
                  <span className="services-count">{services.length} Services</span>
                </div>
                
                <div className="company-location-info">
                  <div className="location-item">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {company.city && company.state ? `${company.city}, ${company.state}` : company.address}
                  </div>
                  
                  {company.phone && (
                    <div className="location-item">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                      {company.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="quick-actions">
              <button className="action-btn primary">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Contact
              </button>
              <button className="action-btn secondary">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{company.rating?.toFixed(1) || '5.0'}</div>
                <div className="stat-label">Rating</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">🛍️</div>
              <div className="stat-content">
                <div className="stat-value">{services.length}</div>
                <div className="stat-label">Services</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{company.totalBookings || '10+'}</div>
                <div className="stat-label">Bookings</div>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-value">Today</div>
                <div className="stat-label">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      {company.images && company.images.length > 0 && (
        <div className="gallery-section">
          <div className="container">
            <h2 className="section-title">
              <span className="title-icon">📸</span>
              Gallery
            </h2>
            
            <div className="photo-gallery">
              <div className="main-photo">
                <img 
                  src={company.images[currentImageIndex]} 
                  alt={`${company.name} photo ${currentImageIndex + 1}`}
                  className="main-image"
                />
                
                {company.images.length > 1 && (
                  <>
                    <button 
                      className="gallery-nav prev"
                      onClick={() => handleImageNavigation('prev')}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                      </svg>
                    </button>
                    <button 
                      className="gallery-nav next"
                      onClick={() => handleImageNavigation('next')}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {company.images.length > 1 && (
                <div className="photo-thumbnails">
                  {company.images.map((image, index) => (
                    <div 
                      key={index}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img src={image} alt={`Thumbnail ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      {company.description && (
        <div className="about-section">
          <div className="container">
            <h2 className="section-title">
              <span className="title-icon">ℹ️</span>
              About {company.name}
            </h2>
            <div className="about-content">
              <p className="description-text">{company.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="services-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-icon">🎯</span>
            Our Services
          </h2>
          
          {services.length > 0 ? (
            <div className="services-grid">
              {services.map((service, index) => (
                <div 
                  key={service.id} 
                  className="service-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="service-header">
                    <div className="service-icon">
                      {service.category === 'grooming' ? '✂️' : 
                       service.category === 'sitting' ? '🏠' : 
                       service.category === 'training' ? '🎓' : '🐕'}
                    </div>
                    <div className="service-info">
                      <h3 className="service-name">{service.name}</h3>
                      <div className="service-category-badge">
                        {service.category}
                      </div>
                    </div>
                    <div className="service-price">
                      <span className="price-currency">$</span>
                      <span className="price-value">{service.price}</span>
                      <span className="price-duration">/{service.duration}min</span>
                    </div>
                  </div>
                  
                  <p className="service-description">{service.description}</p>
                  
                  <div className="service-features">
                    <div className="feature-item">
                      <span className="feature-icon">⏱️</span>
                      <span>{service.duration} minutes</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">⭐</span>
                      <span>{service.rating?.toFixed(1) || '5.0'} rating</span>
                    </div>
                  </div>
                  
                  <button 
                    className="book-service-btn"
                    onClick={() => handleBookService(service.id)}
                  >
                    <span className="btn-icon">📅</span>
                    Book Now
                    <span className="btn-arrow">→</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-services">
              <div className="no-services-content">
                <div className="no-services-icon">🐕</div>
                <h3>No Services Available</h3>
                <p>This company hasn't added any services yet.</p>
              </div>
            </div>
          )}
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

export default CompanyDescription; 