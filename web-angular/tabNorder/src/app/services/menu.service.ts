import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FirestoreService } from './firestore.service';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  popular: boolean;
  allergens?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  customizations?: {
    [key: string]: {
      type: 'single' | 'multiple';
      required: boolean;
      options: {
        name: string;
        price: number;
      }[];
    };
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  order: number;
  available: boolean;
  items: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuSubject = new BehaviorSubject<MenuItem[]>([]);
  private categoriesSubject = new BehaviorSubject<MenuCategory[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public menu$ = this.menuSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  public availableMenu$ = this.menu$.pipe(
    map(items => items.filter(item => item.available))
  );

  public popularItems$ = this.menu$.pipe(
    map(items => items.filter(item => item.popular && item.available))
  );

  public menuByCategory$ = combineLatest([
    this.menu$,
    this.categories$
  ]).pipe(
    map(([items, categories]) => {
      return categories.map(category => ({
        ...category,
        items: items.filter(item => 
          item.category === category.id && item.available
        )
      }));
    })
  );

  constructor(private firestoreService: FirestoreService) {
    this.loadMenu();
  }

  async loadMenu(): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      // Load categories first
      const categories = await this.firestoreService.getCollection('categories');
      const sortedCategories = categories
        .sort((a: any, b: any) => a.order - b.order)
        .map((cat: any) => ({
          ...cat,
          items: []
        }));

      this.categoriesSubject.next(sortedCategories);

      // Load menu items
      const items = await this.firestoreService.getCollection('menu-items');
      const menuItems = items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }));

      this.menuSubject.next(menuItems);
    } catch (error) {
      console.error('Error loading menu:', error);
      this.errorSubject.next('Failed to load menu');
    } finally {
      this.loadingSubject.next(false);
    }
  }

  getMenuItem(id: string): Observable<MenuItem | undefined> {
    return this.menu$.pipe(
      map(items => items.find(item => item.id === id))
    );
  }

  getMenuItemsByCategory(categoryId: string): Observable<MenuItem[]> {
    return this.menu$.pipe(
      map(items => items.filter(item => 
        item.category === categoryId && item.available
      ))
    );
  }

  searchMenuItems(query: string): Observable<MenuItem[]> {
    return this.menu$.pipe(
      map(items => items.filter(item => 
        item.available && (
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
      ))
    );
  }

  getMenuItemsByTag(tag: string): Observable<MenuItem[]> {
    return this.menu$.pipe(
      map(items => items.filter(item => 
        item.available && item.tags?.includes(tag)
      ))
    );
  }

  getAvailableCategories(): Observable<MenuCategory[]> {
    return this.categories$.pipe(
      map(categories => categories.filter(cat => cat.available))
    );
  }

  async addMenuItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = await this.firestoreService.addDocument('menu-items', item);
      await this.loadMenu(); // Reload menu
      return id;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    try {
      await this.firestoreService.updateDocument('menu-items', id, updates);
      await this.loadMenu(); // Reload menu
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    try {
      await this.firestoreService.deleteDocument('menu-items', id);
      await this.loadMenu(); // Reload menu
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  async toggleItemAvailability(id: string): Promise<void> {
    const item = this.menuSubject.value.find(i => i.id === id);
    if (item) {
      await this.updateMenuItem(id, { available: !item.available });
    }
  }

  async toggleItemPopularity(id: string): Promise<void> {
    const item = this.menuSubject.value.find(i => i.id === id);
    if (item) {
      await this.updateMenuItem(id, { popular: !item.popular });
    }
  }

  // Category management
  async addCategory(category: Omit<MenuCategory, 'id' | 'items'>): Promise<string> {
    try {
      const id = await this.firestoreService.addDocument('categories', category);
      await this.loadMenu(); // Reload menu
      return id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<void> {
    try {
      await this.firestoreService.updateDocument('categories', id, updates);
      await this.loadMenu(); // Reload menu
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      // First, move all items in this category to 'uncategorized' or delete them
      const itemsInCategory = this.menuSubject.value.filter(item => item.category === id);
      for (const item of itemsInCategory) {
        await this.updateMenuItem(item.id, { category: 'uncategorized' });
      }

      await this.firestoreService.deleteDocument('categories', id);
      await this.loadMenu(); // Reload menu
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Utility methods
  getMenuStats(): Observable<{
    totalItems: number;
    availableItems: number;
    popularItems: number;
    categories: number;
  }> {
    return combineLatest([this.menu$, this.categories$]).pipe(
      map(([items, categories]) => ({
        totalItems: items.length,
        availableItems: items.filter(item => item.available).length,
        popularItems: items.filter(item => item.popular && item.available).length,
        categories: categories.filter(cat => cat.available).length
      }))
    );
  }

  // Demo mode helpers
  isDemoMode(): boolean {
    return window.location.pathname.includes('/demo');
  }

  // Get demo menu items for demo mode
  getDemoMenuItems(): MenuItem[] {
    return [
      {
        id: 'demo-1',
        name: 'Classic Burger',
        description: 'Juicy beef patty with lettuce, tomato, and our special sauce',
        price: 12.99,
        category: 'mains',
        available: true,
        popular: true,
        tags: ['beef', 'burger'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'demo-2',
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, tomato sauce, and basil on thin crust',
        price: 15.99,
        category: 'mains',
        available: true,
        popular: true,
        tags: ['pizza', 'vegetarian'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'demo-3',
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with parmesan cheese and croutons',
        price: 9.99,
        category: 'salads',
        available: true,
        popular: false,
        tags: ['salad', 'healthy'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}
