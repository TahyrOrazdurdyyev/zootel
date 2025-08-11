import React from 'react';
import UniversalHeader from '../common/UniversalHeader';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  UsersIcon,
  SparklesIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

const CompanyLayout = ({ children }) => {
  const { user } = useAuth();

  const sidebarItems = [
    { name: 'Dashboard', href: '/company', icon: HomeIcon },
    { name: 'Services', href: '/company/services', icon: CogIcon },
    { name: 'Calendar', href: '/company/calendar', icon: CalendarIcon },
    { name: 'Employees', href: '/company/employees', icon: UsersIcon },
    { name: 'Chat', href: '/company/chat', icon: ChatBubbleLeftIcon },
    { name: 'Analytics', href: '/company/analytics', icon: ChartBarIcon },
    { name: 'AI Prompts', href: '/company/ai-prompts', icon: SparklesIcon }
  ];

  return (
    <div className="theme-company min-h-screen bg-gray-50">
      <UniversalHeader />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">Company Panel</h2>
            <p className="text-sm text-gray-600">{user?.company?.name || 'My Company'}</p>
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

export default CompanyLayout; 