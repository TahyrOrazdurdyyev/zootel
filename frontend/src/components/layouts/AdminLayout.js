import React from 'react';
import UniversalHeader from '../common/UniversalHeader';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  CogIcon,
  CreditCardIcon,
  SparklesIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  TagIcon,
  BriefcaseIcon,
  NewspaperIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const AdminLayout = ({ children }) => {
  const sidebarItems = [
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Companies', href: '/admin/companies', icon: BuildingOfficeIcon },
    { name: 'Service Categories', href: '/admin/service-categories', icon: TagIcon },
    { name: 'Business Types', href: '/admin/business-types', icon: BuildingOfficeIcon },
    { name: 'Currencies', href: '/admin/currencies', icon: CurrencyDollarIcon },
    { name: 'Plan Settings', href: '/admin/plan-settings', icon: CogIcon },
    { name: 'Payment Settings', href: '/admin/payment-settings', icon: CreditCardIcon },
    { name: 'AI Agents', href: '/admin/ai-agents', icon: CpuChipIcon },
    { name: 'AI Prompts', href: '/admin/prompts', icon: SparklesIcon },
    { name: 'Careers', href: '/admin/careers', icon: BriefcaseIcon },
    { name: 'Press Center', href: '/admin/press', icon: NewspaperIcon },
    { name: 'Blog', href: '/admin/blog', icon: DocumentTextIcon }
  ];

  return (
    <div className="theme-admin min-h-screen bg-gray-50">
      <UniversalHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-600">Super Admin</p>
          </div>
          
          <nav className="mt-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-150"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 