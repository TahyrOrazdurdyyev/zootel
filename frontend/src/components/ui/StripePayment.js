import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  CreditCardIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146'
    }
  },
  hidePostalCode: false
};

const PaymentForm = ({ 
  amount, 
  currency = 'RUB', 
  onSuccess, 
  onError, 
  disabled = false,
  description = '',
  metadata = {}
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || processing) {
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          description,
          metadata
        })
      });

      const { client_secret: clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (stripeError) {
        setCardError(stripeError.message);
        if (onError) onError(stripeError);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment processed successfully!');
        if (onSuccess) onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
              setCardError(error.message || 'An error occurred while processing the payment');
      if (onError) onError(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">To pay:</span>
          <span className="text-lg font-bold text-gray-900">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: currency
            }).format(amount)}
          </span>
        </div>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Card details
        </label>
        <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <div className="flex items-center space-x-2 text-orange-600 text-sm">
            <XCircleIcon className="w-4 h-4" />
            <span>{cardError}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <LockClosedIcon className="w-4 h-4" />
        <span>Your data is protected by SSL encryption</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || !cardComplete || processing || disabled}
        className="w-full bg-primary-500 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCardIcon className="w-5 h-5" />
            <span>Pay {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: currency
            }).format(amount)}</span>
          </>
        )}
      </button>
    </form>
  );
};

const OfflinePayment = ({ 
  amount, 
  currency = 'RUB', 
  onConfirm,
  companyInfo = {},
  instructions = ''
}) => {
  const [confirmed, setConfirmed] = useState(false);

  const defaultInstructions = `
For offline payment, please:

1. Transfer ${new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: currency
}).format(amount)} to the specified details

2. In the transfer comment, specify the order number

3. After the transfer, contact us for confirmation

Transfer details:
• Card: 1234 5678 9012 3456
• Recipient: ${companyInfo.name || 'Company'}
• Phone: ${companyInfo.phone || '+7 (XXX) XXX-XX-XX'}
• Email: ${companyInfo.email || 'info@company.com'}
  `;

  const handleConfirm = () => {
    setConfirmed(true);
    toast.success('Instructions sent!');
    if (onConfirm) {
      onConfirm({
        amount,
        currency,
        method: 'offline',
        status: 'pending'
      });
    }
  };

  if (confirmed) {
    return (
      <div className="text-center space-y-4">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-lg font-medium text-gray-900">
          Instructions sent
        </h3>
        <p className="text-gray-600">
          We have sent you payment instructions by email. 
          After transferring funds, we will contact you for confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Offline payment
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Online payments are temporarily unavailable. Use the instructions for offline payment.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">To pay:</span>
          <span className="text-lg font-bold text-gray-900">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: currency
            }).format(amount)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Payment instructions:</h4>
        <div className="text-sm text-gray-600 whitespace-pre-line">
          {instructions || defaultInstructions}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full bg-gray-800 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-900 flex items-center justify-center space-x-2"
      >
        <CheckCircleIcon className="w-5 h-5" />
        <span>Get instructions</span>
      </button>
    </div>
  );
};

const StripePayment = ({ 
  amount, 
  currency = 'RUB',
  stripeEnabled = true,
  onSuccess,
  onError,
  description = '',
  metadata = {},
  companyInfo = {},
  offlineInstructions = '',
  className = ''
}) => {
  const [paymentMethod, setPaymentMethod] = useState(stripeEnabled ? 'stripe' : 'offline');

  if (!stripeEnabled) {
    return (
      <div className={className}>
        <OfflinePayment
          amount={amount}
          currency={currency}
          onConfirm={onSuccess}
          companyInfo={companyInfo}
          instructions={offlineInstructions}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Payment Method Selector */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('stripe')}
            className={`p-3 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              paymentMethod === 'stripe'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <CreditCardIcon className="w-5 h-5" />
            <span className="font-medium">Online</span>
          </button>
          
          <button
            onClick={() => setPaymentMethod('offline')}
            className={`p-3 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              paymentMethod === 'offline'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">Offline</span>
          </button>
        </div>
      </div>

      {/* Payment Form */}
      {paymentMethod === 'stripe' ? (
        <Elements stripe={stripePromise}>
          <PaymentForm
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onError={onError}
            description={description}
            metadata={metadata}
          />
        </Elements>
      ) : (
        <OfflinePayment
          amount={amount}
          currency={currency}
          onConfirm={onSuccess}
          companyInfo={companyInfo}
          instructions={offlineInstructions}
        />
      )}

      {/* Security Notice */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <LockClosedIcon className="w-4 h-4" />
          <span>Payments processed through Stripe</span>
        </div>
      </div>
    </div>
  );
};

export default StripePayment; 