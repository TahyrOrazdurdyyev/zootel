import React, { useState, useEffect } from 'react';
import { 
  QrCodeIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiCall } from '../../utils/api';

const CryptoPaymentDisplay = ({ 
  paymentId, 
  onStatusChange,
  className = '' 
}) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentStatus();
      // Poll for status updates every 10 seconds
      const interval = setInterval(fetchPaymentStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [paymentId]);

  useEffect(() => {
    if (payment?.expires_at) {
      const expiryTime = new Date(payment.expires_at).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeLeft(timeLeft);
        
        if (timeLeft === 0) {
          fetchPaymentStatus();
        }
      };
      
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [payment?.expires_at]);

  const fetchPaymentStatus = async () => {
    try {
      const response = await apiCall(`/api/v1/crypto-payments/${paymentId}/status`, 'GET');
      if (response.success) {
        setPayment(response.data);
        setError(null);
        if (onStatusChange) {
          onStatusChange(response.data.status);
        }
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
      setError('Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'text-blue-600 bg-blue-100';
      case 'confirming':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-orange-600 bg-red-100';
      case 'failed':
        return 'text-orange-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return <ClockIcon className="h-4 w-4" />;
      case 'confirming':
        return <ClockIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckIcon className="h-4 w-4" />;
      case 'expired':
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchPaymentStatus}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900">Payment not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Crypto Payment
        </h2>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
          {getStatusIcon(payment.status)}
          <span className="ml-2 capitalize">{payment.status}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {payment.amount} {payment.currency}
        </div>
        <div className="text-sm text-gray-500">
          {payment.network} network
        </div>
      </div>

      {/* QR Code */}
      {payment.qr_code && (
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
            <img
              src={payment.qr_code}
              alt="Payment QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Scan QR code with your crypto wallet
          </p>
        </div>
      )}

      {/* Payment Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Address
        </label>
        <div className="flex">
          <input
            type="text"
            value={payment.address}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={() => copyToClipboard(payment.address)}
            className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Send exactly {payment.amount} {payment.currency} to this address
        </p>
      </div>

      {/* Timer */}
      {timeLeft > 0 && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span className="font-medium">
              Payment expires in: {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Payment Instructions</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Open your {payment.currency} wallet</li>
          <li>2. Scan the QR code or copy the address above</li>
          <li>3. Send exactly {payment.amount} {payment.currency}</li>
          <li>4. Wait for network confirmation</li>
          <li>5. Payment will be processed automatically</li>
        </ol>
      </div>

      {/* Transaction Link */}
      {payment.transaction_url && (
        <div className="text-center">
          <a
            href={payment.transaction_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <QrCodeIcon className="h-4 w-4 mr-2" />
            View on NowPayments
          </a>
        </div>
      )}
    </div>
  );
};

export default CryptoPaymentDisplay;
