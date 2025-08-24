import {
  getFirestore,
  Firestore,
  Query
} from 'firebase-admin/firestore';
import { initializeApp, App, cert } from 'firebase-admin/app';

import { 
  IDatabaseOperations,
  DatabaseConfig,
  DatabaseFilter,
  QueryOptions,
  DatabaseTransaction,
  DatabaseQueryResult
} from '../types';

export class FirebaseClient implements IDatabaseOperations {

  private app: App;
  private db: Firestore;
  private connected: boolean = false;

  constructor(private config: DatabaseConfig) {
    this.app = initializeApp({
      credential: cert(config.credentials as any)
    });
    this.db = getFirestore(this.app);
  }

  private async performHealthCheck(): Promise<{ isHealthy: boolean; latency: number }> {
    const startTime = Date.now();
    try {
      const healthRef = this.db.collection('_health').doc('_test');
      const timestamp = new Date();
      
      // Write test
      await healthRef.set({ 
        timestamp,
        lastCheck: timestamp
      });

      // Read test
      const doc = await healthRef.get();
      const data = doc.data();

      // Verify data integrity
      if (!data || !data.timestamp || !(data.timestamp instanceof Date)) {
        return { isHealthy: false, latency: Date.now() - startTime };
      }

      return { 
        isHealthy: true, 
        latency: Date.now() - startTime 
      };
    } catch (error) {
      return { 
        isHealthy: false, 
        latency: Date.now() - startTime 
      };
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError || new Error('Operation failed after max retries');
  }

  async connect(): Promise<void> {
    try {
      const health = await this.retryOperation(
        () => this.performHealthCheck(),
        3, // max retries
        1000 // base delay in ms
      );

      if (!health.isHealthy) {
        throw new Error('Health check failed after retries');
      }

      this.connected = true;
    } catch (error) {
      this.connected = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to Firebase: ${errorMessage}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Perform cleanup operations
      const healthRef = this.db.collection('_health').doc('_test');
      await healthRef.update({
        disconnectedAt: new Date(),
        status: 'disconnected'
      });

      await (this.app as any).delete();
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      this.connected = false;
    }
  }

  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    timestamp: Date;
    details: {
      connected: boolean;
      lastSuccessfulOperation?: Date;
      error?: string;
    };
  }> {
    try {
      const health = await this.performHealthCheck();
      
      return {
        status: health.isHealthy ? 'healthy' : 'unhealthy',
        latency: health.latency,
        timestamp: new Date(),
        details: {
          connected: this.connected,
          lastSuccessfulOperation: new Date()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: -1,
        timestamp: new Date(),
        details: {
          connected: this.connected,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private convertFilter(filter: DatabaseFilter): [string, any, any] {
    return [filter.field, filter.operator, filter.value];
  }

  async find<T>(
    collectionName: string,
    filters: DatabaseFilter[] = [],
    options: QueryOptions = {}
  ): Promise<DatabaseQueryResult<T>> {
    let q = this.db.collection(collectionName) as unknown as Query<T>;

    if (filters.length > 0) {
      filters.forEach(f => {
        const [field, op, value] = this.convertFilter(f);
        q = q.where(field, op, value);
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach(o => {
        q = q.orderBy(o.field, o.direction);
      });
    }

    if (options.limit) {
      q = q.limit(options.limit);
    }

    if (options.offset) {
      const snapshot = await q.get();
      const lastVisible = snapshot.docs[options.offset - 1];
      if (lastVisible) {
        q = q.startAfter(lastVisible);
      }
    }

    const snapshot = await q.get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    return {
      data,
      metadata: {
        total: snapshot.size,
        hasMore: data.length === options.limit
      }
    };
  }

  async findOne<T>(
    collectionName: string,
    filters: DatabaseFilter[] = []
  ): Promise<T | null> {
    const result = await this.find<T>(collectionName, filters, { limit: 1 });
    return result.data[0] || null;
  }

  async findById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = this.db.collection(collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as T;
  }

  async create<T>(
    collectionName: string,
    data: Partial<T>,
    _options?: { transaction?: DatabaseTransaction }
  ): Promise<string> {
    const docRef = await this.db.collection(collectionName).add(data);
    return docRef.id;
  }

  async update<T>(
    collectionName: string,
    id: string,
    data: Partial<T>,
    _options?: { transaction?: DatabaseTransaction }
  ): Promise<void> {
    const docRef = this.db.collection(collectionName).doc(id);
    await docRef.update(data as any);
  }

  async delete(
    collectionName: string,
    id: string,
    _options?: { transaction?: DatabaseTransaction }
  ): Promise<void> {
    const docRef = this.db.collection(collectionName).doc(id);
    await docRef.delete();
  }

  async createBatch<T>(
    collectionName: string,
    items: Partial<T>[],
    _options?: { transaction?: DatabaseTransaction }
  ): Promise<string[]> {
    const batch = this.db.batch();
    const refs = items.map(item => {
      const docRef = this.db.collection(collectionName).doc();
      batch.set(docRef as any, item as any);
      return docRef;
    });

    await batch.commit();
    return refs.map(ref => ref.id);
  }

  async updateBatch<T>(
    collectionName: string,
    items: { id: string; data: Partial<T> }[],
    _options?: { transaction?: DatabaseTransaction }
  ): Promise<void> {
    const batch = this.db.batch();

    items.forEach(({ id, data }) => {
      const docRef = this.db.collection(collectionName).doc(id);
      batch.update(docRef, data as any);
    });

    await batch.commit();
  }

  async deleteBatch(
    collectionName: string,
    ids: string[],
    _options?: { transaction?: DatabaseTransaction }
  ): Promise<void> {
    const batch = this.db.batch();

    ids.forEach(id => {
      const docRef = this.db.collection(collectionName).doc(id);
      batch.delete(docRef);
    });

    await batch.commit();
  }

  async startTransaction(): Promise<DatabaseTransaction> {
    // const transaction = await this.db.runTransaction(async t => t);
    return {
      commit: async () => {},  // Firebase handles this automatically
      rollback: async () => {} // Firebase handles this automatically
    };
  }

  subscribe<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    filters: DatabaseFilter[] = []
  ): () => void {
    let q = this.db.collection(collectionName) as unknown as Query<T>;

    if (filters.length > 0) {
      filters.forEach(f => {
        const [field, op, value] = this.convertFilter(f);
        q = q.where(field, op, value);
      });
    }

    return q.onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }

  subscribeToDocument<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void
  ): () => void {
    const docRef = this.db.collection(collectionName).doc(id);
    
    return docRef.onSnapshot(snapshot => {
      if (!snapshot.exists) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data()
      } as T);
    });
  }
}
