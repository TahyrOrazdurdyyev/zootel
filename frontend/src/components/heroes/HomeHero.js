import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const HomeHero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const serviceCategories = [
    { id: '', name: 'Все категории' },
    { id: 'grooming', name: 'Груминг' },
    { id: 'veterinary', name: 'Ветеринария' },
    { id: 'boarding', name: 'Передержка' },
    { id: 'training', name: 'Дрессировка' },
    { id: 'walking', name: 'Выгул' },
    { id: 'sitting', name: 'Пет-ситтинг' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (searchLocation) params.append('location', searchLocation);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative bg-gradient-to-br from-red-50 to-orange-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white bg-opacity-70"></div>
      
      {/* Background Image/Illustration */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-r from-red-400 to-orange-400"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - B2C Hero */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Найдите и забронируйте 
              <span className="text-red-600"> лучшие Pet Care услуги</span> 
              рядом с вами
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Груминг, ветеринария, передержка, товары для питомцев — всё в одном месте. 
              Простое бронирование, надёжные специалисты, довольные питомцы.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Category Select */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                >
                  {serviceCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Location Input */}
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Введите город"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Найти
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">500+</div>
                <div className="text-sm text-gray-600">Проверенных компаний</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">10K+</div>
                <div className="text-sm text-gray-600">Довольных клиентов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">24/7</div>
                <div className="text-sm text-gray-600">Поддержка</div>
              </div>
            </div>
          </div>

          {/* Right side - B2B Hero */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <BuildingOfficeIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Управляйте Pet Care бизнесом
              </h2>
              <p className="text-gray-600">
                CRM-система для ветклиник, грумеров, зоомагазинов и других Pet Care услуг
              </p>
            </div>

            {/* B2B Features */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <ChartBarIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <span>Управление бронированиями и расписанием</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <ChatBubbleLeftIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <span>Автоматические напоминания и чат с клиентами</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <SparklesIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <span>AI-ассистенты для работы с клиентами</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <ChartBarIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <span>Детальная аналитика и отчёты</span>
              </div>
            </div>

            {/* B2B CTA Buttons */}
            <div className="space-y-3">
              <Link
                to="/business"
                className="block w-full bg-red-600 text-white text-center py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Узнать о CRM →
              </Link>
              <Link
                to="/demo"
                className="block w-full border border-red-600 text-red-600 text-center py-3 px-6 rounded-lg hover:bg-red-50 transition-colors duration-200 font-medium"
              >
                Запросить демо
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-2">Уже доверяют:</p>
              <div className="text-center">
                <span className="text-lg font-semibold text-red-600">200+</span>
                <span className="text-sm text-gray-600 ml-1">Pet Care компаний</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Попробуйте новый способ взаимодействия с Pet Care индустрией
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/services"
              className="bg-white text-red-600 border border-red-600 px-8 py-3 rounded-lg hover:bg-red-50 transition-colors duration-200 font-medium"
            >
              Перейти в маркетплейс
            </Link>
            <Link
              to="/business"
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Начать с CRM
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero; 