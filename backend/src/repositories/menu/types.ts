import { BaseModel } from '../types';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  available: boolean;
}

export interface Menu extends BaseModel {
  placeId: string;
  items: MenuItem[];
  categories?: string[];
  isActive: boolean;
}

