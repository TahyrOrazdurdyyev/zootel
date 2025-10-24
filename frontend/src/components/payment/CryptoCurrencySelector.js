import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { apiCall } from '../../utils/api';

const CryptoCurrencySelector = ({ 
  selectedCurrency, 
  selectedNetwork, 
  onCurrencyChange, 
  onNetworkChange,
  className = '' 
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (selectedCurrency) {
      fetchNetworks(selectedCurrency);
    }
  }, [selectedCurrency]);

  const fetchCurrencies = async () => {
    try {
      const response = await apiCall('/api/v1/crypto/currencies', 'GET');
      if (response.success) {
        setCurrencies(response.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworks = async (currencyCode) => {
    try {
      const response = await apiCall(`/api/v1/crypto/currencies/${currencyCode}/networks`, 'GET');
      if (response.success) {
        setNetworks(response.data);
        // Auto-select first network if none selected
        if (response.data.length > 0 && !selectedNetwork) {
          onNetworkChange(response.data[0].code);
        }
      }
    } catch (error) {
      console.error('Error fetching networks:', error);
    }
  };

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency);
  const selectedNetworkData = networks.find(n => n.code === selectedNetwork);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Cryptocurrency</h3>
      
      {/* Currency Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Currency
        </label>
        <div className="relative">
          <button
            type="button"
            className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex items-center">
              {selectedCurrencyData && (
                <>
                  <img
                    src={selectedCurrencyData.icon}
                    alt={selectedCurrencyData.name}
                    className="h-6 w-6 flex-shrink-0 mr-3"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <span className="block truncate">
                    {selectedCurrencyData.name} ({selectedCurrencyData.code})
                  </span>
                </>
              )}
              {!selectedCurrencyData && (
                <span className="block truncate text-gray-500">
                  Select a currency
                </span>
              )}
            </div>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </button>

          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
              {currencies.map((currency) => (
                <div
                  key={currency.code}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                  onClick={() => {
                    onCurrencyChange(currency.code);
                    setShowDropdown(false);
                  }}
                >
                  <div className="flex items-center">
                    <img
                      src={currency.icon}
                      alt={currency.name}
                      className="h-6 w-6 flex-shrink-0 mr-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="font-normal block truncate">
                      {currency.name} ({currency.code})
                    </span>
                    <span className="text-gray-500 ml-2">
                      {currency.symbol}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Network Selection */}
      {selectedCurrency && networks.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Network
          </label>
          <div className="grid grid-cols-2 gap-2">
            {networks.map((network) => (
              <button
                key={network.code}
                type="button"
                className={`relative p-3 border rounded-md text-left transition-colors ${
                  selectedNetwork === network.code
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onClick={() => onNetworkChange(network.code)}
              >
                <div className="text-sm font-medium">{network.name}</div>
                <div className="text-xs text-gray-500">{network.code}</div>
                {selectedNetwork === network.code && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Currency Info */}
      {selectedCurrencyData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Min Amount:</span>
              <span className="font-medium">{selectedCurrencyData.min_amount} {selectedCurrencyData.code}</span>
            </div>
            <div className="flex justify-between">
              <span>Max Amount:</span>
              <span className="font-medium">{selectedCurrencyData.max_amount} {selectedCurrencyData.code}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoCurrencySelector;
