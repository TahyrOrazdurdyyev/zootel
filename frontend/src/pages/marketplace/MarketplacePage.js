import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { 
  FunnelIcon,
  MapPinIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../contexts/CartContext';

const MarketplacePage = () => {
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    type: searchParams.get('type') || 'all', // 'services', 'products', 'companies'
    location: '',
    priceRange: 'all',
    rating: 'all',
    sortBy: 'popular'
  });

  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch listings and categories from API
  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch listings
      const listingsResponse = await fetch('/api/v1/public/marketplace');
      const listingsData = await listingsResponse.json();

      console.log('🔍 Marketplace API response:', listingsData);
      if (listingsData.success) {
        console.log('✅ Listings received:', listingsData.listings);
        console.log('📊 Listings count:', listingsData.listings?.length || 0);
        setListings(listingsData.listings || []);
      } else {
        console.error('Failed to fetch listings:', listingsData.error);
        setListings([]);
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/v1/public/categories');
      const categoriesData = await categoriesResponse.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories || []);
      } else {
        console.error('Failed to fetch categories:', categoriesData.error);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      setError('Marketplace Coming Soon');
      setListings([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleFavorite = (itemId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  const handleAddToCart = (item) => {
    addItem({
      id: item.id,
      type: item.type,
      name: item.name,
      company: item.company,
      price: item.price,
      description: item.description,
      image: item.image
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  };

  const filteredListings = listings.filter(item => {
    console.log('🔍 Filtering item:', item);
    console.log('🎯 Current filters:', filters);
    
    if (filters.category !== 'all' && item.category !== filters.category) {
      console.log('❌ Category filter failed:', item.category, 'vs', filters.category);
      return false;
    }
    // For now, show all items regardless of type filter since we only have services
    // TODO: Implement proper type filtering when products are added
    if (filters.type !== 'all' && filters.type !== 'products' && filters.type !== 'services') {
      // Only filter out if it's a specific type that's not services or products
      if (item.type && item.type !== filters.type) {
        console.log('❌ Type filter failed:', item.type, 'vs', filters.type);
        return false;
      }
    }
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !item.description.toLowerCase().includes(filters.search.toLowerCase())) {
      console.log('❌ Search filter failed');
      return false;
    }
    console.log('✅ Item passed filters');
    return true;
  });
  
  console.log('📊 Filtered listings count:', filteredListings.length);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-orange-500 text-lg mb-4">{error}</div>
          <button
            onClick={fetchMarketplaceData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search services, products, companies..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full input-field"
              />
            </div>

            {/* Location Filter */}
            <div className="md:w-64">
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full input-field pl-10"
                />
              </div>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="input-field"
                  >
                    <option value="all">All</option>
                    <option value="services">Services</option>
                    <option value="products">Products</option>
                    <option value="companies">Companies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="input-field"
                  >
                    <option value="all">Any</option>
                    <option value="0-1000">Up to 1,000₽</option>
                    <option value="1000-3000">1,000₽ - 3,000₽</option>
                    <option value="3000-5000">3,000₽ - 5,000₽</option>
                    <option value="5000+">Over 5,000₽</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="input-field"
                  >
                    <option value="all">Any</option>
                    <option value="4.5+">4.5+ stars</option>
                    <option value="4.0+">4.0+ stars</option>
                    <option value="3.5+">3.5+ stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input-field"
                  >
                    <option value="popular">Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h3>
              <nav className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleFilterChange('category', category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      filters.category === category.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>{category.name}</span>
                      <span className="text-gray-400">({category.count})</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {filters.search ? `Search Results: "${filters.search}"` : 'All Services and Products'}
              </h1>
              <p className="text-gray-600">
                Found: {filteredListings.length} results
              </p>
            </div>

            {/* Listings Grid */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {listings.length === 0 ? 'No listings available' : 'No listings found'}
                </h3>
                <p className="text-gray-500">
                  {listings.length === 0 
                    ? 'Check back later for new services and products'
                    : 'Try adjusting your search criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center ${item.image_url ? 'hidden' : ''}`}>
                      <span className="text-4xl">
                        {item.type === 'service' ? '🛍️' : '📦'}
                      </span>
                    </div>
                    
                    {/* Discount Badge */}
                    {item.is_on_sale && item.discount_percentage && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                        -{item.discount_percentage}%
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:shadow-md"
                    >
                      {favorites.has(item.id) ? (
                        <HeartIconSolid className="h-5 w-5 text-orange-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Type Badge */}
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {item.type === 'service' || !item.type ? 'Service' : 'Product'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    
                    <Link 
                      to={`/companies/${item.companyId || 'demo-company'}`}
                      className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
                    >
                      {item.company}
                    </Link>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Features */}
                    {item.features && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {item.features.slice(0, 2).map((feature, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                          {item.features.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{item.features.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rating and Location */}
                    <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 font-medium">{item.rating || '5.0'}</span>
                        <span className="ml-1">({item.reviews || '0'})</span>
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4" />
                        <span className="ml-1 text-xs">{item.location || 'Location'}</span>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-primary-500">
                            {formatPrice(item.price)}
                          </span>
                          {item.is_on_sale && item.original_price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.original_price)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="btn-primary flex items-center space-x-1 text-sm px-3 py-2"
                      >
                        <ShoppingCartIcon className="h-4 w-4" />
                        <span>{item.type === 'service' ? 'Book' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}


            {/* Load More */}
            {filteredListings.length > 0 && (
              <div className="text-center mt-12">
                <button className="btn-secondary">
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage; 