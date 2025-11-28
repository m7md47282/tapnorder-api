import { BaseModel } from '../types';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
}

export interface Menu extends BaseModel {
  placeId: string;
  name?: string;
  description?: string;
  categories?: string[];
  isActive: boolean;
}

