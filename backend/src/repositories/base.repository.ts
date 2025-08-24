import { QueryFilter } from './types';

export interface IBaseRepository<T> {
  // Basic CRUD operations
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Advanced querying
  query(filters: QueryFilter[]): Promise<T[]>;
  queryOne(filters: QueryFilter[]): Promise<T | null>;
  
  // Real-time subscriptions
  subscribeToChanges(callback: (data: T[]) => void): () => void;
  subscribeToDocument(id: string, callback: (data: T | null) => void): () => void;
  
  // Batch operations
  createBatch(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]>;
  updateBatch(items: { id: string; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }[]): Promise<void>;
  deleteBatch(ids: string[]): Promise<void>;
}