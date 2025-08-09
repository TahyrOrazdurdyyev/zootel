import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckIcon,
  CreditCardIcon,
  TruckIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import PhoneInput from 'react-phone-input-2';
import LocationSelect from '../components/ui/LocationSelect';

const CheckoutPage = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Shipping
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    country: '',
    state: '',
    city: '',
    postalCode: '',
    deliveryNotes: '',
    // Payment
    paymentMethod: 'stripe', // 'stripe' or 'offline'
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const [stripeEnabled, setStripeEnabled] = useState(true); // This would come from API
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, name: 'Shipping', icon: TruckIcon },
    { id: 2, name: 'Payment', icon: CreditCardIcon },
    { id: 3, name: 'Confirmation', icon: DocumentCheckIcon }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Имя обязательно';
      if (!formData.lastName.trim()) newErrors.lastName = 'Фамилия обязательна';
      if (!formData.email.trim()) newErrors.email = 'Email обязателен';
      if (!formData.phone.trim()) newErrors.phone = 'Телефон обязателен';
      if (!formData.address.trim()) newErrors.address = 'Адрес обязателен';
      if (!formData.country) newErrors.country = 'Страна обязательна';
      if (!formData.city) newErrors.city = 'Город обязателен';
    }

    if (step === 2 && formData.paymentMethod === 'stripe') {
      if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Номер карты обязателен';
      if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Срок действия обязателен';
      if (!formData.cvv.trim()) newErrors.cvv = 'CVV обязателен';
      if (!formData.cardName.trim()) newErrors.cardName = 'Имя на карте обязательно';
    }

    return newErrors;
  };

  const handleNextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitOrder = () => {
    // Process order
    alert('Заказ успешно оформлен!');
    clearCart();
    // Redirect to success page
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <nav className="flex justify-center">
        <ol className="flex items-center space-x-5">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep > step.id 
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : currentStep === step.id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.id ? (
                  <CheckIcon className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`ml-5 w-8 h-0.5 ${
                  currentStep > step.id ? 'bg-primary-500' : 'bg-gray-300'
                }`} />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );

  const renderShippingStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Информация о доставке</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`input-field ${errors.firstName ? 'border-red-300' : ''}`}
            placeholder="Ваше имя"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фамилия *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`input-field ${errors.lastName ? 'border-red-300' : ''}`}
            placeholder="Ваша фамилия"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`input-field ${errors.email ? 'border-red-300' : ''}`}
            placeholder="your@email.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон *
          </label>
          <PhoneInput
            country={'ru'}
            value={formData.phone}
            onChange={(phone) => handleInputChange('phone', phone)}
            inputClass={`input-field !pl-14 ${errors.phone ? 'border-red-300' : ''}`}
            containerClass="w-full"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Адрес доставки *
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className={`input-field ${errors.address ? 'border-red-300' : ''}`}
          placeholder="Улица, дом"
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Квартира/офис
          </label>
          <input
            type="text"
            value={formData.apartment}
            onChange={(e) => handleInputChange('apartment', e.target.value)}
            className="input-field"
            placeholder="Квартира, офис, подъезд"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Почтовый индекс
          </label>
          <input
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleInputChange('postalCode', e.target.value)}
            className="input-field"
            placeholder="123456"
          />
        </div>
      </div>

      <LocationSelect
        selectedCountry={formData.country}
        selectedState={formData.state}
        selectedCity={formData.city}
        onCountryChange={(country) => handleInputChange('country', country)}
        onStateChange={(state) => handleInputChange('state', state)}
        onCityChange={(city) => handleInputChange('city', city)}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Примечания к доставке
        </label>
        <textarea
          value={formData.deliveryNotes}
          onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
          className="input-field"
          rows={3}
          placeholder="Особые инструкции для курьера"
        />
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Способ оплаты</h2>

      <div className="space-y-4">
        {/* Stripe Payment */}
        {stripeEnabled && (
          <label className="relative flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="stripe"
              checked={formData.paymentMethod === 'stripe'}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                Банковская карта
              </div>
              <div className="text-sm text-gray-500">
                Безопасная оплата через Stripe
              </div>
            </div>
            <CreditCardIcon className="ml-auto h-8 w-8 text-gray-400" />
          </label>
        )}

        {/* Offline Payment */}
        <label className="relative flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="offline"
            checked={formData.paymentMethod === 'offline'}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300"
          />
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              Оплата при получении
            </div>
            <div className="text-sm text-gray-500">
              Наличными или картой курьеру
            </div>
          </div>
        </label>
      </div>

      {/* Card Details - Only show if Stripe is selected */}
      {formData.paymentMethod === 'stripe' && stripeEnabled && (
        <div className="mt-6 p-6 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Данные карты</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер карты *
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className={`input-field ${errors.cardNumber ? 'border-red-300' : ''}`}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Срок действия *
                </label>
                <input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className={`input-field ${errors.expiryDate ? 'border-red-300' : ''}`}
                  placeholder="MM/YY"
                  maxLength={5}
                />
                {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV *
                </label>
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  className={`input-field ${errors.cvv ? 'border-red-300' : ''}`}
                  placeholder="123"
                  maxLength={4}
                />
                {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя на карте *
              </label>
              <input
                type="text"
                value={formData.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
                className={`input-field ${errors.cardName ? 'border-red-300' : ''}`}
                placeholder="IVAN PETROV"
              />
              {errors.cardName && <p className="mt-1 text-sm text-red-600">{errors.cardName}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Offline Payment Instructions */}
      {formData.paymentMethod === 'offline' && (
        <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Оплата при получении
          </h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>• Оплата принимается наличными или банковской картой</p>
            <p>• Подготовьте точную сумму: {formatPrice(getTotalPrice())}</p>
            <p>• Курьер предоставит чек об оплате</p>
            <p>• Проверьте товар перед оплатой</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Подтверждение заказа</h2>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ваш заказ</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.id}-${item.type}`} className="flex justify-between">
              <div>
                <span className="font-medium">{item.name} × {item.quantity}</span>
                <p className="text-sm text-gray-500">{item.company}</p>
              </div>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-300 pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Итого:</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Доставка</h3>
        <div className="text-sm space-y-1">
          <p><strong>{formData.firstName} {formData.lastName}</strong></p>
          <p>{formData.email}</p>
          <p>{formData.phone}</p>
          <p>{formData.address}{formData.apartment && `, ${formData.apartment}`}</p>
          <p>{formData.city}, {formData.state}, {formData.country}</p>
          {formData.postalCode && <p>{formData.postalCode}</p>}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Способ оплаты</h3>
        <p className="text-sm">
          {formData.paymentMethod === 'stripe' ? 'Банковская карта' : 'Оплата при получении'}
        </p>
        {formData.paymentMethod === 'stripe' && formData.cardNumber && (
          <p className="text-sm text-gray-500 mt-1">
            •••• •••• •••• {formData.cardNumber.slice(-4)}
          </p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          Нажимая "Оформить заказ", вы соглашаетесь с условиями использования и политикой конфиденциальности.
        </p>
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Корзина пуста</h1>
          <p className="mt-4 text-lg text-gray-600">
            Добавьте товары в корзину для оформления заказа
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Оформление заказа
        </h1>

        {renderStepIndicator()}

        <div className="bg-white rounded-lg shadow-sm p-8">
          {currentStep === 1 && renderShippingStep()}
          {currentStep === 2 && renderPaymentStep()}
          {currentStep === 3 && renderConfirmationStep()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={handlePrevStep}
                className="btn-secondary"
              >
                Назад
              </button>
            )}
            
            <div className="ml-auto">
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="btn-primary"
                >
                  Продолжить
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  className="btn-primary text-lg px-8 py-3"
                >
                  Оформить заказ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 