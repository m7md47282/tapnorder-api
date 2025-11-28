import { getFirestore, Firestore, DocumentSnapshot, QuerySnapshot } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { BaseRepository } from '../base.repository';
import { IOrderRepository } from '../interfaces/order.repository.interface';
import { Order, OrderQuery } from '../../entities/order.entity';

/**
 * Order Repository Implementation
 * Handles order data persistence and real-time subscriptions
 * Follows SOLID principles and Clean Architecture
 */
export class OrderRepository extends BaseRepository<Order> implements IOrderRepository {
  private readonly firestore: Firestore;

  constructor() {
    super('orders');
    this.firestore = getFirestore(getApp());
  }

  // Order-specific queries
  async getOrdersByPlaceId(placeId: string, query?: OrderQuery): Promise<Order[]> {
    try {
      let ordersQuery = this.firestore
        .collection('orders')
        .where('placeId', '==', placeId);

      if (query?.status) {
        ordersQuery = ordersQuery.where('status', '==', query.status);
      }

      if (query?.type) {
        ordersQuery = ordersQuery.where('type', '==', query.type);
      }

      if (query?.customerId) {
        ordersQuery = ordersQuery.where('customer.id', '==', query.customerId);
      }

      if (query?.source) {
        ordersQuery = ordersQuery.where('source', '==', query.source);
      }

      if (query?.dateFrom) {
        ordersQuery = ordersQuery.where('createdAt', '>=', query.dateFrom);
      }

      if (query?.dateTo) {
        ordersQuery = ordersQuery.where('createdAt', '<=', query.dateTo);
      }

      // Order by creation date (newest first)
      ordersQuery = ordersQuery.orderBy('createdAt', 'desc');

      const snapshot = await ordersQuery.get();
      return this.mapDocumentsToEntities(snapshot.docs);
    } catch (error) {
      console.error('Error getting orders by place ID:', error);
      throw new Error('Failed to retrieve orders');
    }
  }

  async getOrderByOrderNumber(placeId: string, orderNumber: string): Promise<Order | null> {
    try {
      const snapshot = await this.firestore
        .collection('orders')
        .where('placeId', '==', placeId)
        .where('orderNumber', '==', orderNumber)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return this.mapDocumentToEntity(snapshot.docs[0] as DocumentSnapshot);
    } catch (error) {
      console.error('Error getting order by order number:', error);
      throw new Error('Failed to retrieve order');
    }
  }

  async getOrdersByStatus(placeId: string, status: Order['status']): Promise<Order[]> {
    try {
      const snapshot = await this.firestore
        .collection('orders')
        .where('placeId', '==', placeId)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();

      return this.mapDocumentsToEntities(snapshot.docs);
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw new Error('Failed to retrieve orders');
    }
  }

  async getOrdersByCustomer(placeId: string, customerId: string): Promise<Order[]> {
    try {
      const snapshot = await this.firestore
        .collection('orders')
        .where('placeId', '==', placeId)
        .where('customer.id', '==', customerId)
        .orderBy('createdAt', 'desc')
        .get();

      return this.mapDocumentsToEntities(snapshot.docs);
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      throw new Error('Failed to retrieve orders');
    }
  }

  // Real-time operations for cashier
  subscribeToOrdersByPlaceId(placeId: string, callback: (orders: Order[]) => void): () => void {
    const unsubscribe = this.firestore
      .collection('orders')
      .where('placeId', '==', placeId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot: QuerySnapshot) => {
          const orders = this.mapDocumentsToEntities(snapshot.docs);
          callback(orders);
        },
        (error) => {
          console.error('Error in orders subscription:', error);
        }
      );

    return unsubscribe;
  }

  subscribeToOrderUpdates(orderId: string, callback: (order: Order | null) => void): () => void {
    const unsubscribe = this.firestore
      .collection('orders')
      .doc(orderId)
      .onSnapshot(
        (snapshot: DocumentSnapshot) => {
          if (snapshot.exists) {
            const order = this.mapDocumentToEntity(snapshot);
            callback(order);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Error in order subscription:', error);
        }
      );

    return unsubscribe;
  }

  subscribeToOrdersByStatus(placeId: string, statuses: Order['status'][], callback: (orders: Order[]) => void): () => void {
    const unsubscribe = this.firestore
      .collection('orders')
      .where('placeId', '==', placeId)
      .where('status', 'in', statuses)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot: QuerySnapshot) => {
          const orders = this.mapDocumentsToEntities(snapshot.docs);
          callback(orders);
        },
        (error) => {
          console.error('Error in orders by status subscription:', error);
        }
      );

    return unsubscribe;
  }

  // Order status operations
  async updateOrderStatus(orderId: string, status: Order['status'], updatedBy: string): Promise<void> {
    try {
      await this.firestore.collection('orders').doc(orderId).update({
        status,
        lastUpdatedBy: updatedBy,
        lastUpdatedAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  // Order search and filtering
  async searchOrders(placeId: string, searchTerm: string): Promise<Order[]> {
    try {
      // Search by order number or customer name
      const orderNumberQuery = this.firestore
        .collection('orders')
        .where('placeId', '==', placeId)
        .where('orderNumber', '>=', searchTerm)
        .where('orderNumber', '<=', searchTerm + '\uf8ff')
        .orderBy('orderNumber')
        .get();

      const customerNameQuery = this.firestore
        .collection('orders')
        .where('placeId', '==', placeId)
        .where('customer.name', '>=', searchTerm)
        .where('customer.name', '<=', searchTerm + '\uf8ff')
        .orderBy('customer.name')
        .get();

      const [orderNumberSnapshot, customerNameSnapshot] = await Promise.all([
        orderNumberQuery,
        customerNameQuery
      ]);

      const orders = [
        ...this.mapDocumentsToEntities(orderNumberSnapshot.docs),
        ...this.mapDocumentsToEntities(customerNameSnapshot.docs)
      ];

      // Remove duplicates based on order ID
      const uniqueOrders = orders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );

      return uniqueOrders;
    } catch (error) {
      console.error('Error searching orders:', error);
      throw new Error('Failed to search orders');
    }
  }

  async getOrdersByDateRange(placeId: string, dateFrom: Date, dateTo: Date): Promise<Order[]> {
    try {
      const snapshot = await this.firestore
        .collection('orders')
        .where('placeId', '==', placeId)
        .where('createdAt', '>=', dateFrom)
        .where('createdAt', '<=', dateTo)
        .orderBy('createdAt', 'desc')
        .get();

      return this.mapDocumentsToEntities(snapshot.docs);
    } catch (error) {
      console.error('Error getting orders by date range:', error);
      throw new Error('Failed to retrieve orders');
    }
  }

  // Generate order number
  async generateOrderNumber(placeId: string): Promise<string> {
    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]?.replace(/-/g, '');
      
      // Get today's order count
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const snapshot = await this.firestore
        .collection('orders')
        .where('placeId', '==', placeId)
        .where('createdAt', '>=', startOfDay)
        .where('createdAt', '<', endOfDay)
        .get();

      const orderCount = snapshot.size + 1;
      return `ORD-${dateString}-${orderCount.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      throw new Error('Failed to generate order number');
    }
  }

  // Helper methods
  private mapDocumentToEntity(doc: DocumentSnapshot): Order {
    const data = doc.data();
    if (!data) {
      throw new Error('Document data is null');
    }

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastUpdatedAt: data.lastUpdatedAt?.toDate() || new Date(),
      items: data.items?.map((item: any) => ({
        ...item,
        createdAt: item.createdAt?.toDate() || new Date(),
        updatedAt: item.updatedAt?.toDate() || new Date()
      })) || []
    } as Order;
  }

  private mapDocumentsToEntities(docs: DocumentSnapshot[]): Order[] {
    return docs.map(doc => this.mapDocumentToEntity(doc));
  }
}
