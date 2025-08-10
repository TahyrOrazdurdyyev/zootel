import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  FunnelIcon,
  MapPinIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon
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

  // Mock data
  const listings = [
    {
      id: 1,
      type: 'service',
      name: 'Комплексный ветеринарный осмотр',
      company: 'ВетЦентр "Здоровый питомец"',
      price: 2500,
      originalPrice: 3000,
      discount: 17,
      rating: 4.9,
      reviews: 156,
      location: 'Москва, Центральный район',
      image: '/images/vet-checkup.jpg',
      category: 'veterinary',
      description: 'Полный медицинский осмотр с анализами и консультацией ветеринара',
      features: ['Анализы включены', 'Консультация 1 час', 'Сертификат здоровья']
    },
    {
      id: 2,
      type: 'service', 
      name: 'Профессиональный груминг',
      company: 'Салон "ПетСтиль"',
      price: 3500,
      rating: 4.8,
      reviews: 89,
      location: 'Москва, Северный район',
      image: '/images/grooming.jpg',
      category: 'grooming',
      description: 'Полный комплекс груминг услуг: стрижка, мытье, сушка, маникюр',
      features: ['Стрижка по стандарту', 'Гигиеническая обработка', 'Парфюмирование']
    },
    {
      id: 3,
      type: 'product',
      name: 'Премиум корм для собак Royal Canin',
      company: 'ЗооМагазин "Лапки"',
      price: 4200,
      originalPrice: 4800,
      discount: 13,
      rating: 4.7,
      reviews: 234,
      location: 'Москва, Восточный район',
      image: '/images/dog-food.jpg',
      category: 'nutrition',
      description: 'Сбалансированный корм для взрослых собак средних пород, 15кг',
      features: ['15кг упаковка', 'Для средних пород', 'Сбалансированный состав']
    },
    {
      id: 4,
      type: 'service',
      name: 'Дрессировка щенков (курс)',
      company: 'Школа "Умный пес"',
      price: 8000,
      rating: 4.9,
      reviews: 67,
      location: 'Москва, Западный район',
      image: '/images/training.jpg',
      category: 'training',
      description: 'Базовый курс дрессировки для щенков от 3 до 6 месяцев, 8 занятий',
      features: ['8 занятий', 'Группа до 6 щенков', 'Сертификат по окончании']
    }
  ];

  const categories = [
    { id: 'all', name: 'Все категории', count: 150 },
    { id: 'veterinary', name: 'Ветеринария', count: 45 },
    { id: 'grooming', name: 'Груминг', count: 32 },
    { id: 'boarding', name: 'Передержка', count: 18 },
    { id: 'training', name: 'Дрессировка', count: 25 },
    { id: 'walking', name: 'Выгул', count: 12 },
    { id: 'nutrition', name: 'Питание', count: 18 }
  ];

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
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.type !== 'all' && item.type !== filters.type) return false;
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !item.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

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
                placeholder="Поиск услуг, товаров, компаний..."
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
                  placeholder="Локация"
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
              <span>Фильтры</span>
            </button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="input-field"
                  >
                    <option value="all">Все</option>
                    <option value="services">Услуги</option>
                    <option value="products">Товары</option>
                    <option value="companies">Компании</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="input-field"
                  >
                    <option value="all">Любая</option>
                    <option value="0-1000">До 1,000₽</option>
                    <option value="1000-3000">1,000₽ - 3,000₽</option>
                    <option value="3000-5000">3,000₽ - 5,000₽</option>
                    <option value="5000+">От 5,000₽</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Рейтинг
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="input-field"
                  >
                    <option value="all">Любой</option>
                    <option value="4.5+">4.5+ звезд</option>
                    <option value="4.0+">4.0+ звезд</option>
                    <option value="3.5+">3.5+ звезд</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сортировка
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="input-field"
                  >
                    <option value="popular">Популярные</option>
                    <option value="price-low">Цена: по возрастанию</option>
                    <option value="price-high">Цена: по убыванию</option>
                    <option value="rating">Рейтинг</option>
                    <option value="newest">Новые</option>
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
                Категории
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
                {filters.search ? `Результаты поиска: "${filters.search}"` : 'Все услуги и товары'}
              </h1>
              <p className="text-gray-600">
                Найдено: {filteredListings.length} результатов
              </p>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                    <div className="absolute inset-0 flex items-center justify-center">
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
                        <HeartIconSolid className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Type Badge */}
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {item.type === 'service' ? 'Service' : 'Product'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-2">{item.company}</p>
                    
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

            {/* No Results */}
            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ничего не найдено
                </h3>
                <p className="text-gray-600 mb-6">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
                <button
                  onClick={() => setFilters({
                    search: '',
                    category: 'all',
                    type: 'all',
                    location: '',
                    priceRange: 'all',
                    rating: 'all',
                    sortBy: 'popular'
                  })}
                  className="btn-primary"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}

            {/* Load More */}
            {filteredListings.length > 0 && (
              <div className="text-center mt-12">
                <button className="btn-secondary">
                  Загрузить еще
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