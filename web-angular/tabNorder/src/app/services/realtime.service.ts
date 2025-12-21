import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { onSnapshot, Unsubscribe, doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Order } from '../models/order.model';

export interface RealtimeOrderUpdate {
  orderId: string;
  order: Order | null;
  timestamp: Date;
}

export interface RealtimeNotification {
  id: string;
  type: 'order_update' | 'new_order' | 'status_change' | 'payment_update';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private orderUpdatesSubject = new Subject<RealtimeOrderUpdate>();
  private notificationsSubject = new BehaviorSubject<RealtimeNotification[]>([]);
  private activeSubscriptions = new Map<string, Unsubscribe>();

  public orderUpdates$ = this.orderUpdatesSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Subscribe to real-time order updates
   */
  subscribeToOrder(orderId: string): Observable<Order | null> {
    return new Observable(observer => {
      if (this.isDemoMode()) {
        // Return demo subscription
        return this.subscribeToDemoOrder(orderId, observer);
      }

      const orderRef = doc(this.firebaseService.getFirestore(), 'orders', orderId);
      
      const unsubscribe = onSnapshot(orderRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const order: Order = {
            id: doc.id,
            placeId: data['placeId'],
            tableId: data['tableId'],
            items: data['items'] || [],
            total: data['total'] || 0,
            status: data['status'] || 'pending',
            statusHistory: data['statusHistory']?.map((status: any) => ({
              ...status,
              timestamp: status.timestamp?.toDate() || new Date()
            })) || [],
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date(),
            userId: data['userId'],
            userName: data['userName'],
            paid: data['paid'] || false,
            estimatedTime: data['estimatedTime']
          };
          
          observer.next(order);
          
          // Emit order update
          this.orderUpdatesSubject.next({
            orderId,
            order,
            timestamp: new Date()
          });
        } else {
          observer.next(null);
        }
      }, (error) => {
        console.error('Error listening to order updates:', error);
        observer.error(error);
      });

      // Store subscription for cleanup
      this.activeSubscriptions.set(orderId, unsubscribe);

      // Return cleanup function
      return () => {
        unsubscribe();
        this.activeSubscriptions.delete(orderId);
      };
    });
  }

  /**
   * Subscribe to all orders for a specific place (for dashboards)
   */
  subscribeToOrders(placeId: string): Observable<Order[]> {
    return new Observable(observer => {
      if (this.isDemoMode()) {
        // Return demo subscription
        return this.subscribeToDemoOrders(placeId, observer);
      }

      const ordersRef = collection(this.firebaseService.getFirestore(), 'orders');
      const q = query(
        ordersRef,
        where('placeId', '==', placeId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const order: Order = {
            id: doc.id,
            placeId: data['placeId'],
            tableId: data['tableId'],
            items: data['items'] || [],
            total: data['total'] || 0,
            status: data['status'] || 'pending',
            statusHistory: data['statusHistory']?.map((status: any) => ({
              ...status,
              timestamp: status.timestamp?.toDate() || new Date()
            })) || [],
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date(),
            userId: data['userId'],
            userName: data['userName'],
            paid: data['paid'] || false,
            estimatedTime: data['estimatedTime']
          };
          orders.push(order);
        });
        
        observer.next(orders);
      }, (error) => {
        console.error('Error listening to orders:', error);
        observer.error(error);
      });

      // Store subscription for cleanup
      this.activeSubscriptions.set(`orders_${placeId}`, unsubscribe);

      // Return cleanup function
      return () => {
        unsubscribe();
        this.activeSubscriptions.delete(`orders_${placeId}`);
      };
    });
  }

  /**
   * Subscribe to orders by status (for kitchen/cashier dashboards)
   */
  subscribeToOrdersByStatus(placeId: string, status: string): Observable<Order[]> {
    return new Observable(observer => {
      if (this.isDemoMode()) {
        // Return demo subscription
        return this.subscribeToDemoOrdersByStatus(placeId, status, observer);
      }

      const ordersRef = collection(this.firebaseService.getFirestore(), 'orders');
      const q = query(
        ordersRef,
        where('placeId', '==', placeId),
        where('status', '==', status),
        orderBy('createdAt', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const order: Order = {
            id: doc.id,
            placeId: data['placeId'],
            tableId: data['tableId'],
            items: data['items'] || [],
            total: data['total'] || 0,
            status: data['status'] || 'pending',
            statusHistory: data['statusHistory']?.map((status: any) => ({
              ...status,
              timestamp: status.timestamp?.toDate() || new Date()
            })) || [],
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date(),
            userId: data['userId'],
            userName: data['userName'],
            paid: data['paid'] || false,
            estimatedTime: data['estimatedTime']
          };
          orders.push(order);
        });
        
        observer.next(orders);
      }, (error) => {
        console.error('Error listening to orders by status:', error);
        observer.error(error);
      });

      // Store subscription for cleanup
      this.activeSubscriptions.set(`orders_${placeId}_${status}`, unsubscribe);

      // Return cleanup function
      return () => {
        unsubscribe();
        this.activeSubscriptions.delete(`orders_${placeId}_${status}`);
      };
    });
  }

  /**
   * Add a notification
   */
  addNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId ? { ...notification, read: true } : notification
    );
    this.notificationsSubject.next(updatedNotifications);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): Observable<number> {
    return new Observable(observer => {
      this.notifications$.subscribe(notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        observer.next(unreadCount);
      });
    });
  }

  /**
   * Cleanup all active subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }

  /**
   * Demo mode implementations
   */
  private isDemoMode(): boolean {
    return this.firebaseService.isDemoMode();
  }

  private subscribeToDemoOrder(orderId: string, observer: any): () => void {
    // Simulate real-time updates for demo
    const interval = setInterval(() => {
      // Generate demo order data
      const demoOrder: Order = {
        id: orderId,
        placeId: 'demo-place',
        tableId: 'demo-table',
        items: [
          { id: '1', name: 'Demo Item', price: 10.99, quantity: 2, notes: '' }
        ],
        total: 21.98,
        status: 'preparing',
        statusHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 300000) },
          { status: 'confirmed', timestamp: new Date(Date.now() - 240000) },
          { status: 'preparing', timestamp: new Date(Date.now() - 120000) }
        ],
        createdAt: new Date(Date.now() - 300000),
        updatedAt: new Date(),
        userId: 'demo-user',
        userName: 'Demo User',
        paid: false,
        estimatedTime: 15
      };
      
      observer.next(demoOrder);
    }, 5000);

    return () => clearInterval(interval);
  }

  private subscribeToDemoOrders(placeId: string, observer: any): () => void {
    // Simulate real-time updates for demo
    const interval = setInterval(() => {
      const demoOrders: Order[] = [
        {
          id: 'demo-order-1',
          placeId,
          tableId: 'table-1',
          items: [{ id: '1', name: 'Demo Item 1', price: 10.99, quantity: 1, notes: '' }],
          total: 10.99,
          status: 'pending',
          statusHistory: [{ status: 'pending', timestamp: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'demo-user',
          userName: 'Demo User',
          paid: false,
          estimatedTime: 15
        }
      ];
      
      observer.next(demoOrders);
    }, 10000);

    return () => clearInterval(interval);
  }

  private subscribeToDemoOrdersByStatus(placeId: string, status: string, observer: any): () => void {
    // Simulate real-time updates for demo
    const interval = setInterval(() => {
      const demoOrders: Order[] = [
        {
          id: `demo-order-${status}`,
          placeId,
          tableId: 'table-1',
          items: [{ id: '1', name: `Demo ${status} Item`, price: 10.99, quantity: 1, notes: '' }],
          total: 10.99,
          status: status as any,
          statusHistory: [{ status: status as any, timestamp: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'demo-user',
          userName: 'Demo User',
          paid: false,
          estimatedTime: 15
        }
      ];
      
      observer.next(demoOrders);
    }, 8000);

    return () => clearInterval(interval);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
