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
      {/* Company Header */}
      <div className="company-header">
        <div className="container">
          <div className="company-info">
            {company.logoUrl && (
              <div className="company-logo">
                <img src={company.logoUrl} alt={`${company.name} logo`} />
              </div>
            )}
            <div className="company-details">
              <h1 className="company-name">{company.name}</h1>
              <p className="company-location">
                {company.city && company.state ? `${company.city}, ${company.state}` : company.address}
              </p>
              {company.phone && (
                <p className="company-phone">📞 {company.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Carousel */}
      <div className="photos-section">
        <div className="container">
          {company.images && company.images.length > 0 ? (
            <div className="photo-carousel">
              <div className="carousel-container">
                <div className="carousel-track">
                  {company.images.map((image, index) => (
                    <div 
                      key={index} 
                      className={`carousel-slide ${index === currentImageIndex ? 'active' : ''}`}
                    >
                      <img src={image} alt={`${company.name} photo ${index + 1}`} />
                    </div>
                  ))}
                </div>
                
                {company.images.length > 1 && (
                  <>
                    <button 
                      className="carousel-nav prev"
                      onClick={() => handleImageNavigation('prev')}
                    >
                      ‹
                    </button>
                    <button 
                      className="carousel-nav next"
                      onClick={() => handleImageNavigation('next')}
                    >
                      ›
                    </button>
                    
                    <div className="carousel-dots">
                      {company.images.map((_, index) => (
                        <button
                          key={index}
                          className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="no-photos">
              <div className="no-photos-content">
                <div className="no-photos-icon">📷</div>
                <h3>No Photos Available</h3>
                <p>This company hasn't uploaded any photos yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Company Description */}
      {company.description && (
        <div className="description-section">
          <div className="container">
            <h2>About {company.name}</h2>
            <div className="description-content">
              <p>{company.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="services-section">
        <div className="container">
          <h2>Services Offered</h2>
          {services.length > 0 ? (
            <div className="services-grid">
              {services.map(service => (
                <div key={service.id} className="service-card">
                  <div className="service-header">
                    <h3 className="service-name">{service.name}</h3>
                    <div className="service-price">
                      <span className="price-value">${service.price}</span>
                      <span className="price-duration">/{service.duration}min</span>
                    </div>
                  </div>
                  
                  <p className="service-description">{service.description}</p>
                  
                  <div className="service-meta">
                    <div className="service-category">
                      <span className="category-badge">{service.category}</span>
                    </div>
                    <div className="service-rating">
                      <span className="rating-star">⭐</span>
                      <span className="rating-value">{service.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="book-service-btn"
                    onClick={() => handleBookService(service.id)}
                  >
                    Book This Service
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