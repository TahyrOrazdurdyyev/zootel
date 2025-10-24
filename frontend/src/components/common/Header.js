import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  BellIcon, 
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiCall } from '../../utils/api';
import CurrencySelector from './CurrencySelector';

// Add trial status indicator
const TrialStatusIndicator = ({ trialExpired, daysLeft }) => {
  if (trialExpired) {
    return (
      <div className="flex items-center px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">
        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
        Trial Expired
      </div>
    );
  }
  
  if (daysLeft && daysLeft <= 7) {
    return (
      <div className="flex items-center px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">
        <ClockIcon className="w-4 h-4 mr-1" />
        {daysLeft} days left
      </div>
    );
  }
  
  return null;
};

const Header = () => {
  const { user, company, logout } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [trialStatus, setTrialStatus] = useState(null);

  useEffect(() => {
    // Check trial status for company owners
    if (user?.role === 'company_owner' && company) {
      checkTrialStatus();
    }
  }, [user, company]);

  const checkTrialStatus = async () => {
    try {
      const response = await apiCall('/api/company/trial-status', 'GET');
      setTrialStatus(response.data);
    } catch (error) {
      console.error('Failed to check trial status:', error);
    }
  };

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
              <img src="/logo.svg" alt="Zootel" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/marketplace" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              Services
            </Link>
            <Link to="/marketplace?type=products" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              Shop
            </Link>
            <Link to="/marketplace?type=companies" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              Companies
            </Link>
            <Link to="/business" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
              For Business
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
                <option value="all">All</option>
                <option value="services">Services</option>
                <option value="products">Products</option>
                <option value="companies">Companies</option>
              </select>
              <input
                type="text"
                placeholder="Search by location or service..."
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
            {/* Currency Selector */}
            <CurrencySelector />
            
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
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Register
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
                  to="/company/services" 
                  className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Services
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
                <Link 
                  to="/company/ai-prompts" 
                  className="text-gray-700 hover:text-orange-500 px-3 py-2 rounded-md text-sm font-medium"
                >
                  AI Prompts
                </Link>
              </>
            )}

            {user && user.role === 'super_admin' && (
              <>
                <Link to="/admin/analytics" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Analytics
                </Link>
                <Link to="/admin/companies" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Companies
                </Link>
                <Link to="/admin/plan-settings" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Plan Settings
                </Link>
                <Link to="/admin/payment-settings" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Payment Settings
                </Link>
                <Link to="/admin/ai-agents" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  AI Agents
                </Link>
                <Link to="/admin/prompts" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  AI Prompts
                </Link>
              </>
            )}

            {/* Trial status indicator */}
            {trialStatus && (
              <TrialStatusIndicator 
                trialExpired={trialStatus.trial_expired}
                daysLeft={trialStatus.days_left}
              />
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
              <option value="all">All</option>
              <option value="services">Services</option>
              <option value="products">Products</option>
              <option value="companies">Companies</option>
            </select>
            <input
              type="text"
              placeholder="Search..."
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
                Services
              </Link>
              <Link 
                to="/marketplace?type=products" 
                className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              <Link 
                to="/marketplace?type=companies" 
                className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Companies
              </Link>
              <Link 
                to="/business" 
                className="text-gray-700 hover:text-primary-500 px-3 py-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                For Business
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 