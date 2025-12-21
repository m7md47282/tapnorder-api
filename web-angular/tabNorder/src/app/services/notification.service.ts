import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { RealtimeService, RealtimeNotification } from './realtime.service';
import { ToastService } from './toast.service';

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<RealtimeNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private permissionSubject = new BehaviorSubject<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public permission$ = this.permissionSubject.asObservable();

  constructor(
    private realtimeService: RealtimeService,
    private toastService: ToastService
  ) {
    this.initializeNotifications();
    this.checkNotificationPermission();
  }

  /**
   * Initialize notification system
   */
  private initializeNotifications(): void {
    // Subscribe to real-time notifications
    this.realtimeService.notifications$.subscribe(notifications => {
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount(notifications);
    });

    // Subscribe to order updates for notifications
    this.realtimeService.orderUpdates$.subscribe(update => {
      if (update.order) {
        this.handleOrderUpdate(update);
      }
    });
  }

  /**
   * Check browser notification permission
   */
  checkNotificationPermission(): void {
    if ('Notification' in window) {
      const permission = Notification.permission;
      this.permissionSubject.next({
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      });
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionSubject.next({
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      });
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title: string, options?: NotificationOptions): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/assets/icon-192x192.png',
        badge: '/assets/badge-72x72.png',
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Add a new notification
   */
  addNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>): void {
    this.realtimeService.addNotification(notification);
    
    // Show toast notification
    this.toastService.info(notification.title, notification.message);
    
    // Show browser notification if permission granted
    if (this.permissionSubject.value.granted) {
      this.showBrowserNotification(notification.title, {
        body: notification.message,
        tag: notification.type
      });
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    this.realtimeService.markNotificationAsRead(notificationId);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.realtimeService.clearAllNotifications();
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  /**
   * Handle order update notifications
   */
  private handleOrderUpdate(update: any): void {
    const { orderId, order } = update;
    
    if (!order) return;

    // Get previous order state to detect changes
    const currentNotifications = this.notificationsSubject.value;
    const lastOrderNotification = currentNotifications.find(n => 
      n.type === 'order_update' && n.data?.orderId === orderId
    );

    const previousStatus = lastOrderNotification?.data?.status;
    const currentStatus = order.status;

    // Only notify if status changed
    if (previousStatus && previousStatus !== currentStatus) {
      this.addNotification({
        type: 'status_change',
        title: 'Order Status Updated',
        message: `Order #${orderId} is now ${this.getStatusText(currentStatus)}`,
        data: { orderId, status: currentStatus, order }
      });
    }
  }

  /**
   * Get status text for display
   */
  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'preparing': 'being prepared',
      'ready': 'ready for pickup',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || status;
  }

  /**
   * Update unread count
   */
  private updateUnreadCount(notifications: RealtimeNotification[]): void {
    const unreadCount = notifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Subscribe to specific notification types
   */
  subscribeToNotificationType(type: string): Observable<RealtimeNotification> {
    return new Observable(observer => {
      const subscription = this.notifications$.subscribe(notifications => {
        const latestNotification = notifications.find(n => n.type === type);
        if (latestNotification) {
          observer.next(latestNotification);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Subscribe to order notifications
   */
  subscribeToOrderNotifications(): Observable<RealtimeNotification> {
    return this.subscribeToNotificationType('order_update');
  }

  /**
   * Subscribe to status change notifications
   */
  subscribeToStatusChangeNotifications(): Observable<RealtimeNotification> {
    return this.subscribeToNotificationType('status_change');
  }

  /**
   * Subscribe to new order notifications
   */
  subscribeToNewOrderNotifications(): Observable<RealtimeNotification> {
    return this.subscribeToNotificationType('new_order');
  }

  /**
   * Subscribe to payment notifications
   */
  subscribeToPaymentNotifications(): Observable<RealtimeNotification> {
    return this.subscribeToNotificationType('payment_update');
  }
}
