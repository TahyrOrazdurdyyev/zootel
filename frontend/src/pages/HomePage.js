import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon,
  StarIcon,
  MapPinIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import HomeHero from '../components/heroes/HomeHero';

const HomePage = () => {
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const serviceCategories = [
    { 
      id: 'grooming', 
      name: 'Grooming', 
      icon: '✂️', 
      description: 'Haircut, washing, coat care',
      count: '120+ masters'
    },
    { 
      id: 'veterinary', 
      name: 'Veterinary', 
      icon: '🏥', 
      description: 'Consultations, treatment, vaccinations',
      count: '85+ clinics'
    },
    { 
      id: 'boarding', 
      name: 'Boarding', 
      icon: '🏠', 
      description: 'Pet hotels',
      count: '45+ hotels'
    },
    { 
      id: 'training', 
      name: 'Training', 
      icon: '🎾', 
      description: 'Education and behavior correction',
      count: '30+ trainers'
    },
    { 
      id: 'walking', 
      name: 'Walking', 
      icon: '🚶', 
      description: 'Dog walks',
      count: '200+ sitters'
    },
    { 
      id: 'sitting', 
      name: 'Pet Sitting', 
      icon: '👥', 
      description: 'Home care',
      count: '150+ sitters'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Choose a service or product',
      description: 'Find the service you need through search or category catalog',
      icon: '🔍'
    },
    {
      step: 2,
      title: 'Book or add to cart',
      description: 'Choose a convenient time for the service or add the product to cart',
      icon: '📅'
    },
    {
      step: 3,
      title: 'Pay online or offline',
      description: 'Secure payment by card online or cash on site',
      icon: '💳'
    },
    {
      step: 4,
      title: 'Come or receive delivery',
      description: 'Come at the appointed time or wait for product delivery',
      icon: '✅'
    }
  ];

  useEffect(() => {
    const fetchHomePageData = async () => {
      try {
        const [dealsResponse, companiesResponse, reviewsResponse] = await Promise.all([
          fetch('/api/deals/featured'),
          fetch('/api/companies/top'),
          fetch('/api/reviews/recent')
        ]);

        const [dealsData, companiesData, reviewsData] = await Promise.all([
          dealsResponse.json(),
          companiesResponse.json(),
          reviewsResponse.json()
        ]);

        setFeaturedDeals(dealsData.deals || []);
        setTopCompanies(companiesData.companies || []);
        setCustomerReviews(reviewsData.reviews || []);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        setFeaturedDeals([]);
        setTopCompanies([]);
        setCustomerReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <StarIconSolid 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HomeHero />

      {/* Service Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Service Categories
            </h2>
            <p className="text-lg text-gray-600">
              Choose the right category for your pet
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {serviceCategories.map((category) => (
              <Link
                key={category.id}
                to={`/services/${category.id}`}
                className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg hover:border-red-300 transition-all duration-200 group"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-red-600 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                <p className="text-xs text-red-600 font-medium">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="py-16 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🔥 Hot Deals
              </h2>
              <p className="text-lg text-gray-600">
                Best discounts on services and products
              </p>
            </div>
            <Link
              to="/deals"
              className="text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              All Deals <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p>Loading featured deals...</p>
            ) : featuredDeals.length === 0 ? (
              <p>No featured deals available at the moment.</p>
            ) : (
              featuredDeals.map((deal) => (
                <div key={deal.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="relative">
                    <img 
                      src={deal.image} 
                      alt={deal.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{deal.discount}%
                    </div>
                    <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
                      <HeartIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {deal.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{deal.company}</p>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center mr-3">
                        {renderStars(Math.floor(deal.rating))}
                        <span className="ml-1 text-sm text-gray-600">{deal.rating}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {deal.location}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-red-600">
                          {deal.discountPrice.toLocaleString()}₽
                        </span>
                        <span className="text-lg text-gray-500 line-through ml-2">
                          {deal.originalPrice.toLocaleString()}₽
                        </span>
                      </div>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                                                Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Top Companies */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recommended Companies
            </h2>
            <p className="text-lg text-gray-600">
              Verified partners with high ratings
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p>Loading top companies...</p>
            ) : topCompanies.length === 0 ? (
              <p>No top companies available at the moment.</p>
            ) : (
              topCompanies.map((company) => (
                <div key={company.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start mb-4">
                    <img 
                      src={company.logo} 
                      alt={company.name}
                      className="w-16 h-16 rounded-lg object-cover mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h3 className="font-semibold text-gray-900">{company.name}</h3>
                        {company.verified && (
                          <CheckBadgeIcon className="h-5 w-5 text-blue-500 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center mb-1">
                        <div className="flex">
                          {renderStars(Math.floor(company.rating))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {company.rating} ({company.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {company.location}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {company.services.map((service, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <Link
                    to={`/companies/${company.id}`}
                    className="block w-full text-center bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                                            Go
                  </Link>
                </div>
              ))
            )}
          </div>
          
          <div className="text-center mt-8">
            <Link
              to="/companies"
              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
            >
              View All Companies <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple steps to a happy pet
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={step.step} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Customer Reviews
            </h2>
            <p className="text-lg text-gray-600">
              What pet owners say about our services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p>Loading customer reviews...</p>
            ) : customerReviews.length === 0 ? (
              <p>No customer reviews available at the moment.</p>
            ) : (
              customerReviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={review.avatar} 
                      alt={review.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.name}</h4>
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-600">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">"{review.review}"</p>
                  
                  <div className="text-sm text-red-600 font-medium">
                    {review.service}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* B2B CTA Section */}
      <section className="py-16 bg-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
                            Start using Zootel for your business
          </h2>
                      <p className="text-xl text-red-100 mb-8">
              CRM system for managing Pet Care business. Increase sales and improve service.
            </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/business"
              className="bg-white text-red-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
            >
              Learn More About CRM
            </Link>
            <Link
              to="/register?type=business"
              className="bg-red-700 text-white px-8 py-3 rounded-lg hover:bg-red-800 transition-colors duration-200 font-medium"
            >
              Company Registration
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 