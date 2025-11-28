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
  const [serviceCategories, setServiceCategories] = useState([]);
  
  const userMenuRef = useRef(null);
  const servicesMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Fetch service categories
  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const fetchServiceCategories = async () => {
    try {
      const response = await fetch('/api/v1/marketplace/categories');
      const data = await response.json();
      if (data.success && data.categories) {
        setServiceCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Close dropdowns when clicking outside
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

  // Determine current theme based on role and route
  const getCurrentTheme = () => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/company')) return 'company';
    return 'pet-owner';
  };

  // Determine whether to show full menu (only for pet-owner on public pages)
  const shouldShowFullMenu = () => {
    const theme = getCurrentTheme();
    return theme === 'pet-owner' && (!user || user.role === 'pet_owner');
  };

  // Determine whether to show search
  const shouldShowSearch = () => {
    return shouldShowFullMenu();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}`);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    if (value.length > 2) {
      // Mock autocomplete (in real app this would be an API call)
      const mockSuggestions = [
        { type: 'service', name: `${value} - grooming`, icon: '✂️' },
        { type: 'company', name: `Clinic "${value}"`, icon: '🏥' },
        { type: 'product', name: `Products: ${value}`, icon: '🛍️' }
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
        <div className="flex items-center h-16">
          
          {/* Logo - Always visible */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img src="/images/icons/Logo_orange.png" alt="Zootel" className="h-8 w-auto flex-shrink-0" style={{minWidth: '32px'}} />
            </Link>
          </div>

          {/* Main Menu (only for public pages) */}
          {shouldShowFullMenu() && (
            <nav className="hidden lg:flex items-center space-x-8 ml-8">
              {/* Services */}
              <div className="relative" ref={servicesMenuRef}>
                <button
                  onClick={() => setShowServicesMenu(!showServicesMenu)}
                  className="flex items-center text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium"
                >
                  Services
                  <ChevronDownIcon className="ml-1 h-4 w-4" />
                </button>
                
                {showServicesMenu && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {serviceCategories.map((category) => (
                        <Link
                          key={category.id}
                          to={`/services?category=${category.id}`}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded"
                          onClick={() => setShowServicesMenu(false)}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link
                        to="/marketplace"
                        className="block px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium"
                        onClick={() => setShowServicesMenu(false)}
                      >
                        All Services →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Shop */}
              <Link
                to="/marketplace?type=products"
                className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium"
              >
                Shop
              </Link>

              {/* Companies */}
              <Link
                to="/companies"
                className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium"
              >
                Companies
              </Link>

              {/* For Business */}
              <Link
                to="/business"
                className="text-orange-600 hover:text-red-700 px-3 py-2 text-sm font-medium border border-orange-600 rounded-lg hover:bg-orange-50"
              >
                For Business
              </Link>
            </nav>
          )}

          {/* Search bar (only for public pages) */}
          {shouldShowSearch() && (
            <div className="hidden lg:flex flex-1 max-w-lg mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Search services, products, companies..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onFocus={() => searchQuery.length > 2 && setShowSearchSuggestions(true)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-24 px-3 py-2 border-t border-b border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Autocomplete */}
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
                          {suggestion.type === 'service' ? 'Service' : 
                           suggestion.type === 'company' ? 'Company' : 'Product'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4 ml-auto mr-4">
            
            {/* Icons (only for authenticated users on public pages) */}
            {shouldShowFullMenu() && user && (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative p-2 text-gray-700 hover:text-orange-600">
                  <ShoppingCartIcon className="h-6 w-6" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <button className="relative p-2 text-gray-700 hover:text-orange-600">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* Chat */}
                <Link to="/chat" className="p-2 text-gray-700 hover:text-orange-600">
                  <ChatBubbleLeftIcon className="h-6 w-6" />
                </Link>
              </>
            )}

            {/* User menu or login buttons */}
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
                    
                    {/* Menu for pet_owner or unauthorized users */}
                    {(!user.role || user.role === 'pet_owner') && shouldShowFullMenu() && (
                      <>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/bookings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Bookings
                        </Link>
                        <Link
                          to="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Orders
                        </Link>
                        <Link
                          to="/favorites"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Favorites
                        </Link>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Settings
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    {/* Menu for company_owner */}
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
                          Services
                        </Link>
                        <Link
                          to="/company/employees"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Employees
                        </Link>
                        <Link
                          to="/company/customers"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Customers
                        </Link>
                        <Link
                          to="/company/analytics"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Analytics
                        </Link>
                        <Link
                          to="/company/ai-prompts"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          AI Prompts
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    {/* Menu for super_admin */}
                    {user.role === 'super_admin' && (
                      <>
                        <Link
                          to="/admin/analytics"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Analytics
                        </Link>
                        <Link
                          to="/admin/companies"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Companies
                        </Link>
                        <Link
                          to="/admin/prompts"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          AI Prompts
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login/registration buttons for unauthorized users */
              shouldShowFullMenu() && (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Register
                  </Link>
                </div>
              )
            )}

            {/* Mobile menu (only for public pages) */}
            {shouldShowFullMenu() && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-gray-700 hover:text-orange-600"
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

        {/* Mobile menu */}
        {showMobileMenu && shouldShowFullMenu() && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link
                to="/services"
                className="block px-3 py-2 text-gray-700 hover:text-orange-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Services
              </Link>
              <Link
                to="/shop"
                className="block px-3 py-2 text-gray-700 hover:text-orange-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Shop
              </Link>
              <Link
                to="/companies"
                className="block px-3 py-2 text-gray-700 hover:text-orange-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Companies
              </Link>
              <Link
                to="/business"
                className="block px-3 py-2 text-orange-600 font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                For Business
              </Link>
            </div>
            
            {/* Mobile search */}
            <div className="mt-4 px-3">
              <form onSubmit={handleSearch}>
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    placeholder="Search services, products, companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Search
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