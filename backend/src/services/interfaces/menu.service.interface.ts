import { Menu } from '../../repositories/menu/types';

/**
 * Menu Service Interface
 * Follows Interface Segregation Principle
 * Defines contract for menu business operations
 */
export interface IMenuService {
  getMenuByPlaceId(placeId: string): Promise<Menu | null>;
  getMenuById(id: string): Promise<Menu | null>;
  getMenuWithItems(placeId: string): Promise<{ menu: Menu; items: any[] } | null>;
  updateMenu(placeId: string, menuData: Partial<Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'placeId'>>): Promise<void>;
  createMenu(placeId: string, menuData: Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'placeId'>): Promise<string>;
}
