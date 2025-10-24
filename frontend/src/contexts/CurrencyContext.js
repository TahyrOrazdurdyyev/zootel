import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/currencies');
        const data = await response.json();
        
        if (data.success) {
          setCurrencies(data.data);
          
          // Set default currency (first one or USD)
          const defaultCurrency = data.data.find(c => c.code === 'USD') || data.data[0];
          if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency);
          }
        } else {
          setError('Failed to load currencies');
        }
      } catch (err) {
        console.error('Error fetching currencies:', err);
        setError('Failed to load currencies');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Convert price to selected currency
  const convertPrice = async (price, fromCurrency = 'USD') => {
    if (!selectedCurrency || fromCurrency === selectedCurrency.code) {
      return price;
    }

    try {
      const response = await fetch('/api/v1/currencies/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_currency: fromCurrency,
          to_currency: selectedCurrency.code,
          amount: price,
        }),
      });

      const data = await response.json();
      if (data.success) {
        return data.data.converted_amount;
      }
    } catch (err) {
      console.error('Error converting currency:', err);
    }

    return price; // Fallback to original price
  };

  // Format price with currency symbol
  const formatPrice = (price, currency = selectedCurrency) => {
    if (!currency) return price;
    
    const formattedPrice = parseFloat(price).toFixed(2);
    return `${currency.symbol}${formattedPrice}`;
  };

  // Change selected currency
  const changeCurrency = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
      // Save to localStorage
      localStorage.setItem('selectedCurrency', JSON.stringify(currency));
    }
  };

  // Load saved currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency && currencies.length > 0) {
      try {
        const currency = JSON.parse(savedCurrency);
        const validCurrency = currencies.find(c => c.code === currency.code);
        if (validCurrency) {
          setSelectedCurrency(validCurrency);
        }
      } catch (err) {
        console.error('Error parsing saved currency:', err);
      }
    }
  }, [currencies]);

  const value = {
    currencies,
    selectedCurrency,
    loading,
    error,
    convertPrice,
    formatPrice,
    changeCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
