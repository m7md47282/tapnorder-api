import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { environment } from '../../environments/environment';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: NotificationAction[];
}

export interface PushNotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private messaging: Messaging | null = null;
  private permissionSubject = new BehaviorSubject<PushNotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public permission$ = this.permissionSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.initializeMessaging();
  }

  /**
   * Initialize Firebase messaging
   */
  private async initializeMessaging(): Promise<void> {
    try {
      const messaging = await this.firebaseService.getMessaging();
      if (messaging) {
        this.messaging = messaging;
        this.setupMessageListener();
        await this.requestPermission();
      }
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.messaging) {
      console.warn('Messaging not available');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      this.permissionSubject.next({
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      });

      if (permission === 'granted') {
        await this.getFCMToken();
      }

      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    if (!this.messaging) {
      console.warn('Messaging not available');
      return null;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey || 'your-vapid-key'
      });

      this.tokenSubject.next(token);
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Setup message listener for foreground notifications
   */
  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show notification in foreground
      this.showNotification({
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || 'You have a new message',
        icon: payload.notification?.icon || '/assets/icon-192x192.png',
        badge: payload.notification?.badge || '/assets/badge-72x72.png',
        data: payload.data
      });
    });
  }

  /**
   * Show browser notification
   */
  showNotification(payload: PushNotificationPayload): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/assets/icon-192x192.png',
        badge: payload.badge || '/assets/badge-72x72.png',
        data: payload.data,
        actions: payload.actions,
        tag: 'tabnorder-notification',
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Handle notification click based on data
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };

      // Handle action clicks
      notification.onactionclick = (event) => {
        console.log('Action clicked:', event.action);
        notification.close();
      };

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Subscribe to FCM token changes
   */
  subscribeToToken(): Observable<string | null> {
    return this.token$;
  }

  /**
   * Subscribe to permission changes
   */
  subscribeToPermission(): Observable<PushNotificationPermission> {
    return this.permission$;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check if permission is granted
   */
  isPermissionGranted(): boolean {
    return this.permissionSubject.value.granted;
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Send test notification
   */
  sendTestNotification(): void {
    this.showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from Tap n Order',
      data: { type: 'test' }
    });
  }

  /**
   * Send order status notification
   */
  sendOrderStatusNotification(orderId: string, status: string): void {
    const statusMessages = {
      'pending': 'Your order has been received and is being processed',
      'confirmed': 'Your order has been confirmed and is being prepared',
      'preparing': 'Your order is being prepared by our kitchen',
      'ready': 'Your order is ready for pickup!',
      'delivered': 'Your order has been delivered. Enjoy your meal!',
      'cancelled': 'Your order has been cancelled'
    };

    this.showNotification({
      title: 'Order Status Update',
      body: statusMessages[status as keyof typeof statusMessages] || 'Your order status has been updated',
      data: {
        type: 'order_update',
        orderId,
        status,
        url: `/order-tracking/${orderId}`
      }
    });
  }

  /**
   * Send new order notification (for staff)
   */
  sendNewOrderNotification(orderId: string, tableId: string): void {
    this.showNotification({
      title: 'New Order Received',
      body: `New order #${orderId} from table ${tableId}`,
      data: {
        type: 'new_order',
        orderId,
        tableId,
        url: `/admin/orders/${orderId}`
      }
    });
  }

  /**
   * Send payment notification
   */
  sendPaymentNotification(orderId: string, amount: number): void {
    this.showNotification({
      title: 'Payment Received',
      body: `Payment of $${amount.toFixed(2)} received for order #${orderId}`,
      data: {
        type: 'payment',
        orderId,
        amount,
        url: `/admin/orders/${orderId}`
      }
    });
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => {
            notification.close();
          });
        });
      });
    }
  }

  /**
   * Get notification count
   */
  getNotificationCount(): Promise<number> {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      return navigator.serviceWorker.ready.then(registration => {
        return registration.getNotifications().then(notifications => {
          return notifications.length;
        });
      });
    }
    return Promise.resolve(0);
  }
}
