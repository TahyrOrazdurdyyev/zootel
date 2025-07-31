import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-8">
            <span className="text-4xl">🔍</span>
          </div>
          
          {/* Error Code */}
          <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
          
          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Страница не найдена
          </h2>
          
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            К сожалению, запрашиваемая страница не существует или была перемещена.
            Проверьте правильность введенного адреса.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary flex items-center space-x-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Вернуться назад</span>
            </button>
            
            <Link
              to="/"
              className="btn-primary flex items-center space-x-2"
            >
              <HomeIcon className="h-5 w-5" />
              <span>На главную</span>
            </Link>
          </div>
          
          {/* Help Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Возможно, вас заинтересует:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                to="/marketplace"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Каталог услуг
              </Link>
              <Link
                to="/business"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Для бизнеса
              </Link>
              <Link
                to="/login"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Войти в аккаунт
              </Link>
              <Link
                to="/help"
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Центр помощи
              </Link>
            </div>
          </div>
          
          {/* Contact Support */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              Если проблема повторяется, свяжитесь с нами:
            </p>
            <a
              href="mailto:support@zootel.shop"
              className="text-primary-500 hover:text-primary-600 font-medium text-sm"
            >
              support@zootel.shop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 