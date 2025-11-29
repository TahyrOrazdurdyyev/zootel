import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageCarousel from '../components/ui/ImageCarousel';
import GoogleMap from '../components/ui/GoogleMap';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  GlobeAltIcon,
  StarIcon,
  ClockIcon,

  HeartIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const CompanyPublicPage = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');


  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    setLoading(true);
    console.log('🔍 CompanyPublicPage fetchCompanyData - companyId:', companyId);
    try {
      // Fetch company profile
      const companyResponse = await fetch(`/api/v1/public/companies/${companyId}`);
      const companyData = await companyResponse.json();
      
      if (companyData.success) {
        setCompany(companyData.company);
      }

      // Fetch services
      const servicesResponse = await fetch(`/api/v1/public/companies/${companyId}/services`);
      const servicesData = await servicesResponse.json();
      
      if (servicesData.success) {
        setServices(servicesData.services);
      }

      // Fetch products
      const productsResponse = await fetch(`/api/v1/public/companies/${companyId}/products`);
      const productsData = await productsResponse.json();
      
      if (productsData.success) {
        setProducts(productsData.products);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarSolidIcon key={i} className="w-5 h-5 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="w-5 h-5 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarSolidIcon className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="w-5 h-5 text-gray-300" />
        );
      }
    }
    return stars;
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <Link to="/marketplace" className="text-blue-600 hover:text-blue-800">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with background image */}
      <div className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600">
        {company.media_gallery && company.media_gallery.length > 0 ? (
          <div className="relative w-full h-full">
            <ImageCarousel
              images={company.media_gallery}
              alt={company.name}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 pointer-events-none"></div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
        )}
        
        {/* Company info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end space-x-6">
              {/* Company logo */}
              {company.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="w-24 h-24 rounded-lg border-4 border-white shadow-lg object-cover"
                  />
                </div>
              )}
              
              {/* Company details */}
              <div className="flex-1 text-white">
                <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
                <div className="flex items-center space-x-4 text-lg">
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-5 h-5" />
                    <span>{company.city}, {company.country}</span>
                  </div>
                  {company.avg_rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {renderStars(company.avg_rating)}
                      </div>
                      <span>({company.review_count} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <nav className="flex space-x-8">
            {[
              { id: 'about', label: 'About', count: null },
              { id: 'services', label: 'Services', count: company.service_count },
              { id: 'products', label: 'Products', count: company.product_count },
              { id: 'reviews', label: 'Reviews', count: company.review_count }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">About {company.name}</h2>
                <p className="text-gray-600 leading-relaxed">
                  {company.description || 'No description available.'}
                </p>
              </div>

              {/* Business hours */}
              {company.business_hours && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Business Hours
                  </h3>
                  <div className="space-y-2">
                    {JSON.parse(company.business_hours).map((day, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium">{day.day}</span>
                        <span className="text-gray-600">
                          {day.open} - {day.close}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {company.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                        {company.phone}
                      </a>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                        {company.email}
                      </a>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center">
                      <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start">
                      <MapPinIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-gray-600">{company.address}</p>
                        <p className="text-gray-600">{company.city}, {company.state}</p>
                        <p className="text-gray-600">{company.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Location</h3>
                <GoogleMap
                  address={company.address}
                  coordinates={company.latitude && company.longitude ? {
                    lat: parseFloat(company.latitude),
                    lng: parseFloat(company.longitude)
                  } : null}
                  height="300px"
                  className="rounded-lg"
                  markerTitle={company.name}
                />
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {company.address}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  {service.image_url && (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(service.price)}
                      </span>
                      <Link
                        to={`/booking/${companyId}?service=${service.id}`}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(product.price)}
                      </span>
                      <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 btn-primary text-sm py-2">
                        <ShoppingCartIcon className="w-4 h-4 inline mr-1" />
                        Add to Cart
                      </button>
                      <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <HeartIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            {company.recent_reviews && company.recent_reviews.length > 0 ? (
              <div className="space-y-6">
                {company.recent_reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{review.customer_name}</h4>
                        <div className="flex items-center mt-1">
                          {renderStars(review.rating)}
                          <span className="ml-2 text-gray-500 text-sm">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No reviews yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyPublicPage; 