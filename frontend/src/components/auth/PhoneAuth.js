import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { 
  PhoneIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

const PhoneAuth = ({ onSuccess, onBack }) => {
  const { sendPhoneVerification, verifyPhoneCode, loading, error } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' or 'code'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return;
    }

    try {
      const result = await sendPhoneVerification(phoneNumber);
      setConfirmationResult(result);
      setStep('code');
      setCountdown(60); // 60 seconds countdown
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error sending verification code:', error);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      return;
    }

    try {
      const user = await verifyPhoneCode(confirmationResult, verificationCode);
      onSuccess(user);
    } catch (error) {
      console.error('Error verifying code:', error);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    try {
      const result = await sendPhoneVerification(phoneNumber);
      setConfirmationResult(result);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error resending code:', error);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    setConfirmationResult(null);
    setCountdown(0);
  };

  return (
    <div className="space-y-6">
      {/* reCAPTCHA container - invisible */}
      <div id="recaptcha-container"></div>

      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <PhoneIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter your phone number</h2>
            <p className="text-gray-600">We'll send you a verification code via SMS</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <PhoneInput
              country={'us'}
              value={phoneNumber}
              onChange={setPhoneNumber}
              inputClass="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              containerClass="w-full"
              dropdownClass="bg-white border border-gray-300 rounded-md shadow-lg"
              enableSearch={true}
              searchPlaceholder="Search countries..."
              placeholder="Enter phone number"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <XCircleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !phoneNumber || phoneNumber.length < 10}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter verification code</h2>
            <p className="text-gray-600">
              We sent a 6-digit code to <strong>{phoneNumber}</strong>
            </p>
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <XCircleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0}
                className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </button>
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBackToPhone}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
              Change Number
            </button>
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneAuth;
