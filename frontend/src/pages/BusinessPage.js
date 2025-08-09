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
      title: 'Online Booking',
      description: 'Clients can book services 24/7 through the website and mobile app'
    },
    {
      icon: UserGroupIcon,
      title: 'Client Management',
      description: 'Maintain client database, service history, and pet medical records'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics and Reports',
      description: 'Track revenues, popular services, and operational efficiency'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Chat with Clients',
      description: 'Communicate with clients in real-time and answer questions'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Payment Processing',
      description: 'Accept online and cash payments with automatic accounting'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile App',
      description: 'Manage your business from anywhere through the mobile app'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: 2999,
      description: 'For small clinics and salons',
      features: [
        'Up to 5 employees',
        'Basic CRM',
        'Online Booking',
        'Basic Analytics',
        'Email support'
      ],
      highlighted: false
    },
    {
      name: 'Professional',
      price: 4999,
      description: 'For growing businesses',
      features: [
        'Up to 15 employees',
        'Advanced CRM',
        'AI assistants',
        'Advanced Analytics',
        'Integrations',
        'Priority support'
      ],
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 9999,
      description: 'For large networks',
      features: [
        'Unlimited employees',
        'Full CRM',
        'All AI agents',
        'White label',
        'API access',
        'Personal manager'
      ],
      highlighted: false
    }
  ];

  const testimonials = [
    {
      name: 'Anna Kozlova',
      position: 'Owner of "VetCare" Clinic',
      content: 'Zootel helped us increase customers by 40% and optimize scheduling. Now we never lose appointments and always know when to expect clients.',
      avatar: '👩‍⚕️'
    },
    {
      name: 'Dmitry Pavlov',
      position: 'Director of "PetGroom" Chain',
      content: 'Managing 3 salons has become much easier. Analytics shows which services are popular, and the mobile app allows control of all processes.',
      avatar: '👨‍💼'
    },
    {
      name: 'Elena Morozova',
      position: 'Pet Hotel Owner',
      content: 'Clients appreciated the online booking feature. Now they can book a place for their pet even while on vacation, which is very convenient.',
      avatar: '👩‍💻'
    }
  ];

  const stats = [
    { value: '500+', label: 'Happy Clients' },
    { value: '50,000+', label: 'Pets Served' },
    { value: '99.9%', label: 'System Uptime' },
    { value: '24/7', label: 'Technical Support' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Develop your{' '}
              <span className="text-primary-500">Pet Care business</span>{' '}
              with Zootel
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive CRM system for veterinary clinics, grooming salons, 
              pet hotels, and other Pet Care businesses. Automate processes 
              and increase profits.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-4"
              >
                Try for free
              </Link>
              <button className="btn-secondary text-lg px-8 py-4">
                Watch demo
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              14 days free trial • No obligations • Quick setup
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              All tools for successful business
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Modern CRM system created specifically for the Pet Care industry
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
              Choose the right plan
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start with a free period and choose a plan as your business grows
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
                      Popular
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
                    <span className="text-gray-600">/month</span>
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
                    Start for free
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
              Client Testimonials
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Learn how Zootel helps businesses grow
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
            Ready to start?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of Pet Care businesses that already use Zootel 
            for growth and automation of their processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-500 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-colors"
            >
              Start for free
            </Link>
            <button className="border-2 border-white text-white hover:bg-white hover:text-primary-500 font-bold py-4 px-8 rounded-lg text-lg transition-colors">
              Contact us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessPage; 