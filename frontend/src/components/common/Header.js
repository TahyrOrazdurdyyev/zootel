import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  BellIcon, 
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}&category=${searchCategory}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemsCount = getTotalItems();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Zootel</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/marketplace" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              Услуги
            </Link>
            <Link to="/marketplace?type=products" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              Магазин
            </Link>
            <Link to="/marketplace?type=companies" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              Компании
            </Link>
            <Link to="/business" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              Для бизнеса
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full flex">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="rounded-l-lg border border-r-0 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Все</option>
                <option value="services">Услуги</option>
                <option value="products">Товары</option>
                <option value="companies">Компании</option>
              </select>
              <input
                type="text"
                placeholder="Поиск по локации или услуге..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-r-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Right side - Icons and Auth */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-primary-500">
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-gray-700 hover:text-primary-500">
                  <BellIcon className="h-6 w-6" />
                </button>

                {/* Chat */}
                <Link to="/chat" className="p-2 text-gray-700 hover:text-primary-500">
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary-500">
                    <UserIcon className="h-6 w-6" />
                    <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                  </Link>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-700 hover:text-primary-500 px-3 py-2"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
                  Войти
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Регистрация
                </Link>
              </>
            )}

            {user && user.role === 'company_owner' && (
              <>
                <Link 
                  to="/company" 
                  className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/company/chat" 
                  className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Customer Chat
                </Link>
                <Link 
                  to="/company/analytics" 
                  className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Analytics
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-500"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden py-4 border-t border-gray-200">
          <form onSubmit={handleSearch} className="flex">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="rounded-l-lg border border-r-0 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все</option>
              <option value="services">Услуги</option>
              <option value="products">Товары</option>
              <option value="companies">Компании</option>
            </select>
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-r-lg hover:bg-primary-600"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/marketplace" 
                className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Услуги
              </Link>
              <Link 
                to="/marketplace?type=products" 
                className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Магазин
              </Link>
              <Link 
                to="/marketplace?type=companies" 
                className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Компании
              </Link>
              <Link 
                to="/business" 
                className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Для бизнеса
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 