export interface Employee {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: EmployeeRole;
  permissions: Permission[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeRole = 'admin' | 'manager' | 'employee' | 'viewer';

export type Permission = 
  | 'view_own_bookings'
  | 'view_all_bookings' 
  | 'start_booking'
  | 'complete_booking'
  | 'cancel_booking'
  | 'send_notifications'
  | 'manage_inventory'
  | 'view_analytics'
  | 'use_ai_agent'
  | 'manage_employees'
  | 'manage_settings'
  | 'view_services'
  | 'manage_services';

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  serviceCategories: string[];
  businessHours: BusinessHours;
  settings: CompanySettings;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface CompanySettings {
  currency: string;
  timezone: string;
  autoConfirmBookings: boolean;
  allowCancellations: boolean;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  employeeId: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  price: number;
  notes?: string;
  petInfo?: PetInfo;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface PetInfo {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: number;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  categoryId: string;
  categoryName: string;
  category: string;
  isActive: boolean;
  // Image fields
  imageId?: string; // File ID in database
  imageUrl?: string; // URL for displaying image
  // New scheduling fields
  availableDays: string[]; // ['monday', 'tuesday', etc.]
  startTime: string; // '09:00'
  endTime: string; // '17:00'
  assignedEmployees: string[]; // employee IDs
  maxBookingsPerSlot: number;
  bufferTimeBefore: number; // minutes
  bufferTimeAfter: number; // minutes
  advanceBookingDays: number; // days
  cancellationPolicy: string; // '24h before', etc.
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  images?: string[];
}

export interface DashboardMetrics {
  todayBookings: number;
  todayRevenue: number;
  weeklyBookings: number;
  weeklyRevenue: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  pendingBookings: number;
  lowStockItems: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate?: string;
  bookingId?: string;
  assignedTo: string;
  status: TaskStatus;
  createdAt: string;
}

export type TaskType = 'booking_reminder' | 'follow_up' | 'inventory_reorder' | 'customer_contact' | 'general';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'booking' | 'break' | 'event';
  bookingId?: string;
  description?: string;
  color?: string;
}

// Navigation Types
export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  ForgotPassword: undefined;
  
  // Main Stack
  Dashboard: undefined;
  Bookings: undefined;
  Calendar: undefined;
  Chat: undefined;
  Services: undefined;
  Inventory: undefined;
  Analytics: undefined;
  Settings: undefined;
  Employees: undefined;
  
  // AI Stack
  AIAssistant: {
    agentKey?: string;
  };
  
  // Service Management
  ServiceForm: {
    serviceId?: string;
    mode: 'create' | 'edit';
  };
  
  // Booking Management
  BookingDetail: {
    bookingId: string;
  };
  
  // Settings
  IntegrationSettings: undefined;
};

// Helper type for navigation
export type ScreenNavigationProp<T extends keyof RootStackParamList> = {
  navigate<RouteName extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[RouteName]
      ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
      : [screen: RouteName, params: RootStackParamList[RouteName]]
  ): void;
  goBack(): void;
};

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderType: 'employee' | 'customer' | 'ai';
  message: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  read: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface IntegrationSettings {
  integration_enabled: boolean;
  publish_to_marketplace: boolean;
  api_key?: string;
  allowed_domains: string[];
  available_features: string[];
  recent_analytics?: any;
  can_toggle_marketplace?: boolean;
  marketplace_eligibility?: {
    can_toggle: boolean;
    reason?: string;
  };
} 