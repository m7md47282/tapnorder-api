import { IDatabaseOperations } from '../database/types';
import { IBaseRepository } from './base.repository';
import { QueryFilter, BaseModel, QueryOptions } from './types';
import { DatabaseFilter } from '../database/types';

export class FirebaseRepository<T extends BaseModel> implements IBaseRepository<T> {
  constructor(
    protected readonly client: IDatabaseOperations,
    protected readonly collectionName: string
  ) {}

  // Basic CRUD Operations
  async getAll(): Promise<T[]> {
    const result = await this.client.find<T>(this.collectionName);
    return result.data;
  }

  async getById(id: string): Promise<T | null> {
    return this.client.findById<T>(this.collectionName, id);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const timestamp = new Date();
    const enrichedData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    return this.client.create<T>(this.collectionName, enrichedData as Partial<T>);
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const enrichedData = {
      ...data,
      updatedAt: new Date()
    };
    return this.client.update<T>(this.collectionName, id, enrichedData as Partial<T>);
  }

  async delete(id: string): Promise<void> {
    return this.client.delete(this.collectionName, id);
  }

  // Advanced Querying
  async query(
    filters: QueryFilter[] = [], 
    options: QueryOptions = {}
  ): Promise<T[]> {
    const databaseFilters: DatabaseFilter[] = filters.map(filter => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value
    }));

    const result = await this.client.find<T>(
      this.collectionName,
      databaseFilters,
      {
        limit: options.limit,
        offset: options.offset,
        orderBy: options.orderBy
      }
    );

    return result.data;
  }

  async queryOne(filters: QueryFilter[]): Promise<T | null> {
    return this.client.findOne<T>(
      this.collectionName,
      filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value
      }))
    );
  }

  // Real-time Subscriptions
  subscribeToChanges(callback: (data: T[]) => void): () => void {
    return this.client.subscribe<T>(this.collectionName, callback);
  }

  subscribeToDocument(id: string, callback: (data: T | null) => void): () => void {
    return this.client.subscribeToDocument<T>(this.collectionName, id, callback);
  }

  // Batch Operations
  async createBatch(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    const timestamp = new Date();
    const enrichedItems = items.map(item => ({
      ...item,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    return this.client.createBatch<T>(this.collectionName, enrichedItems as Partial<T>[]);
  }

  async updateBatch(items: { id: string; data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> }[]): Promise<void> {
    const timestamp = new Date();
    const enrichedItems = items.map(({ id, data }) => ({
      id,
      data: {
        ...data,
        updatedAt: timestamp
      }
    }));
    return this.client.updateBatch<T>(this.collectionName, enrichedItems as { id: string; data: Partial<T> }[]);
  }

  async deleteBatch(ids: string[]): Promise<void> {
    return this.client.deleteBatch(this.collectionName, ids);
  }
}