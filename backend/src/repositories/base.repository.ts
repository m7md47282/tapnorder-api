import { getFirestore, Firestore, Query } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { QueryFilter, BaseModel, QueryOptions } from './types';

/**
 * Base Repository Interface - MANDATORY for all repositories
 * Follows SOLID principles and Clean Architecture
 */
export interface IBaseRepository<T extends BaseModel> {
  // Basic CRUD Operations
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;

  // Advanced Querying
  query(filters?: QueryFilter[], options?: QueryOptions): Promise<T[]>;
  queryOne(filters: QueryFilter[]): Promise<T | null>;

  // Real-time Subscriptions
  subscribeToChanges(callback: (data: T[]) => void): () => void;
  subscribeToDocument(id: string, callback: (data: T | null) => void): () => void;

  // Batch Operations
  createBatch(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]>;
  updateBatch(items: { id: string; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }[]): Promise<void>;
  deleteBatch(ids: string[]): Promise<void>;
}

/**
 * Abstract Base Repository - MANDATORY for all repositories
 * Implements common functionality and enforces SOLID principles
 * Uses Firebase directly without client abstraction layer
 */
export abstract class BaseRepository<T extends BaseModel> implements IBaseRepository<T> {
  protected db: Firestore;

  constructor(
    protected readonly collectionName: string
  ) {
    this.db = getFirestore(getApp());
  }

  // Basic CRUD Operations
  async getAll(): Promise<T[]> {
    const snapshot = await this.db.collection(this.collectionName).get();
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
  }

  async getById(id: string): Promise<T | null> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { ...docSnap.data(), id: docSnap.id } as T;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const timestamp = new Date();
    
    // Filter out undefined values as Firestore doesn't allow them
    const enrichedData = this.removeUndefinedValues({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    }) as Partial<T>;

    const docRef = await this.db.collection(this.collectionName).add(enrichedData);
    return docRef.id;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    // Filter out undefined values as Firestore doesn't allow them
    const enrichedData = this.removeUndefinedValues({
      ...data,
      updatedAt: new Date()
    }) as Partial<T>;
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update(enrichedData as any);
  }

  async delete(id: string): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.delete();
  }

  // Advanced Querying
  async query(
    filters: QueryFilter[] = [], 
    options: QueryOptions = {}
  ): Promise<T[]> {
    let q = this.db.collection(this.collectionName) as unknown as Query<T>;

    if (filters.length > 0) {
      filters.forEach(f => {
        q = q.where(f.field as any, f.operator as any, f.value as any);
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach(o => {
        q = q.orderBy(o.field as any, o.direction as any);
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
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
  }

  async queryOne(filters: QueryFilter[]): Promise<T | null> {
    const results = await this.query(filters, { limit: 1 });
    return results[0] || null;
  }

  // Real-time Subscriptions
  subscribeToChanges(callback: (data: T[]) => void): () => void {
    const q = this.db.collection(this.collectionName) as unknown as Query<T>;
    return (q as any).onSnapshot((snapshot: any) => {
      const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as T));
      callback(data);
    });
  }

  subscribeToDocument(id: string, callback: (data: T | null) => void): () => void {
    const docRef = this.db.collection(this.collectionName).doc(id);
    return docRef.onSnapshot(snapshot => {
      if (!snapshot.exists) {
        callback(null);
        return;
      }
      callback({ ...snapshot.data(), id: snapshot.id } as T);
    });
  }

  // Batch Operations
  async createBatch(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const timestamp = new Date();
    const enrichedItems = items.map(item => 
      this.removeUndefinedValues({
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    ) as Partial<T>[];
    const batch = this.db.batch();
    const refs = enrichedItems.map(item => {
      const docRef = this.db.collection(this.collectionName).doc();
      batch.set(docRef as any, item as any);
      return docRef;
    });
    await batch.commit();
    return refs.map(ref => ref.id);
  }

  async updateBatch(items: { id: string; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }[]): Promise<void> {
    const timestamp = new Date();
    const batch = this.db.batch();
    items.forEach(({ id, data }) => {
      const docRef = this.db.collection(this.collectionName).doc(id);
      const cleanedData = this.removeUndefinedValues({ ...data, updatedAt: timestamp });
      batch.update(docRef, cleanedData as any);
    });
    await batch.commit();
  }

  async deleteBatch(ids: string[]): Promise<void> {
    const batch = this.db.batch();
    ids.forEach(id => {
      const docRef = this.db.collection(this.collectionName).doc(id);
      batch.delete(docRef);
    });
    await batch.commit();
  }

  /**
   * Remove undefined values from an object
   * Firestore doesn't allow undefined values in documents
   */
  protected removeUndefinedValues<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned;
  }
}