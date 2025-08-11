import React from 'react';
import { Link } from 'react-router-dom';
import BusinessHero from '../components/heroes/BusinessHero';
import {
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SparklesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const BusinessPage = () => {
  const features = [
    {
      icon: CalendarIcon,
      title: 'Online Booking',
      description: 'Let customers book appointments 24/7 with automated confirmations and reminders.'
    },
    {
      icon: UserGroupIcon,
      title: 'Customer Management',
      description: 'Complete CRM system with customer profiles, pet records, and visit history.'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics & Reports',
      description: 'Track your business performance with detailed analytics and custom reports.'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Customer Communication',
      description: 'Integrated messaging system with automated notifications and reminders.'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile App',
      description: 'Manage your business on the go with our dedicated mobile application.'
    },
    {
      icon: SparklesIcon,
      title: 'AI Assistant',
      description: 'AI-powered features to automate routine tasks and improve efficiency.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Website Integration',
      description: 'Embed booking widgets and showcase your services on your website.'
    },
    {
      icon: CogIcon,
      title: 'Customization',
      description: 'Fully customizable to match your business needs and branding.'
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

  // Add new component for trial expired banner
  const TrialExpiredBanner = ({ onUpgrade }) => {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <span className="font-medium">Free trial expired.</span> Your account is now in read-only mode. 
              Upgrade to a paid plan to restore full access to all features.
            </p>
            <div className="mt-2">
              <div className="-mx-2 -my-1.5 flex">
                <button
                  type="button"
                  className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  onClick={onUpgrade}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add new component for trial expiring soon banner
  const TrialExpiringSoonBanner = ({ daysLeft, onUpgrade }) => {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Trial expires in {daysLeft} days.</span> Upgrade now to continue 
              using all features without interruption.
            </p>
            <div className="mt-2">
              <div className="-mx-2 -my-1.5 flex">
                <button
                  type="button"
                  className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  onClick={onUpgrade}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Now isolated */}
      <BusinessHero />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to grow your pet care business
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Comprehensive tools designed specifically for pet care professionals
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center">
                    <Icon className="h-12 w-12 text-primary-500" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
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