import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionStateSubject = new BehaviorSubject<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null
  });
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  public connectionState$ = this.connectionStateSubject.asObservable();
  public messages$ = this.messageSubject.asObservable();

  constructor() {}

  /**
   * Connect to WebSocket server
   */
  connect(url?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = url || environment.websocketUrl || 'ws://localhost:8080';
    
    this.connectionStateSubject.next({
      connected: false,
      connecting: true,
      error: null
    });

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStateSubject.next({
          connected: true,
          connecting: false,
          error: null
        });
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = {
            ...JSON.parse(event.data),
            timestamp: new Date()
          };
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.connectionStateSubject.next({
          connected: false,
          connecting: false,
          error: null
        });

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStateSubject.next({
          connected: false,
          connecting: false,
          error: 'Connection failed'
        });
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.connectionStateSubject.next({
        connected: false,
        connecting: false,
        error: 'Failed to create connection'
      });
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connectionStateSubject.next({
      connected: false,
      connecting: false,
      error: null
    });
  }

  /**
   * Send message through WebSocket
   */
  sendMessage(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }

  /**
   * Subscribe to specific message types
   */
  subscribeToMessageType(type: string): Observable<WebSocketMessage> {
    return new Observable(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (message.type === type) {
          observer.next(message);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrderUpdates(): Observable<any> {
    return this.subscribeToMessageType('order_update');
  }

  /**
   * Subscribe to new orders
   */
  subscribeToNewOrders(): Observable<any> {
    return this.subscribeToMessageType('new_order');
  }

  /**
   * Subscribe to status changes
   */
  subscribeToStatusChanges(): Observable<any> {
    return this.subscribeToMessageType('status_change');
  }

  /**
   * Subscribe to payment updates
   */
  subscribeToPaymentUpdates(): Observable<any> {
    return this.subscribeToMessageType('payment_update');
  }

  /**
   * Request order updates for specific order
   */
  requestOrderUpdate(orderId: string): void {
    this.sendMessage('request_order_update', { orderId });
  }

  /**
   * Request all orders for a place
   */
  requestOrdersForPlace(placeId: string): void {
    this.sendMessage('request_orders', { placeId });
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId: string, status: string, notes?: string): void {
    this.sendMessage('update_order_status', {
      orderId,
      status,
      notes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Join a room (for place-specific updates)
   */
  joinRoom(roomId: string): void {
    this.sendMessage('join_room', { roomId });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    this.sendMessage('leave_room', { roomId });
  }

  /**
   * Get current connection state
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionStateSubject.value;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStateSubject.value.connected;
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect();
      }
    }, this.reconnectInterval);
  }
}
