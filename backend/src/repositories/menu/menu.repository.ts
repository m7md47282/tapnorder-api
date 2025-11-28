import { BaseRepository } from '../base.repository';
import { IMenuRepository } from '../interfaces/menu.repository.interface';
import { QueryFilter } from '../types';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
}

export interface Menu {
  id: string;
  placeId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Menu Repository - Extends BaseRepository, Implements IMenuRepository
 * Follows SOLID principles and Clean Architecture
 * NO business logic - only data access operations
 */
export class MenuRepository extends BaseRepository<Menu> implements IMenuRepository {
  constructor() {
    super('menus');
  }

  async getByPlaceId(placeId: string): Promise<Menu | null> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'isActive', operator: '==', value: true }
    ];
    
    return this.queryOne(filters);
  }
}   