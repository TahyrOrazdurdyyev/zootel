import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  BuildingOfficeIcon, 
  TruckIcon, 
  AcademicCapIcon,
  StarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const serviceCategories = [
    { 
      name: 'Ветеринария', 
      icon: HeartIcon, 
      link: '/marketplace?category=veterinary',
      color: 'bg-red-100 text-red-600'
    },
    { 
      name: 'Груминг', 
      icon: BuildingOfficeIcon, 
      link: '/marketplace?category=grooming',
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      name: 'Передержка', 
      icon: TruckIcon, 
      link: '/marketplace?category=boarding',
      color: 'bg-green-100 text-green-600'
    },
    { 
      name: 'Дрессировка', 
      icon: AcademicCapIcon, 
      link: '/marketplace?category=training',
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      name: 'Выгул', 
      icon: TruckIcon, 
      link: '/marketplace?category=walking',
      color: 'bg-yellow-100 text-yellow-600'
    },
    { 
      name: 'Питание', 
      icon: HeartIcon, 
      link: '/marketplace?category=nutrition',
      color: 'bg-pink-100 text-pink-600'
    },
  ];

  const featuredDeals = [
    {
      id: 1,
      title: 'Комплексная вакцинация',
      company: 'VetCenter',
      originalPrice: 3500,
      discountPrice: 2450,
      discount: 30,
      image: '/images/vaccination.jpg'
    },
    {
      id: 2,
      title: 'Полный груминг',
      company: 'PetSpa',
      originalPrice: 2800,
      discountPrice: 2240,
      discount: 20,
      image: '/images/grooming.jpg'
    },
    {
      id: 3,
      title: 'Передержка на неделю',
      company: 'PetHotel',
      originalPrice: 7000,
      discountPrice: 5600,
      discount: 20,
      image: '/images/boarding.jpg'
    },
  ];

  const popularCompanies = [
    {
      id: 1,
      name: 'VetExpert',
      rating: 4.9,
      reviews: 1248,
      specialization: 'Ветеринарная клиника',
      image: '/images/company1.jpg'
    },
    {
      id: 2,
      name: 'PetGroomers',
      rating: 4.8,
      reviews: 892,
      specialization: 'Груминг-салон',
      image: '/images/company2.jpg'
    },
    {
      id: 3,
      name: 'HappyPaws',
      rating: 4.7,
      reviews: 634,
      specialization: 'Дрессировка',
      image: '/images/company3.jpg'
    },
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: 'Find a Service',
      description: 'Choose the right service or product for your pet',
      icon: '🔍'
    },
    {
      step: 2,
      title: 'Book Online',
      description: 'Select a convenient time and book online',
      icon: '📅'
    },
    {
      step: 3,
      title: 'Pay Securely',
      description: 'Secure payment by card or cash',
      icon: '💳'
    },
    {
      step: 4,
      title: 'Get Service',
      description: 'Bring your pet and receive quality service',
      icon: '🐕'
    }
  ];

  const customerReviews = [
    {
      id: 1,
      name: 'Anna Peterson',
      rating: 5,
      text: 'Excellent service! Found a veterinarian for my cat very quickly. The doctor came home the same day.',
      pet: 'Cat Whiskers'
    },
    {
      id: 2,
      name: 'David Smith',
      rating: 5,
      text: 'I have been using Zootel for six months. It is convenient to book grooming for my dog, always quality work.',
      pet: 'Dog Rex'
    },
    {
      id: 3,
      name: 'Maria Johnson',
      rating: 5,
      text: 'Thank you for the opportunity to find good pet sitting! Left my parrot for two weeks - everything went great.',
      pet: 'Parrot Charlie'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Найдите и забронируйте лучшие{' '}
                <span className="text-primary-500">Pet Care-услуги</span>{' '}
                рядом с вами
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Качественный уход за вашими питомцами от проверенных специалистов. 
                Ветеринария, груминг, дрессировка и многое другое в одном месте.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/marketplace"
                  className="btn-primary text-lg px-8 py-4 text-center"
                >
                  Найти услуги и товары
                </Link>
                <Link
                  to="/business"
                  className="btn-secondary text-lg px-8 py-4 text-center"
                >
                  Узнать о CRM
                </Link>
              </div>
            </div>
            <div className="lg:text-center">
              <div className="relative">
                <div className="w-full h-96 bg-gradient-to-br from-primary-200 to-primary-300 rounded-2xl flex items-center justify-center">
                  <div className="text-6xl">🐕🐱</div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Популярные услуги</h2>
            <p className="mt-4 text-lg text-gray-600">Выберите нужную категорию для вашего питомца</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {serviceCategories.map((category, index) => (
              <Link
                key={index}
                to={category.link}
                className="group text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <category.icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-500 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Специальные предложения</h2>
            <p className="mt-4 text-lg text-gray-600">Экономьте на качественных услугах для ваших питомцев</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredDeals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{deal.discount_percentage || deal.discount}%
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{deal.title}</h3>
                  <p className="text-gray-600 mb-4">{deal.company}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary-500">
                      ${deal.price || deal.discountPrice}
                    </span>
                    {(deal.original_price || deal.originalPrice) && (
                      <span className="text-lg text-gray-500 line-through">
                        ${deal.original_price || deal.originalPrice}
                      </span>
                    )}
                  </div>
                  <button className="w-full mt-4 btn-primary">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Companies */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Популярные компании</h2>
            <p className="mt-4 text-lg text-gray-600">Проверенные партнеры с высокими оценками</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden border">
                <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-3xl">🏢</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{company.name}</h3>
                  <p className="text-gray-600 mb-4">{company.specialization}</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon 
                          key={i} 
                          className={`h-5 w-5 ${i < Math.floor(company.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{company.rating}</span>
                    <span className="text-sm text-gray-500">({company.reviews} отзывов)</span>
                  </div>
                  <button className="w-full mt-4 btn-secondary">
                    Подробнее
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Как это работает</h2>
            <p className="mt-4 text-lg text-gray-600">Простой процесс получения услуг для ваших питомцев</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Teaser */}
      <section className="py-16 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-6">Развивайте свой Pet Care бизнес с Zootel</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Получите мощную CRM-систему, онлайн-бронирование, управление клиентами 
              и аналитику для роста вашего бизнеса
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <CheckIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Онлайн-бронирование</h3>
                <p className="text-primary-100">Клиенты могут бронировать услуги 24/7</p>
              </div>
              <div className="text-center">
                <CheckIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Управление клиентами</h3>
                <p className="text-primary-100">Ведите базу клиентов и историю обслуживания</p>
              </div>
              <div className="text-center">
                <CheckIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Аналитика и отчеты</h3>
                <p className="text-primary-100">Отслеживайте доходы и эффективность</p>
              </div>
            </div>
            <Link to="/business" className="bg-white text-primary-500 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
              Узнать о CRM
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Отзывы клиентов</h2>
            <p className="mt-4 text-lg text-gray-600">Что говорят владельцы питомцев о нашем сервисе</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {customerReviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon 
                      key={i} 
                      className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{review.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-600">Владелец: {review.pet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 