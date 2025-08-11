import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const UniversalHeader = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  const userMenuRef = useRef(null);
  const servicesMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Закрытие выпадающих меню при клике вне их
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(event.target)) {
        setShowServicesMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Определяем текущую тему на основе роли и маршрута
  const getCurrentTheme = () => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/company')) return 'company';
    return 'pet-owner';
  };

  // Определяем, показывать ли полное меню (только для pet-owner на публичных страницах)
  const shouldShowFullMenu = () => {
    const theme = getCurrentTheme();
    return theme === 'pet-owner' && (!user || user.role === 'pet_owner');
  };

  // Определяем, показывать ли поиск
  const shouldShowSearch = () => {
    return shouldShowFullMenu();
  };

  const serviceCategories = [
    { id: 'grooming', name: 'Груминг', icon: '✂️' },
    { id: 'veterinary', name: 'Ветеринария', icon: '🏥' },
    { id: 'boarding', name: 'Передержка', icon: '🏠' },
    { id: 'training', name: 'Дрессировка', icon: '🎾' },
    { id: 'walking', name: 'Выгул', icon: '🚶' },
    { id: 'sitting', name: 'Пет-ситтинг', icon: '👥' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}`);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    if (value.length > 2) {
      // Имитация автодополнения (в реальности это будет API-запрос)
      const mockSuggestions = [
        { type: 'service', name: `${value} - груминг`, icon: '✂️' },
        { type: 'company', name: `Клиника "${value}"`, icon: '🏥' },
        { type: 'product', name: `Товары: ${value}`, icon: '🛍️' }
      ];
      setSearchSuggestions(mockSuggestions);
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const cartItemsCount = cartItems?.length || 0;
  const theme = getCurrentTheme();

  return (
    <header className={`sticky top-0 z-50 bg-white shadow-sm theme-${theme}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Логотип */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/logo.svg" alt="Zootel" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-gray-900">Zootel</span>
            </Link>
          </div>

          {/* Основное меню (только для публичных страниц) */}
          {shouldShowFullMenu() && (
            <nav className="hidden lg:flex items-center space-x-8 ml-8">
              {/* Услуги */}
              <div className="relative" ref={servicesMenuRef}>
                <button
                  onClick={() => setShowServicesMenu(!showServicesMenu)}
                  className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                >
                  Услуги
                  <ChevronDownIcon className="ml-1 h-4 w-4" />
                </button>
                
                {showServicesMenu && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {serviceCategories.map((category) => (
                        <Link
                          key={category.id}
                          to={`/services/${category.id}`}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded"
                          onClick={() => setShowServicesMenu(false)}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link
                        to="/services"
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                        onClick={() => setShowServicesMenu(false)}
                      >
                        Все услуги →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Магазин */}
              <Link
                to="/shop"
                className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
              >
                Магазин
              </Link>

              {/* Компании */}
              <Link
                to="/companies"
                className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
              >
                Компании
              </Link>

              {/* Для бизнеса */}
              <Link
                to="/business"
                className="text-red-600 hover:text-red-700 px-3 py-2 text-sm font-medium border border-red-600 rounded-lg hover:bg-red-50"
              >
                Для бизнеса
              </Link>
            </nav>
          )}

          {/* Поисковая строка (только для публичных страниц) */}
          {shouldShowSearch() && (
            <div className="hidden lg:flex flex-1 max-w-lg mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Поиск услуг, товаров, компаний..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onFocus={() => searchQuery.length > 2 && setShowSearchSuggestions(true)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Город"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-24 px-3 py-2 border-t border-b border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Автодополнение */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion.name);
                          setShowSearchSuggestions(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                      >
                        <span className="mr-3">{suggestion.icon}</span>
                        {suggestion.name}
                        <span className="ml-auto text-xs text-gray-500">
                          {suggestion.type === 'service' ? 'Услуга' : 
                           suggestion.type === 'company' ? 'Компания' : 'Товар'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Правая часть */}
          <div className="flex items-center space-x-4">
            
            {/* Иконки (только для авторизованных на публичных страницах) */}
            {shouldShowFullMenu() && user && (
              <>
                {/* Корзина */}
                <Link to="/cart" className="relative p-2 text-gray-700 hover:text-red-600">
                  <ShoppingCartIcon className="h-6 w-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {/* Уведомления */}
                <button className="relative p-2 text-gray-700 hover:text-red-600">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* Чат */}
                <Link to="/chat" className="p-2 text-gray-700 hover:text-red-600">
                  <ChatBubbleLeftIcon className="h-6 w-6" />
                </Link>
              </>
            )}

            {/* Меню пользователя или кнопки входа */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-600" />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.name || user.email}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    
                    {/* Меню для pet_owner или неавторизованных */}
                    {(!user.role || user.role === 'pet_owner') && shouldShowFullMenu() && (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Профиль
                        </Link>
                        <Link
                          to="/bookings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Мои бронирования
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Мои заказы
                        </Link>
                        <Link
                          to="/favorites"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Избранное
                        </Link>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Настройки
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    {/* Меню для company_owner */}
                    {user.role === 'company_owner' && (
                      <>
                        <Link
                          to="/company"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/company/services"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Услуги
                        </Link>
                        <Link
                          to="/company/analytics"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Аналитика
                        </Link>
                        <Link
                          to="/company/ai-prompts"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          AI Промпты
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    {/* Меню для super_admin */}
                    {user.role === 'super_admin' && (
                      <>
                        <Link
                          to="/admin/analytics"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Аналитика
                        </Link>
                        <Link
                          to="/admin/companies"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Компании
                        </Link>
                        <Link
                          to="/admin/prompts"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          AI Промпты
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Выход
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Кнопки входа/регистрации для неавторизованных */
              shouldShowFullMenu() && (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium"
                  >
                    Вход
                  </Link>
                  <Link
                    to="/register"
                    className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Регистрация
                  </Link>
                </div>
              )
            )}

            {/* Мобильное меню (только для публичных страниц) */}
            {shouldShowFullMenu() && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-gray-700 hover:text-red-600"
              >
                {showMobileMenu ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Мобильное меню */}
        {showMobileMenu && shouldShowFullMenu() && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link
                to="/services"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Услуги
              </Link>
              <Link
                to="/shop"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Магазин
              </Link>
              <Link
                to="/companies"
                className="block px-3 py-2 text-gray-700 hover:text-red-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Компании
              </Link>
              <Link
                to="/business"
                className="block px-3 py-2 text-red-600 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Для бизнеса
              </Link>
            </div>
            
            {/* Мобильный поиск */}
            <div className="mt-4 px-3">
              <form onSubmit={handleSearch}>
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    placeholder="Поиск услуг, товаров, компаний..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Город"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Найти
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default UniversalHeader; 