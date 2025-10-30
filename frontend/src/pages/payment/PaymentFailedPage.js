import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { XCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const PaymentFailedPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentId, reason } = location.state || {};

  const getFailureMessage = (reason) => {
    switch (reason) {
      case 'expired':
        return 'Payment expired. Please try again.';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return 'Payment was not completed. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <XCircleIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600">
            {getFailureMessage(reason)}
          </p>
        </div>

        {paymentId && (
          <div className="text-sm text-gray-500 mb-6">
            Transaction ID: {paymentId}
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            What to do next:
          </h3>
          <ul className="text-sm text-red-700 text-left space-y-1">
            <li>• Check your crypto wallet for any issues</li>
            <li>• Ensure you sent the correct amount</li>
            <li>• Try a different payment method</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/cart')}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Go Home
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Need help? Contact our support team.
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
