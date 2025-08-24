import { FirebaseRepository } from '../firebase.repository';
import { IDatabaseOperations } from '../../database/types';
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
  items: MenuItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MenuRepository extends FirebaseRepository<Menu> {
  constructor(client: IDatabaseOperations) {
    super(client, 'menus');
  }

  async getByPlaceId(placeId: string): Promise<Menu | null> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'isActive', operator: '==', value: true }
    ];
    
    return this.queryOne(filters);
  }
}   