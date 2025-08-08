import { initializeApp, getApps } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// Firebase конфигурация автоматически загружается из:
// - GoogleService-Info.plist (iOS)
// - google-services.json (Android)

class FirebaseService {
  private static instance: FirebaseService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Firebase app уже инициализирован через конфигурационные файлы
      const apps = getApps();
      if (apps.length === 0) {
        console.warn('No Firebase apps initialized');
        return;
      }

      // Enable analytics (автоматически disabled в development)
      await analytics().setAnalyticsCollectionEnabled(true);

      // Enable crashlytics
      await crashlytics().setCrashlyticsCollectionEnabled(true);

      // Request messaging permission (будет обработано в PushNotificationService)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Firebase messaging permission granted');
      } else {
        console.log('❌ Firebase messaging permission denied');
      }

      this.initialized = true;
      console.log('✅ Firebase Business App initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      crashlytics().recordError(error as Error);
    }
  }

  /**
   * Log analytics event
   */
  async logEvent(eventName: string, parameters?: { [key: string]: any }): Promise<void> {
    try {
      await analytics().logEvent(eventName, parameters);
    } catch (error) {
      console.error('Analytics event failed:', error);
    }
  }

  /**
   * Log business-specific events
   */
  async logBusinessEvent(event: {
    action: 'employee_login' | 'booking_completed' | 'chat_message_sent' | 'analytics_viewed' | 'inventory_updated';
    employeeId: string;
    companyId: string;
    additionalData?: any;
  }): Promise<void> {
    await this.logEvent('business_action', {
      action_type: event.action,
      employee_id: event.employeeId,
      company_id: event.companyId,
      timestamp: new Date().toISOString(),
      ...event.additionalData,
    });
  }

  /**
   * Set user properties for analytics
   */
  async setUserProperties(properties: {
    employee_id?: string;
    company_id?: string;
    role?: string;
    permissions?: string[];
  }): Promise<void> {
    try {
      await analytics().setUserProperties({
        employee_id: properties.employee_id || null,
        company_id: properties.company_id || null,
        employee_role: properties.role || null,
        permission_count: properties.permissions?.length?.toString() || null,
      });
    } catch (error) {
      console.error('Set user properties failed:', error);
    }
  }

  /**
   * Record custom error
   */
  recordError(error: Error, context?: string): void {
    try {
      if (context) {
        crashlytics().log(`Context: ${context}`);
      }
      crashlytics().recordError(error);
    } catch (e) {
      console.error('Failed to record error:', e);
    }
  }

  /**
   * Set crashlytics user identifier
   */
  setCrashlyticsUserId(userId: string): void {
    try {
      crashlytics().setUserId(userId);
    } catch (error) {
      console.error('Failed to set crashlytics user ID:', error);
    }
  }

  /**
   * Log business performance metrics
   */
  async logPerformanceMetric(metric: {
    name: string;
    value: number;
    unit?: string;
    employeeId?: string;
    companyId?: string;
  }): Promise<void> {
    await this.logEvent('performance_metric', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit || 'count',
      employee_id: metric.employeeId,
      company_id: metric.companyId,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();

// Export Firebase modules for direct use
export { messaging, analytics, crashlytics };

// Export default
export default firebaseService; 