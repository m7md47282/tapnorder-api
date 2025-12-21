export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  available: boolean;
  ingredients?: string[];
  allergens?: string[];
  preparationTime?: number;
  placeId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Menu {
  id: string;
  placeId: string;
  name?: string;
  description?: string;
  items: MenuItem[];
  categories?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  searchQuery?: string;
}

export interface MenuSearchResult {
  items: MenuItem[];
  totalCount: number;
  categories: string[];
}
