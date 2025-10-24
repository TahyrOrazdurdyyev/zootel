import React, { useState, useEffect } from 'react';
import { CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { apiCall } from '../../utils/api';

const PaymentMethodSelector = ({ selectedMethod, onMethodChange, className = '' }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await apiCall('/api/v1/crypto/payment-methods', 'GET');
      if (response.success) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.type}
            className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethod === method.type
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onMethodChange(method.type)}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {method.type === 'card' ? (
                  <CreditCardIcon className="h-6 w-6 text-gray-600" />
                ) : (
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {method.name}
                </div>
                <div className="text-sm text-gray-500">
                  {method.type === 'card' 
                    ? 'Pay with credit or debit card' 
                    : 'Pay with cryptocurrency'
                  }
                </div>
              </div>
              <div className="ml-auto">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedMethod === method.type
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedMethod === method.type && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
