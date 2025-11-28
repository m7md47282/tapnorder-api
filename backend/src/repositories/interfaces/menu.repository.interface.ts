import { Menu } from '../menu/types';

/**
 * Menu Repository Interface
 * Follows Interface Segregation Principle
 * Defines contract for menu data access operations
 */
export interface IMenuRepository {
  getByPlaceId(placeId: string): Promise<Menu | null>;
  getAll(): Promise<Menu[]>;
  getById(id: string): Promise<Menu | null>;
  create(data: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, data: Partial<Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
}
