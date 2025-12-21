import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { FirestoreService } from '../services/firestore.service';
import { Order, OrderItem, CreateOrderData, OrderFilters, OrderStats, TableOrder, OrderUpdate } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderRepository {
  private readonly COLLECTION_NAME = 'orders';
  private readonly TABLES_COLLECTION = 'tables';

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<string> {
    try {
      const ordersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      
      // Calculate totals
      const totalAmount = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = totalAmount * 0.085; // 8.5% tax
      const finalAmount = totalAmount + taxAmount;

      const order = {
        ...orderData,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        totalAmount,
        taxAmount,
        finalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(ordersRef, order);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const orderRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        return null;
      }

      const orderData = orderSnap.data() as Omit<Order, 'id'>;
      return {
        id: orderSnap.id,
        ...orderData,
        createdAt: orderData.createdAt?.toDate() || new Date(),
        updatedAt: orderData.updatedAt?.toDate() || new Date(),
        actualDeliveryTime: orderData.actualDeliveryTime?.toDate()
      };
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }

  /**
   * Get orders by table ID
   */
  async getOrdersByTable(tableId: string, placeId: string): Promise<Order[]> {
    try {
      const ordersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        ordersRef,
        where('tableId', '==', tableId),
        where('placeId', '==', placeId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const orderData = doc.data() as Omit<Order, 'id'>;
        return {
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date(),
          actualDeliveryTime: orderData.actualDeliveryTime?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching orders by table:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(tableId: string, placeId: string, userId: string): Promise<Order[]> {
    try {
      const ordersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        ordersRef,
        where('tableId', '==', tableId),
        where('placeId', '==', placeId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const orderData = doc.data() as Omit<Order, 'id'>;
        return {
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date(),
          actualDeliveryTime: orderData.actualDeliveryTime?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  /**
   * Get orders with filters
   */
  async getOrdersWithFilters(filters: OrderFilters, limitCount: number = 50): Promise<Order[]> {
    try {
      const ordersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [];
      
      if (filters.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }
      
      if (filters.paymentStatus && filters.paymentStatus.length > 0) {
        constraints.push(where('paymentStatus', 'in', filters.paymentStatus));
      }
      
      if (filters.tableId) {
        constraints.push(where('tableId', '==', filters.tableId));
      }
      
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }
      
      if (filters.dateFrom) {
        constraints.push(where('createdAt', '>=', filters.dateFrom));
      }
      
      if (filters.dateTo) {
        constraints.push(where('createdAt', '<=', filters.dateTo));
      }
      
      if (filters.minAmount !== undefined) {
        constraints.push(where('finalAmount', '>=', filters.minAmount));
      }
      
      if (filters.maxAmount !== undefined) {
        constraints.push(where('finalAmount', '<=', filters.maxAmount));
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(limitCount));
      
      const q = query(ordersRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const orderData = doc.data() as Omit<Order, 'id'>;
        return {
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date(),
          actualDeliveryTime: orderData.actualDeliveryTime?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching orders with filters:', error);
      throw error;
    }
  }

  /**
   * Get active orders (pending, confirmed, preparing, ready)
   */
  async getActiveOrders(placeId: string): Promise<Order[]> {
    try {
      const filters: OrderFilters = {
        status: ['pending', 'confirmed', 'preparing', 'ready'],
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      };
      
      const ordersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        ordersRef,
        where('placeId', '==', placeId),
        where('status', 'in', filters.status!),
        where('createdAt', '>=', filters.dateFrom!),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const orderData = doc.data() as Omit<Order, 'id'>;
        return {
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date(),
          actualDeliveryTime: orderData.actualDeliveryTime?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching active orders:', error);
      throw error;
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, updates: OrderUpdate): Promise<void> {
    try {
      const orderRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, orderId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      await this.updateOrder(orderId, { orderId, status });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Mark order as paid
   */
  async markOrderAsPaid(orderId: string, paymentMethod: Order['paymentMethod'] = 'card'): Promise<void> {
    try {
      await this.updateOrder(orderId, { 
        orderId, 
        paymentStatus: 'paid',
        status: 'confirmed' // Auto-confirm when paid
      });
    } catch (error) {
      console.error('Error marking order as paid:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      await this.updateOrder(orderId, { 
        orderId, 
        status: 'cancelled',
        cashierNotes: reason ? `Cancelled: ${reason}` : 'Order cancelled'
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(placeId: string, dateFrom?: Date, dateTo?: Date): Promise<OrderStats> {
    try {
      const filters: OrderFilters = {
        dateFrom: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        dateTo: dateTo || new Date()
      };
      
      const orders = await this.getOrdersWithFilters(filters, 1000);
      
      const stats: OrderStats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        preparingOrders: orders.filter(o => o.status === 'preparing').length,
        readyOrders: orders.filter(o => o.status === 'ready').length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
        averageOrderValue: 0,
        averagePreparationTime: 0
      };
      
      stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
      
      // Calculate average preparation time
      const completedOrders = orders.filter(o => o.actualDeliveryTime && o.status === 'delivered');
      if (completedOrders.length > 0) {
        const totalPrepTime = completedOrders.reduce((sum, o) => {
          const prepTime = o.actualDeliveryTime!.getTime() - o.createdAt.getTime();
          return sum + prepTime;
        }, 0);
        stats.averagePreparationTime = totalPrepTime / completedOrders.length / (1000 * 60); // Convert to minutes
      }
      
      return stats;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      throw error;
    }
  }

  /**
   * Get table orders summary
   */
  async getTableOrders(placeId: string): Promise<TableOrder[]> {
    try {
      const activeOrders = await this.getActiveOrders(placeId);
      
      // Group orders by table
      const tableMap = new Map<string, TableOrder>();
      
      activeOrders.forEach(order => {
        if (!order.tableId) return;
        
        if (!tableMap.has(order.tableId)) {
          tableMap.set(order.tableId, {
            tableId: order.tableId,
            tableNumber: order.tableId, // In real app, this would come from tables collection
            orders: [],
            totalAmount: 0,
            status: 'empty',
            lastOrderTime: undefined
          });
        }
        
        const tableOrder = tableMap.get(order.tableId)!;
        tableOrder.orders.push(order);
        tableOrder.totalAmount += order.finalAmount;
        
        if (!tableOrder.lastOrderTime || order.createdAt > tableOrder.lastOrderTime) {
          tableOrder.lastOrderTime = order.createdAt;
        }
        
        // Determine table status
        if (order.status === 'ready') {
          tableOrder.status = 'needs_attention';
        } else if (order.status === 'preparing' || order.status === 'confirmed') {
          tableOrder.status = 'active';
        }
      });
      
      return Array.from(tableMap.values());
    } catch (error) {
      console.error('Error fetching table orders:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time order updates
   */
  subscribeToOrders(placeId: string, callback: (orders: Order[]) => void): Unsubscribe {
    const ordersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('placeId', '==', placeId),
      where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready']),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => {
        const orderData = doc.data() as Omit<Order, 'id'>;
        return {
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date(),
          actualDeliveryTime: orderData.actualDeliveryTime?.toDate()
        };
      });
      callback(orders);
    });
  }

  /**
   * Subscribe to table-specific order updates
   */
  subscribeToTableOrders(tableId: string, placeId: string, callback: (orders: Order[]) => void): Unsubscribe {
    const ordersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('tableId', '==', tableId),
      where('placeId', '==', placeId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => {
        const orderData = doc.data() as Omit<Order, 'id'>;
        return {
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date(),
          actualDeliveryTime: orderData.actualDeliveryTime?.toDate()
        };
      });
      callback(orders);
    });
  }
}
