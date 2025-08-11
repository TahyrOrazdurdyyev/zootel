import React from 'react';
import { Link } from 'react-router-dom';
import HomeHero from '../components/heroes/HomeHero';
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  HeartIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const HomePage = () => {
  const serviceCategories = [
    { 
      id: 'grooming', 
      name: 'Груминг', 
      icon: '✂️', 
      description: 'Стрижка, мытьё, уход за шерстью',
      count: '120+ мастеров'
    },
    { 
      id: 'veterinary', 
      name: 'Ветеринария', 
      icon: '🏥', 
      description: 'Консультации, лечение, прививки',
      count: '85+ клиник'
    },
    { 
      id: 'boarding', 
      name: 'Передержка', 
      icon: '🏠', 
      description: 'Гостиницы для питомцев',
      count: '45+ отелей'
    },
    { 
      id: 'training', 
      name: 'Дрессировка', 
      icon: '🎾', 
      description: 'Обучение и коррекция поведения',
      count: '30+ тренеров'
    },
    { 
      id: 'walking', 
      name: 'Выгул', 
      icon: '🚶', 
      description: 'Прогулки с собаками',
      count: '200+ ситтеров'
    },
    { 
      id: 'sitting', 
      name: 'Пет-ситтинг', 
      icon: '👥', 
      description: 'Уход на дому',
      count: '150+ ситтеров'
    }
  ];

  const featuredDeals = [
    {
      id: 1,
      title: 'Комплексный груминг собак',
      company: 'PetStyle Studio',
      originalPrice: 3500,
      discountPrice: 2450,
      discount: 30,
      image: '/api/placeholder/300/200',
      rating: 4.8,
      location: 'Москва, ЦАО'
    },
    {
      id: 2,
      title: 'Ветеринарный осмотр + прививки',
      company: 'ВетКлиника "Здоровье"',
      originalPrice: 2800,
      discountPrice: 2240,
      discount: 20,
      image: '/api/placeholder/300/200',
      rating: 4.9,
      location: 'СПб, Центральный'
    },
    {
      id: 3,
      title: 'Передержка кошек (7 дней)',
      company: 'Кошкин Дом',
      originalPrice: 7000,
      discountPrice: 5250,
      discount: 25,
      image: '/api/placeholder/300/200',
      rating: 4.7,
      location: 'Москва, СВАО'
    }
  ];

  const topCompanies = [
    {
      id: 1,
      name: 'ВетКлиника "Айболит"',
      logo: '/api/placeholder/80/80',
      rating: 4.9,
      reviewCount: 234,
      services: ['Ветеринария', 'УЗИ', 'Хирургия'],
      location: 'Москва',
      verified: true
    },
    {
      id: 2,
      name: 'Груминг-салон "PetBeauty"',
      logo: '/api/placeholder/80/80',
      rating: 4.8,
      reviewCount: 189,
      services: ['Груминг', 'СПА', 'Стрижка когтей'],
      location: 'СПб',
      verified: true
    },
    {
      id: 3,
      name: 'Зоомагазин "Лапландия"',
      logo: '/api/placeholder/80/80',
      rating: 4.7,
      reviewCount: 456,
      services: ['Корма', 'Игрушки', 'Аксессуары'],
      location: 'Екатеринбург',
      verified: true
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Выберите услугу или товар',
      description: 'Найдите нужную услугу через поиск или каталог категорий',
      icon: '🔍'
    },
    {
      step: 2,
      title: 'Забронируйте или добавьте в корзину',
      description: 'Выберите удобное время для услуги или добавьте товар в корзину',
      icon: '📅'
    },
    {
      step: 3,
      title: 'Оплатите онлайн или офлайн',
      description: 'Безопасная оплата картой онлайн или наличными на месте',
      icon: '💳'
    },
    {
      step: 4,
      title: 'Приходите или получайте доставку',
      description: 'Приезжайте в назначенное время или ждите доставку товаров',
      icon: '✅'
    }
  ];

  const customerReviews = [
    {
      id: 1,
      name: 'Анна Петрова',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      review: 'Отличная платформа! Быстро нашла хорошего грумера для моего лабрадора. Мастер приехал на дом, всё сделал качественно.',
      service: 'Груминг на дому',
      date: '2 дня назад'
    },
    {
      id: 2,
      name: 'Михаил Соколов',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      review: 'Пользуюсь уже полгода. Удобно записываться к ветеринару, напоминания приходят вовремя. Цены адекватные.',
      service: 'Ветеринарная клиника',
      date: '5 дней назад'
    },
    {
      id: 3,
      name: 'Елена Краснова',
      avatar: '/api/placeholder/60/60',
      rating: 4,
      review: 'Заказывала корм с доставкой. Привезли быстро, упаковка целая. В следующий раз закажу снова.',
      service: 'Зоомагазин',
      date: '1 неделю назад'
    }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <StarIconSolid 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HomeHero />

      {/* Service Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Категории услуг
            </h2>
            <p className="text-lg text-gray-600">
              Выберите нужную категорию для вашего питомца
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {serviceCategories.map((category) => (
              <Link
                key={category.id}
                to={`/services/${category.id}`}
                className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg hover:border-red-300 transition-all duration-200 group"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-red-600 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                <p className="text-xs text-red-600 font-medium">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="py-16 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🔥 Горячие предложения
              </h2>
              <p className="text-lg text-gray-600">
                Лучшие скидки на услуги и товары
              </p>
            </div>
            <Link
              to="/deals"
              className="text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              Все акции <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDeals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="relative">
                  <img 
                    src={deal.image} 
                    alt={deal.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{deal.discount}%
                  </div>
                  <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
                    <HeartIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {deal.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{deal.company}</p>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex items-center mr-3">
                      {renderStars(Math.floor(deal.rating))}
                      <span className="ml-1 text-sm text-gray-600">{deal.rating}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {deal.location}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-red-600">
                        {deal.discountPrice.toLocaleString()}₽
                      </span>
                      <span className="text-lg text-gray-500 line-through ml-2">
                        {deal.originalPrice.toLocaleString()}₽
                      </span>
                    </div>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                      Записаться
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Companies */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Рекомендуемые компании
            </h2>
            <p className="text-lg text-gray-600">
              Проверенные партнёры с высоким рейтингом
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topCompanies.map((company) => (
              <div key={company.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start mb-4">
                  <img 
                    src={company.logo} 
                    alt={company.name}
                    className="w-16 h-16 rounded-lg object-cover mr-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      {company.verified && (
                        <CheckCircleIcon className="h-5 w-5 text-blue-500 ml-2" />
                      )}
                    </div>
                    <div className="flex items-center mb-1">
                      <div className="flex">
                        {renderStars(Math.floor(company.rating))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {company.rating} ({company.reviewCount} отзывов)
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {company.location}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {company.services.map((service, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Link
                  to={`/companies/${company.id}`}
                  className="block w-full text-center bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Перейти
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              to="/companies"
              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
            >
              Посмотреть все компании <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Как это работает
            </h2>
            <p className="text-lg text-gray-600">
              Простые шаги к счастливому питомцу
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={step.step} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Отзывы клиентов
            </h2>
            <p className="text-lg text-gray-600">
              Что говорят владельцы питомцев о наших услугах
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerReviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={review.avatar} 
                    alt={review.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-sm text-gray-600">{review.date}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">"{review.review}"</p>
                
                <div className="text-sm text-red-600 font-medium">
                  {review.service}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B CTA Section */}
      <section className="py-16 bg-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Начните использовать Zootel для своего бизнеса
          </h2>
          <p className="text-xl text-red-100 mb-8">
            CRM-система для управления Pet Care бизнесом. Увеличьте продажи и улучшите сервис.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/business"
              className="bg-white text-red-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
            >
              Подробнее о CRM
            </Link>
            <Link
              to="/register?type=business"
              className="bg-red-700 text-white px-8 py-3 rounded-lg hover:bg-red-800 transition-colors duration-200 font-medium"
            >
              Регистрация компании
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 