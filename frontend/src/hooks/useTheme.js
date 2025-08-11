import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const useTheme = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getTheme = () => {
    const path = location.pathname;

    // Admin routes
    if (path.startsWith('/admin')) {
      return 'admin-theme';
    }

    // Company routes
    if (path.startsWith('/company')) {
      return 'company-theme';
    }

    // Default pet owner theme
    return 'pet-owner-theme';
  };

  const getHeroClass = () => {
    const path = location.pathname;

    if (path.startsWith('/admin')) {
      return 'hero-admin';
    }

    if (path.startsWith('/company')) {
      return 'hero-company';
    }

    return 'hero-pet-owner';
  };

  const getButtonClass = (variant = 'primary') => {
    const path = location.pathname;
    
    if (path.startsWith('/admin')) {
      return `btn-admin${variant !== 'primary' ? `-${variant}` : ''}`;
    }

    if (path.startsWith('/company')) {
      return `btn-company${variant !== 'primary' ? `-${variant}` : ''}`;
    }

    return `btn-pet-owner${variant !== 'primary' ? `-${variant}` : ''}`;
  };

  const getCardClass = () => {
    const path = location.pathname;

    if (path.startsWith('/admin')) {
      return 'card-admin';
    }

    if (path.startsWith('/company')) {
      return 'card-company';
    }

    return 'card-pet-owner';
  };

  const getNavClass = () => {
    const path = location.pathname;

    if (path.startsWith('/admin')) {
      return 'nav-admin';
    }

    if (path.startsWith('/company')) {
      return 'nav-company';
    }

    return 'nav-pet-owner';
  };

  // Apply theme class to body
  useEffect(() => {
    const theme = getTheme();
    document.body.className = theme;
    
    return () => {
      document.body.className = '';
    };
  }, [location.pathname]);

  return {
    theme: getTheme(),
    heroClass: getHeroClass(),
    buttonClass: getButtonClass,
    cardClass: getCardClass(),
    navClass: getNavClass(),
  };
};

export default useTheme; 