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
      title: 'Booking Management',
      description: 'Full control over schedule, automatic booking confirmation, calendar synchronization',
      benefits: ['Drag & drop calendar', 'Automatic reminders', 'Recurring appointments management']
    },
    {
      icon: UsersIcon,
      title: 'Employee Management',
      description: 'Flexible role and permission system, activity tracking, staff schedule management',
      benefits: ['Roles and permissions', 'Activity logs', 'Personal schedules']
    },
    {
      icon: ChatBubbleLeftIcon,
      title: 'Customer Chat',
      description: 'Built-in messenger for customer communication, file sharing, conversation history',
      benefits: ['Instant notifications', 'Files and photos', 'Centralized history']
    },
    {
      icon: SparklesIcon,
      title: 'AI Assistants',
      description: 'Smart bots for automation: booking assistant, customer support, vet assistant',
      benefits: ['Automatic responses', 'Request processing', 'Medical consultations']
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics and Reports',
      description: 'Detailed sales statistics, customer base, employee effectiveness',
      benefits: ['Revenue tracking', 'Customer insights', 'Performance metrics']
    },
    {
      icon: CreditCardIcon,
      title: 'Payments and Billing',
      description: 'Stripe integration, automatic invoices, subscription and commission management',
      benefits: ['Online payments', 'Recurring billing', 'Commission tracking']
    }
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 2990,
      period: 'month',
      description: 'For small businesses and startups',
      features: [
        'Up to 3 employees',
        'Basic booking management',
        'Customer chat',
        '1 AI assistant (Booking)',
        'Basic analytics',
        'Email support'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 5990,
      period: 'month',
      description: 'For growing Pet Care companies',
      features: [
        'Up to 10 employees',
        'Advanced booking management',
        'Chat + notifications',
        '3 AI assistants',
        'Full analytics',
        'Stripe integration',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 12990,
      period: 'month',
      description: 'For large chains and franchises',
      features: [
        'Unlimited employees',
        'Multi-location management',
        'All AI assistants',
        'Custom integrations',
        'White label',
        'Dedicated account manager',
        'SLA 99.9%'
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Anna Korzhova',
      position: 'Owner of "VetDoctor" chain',
      avatar: '/api/placeholder/80/80',
      rating: 5,
      text: 'Zootel transformed our business. We increased efficiency by 40% and customers became much happier thanks to automatic reminders.',
      company: 'VetDoctor (4 clinics)',
      results: '+40% efficiency'
    },
    {
      id: 2,
      name: 'Mikhail Petrov',
      position: 'Founder of "PetStyle"',
      avatar: '/api/placeholder/80/80',
      rating: 5,
      text: 'AI assistants are simply magical! They respond to customers 24/7, and I can focus on business development.',
      company: 'PetStyle Grooming',
      results: '24/7 support'
    },
    {
      id: 3,
      name: 'Elena Smirnova',
      position: 'Director of "Lapland"',
      avatar: '/api/placeholder/80/80',
      rating: 5,
      text: 'Analytics showed us bottlenecks in our work. Now we know how to optimize processes and increase profits.',
      company: 'Lapland Pet Store',
      results: '+25% conversion'
    }
  ];

  const stats = [
    { number: '500+', label: 'Active companies' },
    { number: '50K+', label: 'Customers served' },
    { number: '98%', label: 'Satisfaction rate' },
    { number: '35%', label: 'Average revenue growth' }
  ];

  const businessTypes = [
    'Veterinary clinic',
    'Grooming salon', 
    'Pet store',
    'Pet hotel/Boarding',
    'Training center',
    'Other'
  ];

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    // Send demo request
    console.log('Demo request:', demoForm);
    alert('Thank you! We will contact you within 24 hours for a demonstration.');
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
                CRM for Pet Care business
              </h1>
              <p className="text-xl mb-8 text-red-100">
                Manage bookings, employees and customers in one platform. 
                Increase sales with AI assistants and automation.
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
                  className="bg-white text-orange-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold flex items-center justify-center"
                >
                  <PlayCircleIcon className="h-5 w-5 mr-2" />
                  Request demo
                </button>
                <Link
                  to="/register?type=business"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-orange-600 transition-colors duration-200 font-semibold text-center"
                >
                  Start for free
                </Link>
              </div>
              
              <p className="text-sm text-red-200 mt-4">
                ✓ Free 14-day trial period ✓ No credit card required
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
              Everything you need for a successful Pet Care business
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive solution for automation and growth of your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-6">
                    <Icon className="h-8 w-8 text-orange-600" />
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
              Transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`rounded-2xl p-8 border-2 ${
                  plan.popular 
                    ? 'border-orange-600 bg-red-50 relative' 
                    : 'border-gray-200 bg-white'
                } hover:shadow-lg transition-shadow duration-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Popular
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
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Start with {plan.name}
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Need more features? Contact us for a custom offer.
            </p>
            <Link
              to="/contact"
              className="text-orange-600 hover:text-red-700 font-medium"
            >
              Contact sales team →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What our customers say
            </h2>
            <p className="text-xl text-gray-600">
              Success stories from Pet Care companies
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
      <section className="py-20 bg-orange-600">
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
            Ready to start?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of Pet Care companies already using Zootel
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowDemoModal(true)}
              className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-semibold"
            >
              Get demo
            </button>
            <Link
              to="/register?type=business"
              className="border border-orange-600 text-orange-600 px-8 py-4 rounded-lg hover:bg-orange-50 transition-colors duration-200 font-semibold"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Request demonstration</h3>
            
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={demoForm.company}
                  onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={demoForm.phone}
                  onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business type</label>
                <select
                  value={demoForm.businessType}
                  onChange={(e) => setDemoForm({ ...demoForm, businessType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Submit
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