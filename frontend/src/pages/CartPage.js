import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { 
  TrashIcon, 
  MinusIcon, 
  PlusIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const CartPage = () => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBagIcon className="mx-auto h-24 w-24 text-gray-300" />
            <h1 className="mt-6 text-3xl font-bold text-gray-900">
              Корзина пуста
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Добавьте товары или услуги в корзину, чтобы продолжить покупки
            </p>
            <div className="mt-8">
              <Link
                to="/marketplace"
                className="btn-primary text-lg px-8 py-4"
              >
                Перейти к покупкам
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Корзина ({getTotalItems()} товаров)
          </h1>
          <p className="mt-2 text-gray-600">
            Проверьте выбранные товары и услуги перед оформлением заказа
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Товары в корзине
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Очистить корзину
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={`${item.id}-${item.type}`} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Item Image */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">
                          {item.type === 'service' ? '🛍️' : '📦'}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.name || item.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.company || item.provider}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {item.type === 'service' ? 'Услуга' : 'Товар'}
                        </p>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <MinusIcon className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <PlusIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-sm text-gray-500">
                            {formatPrice(item.price)} за шт.
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id, item.type)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                        title="Удалить из корзины"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Итого по заказу
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товары ({getTotalItems()} шт.)</span>
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-medium">Рассчитается при оформлении</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Итого</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  to="/checkout"
                  className="w-full btn-primary text-center text-lg py-3"
                >
                  Перейти к оформлению
                </Link>
                
                <Link
                  to="/marketplace"
                  className="w-full btn-secondary text-center"
                >
                  Продолжить покупки
                </Link>
              </div>

              {/* Promo Code */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Промокод
                </h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Введите промокод"
                    className="flex-1 input-field text-sm"
                  />
                  <button className="btn-secondary text-sm px-4 py-2">
                    Применить
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Безопасная оплата</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Ваши данные защищены SSL-шифрованием
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Возможно, вас заинтересует
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-4xl">🐕</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Рекомендуемый товар {item}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Описание товара или услуги
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary-500">
                      {formatPrice(1500 + item * 100)}
                    </span>
                    <button className="btn-primary text-sm px-4 py-2">
                      Добавить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage; 