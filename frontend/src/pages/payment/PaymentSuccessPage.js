import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentId, amount, currency } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Your payment has been confirmed and processed.
          </p>
        </div>

        {amount && currency && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="text-lg font-semibold text-green-800">
              {amount} {currency}
            </div>
            <div className="text-sm text-green-600">
              Payment confirmed
            </div>
          </div>
        )}

        {paymentId && (
          <div className="text-sm text-gray-500 mb-6">
            Transaction ID: {paymentId}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/orders')}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View Orders
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          You will receive a confirmation email shortly.
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
