import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    priceRange: '',
    rating: '',
    availability: ''
  });

  // Получаем параметры поиска из URL
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const locationParam = searchParams.get('location') || '';

  useEffect(() => {
    // Устанавливаем фильтры из URL
    setFilters(prev => ({
      ...prev,
      category: categoryParam,
      location: locationParam
    }));
    
    // Загружаем результаты поиска
    loadSearchResults();
  }, [location.search]);

  const loadSearchResults = async () => {
    setLoading(true);
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Мок данные результатов поиска
      const mockResults = [
        {
          id: 1,
          type: 'service',
          title: 'Комплексный груминг собак',
          company: 'PetStyle Studio',
          price: 2450,
          originalPrice: 3500,
          rating: 4.8,
          reviewCount: 127,
          location: 'Москва, ЦАО',
          image: '/api/placeholder/300/200',
          availability: 'Сегодня доступен',
          features: ['Мойка', 'Стрижка', 'Сушка', 'Стрижка когтей']
        },
        {
          id: 2,
          type: 'service',
          title: 'Ветеринарный осмотр',
          company: 'ВетКлиника "Здоровье"',
          price: 1500,
          rating: 4.9,
          reviewCount: 234,
          location: 'Москва, СВАО',
          image: '/api/placeholder/300/200',
          availability: 'Завтра доступен',
          features: ['Консультация', 'Осмотр', 'Рекомендации']
        },
        {
          id: 3,
          type: 'product',
          title: 'Корм Royal Canin для кошек',
          company: 'Зоомагазин "Лапландия"',
          price: 1890,
          rating: 4.7,
          reviewCount: 89,
          location: 'Москва, ЮАО',
          image: '/api/placeholder/300/200',
          availability: 'В наличии',
          features: ['2кг', 'Для взрослых кошек', 'Доставка']
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error loading search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    // Обновляем URL с новыми фильтрами
    const newSearchParams = new URLSearchParams(location.search);
    if (value) {
      newSearchParams.set(filterType, value);
    } else {
      newSearchParams.delete(filterType);
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <StarIconSolid 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Поиск результатов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Результаты поиска
            </h1>
            <p className="text-gray-600">
              Найдено {searchResults.length} результатов
            </p>
          </div>
          
          {/* Search Query Display */}
          {query && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-600">Поиск по:</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                {query}
              </span>
              {categoryParam && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Категория: {categoryParam}
                </span>
              )}
              {locationParam && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  {locationParam}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <FunnelIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
              </div>
              
              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Все категории</option>
                  <option value="grooming">Груминг</option>
                  <option value="veterinary">Ветеринария</option>
                  <option value="boarding">Передержка</option>
                  <option value="training">Дрессировка</option>
                  <option value="products">Товары</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цена
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Любая цена</option>
                  <option value="0-1000">До 1 000₽</option>
                  <option value="1000-3000">1 000 - 3 000₽</option>
                  <option value="3000-5000">3 000 - 5 000₽</option>
                  <option value="5000+">Свыше 5 000₽</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рейтинг
                </label>
                <div className="space-y-2">
                  {[5, 4, 3].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={filters.rating === rating.toString()}
                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                        className="mr-2"
                      />
                      <div className="flex items-center">
                        {renderStars(rating)}
                        <span className="ml-2 text-sm text-gray-600">и выше</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Доступность
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="availability"
                      value="today"
                      checked={filters.availability === 'today'}
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Сегодня</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="availability"
                      value="tomorrow"
                      checked={filters.availability === 'tomorrow'}
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Завтра</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="availability"
                      value="week"
                      checked={filters.availability === 'week'}
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">На этой неделе</span>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setFilters({ category: '', location: '', priceRange: '', rating: '', availability: '' });
                  navigate('/search');
                }}
                className="w-full text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Очистить фильтры
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Sort Options */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Показано {searchResults.length} из {searchResults.length} результатов
              </p>
              <div className="flex items-center">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600 mr-2" />
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent">
                  <option>По релевантности</option>
                  <option>По цене (возрастание)</option>
                  <option>По цене (убывание)</option>
                  <option>По рейтингу</option>
                  <option>По отзывам</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
              {searchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-80 h-48 md:h-auto relative">
                      <img 
                        src={result.image} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                      <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
                        <HeartIcon className="h-5 w-5 text-gray-600" />
                      </button>
                      {result.originalPrice && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                          -{Math.round((1 - result.price / result.originalPrice) * 100)}%
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {result.title}
                          </h3>
                          <p className="text-gray-600">{result.company}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.type === 'service' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {result.type === 'service' ? 'Услуга' : 'Товар'}
                        </span>
                      </div>

                      {/* Rating and Location */}
                      <div className="flex items-center mb-3">
                        <div className="flex items-center mr-4">
                          {renderStars(Math.floor(result.rating))}
                          <span className="ml-1 text-sm text-gray-600">
                            {result.rating} ({result.reviewCount} отзывов)
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {result.location}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.features.map((feature, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Availability */}
                      <div className="flex items-center mb-4">
                        <ClockIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">{result.availability}</span>
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            {result.price.toLocaleString()}₽
                          </span>
                          {result.originalPrice && (
                            <span className="text-lg text-gray-500 line-through ml-2">
                              {result.originalPrice.toLocaleString()}₽
                            </span>
                          )}
                        </div>
                        <button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                          {result.type === 'service' ? 'Записаться' : 'В корзину'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Результаты не найдены
                </h3>
                <p className="text-gray-600">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage; 