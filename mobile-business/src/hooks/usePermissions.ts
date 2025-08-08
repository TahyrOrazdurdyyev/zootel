import { useAuth } from '../context/AuthContext';
import { Permission } from '../types';
import { useCallback } from 'react';

export const usePermissions = () => {
  const { employee } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!employee || !employee.active) {
      return false;
    }

    // Admin and manager roles have all permissions
    if (employee.role === 'admin' || employee.role === 'manager') {
      return true;
    }

    // Check specific permission
    return employee.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canViewBookings = (): boolean => {
    return hasAnyPermission(['view_own_bookings', 'view_all_bookings']);
  };

  const canManageBookings = (): boolean => {
    return hasAnyPermission(['start_booking', 'complete_booking', 'cancel_booking']);
  };

  const canStartBooking = (): boolean => {
    return hasPermission('start_booking');
  };

  const canCompleteBooking = (): boolean => {
    return hasPermission('complete_booking');
  };

  const canCancelBooking = (): boolean => {
    return hasPermission('cancel_booking');
  };

  const canManageInventory = (): boolean => {
    return hasPermission('manage_inventory');
  };

  const canViewAnalytics = (): boolean => {
    return hasPermission('view_analytics');
  };

  const canManageEmployees = (): boolean => {
    return hasPermission('manage_employees');
  };

  const canManageSettings = (): boolean => {
    return hasPermission('manage_settings');
  };

  const canUseAI = (): boolean => {
    return hasPermission('use_ai_agent');
  };

  const canSendNotifications = (): boolean => {
    return hasPermission('send_notifications');
  };

  // Service Management Permissions
  const canViewServices = useCallback((): boolean => {
    return hasAnyPermission(['view_services', 'manage_services']);
  }, [hasAnyPermission]);

  const canManageServices = useCallback((): boolean => {
    return hasPermission('manage_services');
  }, [hasPermission]);

  const canCreateServices = useCallback((): boolean => {
    return hasPermission('manage_services');
  }, [hasPermission]);

  const canEditServices = useCallback((): boolean => {
    return hasPermission('manage_services');
  }, [hasPermission]);

  const canDeleteServices = useCallback((): boolean => {
    return hasPermission('manage_services');
  }, [hasPermission]);

  const canManageServiceSchedule = useCallback((): boolean => {
    return hasPermission('manage_services');
  }, [hasPermission]);

  return {
    // Base permission functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Booking permissions
    canViewBookings,
    canManageBookings,
    canStartBooking,
    canCompleteBooking,
    canCancelBooking,
    
    // Other permissions
    canSendNotifications,
    canManageInventory,
    canViewAnalytics,
    canUseAI,
    canManageEmployees,
    canManageSettings,
    
    // Service permissions
    canViewServices,
    canManageServices,
    canCreateServices,
    canEditServices,
    canDeleteServices,
    canManageServiceSchedule,
    
    // Employee info
    isActive: employee?.active ?? false,
    role: employee?.role ?? 'viewer',
  };
}; 