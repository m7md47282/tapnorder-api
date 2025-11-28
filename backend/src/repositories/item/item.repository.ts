import { BaseRepository } from '../base.repository';
import { Item } from '../../entities/item.entity';
import { QueryFilter } from '../types';

export interface IItemRepository {
  getAll(): Promise<Item[]>;
  getByMenuId(menuId: string): Promise<Item[]>;
  getByCategoryId(menuId: string, categoryId: string): Promise<Item[]>;
  getByCategoryIdOnly(categoryId: string): Promise<Item[]>;
  getAvailableItems(menuId: string): Promise<Item[]>;
  searchItems(menuId: string, searchTerm: string): Promise<Item[]>;
  getById(id: string): Promise<Item | null>;
  create(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, item: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
  query(filters: QueryFilter[]): Promise<Item[]>;
}

/**
 * Maps entity field (categoryId) to database field (category)
 * Since there's no categories table, categories are stored as strings in the 'category' field
 */
export class ItemRepository extends BaseRepository<Item> implements IItemRepository {
  constructor() {
    super('items');
  }

  /**
   * Transform database document to entity (category -> categoryId)
   */
  private mapDbToEntity(dbData: any): Item {
    const { category, ...rest } = dbData;
    return {
      ...rest,
      categoryId: category || dbData.categoryId || '' // Support both field names for backward compatibility
    } as Item;
  }

  /**
   * Transform entity to database document (categoryId -> category)
   */
  private mapEntityToDb(entityData: any): any {
    const { categoryId, ...rest } = entityData;
    return {
      ...rest,
      ...(categoryId !== undefined && { category: categoryId }) // Map categoryId to category for database
    };
  }

  async getAll(): Promise<Item[]> {
    const items = await super.getAll();
    return items.map(item => this.mapDbToEntity(item));
  }

  async getByMenuId(menuId: string): Promise<Item[]> {
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId }
    ];
    return this.query(filters);
  }

  async getByCategoryId(menuId: string, categoryId: string): Promise<Item[]> {
    // Query using 'category' field in database (not 'categoryId')
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId },
      { field: 'category', operator: '==', value: categoryId }
    ];
    const items = await super.query(filters);
    return items.map(item => this.mapDbToEntity(item));
  }

  async getByCategoryIdOnly(categoryId: string): Promise<Item[]> {
    // Query using 'category' field in database (not 'categoryId')
    const filters: QueryFilter[] = [
      { field: 'category', operator: '==', value: categoryId }
    ];
    const items = await super.query(filters);
    return items.map(item => this.mapDbToEntity(item));
  }

  async getAvailableItems(menuId: string): Promise<Item[]> {
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId },
      { field: 'isAvailable', operator: '==', value: true }
    ];
    return this.query(filters);
  }

  async searchItems(menuId: string, searchTerm: string): Promise<Item[]> {
    // Note: This is a simplified search. For production, consider using
    // a proper search service like Algolia or Elasticsearch
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId }
    ];
    
    const items = await this.query(filters);
    const searchLower = searchTerm.toLowerCase();
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.ingredients?.some(ingredient => 
        ingredient.toLowerCase().includes(searchLower)
      )
    );
  }

  async getById(id: string): Promise<Item | null> {
    const item = await super.getById(id);
    if (!item) return null;
    return this.mapDbToEntity(item);
  }

  async create(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newItem: Omit<Item, 'id'> = {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // Transform categoryId to category for database
    const dbData = this.mapEntityToDb(newItem);
    return super.create(dbData as any);
  }

  async update(id: string, item: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    // Transform categoryId to category for database
    const dbData = this.mapEntityToDb({
      ...item,
      updatedAt: new Date()
    });
    return super.update(id, dbData);
  }

  async delete(id: string): Promise<void> {
    return super.delete(id);
  }

  async query(filters: QueryFilter[]): Promise<Item[]> {
    // Transform filters: if filtering by categoryId, change to category
    const transformedFilters = filters.map(filter => {
      if (filter.field === 'categoryId') {
        return { ...filter, field: 'category' };
      }
      return filter;
    });
    const items = await super.query(transformedFilters);
    return items.map(item => this.mapDbToEntity(item));
  }
}
