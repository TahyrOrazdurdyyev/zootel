import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import CompanyLayout from './CompanyLayout';
import PetOwnerLayout from './PetOwnerLayout';

const LayoutRouter = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Determine which layout to use based on route and user role
  const getLayout = () => {
    const path = location.pathname;

    // Admin routes
    if (path.startsWith('/admin')) {
      return AdminLayout;
    }

    // Company routes
    if (path.startsWith('/company')) {
      return CompanyLayout;
    }

    // Auth pages use minimal layout
    if (path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password') || path.startsWith('/reset-password')) {
      return PetOwnerLayout;
    }

    // Default to pet owner layout for public pages
    return PetOwnerLayout;
  };

  const Layout = getLayout();

  return (
    <Layout>
      {children}
    </Layout>
  );
};

export default LayoutRouter; 