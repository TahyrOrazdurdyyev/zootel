import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { firebaseService } from '../config/firebase';
import ApiService from './apiService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'booking_reminder' | 'new_booking' | 'booking_update' | 'customer_message' | 'system_alert';
  bookingId?: string;
  customerId?: string;
  title: string;
  body: string;
  data?: any;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private notificationToken: string | null = null;
  private listeners: any[] = [];

  private constructor() {
    this.initializeListeners();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notification listeners
   */
  private initializeListeners() {
    // Listen for notifications received while app is in foreground
    this.listeners.push(
      Notifications.addNotificationReceivedListener(this.handleNotificationReceived)
    );

    // Listen for notification interactions (tap, action buttons)
    this.listeners.push(
      Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse)
    );
  }

  /**
   * Set up Firebase messaging handlers
   */
  private setupFirebaseHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      
      // Log analytics event
      await firebaseService.logEvent('notification_received_background', {
        messageId: remoteMessage.messageId,
        from: remoteMessage.from,
        notification_type: remoteMessage.data?.type || 'unknown',
      });
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Message received in foreground!', remoteMessage);
      
      // Show local notification for foreground messages
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title || 'New Message',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data || {},
          },
          trigger: null, // Show immediately
        });
      }

      // Log analytics event
      await firebaseService.logEvent('notification_received_foreground', {
        messageId: remoteMessage.messageId,
        from: remoteMessage.from,
        notification_type: remoteMessage.data?.type || 'unknown',
      });
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleFirebaseNotificationTap(remoteMessage);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleFirebaseNotificationTap(remoteMessage);
        }
      });

    this.listeners.push(unsubscribe);
  }

  /**
   * Request notification permissions and get push token
   */
  async requestPermissions(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Request Firebase messaging permissions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Firebase messaging permission not granted');
        return null;
      }

      // Also request Expo notifications permissions for local notifications
      const { status: expoStatus } = await Notifications.requestPermissionsAsync();
      if (expoStatus !== 'granted') {
        console.log('Expo notifications permission not granted');
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      this.notificationToken = fcmToken;
      
      // Store token locally
      await AsyncStorage.setItem('pushToken', fcmToken);
      await AsyncStorage.setItem('fcmToken', fcmToken);
      
      // Send token to backend
      await this.sendTokenToServer(fcmToken);

      // Set up Firebase message handlers
      this.setupFirebaseHandlers();

      console.log('✅ Push notifications initialized with FCM token');
      return fcmToken;
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      firebaseService.recordError(error as Error, 'PushNotificationService.requestPermissions');
      return null;
    }
  }

  /**
   * Send token to backend for storage
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // In a real implementation, you would have an API endpoint to register tokens
      // await ApiService.registerPushToken(token);
      console.log('FCM token registered:', token);
      
      // Log analytics event
      await firebaseService.logEvent('fcm_token_registered', {
        token_length: token.length,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
      firebaseService.recordError(error as Error, 'PushNotificationService.sendTokenToServer');
    }
  }

  /**
   * Handle Firebase notification tap
   */
  private handleFirebaseNotificationTap(remoteMessage: any) {
    const { type, bookingId, customerId } = remoteMessage.data || {};
    
    // Log analytics event
    firebaseService.logEvent('notification_tapped', {
      messageId: remoteMessage.messageId,
      notification_type: type || 'unknown',
      has_booking_id: !!bookingId,
      has_customer_id: !!customerId,
    });
    
    // Navigate to appropriate screen
    this.navigateFromNotification(type, { bookingId, customerId });
  }

  /**
   * Handle notification received in foreground
   */
  private handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    const { type, bookingId } = notification.request.content.data as NotificationData;
    
    // You can add custom logic here based on notification type
    switch (type) {
      case 'new_booking':
        this.handleNewBookingNotification(notification);
        break;
      case 'booking_update':
        this.handleBookingUpdateNotification(notification);
        break;
      case 'customer_message':
        this.handleCustomerMessageNotification(notification);
        break;
      default:
        break;
    }
  };

  /**
   * Handle notification tap/interaction
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    console.log('Notification response:', response);
    
    const { type, bookingId, customerId } = response.notification.request.content.data as NotificationData;
    
    // Navigate to appropriate screen based on notification type
    this.navigateFromNotification(type, { bookingId, customerId });
  };

  /**
   * Navigate to appropriate screen based on notification
   */
  private navigateFromNotification(type: string, data: any) {
    // This would integrate with your navigation system
    // For now, we'll just log the intended navigation
    switch (type) {
      case 'new_booking':
      case 'booking_update':
        console.log('Navigate to booking detail:', data.bookingId);
        break;
      case 'customer_message':
        console.log('Navigate to chat:', data.bookingId);
        break;
      default:
        console.log('Navigate to dashboard');
        break;
    }
  }

  /**
   * Handle new booking notifications
   */
  private handleNewBookingNotification(notification: Notifications.Notification) {
    // Update local state, refresh booking list, etc.
    console.log('New booking received');
  }

  /**
   * Handle booking update notifications
   */
  private handleBookingUpdateNotification(notification: Notifications.Notification) {
    // Update booking status in local cache
    console.log('Booking updated');
  }

  /**
   * Handle customer message notifications
   */
  private handleCustomerMessageNotification(notification: Notifications.Notification) {
    // Update chat message count, refresh chat, etc.
    console.log('New customer message');
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    scheduledTime: Date,
    data?: any
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: {
          date: scheduledTime,
        },
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear all notifications from notification center
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Schedule booking reminder notification
   */
  async scheduleBookingReminder(
    bookingId: string,
    customerName: string,
    serviceName: string,
    bookingTime: Date
  ): Promise<string | null> {
    try {
      // Schedule 30 minutes before booking
      const reminderTime = new Date(bookingTime.getTime() - 30 * 60 * 1000);
      
      // Don't schedule if time has already passed
      if (reminderTime <= new Date()) {
        return null;
      }

      const identifier = await this.scheduleLocalNotification(
        'Upcoming Booking',
        `${customerName} - ${serviceName} in 30 minutes`,
        reminderTime,
        {
          type: 'booking_reminder',
          bookingId,
        }
      );

      return identifier;
    } catch (error) {
      console.error('Error scheduling booking reminder:', error);
      return null;
    }
  }

  /**
   * Schedule end-of-day summary notification
   */
  async scheduleEndOfDaySummary(): Promise<string | null> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0); // 6 PM tomorrow

      const identifier = await this.scheduleLocalNotification(
        'Daily Summary',
        'Tap to view your daily performance summary',
        tomorrow,
        {
          type: 'system_alert',
        }
      );

      return identifier;
    } catch (error) {
      console.error('Error scheduling end of day summary:', error);
      return null;
    }
  }

  /**
   * Create notification channels for Android
   */
  async createNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('bookings', {
          name: 'Bookings',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ff4500',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007bff',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('system', {
          name: 'System Alerts',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [0, 100],
          lightColor: '#28a745',
        });
      } catch (error) {
        console.error('Error creating notification channels:', error);
      }
    }
  }

  /**
   * Get current push token
   */
  getCurrentToken(): string | null {
    return this.notificationToken;
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.listeners.forEach(listener => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    });
    this.listeners = [];
  }
}

export default PushNotificationService; 