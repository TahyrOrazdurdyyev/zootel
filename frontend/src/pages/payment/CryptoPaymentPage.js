import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CryptoPaymentDisplay from '../../components/payment/CryptoPaymentDisplay';
import { apiCall } from '../../utils/api';

const CryptoPaymentPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (paymentId) {
      fetchPayment();
    }
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      const response = await apiCall(`/api/v1/crypto-payments/${paymentId}/status`, 'GET');
      if (response.success) {
        setPayment(response.data);
      } else {
        setError('Payment not found');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      setError('Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    if (status === 'confirmed') {
      // Redirect to success page after a short delay
      setTimeout(() => {
        navigate('/payment/success', { 
          state: { 
            paymentId: paymentId,
            amount: payment?.amount,
            currency: payment?.currency 
          }
        });
      }, 2000);
    } else if (status === 'expired' || status === 'failed') {
      // Redirect to failure page
      setTimeout(() => {
        navigate('/payment/failed', { 
          state: { 
            paymentId: paymentId,
            reason: status 
          }
        });
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Crypto Payment
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Payment ID: {paymentId}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CryptoPaymentDisplay
          paymentId={paymentId}
          onStatusChange={handleStatusChange}
          className="bg-white rounded-lg shadow-sm p-6"
        />
      </div>

      {/* Footer Info */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Important Notes
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Only send {payment?.currency} to this address</li>
            <li>• Send the exact amount: {payment?.amount} {payment?.currency}</li>
            <li>• Do not send from an exchange wallet</li>
            <li>• Payment confirmation may take 10-60 minutes</li>
            <li>• Contact support if payment is not confirmed within 2 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CryptoPaymentPage;
