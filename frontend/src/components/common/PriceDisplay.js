import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

const PriceDisplay = ({ 
  price, 
  originalCurrency = 'USD', 
  className = '',
  showOriginal = false,
  loading = false 
}) => {
  const { selectedCurrency, convertPrice, formatPrice } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState(price);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const convertPriceValue = async () => {
      if (!selectedCurrency || originalCurrency === selectedCurrency.code) {
        setConvertedPrice(price);
        return;
      }

      setIsConverting(true);
      try {
        const converted = await convertPrice(price, originalCurrency);
        setConvertedPrice(converted);
      } catch (error) {
        console.error('Error converting price:', error);
        setConvertedPrice(price);
      } finally {
        setIsConverting(false);
      }
    };

    convertPriceValue();
  }, [price, originalCurrency, selectedCurrency, convertPrice]);

  if (loading || isConverting) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <span className="font-medium">
        {formatPrice(convertedPrice, selectedCurrency)}
      </span>
      {showOriginal && originalCurrency !== selectedCurrency?.code && (
        <span className="ml-2 text-sm text-gray-500">
          ({formatPrice(price, { code: originalCurrency, symbol: getCurrencySymbol(originalCurrency) })})
        </span>
      )}
    </div>
  );
};

// Helper function to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'RUB': '₽',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF',
    'CNY': '¥',
    'INR': '₹',
  };
  return symbols[currencyCode] || currencyCode;
};

export default PriceDisplay;
