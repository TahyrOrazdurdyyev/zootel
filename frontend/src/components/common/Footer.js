import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const Footer = () => {
  const [hoveredApp, setHoveredApp] = useState(null);

  const footerLinks = {
    company: [
      { name: 'About us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press center', href: '/press' },
      { name: 'Blog', href: '/blog' }
    ],
    support: [
      { name: 'Help', href: '/help' },
      { name: 'Support service', href: '/support' },
      { name: 'Security', href: '/safety' },
      { name: 'Accessibility', href: '/accessibility' }
    ],
    business: [
      { name: 'Zootel Business', href: '/business' },
      { name: 'Partnership program', href: '/partners' },
      { name: 'API for developers', href: '/developers' },
      { name: 'Advertising', href: '/advertising' }
    ],
    legal: [
      { name: 'Terms of use', href: '/terms' },
      { name: 'Privacy policy', href: '/privacy' },
      { name: 'Refund policy', href: '/refund-policy' },
      { name: 'Community guidelines', href: '/community-guidelines' }
    ]
  };

  const socialLinks = [
    { name: 'Facebook', href: '#', iconClass: 'fab fa-facebook-f' },
    { name: 'Instagram', href: '#', iconClass: 'fab fa-instagram' },
    { name: 'X', href: '#', iconClass: 'fab fa-x-twitter' },
    { name: 'LinkedIn', href: '#', iconClass: 'fab fa-linkedin-in' }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          
          {/* Company info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <img src="/images/icons/Logo_orange.png" alt="Zootel" className="h-8 w-auto" />
            </div>
            <p className="text-gray-300 mb-6">
              Pet Care services marketplace and CRM for business. 
              Find the best services for your pets or grow your business with us.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <MapPinIcon className="h-5 w-5 mr-3 text-orange-500" />
                <span>1111B S Governors Ave STE 37817, Dover, DE 19904, United States</span>
              </div>
              <div className="flex items-center text-gray-300">
                <PhoneIcon className="h-5 w-5 mr-3 text-orange-500" />
                <span>+1 (636) 216-2132</span>
              </div>
              <div className="flex items-center text-gray-300">
                <EnvelopeIcon className="h-5 w-5 mr-3 text-orange-500" />
                <span>support@zootel.com</span>
              </div>
            </div>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Business</h3>
            <ul className="space-y-2">
              {footerLinks.business.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Documents</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* App download section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            
            {/* App download buttons */}
            <div className="mb-6 lg:mb-0">
              <h3 className="text-lg font-semibold mb-4">Download app</h3>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                
                {/* App Store button */}
                <div className="relative">
                  <button
                    className="flex items-center bg-black border border-gray-600 rounded-lg px-4 py-2 cursor-not-allowed opacity-50"
                    onMouseEnter={() => setHoveredApp('ios')}
                    onMouseLeave={() => setHoveredApp(null)}
                    disabled
                  >
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="white">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.09,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">Download on</div>
                      <div className="text-sm font-medium">App Store</div>
                    </div>
                  </button>
                  
                  {/* Tooltip */}
                  {hoveredApp === 'ios' && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                      Coming Soon
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>

                {/* Google Play button */}
                <div className="relative">
                  <button
                    className="flex items-center bg-black border border-gray-600 rounded-lg px-4 py-2 cursor-not-allowed opacity-50"
                    onMouseEnter={() => setHoveredApp('android')}
                    onMouseLeave={() => setHoveredApp(null)}
                    disabled
                  >
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="white">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">Install on</div>
                      <div className="text-sm font-medium">Google Play</div>
                    </div>
                  </button>
                  
                  {/* Tooltip */}
                  {hoveredApp === 'android' && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap">
                      Coming Soon
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">We're on social</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full transition-colors duration-150"
                    title={social.name}
                  >
                    <i 
                      className={`${social.iconClass} text-white text-lg`}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-gray-400 text-sm">
              © 2025 Zootel. All rights reserved.
            </div>
            <div className="mt-2 md:mt-0 text-gray-400 text-sm">
              Made with ❤️ for animal lovers
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 