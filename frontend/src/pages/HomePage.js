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

  const [serviceCategories, setServiceCategories] = useState([]);

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
      setLoading(true);
      
      // Fetch service categories (critical data)
      try {
        console.log('🔍 Fetching categories from /api/v1/marketplace/categories');
        const categoriesResponse = await fetch('/api/v1/marketplace/categories');
        console.log('📡 Categories response status:', categoriesResponse.status);
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log('📦 Categories data received:', categoriesData);
          console.log('🎯 Categories array:', categoriesData.categories);
          console.log('📊 Categories count:', categoriesData.categories?.length || 0);
          setServiceCategories(categoriesData.categories || []);
        } else {
          console.log('❌ Categories endpoint returned:', categoriesResponse.status);
          setServiceCategories([]);
        }
      } catch (error) {
        console.error('💥 Error fetching categories:', error);
        setServiceCategories([]);
      }
      
      // Fetch featured deals (optional data)
      try {
        const dealsResponse = await fetch('/api/deals/featured');
        if (dealsResponse.ok) {
          const dealsData = await dealsResponse.json();
          setFeaturedDeals(dealsData.deals || []);
        } else {
          console.log('No deals endpoint available yet');
          setFeaturedDeals([]);
        }
      } catch (error) {
        console.log('Deals not available yet');
        setFeaturedDeals([]);
      }
      
      // Fetch top companies (optional data)
      try {
        const companiesResponse = await fetch('/api/companies/top');
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setTopCompanies(companiesData.companies || []);
        } else {
          console.log('No top companies endpoint available yet');
          setTopCompanies([]);
        }
      } catch (error) {
        console.log('Top companies not available yet');
        setTopCompanies([]);
      }
      
      // Fetch customer reviews (optional data)
      try {
        const reviewsResponse = await fetch('/api/reviews/recent');
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setCustomerReviews(reviewsData.reviews || []);
        } else {
          console.log('No reviews endpoint available yet');
          setCustomerReviews([]);
        }
      } catch (error) {
        console.log('Reviews not available yet');
        setCustomerReviews([]);
      }
      
      setLoading(false);
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
            {loading ? (
              // Loading skeleton
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-48 animate-pulse"></div>
              ))
            ) : (console.log('🎨 Rendering categories, count:', serviceCategories.length, 'categories:', serviceCategories), serviceCategories.length > 0) ? (
              serviceCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/services?category=${category.id}`}
                  className="relative bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group h-48"
                  style={{
                    backgroundImage: `url(${category.background_image || `/images/${category.id}.png`})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="relative h-full flex flex-col justify-end p-4 text-white">
                    <h3 className="font-bold text-lg mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm opacity-90 mb-1">{category.description}</p>
                    {category.count && <p className="text-xs font-medium opacity-80">{category.count}</p>}
                  </div>
                </Link>
              ))
            ) : (
              // No categories message
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No service categories available</p>
              </div>
            )}
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
              className="text-orange-600 hover:text-red-700 font-medium flex items-center"
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
                    <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
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
                        <span className="text-2xl font-bold text-orange-600">
                          {deal.discountPrice.toLocaleString()}₽
                        </span>
                        <span className="text-lg text-gray-500 line-through ml-2">
                          {deal.originalPrice.toLocaleString()}₽
                        </span>
                      </div>
                      <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200">
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
                    className="block w-full text-center bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200"
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
              className="inline-flex items-center text-orange-600 hover:text-red-700 font-medium"
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
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
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
                  
                  <div className="text-sm text-orange-600 font-medium">
                    {review.service}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* B2B CTA Section */}
      <section className="py-16 bg-orange-600">
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
              className="bg-white text-orange-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
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