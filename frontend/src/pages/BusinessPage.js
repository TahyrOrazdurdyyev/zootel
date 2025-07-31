import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

const BusinessPage = () => {
  const features = [
    {
      icon: CalendarIcon,
      title: 'Онлайн-бронирование',
      description: 'Клиенты могут бронировать услуги 24/7 через веб-сайт и мобильное приложение'
    },
    {
      icon: UserGroupIcon,
      title: 'Управление клиентами',
      description: 'Ведите базу клиентов, историю обслуживания и медицинские карты питомцев'
    },
    {
      icon: ChartBarIcon,
      title: 'Аналитика и отчеты',
      description: 'Отслеживайте доходы, популярные услуги и эффективность работы'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Чат с клиентами',
      description: 'Общайтесь с клиентами в реальном времени и отвечайте на вопросы'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Приём платежей',
      description: 'Принимайте оплату онлайн и наличными с автоматическим учетом'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Мобильное приложение',
      description: 'Управляйте бизнесом из любой точки через мобильное приложение'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 2999,
      description: 'Для небольших клиник и салонов',
      features: [
        'До 5 сотрудников',
        'Базовая CRM',
        'Онлайн-бронирование',
        'Базовая аналитика',
        'Email поддержка'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      price: 4999,
      description: 'Для растущих бизнесов',
      features: [
        'До 15 сотрудников',
        'Расширенная CRM',
        'AI-помощники',
        'Расширенная аналитика',
        'Интеграции',
        'Приоритетная поддержка'
      ],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 9999,
      description: 'Для крупных сетей',
      features: [
        'Неограниченно сотрудников',
        'Полная CRM',
        'Все AI-агенты',
        'Белая метка',
        'API доступ',
        'Персональный менеджер'
      ],
      highlighted: false
    }
  ];

  const testimonials = [
    {
      name: 'Анна Козлова',
      position: 'Владелец ветклиники "ВетЗабота"',
      content: 'Zootel помог нам увеличить количество клиентов на 40% и оптимизировать расписание. Теперь мы не теряем записи и всегда знаем, когда ожидать клиента.',
      avatar: '👩‍⚕️'
    },
    {
      name: 'Дмитрий Павлов',
      position: 'Директор сети "ПетГрум"',
      content: 'Управление 3 салонами стало намного проще. Аналитика показывает, какие услуги популярны, а мобильное приложение позволяет контролировать все процессы.',
      avatar: '👨‍💼'
    },
    {
      name: 'Елена Морозова',
      position: 'Владелец зоогостиницы',
      content: 'Клиенты оценили возможность онлайн-бронирования. Теперь они могут забронировать место для питомца даже в отпуске, что очень удобно.',
      avatar: '👩‍💻'
    }
  ];

  const stats = [
    { value: '500+', label: 'Довольных клиентов' },
    { value: '50,000+', label: 'Обслуженных питомцев' },
    { value: '99.9%', label: 'Время работы системы' },
    { value: '24/7', label: 'Техническая поддержка' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Развивайте свой{' '}
              <span className="text-primary-500">Pet Care бизнес</span>{' '}
              с Zootel
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Полноценная CRM-система для ветеринарных клиник, груминг-салонов, 
              зоогостиниц и других Pet Care бизнесов. Автоматизируйте процессы 
              и увеличивайте прибыль.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-4"
              >
                Попробовать бесплатно
              </Link>
              <button className="btn-secondary text-lg px-8 py-4">
                Смотреть демо
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              14 дней бесплатно • Без обязательств • Быстрая настройка
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Все инструменты для успешного бизнеса
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Современная CRM-система, созданная специально для Pet Care индустрии
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Выберите подходящий план
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Начните с бесплатного периода и выберите план по мере роста бизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-sm p-8 ${
                  plan.highlighted 
                    ? 'ring-2 ring-primary-500 transform scale-105' 
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Популярный
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-gray-600">
                    {plan.description}
                  </p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ₽{plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-600">/месяц</span>
                  </div>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <button 
                    className={`w-full py-3 px-4 rounded-lg font-medium ${
                      plan.highlighted
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Начать бесплатно
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Отзывы наших клиентов
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Узнайте, как Zootel помогает бизнесам развиваться
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 italic mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.position}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Готовы начать?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к сотням Pet Care бизнесов, которые уже используют Zootel 
            для роста и автоматизации своих процессов.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-500 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-colors"
            >
              Начать бесплатно
            </Link>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-500 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
              Связаться с нами
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessPage; 