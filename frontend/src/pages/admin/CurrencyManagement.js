import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { apiCall } from '../../utils/api';
import toast from 'react-hot-toast';

const CurrencyManagement = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    flag_emoji: '',
    is_active: true,
    is_base: false,
    exchange_rate: 1.0
  });

  // Load currencies
  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/admin/currencies', 'GET');
      if (response.success) {
        setCurrencies(response.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      toast.error('Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCurrency) {
        // Update existing currency
        await apiCall(`/admin/currencies/${editingCurrency.code}`, 'PUT', formData);
        toast.success('Currency updated successfully');
      } else {
        // Create new currency
        await apiCall('/admin/currencies', 'POST', formData);
        toast.success('Currency created successfully');
      }
      
      setShowModal(false);
      setEditingCurrency(null);
      setFormData({
        code: '',
        name: '',
        symbol: '',
        flag_emoji: '',
        is_active: true,
        is_base: false,
        exchange_rate: 1.0
      });
      fetchCurrencies();
    } catch (error) {
      console.error('Error saving currency:', error);
      toast.error('Failed to save currency');
    }
  };

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      flag_emoji: currency.flag_emoji,
      is_active: currency.is_active,
      is_base: currency.is_base,
      exchange_rate: currency.exchange_rate
    });
    setShowModal(true);
  };

  const handleDelete = async (code) => {
    if (!window.confirm('Are you sure you want to delete this currency?')) {
      return;
    }

    try {
      await apiCall(`/admin/currencies/${code}`, 'DELETE');
      toast.success('Currency deleted successfully');
      fetchCurrencies();
    } catch (error) {
      console.error('Error deleting currency:', error);
      toast.error('Failed to delete currency');
    }
  };

  const handleToggleStatus = async (code) => {
    try {
      await apiCall(`/admin/currencies/${code}/toggle`, 'PUT');
      toast.success('Currency status updated');
      fetchCurrencies();
    } catch (error) {
      console.error('Error toggling currency status:', error);
      toast.error('Failed to update currency status');
    }
  };

  const handleSetBase = async (code) => {
    if (!window.confirm('Are you sure you want to set this as the base currency? This will recalculate all exchange rates.')) {
      return;
    }

    try {
      await apiCall(`/admin/currencies/${code}/set-base`, 'PUT');
      toast.success('Base currency updated successfully');
      fetchCurrencies();
    } catch (error) {
      console.error('Error setting base currency:', error);
      toast.error('Failed to set base currency');
    }
  };

  const handleUpdateRates = async () => {
    try {
      await apiCall('/admin/currencies/update-rates', 'POST');
      toast.success('Exchange rates updated successfully');
      fetchCurrencies();
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      toast.error('Failed to update exchange rates');
    }
  };

  const openModal = () => {
    setEditingCurrency(null);
    setFormData({
      code: '',
      name: '',
      symbol: '',
      flag_emoji: '',
      is_active: true,
      is_base: false,
      exchange_rate: 1.0
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Currency Management</h1>
          <p className="text-gray-600">Manage supported currencies and exchange rates</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleUpdateRates}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Update Rates
          </button>
          <button
            onClick={openModal}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Currency
          </button>
        </div>
      </div>

      {/* Currencies Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exchange Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currencies.map((currency) => (
              <tr key={currency.code} className={currency.is_base ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{currency.flag_emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {currency.code}
                        {currency.is_base && (
                          <StarIcon className="w-4 h-4 ml-1 text-yellow-500" title="Base Currency" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{currency.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {currency.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {currency.exchange_rate.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    currency.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currency.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(currency.last_updated).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {!currency.is_base && (
                      <button
                        onClick={() => handleSetBase(currency.code)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Set as Base Currency"
                      >
                        <StarIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(currency)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(currency.code)}
                      className={currency.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                    >
                      {currency.is_active ? <XMarkIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
                    </button>
                    {!currency.is_base && (
                      <button
                        onClick={() => handleDelete(currency.code)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="USD"
                    required
                    disabled={editingCurrency}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="US Dollar"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symbol</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="$"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Flag Emoji</label>
                  <input
                    type="text"
                    value={formData.flag_emoji}
                    onChange={(e) => setFormData({...formData, flag_emoji: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="🇺🇸"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({...formData, exchange_rate: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_base}
                      onChange={(e) => setFormData({...formData, is_base: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Base Currency</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingCurrency ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagement;
