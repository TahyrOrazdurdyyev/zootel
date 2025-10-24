import React, { useState, useEffect } from 'react';
import { CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import PaymentMethodSelector from './PaymentMethodSelector';
import CryptoCurrencySelector from './CryptoCurrencySelector';
import { apiCall } from '../../utils/api';

const PaymentForm = ({ 
  orderId, 
  amount, 
  currency = 'USD',
  onPaymentCreated,
  onError,
  className = '' 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);

  // Estimate crypto amount when currency or network changes
  useEffect(() => {
    if (selectedCrypto && selectedNetwork && amount > 0) {
      estimateCryptoAmount();
    }
  }, [selectedCrypto, selectedNetwork, amount, currency]);

  const estimateCryptoAmount = async () => {
    try {
      setEstimating(true);
      const response = await apiCall(
        `/api/v1/crypto/estimate?amount=${amount}&from_currency=${currency}&to_currency=${selectedCrypto}`,
        'GET'
      );
      if (response.success) {
        setCryptoAmount(response.data.estimated_amount);
      }
    } catch (error) {
      console.error('Error estimating crypto amount:', error);
    } finally {
      setEstimating(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'card') {
      // Reset crypto selections
      setSelectedCrypto('');
      setSelectedNetwork('');
      setCryptoAmount(0);
    }
  };

  const handleCryptoCurrencyChange = (currency) => {
    setSelectedCrypto(currency);
    setSelectedNetwork(''); // Reset network when currency changes
  };

  const handleCryptoNetworkChange = (network) => {
    setSelectedNetwork(network);
  };

  const handleCardPayment = async () => {
    // Handle card payment (Stripe integration)
    // This would integrate with your existing Stripe implementation
    console.log('Card payment not implemented yet');
    if (onError) {
      onError('Card payment not implemented yet');
    }
  };

  const handleCryptoPayment = async () => {
    if (!selectedCrypto || !selectedNetwork) {
      if (onError) {
        onError('Please select both currency and network');
      }
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall('/api/v1/crypto-payments', 'POST', {
        order_id: orderId,
        currency: selectedCrypto,
        network: selectedNetwork,
        amount: amount
      });

      if (response.success) {
        // Redirect to crypto payment page
        window.location.href = `/payment/crypto/${response.data.payment_id}`;
        if (onPaymentCreated) {
          onPaymentCreated(response.data);
        }
      } else {
        if (onError) {
          onError(response.error || 'Failed to create crypto payment');
        }
      }
    } catch (error) {
      console.error('Error creating crypto payment:', error);
      if (onError) {
        onError('Failed to create crypto payment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else if (paymentMethod === 'crypto') {
      handleCryptoPayment();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Payment Method Selection */}
      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onMethodChange={handlePaymentMethodChange}
        className="mb-8"
      />

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <CreditCardIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Credit Card Payment
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Secure payment powered by Stripe
            </p>
          </div>
          
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Pay $${amount} with Card`}
            </button>
          </div>
        </div>
      )}

      {/* Crypto Payment Form */}
      {paymentMethod === 'crypto' && (
        <div className="space-y-6">
          <CryptoCurrencySelector
            selectedCurrency={selectedCrypto}
            selectedNetwork={selectedNetwork}
            onCurrencyChange={handleCryptoCurrencyChange}
            onNetworkChange={handleCryptoNetworkChange}
            className="mb-6"
          />

          {/* Amount Display */}
          {cryptoAmount > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">You will pay</div>
                <div className="text-2xl font-bold text-gray-900">
                  {estimating ? '...' : cryptoAmount.toFixed(8)} {selectedCrypto}
                </div>
                <div className="text-sm text-gray-500">
                  ≈ ${amount} {currency}
                </div>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading || !selectedCrypto || !selectedNetwork || estimating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Payment...' : 
               estimating ? 'Calculating...' :
               `Pay with ${selectedCrypto}`}
            </button>
          </div>

          {/* Crypto Payment Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Crypto Payment Info
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Payment will be processed automatically</li>
              <li>• Confirmation may take 10-60 minutes</li>
              <li>• Only send {selectedCrypto} to the provided address</li>
              <li>• Do not send from an exchange wallet</li>
            </ul>
          </div>
        </div>
      )}
    </form>
  );
};

export default PaymentForm;
