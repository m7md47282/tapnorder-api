import { Injectable } from '@angular/core';
import { 
  getToken, 
  onMessage, 
  MessagePayload,
  deleteToken
} from 'firebase/messaging';
import { FirebaseService } from './firebase.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private messaging: any = null;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private messageSubject = new BehaviorSubject<MessagePayload | null>(null);
  
  public token$ = this.tokenSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    this.initializeMessaging();
  }

  private async initializeMessaging(): Promise<void> {
    try {
      this.messaging = await this.firebaseService.getMessaging();
      if (this.messaging) {
        this.setupMessageListener();
        await this.requestPermission();
      }
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }

  private async requestPermission(): Promise<void> {
    try {
      if (!this.messaging) return;

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        await this.getToken();
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  }

  private async getToken(): Promise<void> {
    try {
      if (!this.messaging) return;

      const token = await getToken(this.messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // You'll need to add your VAPID key here
      });

      if (token) {
        console.log('FCM Token:', token);
        this.tokenSubject.next(token);
        // You might want to send this token to your server
        await this.sendTokenToServer(token);
      } else {
        console.log('No registration token available.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
    }
  }

  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('Message received:', payload);
      this.messageSubject.next(payload);
      
      // Handle foreground messages
      this.handleForegroundMessage(payload);
    });
  }

  private handleForegroundMessage(payload: MessagePayload): void {
    // Show notification in foreground
    if (payload.notification) {
      const notification = payload.notification;
      
      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(notification.title || 'New Message', {
            body: notification.body,
            icon: notification.icon || '/assets/icon-192x192.png',
            badge: '/assets/badge-72x72.png',
            tag: 'notification-tag',
            data: payload.data
          });
        });
      } else {
        // Fallback for browsers that don't support service worker notifications
        if (Notification.permission === 'granted') {
          new Notification(notification.title || 'New Message', {
            body: notification.body,
            icon: notification.icon || '/assets/icon-192x192.png'
          });
        }
      }
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // Send token to your server to store it
      // This is where you'd make an HTTP request to your backend
      console.log('Sending token to server:', token);
      
      // Example:
      // await this.http.post('/api/fcm-token', { token }).toPromise();
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  async deleteToken(): Promise<void> {
    try {
      if (!this.messaging) return;

      const token = this.tokenSubject.value;
      if (token) {
        await deleteToken(this.messaging);
        this.tokenSubject.next(null);
        console.log('Token deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  }

  getCurrentToken(): string | null {
    return this.tokenSubject.value;
  }

  isSupported(): boolean {
    return this.messaging !== null;
  }

  // Subscribe to specific message types
  subscribeToOrderUpdates(): Observable<MessagePayload> {
    return this.messages$.pipe(
      // Filter for order-related messages
      // You can implement filtering logic here
    );
  }

  subscribeToMenuUpdates(): Observable<MessagePayload> {
    return this.messages$.pipe(
      // Filter for menu-related messages
      // You can implement filtering logic here
    );
  }
}
