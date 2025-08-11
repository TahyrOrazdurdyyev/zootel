import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  UsersIcon,
  CreditCardIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  StarIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const BusinessLandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    businessType: ''
  });

  const features = [
    {
      icon: CalendarDaysIcon,
      title: 'Управление бронированиями',
      description: 'Полный контроль над расписанием, автоматическое подтверждение броней, синхронизация с календарём',
      benefits: ['Drag & drop календарь', 'Автоматические напоминания', 'Управление recurring appointments']
    },
    {
      icon: UsersIcon,
      title: 'Управление сотрудниками',
      description: 'Гибкая система ролей и прав доступа, отслеживание активности, управление расписанием персонала',
      benefits: ['Роли и разрешения', 'Логи активности', 'Персональные расписания']
    },
    {
      icon: ChatBubbleLeftIcon,
      title: 'Чат с клиентами',
      description: 'Встроенный мессенджер для общения с клиентами, отправка файлов, история переписки',
      benefits: ['Мгновенные уведомления', 'Файлы и фото', 'Центральная история']
    },
    {
      icon: SparklesIcon,
      title: 'AI-ассистенты',
      description: 'Умные боты для автоматизации: booking assistant, customer support, vet assistant',
      benefits: ['Автоматические ответы', 'Обработка заявок', 'Медицинские консультации']
    },
    {
      icon: ChartBarIcon,
      title: 'Аналитика и отчёты',
      description: 'Детальная статистика продаж, клиентской базы, эффективности сотрудников',
      benefits: ['Revenue tracking', 'Customer insights', 'Performance metrics']
    },
    {
      icon: CreditCardIcon,
      title: 'Платежи и биллинг',
      description: 'Интеграция с Stripe, автоматические счета, управление подписками и комиссиями',
      benefits: ['Online payments', 'Recurring billing', 'Commission tracking']
    }
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 2990,
      period: 'мес',
      description: 'Для небольших бизнесов и стартапов',
      features: [
        'До 3 сотрудников',
        'Базовое управление бронированиями',
        'Чат с клиентами',
        '1 AI-ассистент (Booking)',
        'Базовая аналитика',
        'Email поддержка'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 5990,
      period: 'мес',
      description: 'Для растущих Pet Care компаний',
      features: [
        'До 10 сотрудников',
        'Продвинутое управление бронированиями',
        'Чат + уведомления',
        '3 AI-ассистента',
        'Полная аналитика',
        'Интеграция с Stripe',
        'Приоритетная поддержка'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 12990,
      period: 'мес',
      description: 'Для крупных сетей и франшиз',
      features: [
        'Неограниченно сотрудников',
        'Мультилокационное управление',
        'Все AI-ассистенты',
        'Кастомные интеграции',
        'Белый лейбл',
        'Dedicated account manager',
        'SLA 99.9%'
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Анна Коржова',
      position: 'Владелец сети "ВетДоктор"',
      avatar: '/api/placeholder/80/80',
      rating: 5,
      text: 'Zootel изменил наш бизнес. Мы увеличили эффективность на 40% и клиенты стали гораздо счастливее благодаря автоматическим напоминаниям.',
      company: 'ВетДоктор (4 клиники)',
      results: '+40% эффективность'
    },
    {
      id: 2,
      name: 'Михаил Петров',
      position: 'Основатель "PetStyle"',
      avatar: '/api/placeholder/80/80',
      rating: 5,
      text: 'AI-ассистенты просто волшебные! Они отвечают клиентам 24/7, а я могу сосредоточиться на развитии бизнеса.',
      company: 'PetStyle Grooming',
      results: '24/7 поддержка'
    },
    {
      id: 3,
      name: 'Елена Смирнова',
      position: 'Директор "Лапландия"',
      avatar: '/api/placeholder/80/80',
      rating: 5,
      text: 'Аналитика показала нам узкие места в работе. Теперь мы знаем, как оптимизировать процессы и увеличивать прибыль.',
      company: 'Зоомагазин Лапландия',
      results: '+25% конверсия'
    }
  ];

  const stats = [
    { number: '500+', label: 'Активных компаний' },
    { number: '50K+', label: 'Обслуженных клиентов' },
    { number: '98%', label: 'Удовлетворённость' },
    { number: '35%', label: 'Рост выручки в среднем' }
  ];

  const businessTypes = [
    'Ветеринарная клиника',
    'Груминг-салон', 
    'Зоомагазин',
    'Пет-отель/Передержка',
    'Дрессировочный центр',
    'Другое'
  ];

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    // Отправка заявки на демо
    console.log('Demo request:', demoForm);
    alert('Спасибо! Мы свяжемся с вами в течение 24 часов для демонстрации.');
    setShowDemoModal(false);
    setDemoForm({ name: '', email: '', company: '', phone: '', businessType: '' });
  };

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
      <section className="relative bg-gradient-to-br from-red-600 to-red-800 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="text-white">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                CRM для Pet Care бизнеса
              </h1>
              <p className="text-xl mb-8 text-red-100">
                Управляйте бронированиями, сотрудниками и клиентами в одной платформе. 
                Увеличивайте продажи с AI-ассистентами и автоматизацией.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {stats.slice(0, 2).map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-white">{stat.number}</div>
                    <div className="text-red-200">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="bg-white text-red-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold flex items-center justify-center"
                >
                  <PlayCircleIcon className="h-5 w-5 mr-2" />
                  Запросить демо
                </button>
                <Link
                  to="/register?type=business"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-red-600 transition-colors duration-200 font-semibold text-center"
                >
                  Начать бесплатно
                </Link>
              </div>
              
              <p className="text-sm text-red-200 mt-4">
                ✓ Бесплатный 14-дневный пробный период ✓ Не требуется кредитная карта
              </p>
            </div>
            
            {/* Right Content - Demo Video/Image */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <img 
                  src="/api/placeholder/500/400" 
                  alt="Zootel Dashboard Preview"
                  className="w-full rounded-lg"
                />
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl hover:bg-opacity-40 transition-all duration-200"
                >
                  <PlayCircleIcon className="h-16 w-16 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Всё, что нужно для успешного Pet Care бизнеса
            </h2>
            <p className="text-xl text-gray-600">
              Комплексное решение для автоматизации и роста вашего бизнеса
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-6">
                    <Icon className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-700">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Прозрачное ценообразование
            </h2>
            <p className="text-xl text-gray-600">
              Выберите тариф, который подходит вашему бизнесу
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-2xl p-8 border-2 ${
                  plan.popular 
                    ? 'border-red-600 bg-red-50 relative' 
                    : 'border-gray-200 bg-white'
                } hover:shadow-lg transition-shadow duration-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Популярный
                    </span>
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price.toLocaleString()}₽</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link
                  to={`/register?plan=${plan.id}`}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                    plan.popular
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Начать с {plan.name}
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Нужно больше возможностей? Свяжитесь с нами для индивидуального предложения.
            </p>
            <Link 
              to="/contact"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Связаться с отделом продаж →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Что говорят наши клиенты
            </h2>
            <p className="text-xl text-gray-600">
              Истории успеха Pet Care компаний
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl p-8 shadow-sm">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.position}</p>
                    <div className="flex mt-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{testimonial.company}</span>
                    <span className="text-sm font-medium text-green-600">{testimonial.results}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-red-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Готовы начать?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Присоединяйтесь к сотням Pet Care компаний, которые уже используют Zootel
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowDemoModal(true)}
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold"
            >
              Получить демо
            </button>
            <Link
              to="/register?type=business"
              className="border border-red-600 text-red-600 px-8 py-4 rounded-lg hover:bg-red-50 transition-colors duration-200 font-semibold"
            >
              Начать бесплатный пробный период
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Запросить демонстрацию</h3>
            
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                <input
                  type="text"
                  required
                  value={demoForm.name}
                  onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={demoForm.email}
                  onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Компания</label>
                <input
                  type="text"
                  value={demoForm.company}
                  onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <input
                  type="tel"
                  value={demoForm.phone}
                  onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип бизнеса</label>
                <select
                  value={demoForm.businessType}
                  onChange={(e) => setDemoForm({ ...demoForm, businessType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Выберите тип</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessLandingPage; 