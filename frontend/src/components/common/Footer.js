import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const Footer = () => {
  const [showAppStoreTooltip, setShowAppStoreTooltip] = useState(false);
  const [showPlayStoreTooltip, setShowPlayStoreTooltip] = useState(false);

  const footerLinks = {
    company: [
      { name: 'О нас', href: '/about' },
      { name: 'Как это работает', href: '/how-it-works' },
      { name: 'Вакансии', href: '/careers' },
      { name: 'Пресс-центр', href: '/press' },
      { name: 'Блог', href: '/blog' }
    ],
    support: [
      { name: 'Помощь', href: '/help' },
      { name: 'Центр поддержки', href: '/support' },
      { name: 'Безопасность', href: '/safety' },
      { name: 'Связаться с нами', href: '/contact' },
      { name: 'FAQ', href: '/faq' }
    ],
    business: [
      { name: 'Для бизнеса', href: '/business' },
      { name: 'Стать партнером', href: '/partner' },
      { name: 'API для разработчиков', href: '/developers' },
      { name: 'Виджеты', href: '/widgets' },
      { name: 'Интеграции', href: '/integrations' }
    ],
    legal: [
      { name: 'Условия использования', href: '/terms' },
      { name: 'Политика конфиденциальности', href: '/privacy' },
      { name: 'Политика возврата', href: '/refund' },
      { name: 'Правила сообщества', href: '/community-guidelines' }
    ]
  };

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/zootel',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/zootel',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.596-3.185-1.538-.737-.943-.737-2.169 0-3.112.738-.942 1.888-1.538 3.185-1.538s2.448.596 3.186 1.538c.737.943.737 2.169 0 3.112-.738.942-1.889 1.538-3.186 1.538zm7.138 0c-1.297 0-2.448-.596-3.186-1.538-.737-.943-.737-2.169 0-3.112.738-.942 1.889-1.538 3.186-1.538 1.297 0 2.448.596 3.185 1.538.737.943.737 2.169 0 3.112-.737.942-1.888 1.538-3.185 1.538z"/>
        </svg>
      )
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/zootel',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/zootel',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      name: 'Telegram',
      href: 'https://t.me/zootel',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      )
    },
    {
      name: 'VK',
      href: 'https://vk.com/zootel',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.441 0 .61.203.78.677.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.169.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.271.525.643-.204.678-2.151 4.014-2.151 4.014-.186.305-.254.44 0 .78.186.254.795.779 1.203 1.254.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
        </svg>
      )
    }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="ml-2 text-xl font-bold">Zootel</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Платформа для поиска и бронирования услуг по уходу за питомцами. 
              Найдите лучших специалистов рядом с вами.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-300">
                <EnvelopeIcon className="w-5 h-5 mr-3" />
                <a href="mailto:support@zootel.com" className="hover:text-primary-400 transition-colors">
                  support@zootel.com
                </a>
              </div>
              <div className="flex items-center text-gray-300">
                <PhoneIcon className="w-5 h-5 mr-3" />
                <a href="tel:+74951234567" className="hover:text-primary-400 transition-colors">
                  +7 (495) 123-45-67
                </a>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPinIcon className="w-5 h-5 mr-3" />
                <span>Москва, Россия</span>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold mb-3">Мы в социальных сетях</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Компания</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Поддержка</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Links */}
          <div>
            <h4 className="font-semibold mb-4">Для бизнеса</h4>
            <ul className="space-y-2">
              {footerLinks.business.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App Download */}
          <div>
            <h4 className="font-semibold mb-4">Мобильные приложения</h4>
            <div className="space-y-3">
              {/* App Store */}
              <div className="relative">
                <button
                  className="block w-full opacity-50 cursor-not-allowed"
                  onMouseEnter={() => setShowAppStoreTooltip(true)}
                  onMouseLeave={() => setShowAppStoreTooltip(false)}
                >
                  <img
                    src="/images/app-store-badge.png"
                    alt="Download on the App Store"
                    className="h-10 w-auto grayscale"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback */}
                  <div className="hidden h-10 w-32 bg-gray-800 rounded-lg items-center justify-center border border-gray-600">
                    <span className="text-sm text-gray-400">App Store</span>
                  </div>
                </button>
                {showAppStoreTooltip && (
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg whitespace-nowrap z-10">
                    Coming Soon
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-black"></div>
                  </div>
                )}
              </div>

              {/* Google Play */}
              <div className="relative">
                <button
                  className="block w-full opacity-50 cursor-not-allowed"
                  onMouseEnter={() => setShowPlayStoreTooltip(true)}
                  onMouseLeave={() => setShowPlayStoreTooltip(false)}
                >
                  <img
                    src="/images/google-play-badge.png"
                    alt="Get it on Google Play"
                    className="h-10 w-auto grayscale"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Fallback */}
                  <div className="hidden h-10 w-32 bg-gray-800 rounded-lg items-center justify-center border border-gray-600">
                    <span className="text-sm text-gray-400">Google Play</span>
                  </div>
                </button>
                {showPlayStoreTooltip && (
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg whitespace-nowrap z-10">
                    Coming Soon
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-black"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <h5 className="font-medium mb-2">Подписка на новости</h5>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button className="px-4 py-2 bg-primary-500 text-white rounded-r-md hover:bg-primary-600 transition-colors">
                  <EnvelopeIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            {/* Copyright */}
            <div className="flex items-center">
              <p className="text-gray-400 text-sm">
                © {currentYear} Zootel. Все права защищены.
              </p>
              <HeartIcon className="w-4 h-4 text-red-500 mx-2" />
              <span className="text-gray-400 text-sm">Сделано с любовью к питомцам</span>
            </div>

            {/* Legal Links */}
            <div className="mt-4 md:mt-0">
              <div className="flex flex-wrap space-x-6">
                {footerLinks.legal.map((link, index) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 