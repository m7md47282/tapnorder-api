import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { FirestoreService } from '../services/firestore.service';
import { Menu, MenuItem, MenuFilters, MenuSearchResult } from '../models/menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuRepository {
  private readonly COLLECTION_NAME = 'menus';
  private readonly ITEMS_COLLECTION = 'menuItems';

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Get menu by place ID
   */
  async getByPlaceId(placeId: string): Promise<Menu | null> {
    try {
      const menusRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(menusRef, where('placeId', '==', placeId), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const menuDoc = querySnapshot.docs[0];
      const menuData = menuDoc.data() as Omit<Menu, 'id'>;
      
      // Get menu items
      const items = await this.getMenuItems(menuDoc.id);
      
      return {
        id: menuDoc.id,
        ...menuData,
        items,
        createdAt: menuData.createdAt?.toDate() || new Date(),
        updatedAt: menuData.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error fetching menu by place ID:', error);
      throw error;
    }
  }

  /**
   * Get all menus
   */
  async getAll(): Promise<Menu[]> {
    try {
      const menusRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(menusRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const menus: Menu[] = [];
      
      for (const doc of querySnapshot.docs) {
        const menuData = doc.data() as Omit<Menu, 'id'>;
        const items = await this.getMenuItems(doc.id);
        
        menus.push({
          id: doc.id,
          ...menuData,
          items,
          createdAt: menuData.createdAt?.toDate() || new Date(),
          updatedAt: menuData.updatedAt?.toDate() || new Date()
        });
      }
      
      return menus;
    } catch (error) {
      console.error('Error fetching all menus:', error);
      throw error;
    }
  }

  /**
   * Get menu by ID
   */
  async getById(id: string): Promise<Menu | null> {
    try {
      const menuRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      const menuSnap = await getDoc(menuRef);
      
      if (!menuSnap.exists()) {
        return null;
      }

      const menuData = menuSnap.data() as Omit<Menu, 'id'>;
      const items = await this.getMenuItems(id);
      
      return {
        id: menuSnap.id,
        ...menuData,
        items,
        createdAt: menuData.createdAt?.toDate() || new Date(),
        updatedAt: menuData.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error fetching menu by ID:', error);
      throw error;
    }
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const itemsRef = collection(this.firestoreService.getFirestore(), this.ITEMS_COLLECTION);
      const q = query(itemsRef, where('available', '==', true));
      const querySnapshot = await getDocs(q);
      
      const categories = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get items by category
   */
  async getItemsByCategory(category: string): Promise<MenuItem[]> {
    try {
      const itemsRef = collection(this.firestoreService.getFirestore(), this.ITEMS_COLLECTION);
      const q = query(
        itemsRef, 
        where('category', '==', category),
        where('available', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
      })) as MenuItem[];
    } catch (error) {
      console.error('Error fetching items by category:', error);
      throw error;
    }
  }

  /**
   * Search menu items with filters
   */
  async searchItems(filters: MenuFilters, limitCount: number = 50): Promise<MenuSearchResult> {
    try {
      const itemsRef = collection(this.firestoreService.getFirestore(), this.ITEMS_COLLECTION);
      const constraints: QueryConstraint[] = [where('available', '==', true)];
      
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters.minPrice !== undefined) {
        constraints.push(where('price', '>=', filters.minPrice));
      }
      
      if (filters.maxPrice !== undefined) {
        constraints.push(where('price', '<=', filters.maxPrice));
      }
      
      constraints.push(orderBy('name'));
      constraints.push(limit(limitCount));
      
      const q = query(itemsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      let items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
      })) as MenuItem[];
      
      // Apply text search filter if provided
      if (filters.searchQuery) {
        const searchQuery = filters.searchQuery.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchQuery) ||
          item.description?.toLowerCase().includes(searchQuery) ||
          item.category?.toLowerCase().includes(searchQuery) ||
          item.ingredients?.some(ingredient => ingredient.toLowerCase().includes(searchQuery))
        );
      }
      
      // Get all categories for the result
      const categories = await this.getCategories();
      
      return {
        items,
        totalCount: items.length,
        categories
      };
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw error;
    }
  }

  /**
   * Get featured menu items
   */
  async getFeaturedItems(limitCount: number = 6): Promise<MenuItem[]> {
    try {
      const itemsRef = collection(this.firestoreService.getFirestore(), this.ITEMS_COLLECTION);
      const q = query(
        itemsRef,
        where('available', '==', true),
        where('imageUrl', '!=', null),
        orderBy('imageUrl'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
      })) as MenuItem[];
    } catch (error) {
      console.error('Error fetching featured items:', error);
      throw error;
    }
  }

  /**
   * Create a new menu
   */
  async create(menu: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const menusRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const menuData = {
        ...menu,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(menusRef, menuData);
      
      // Create menu items
      if (menu.items && menu.items.length > 0) {
        await this.createMenuItems(docRef.id, menu.items);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  }

  /**
   * Update a menu
   */
  async update(id: string, updates: Partial<Menu>): Promise<void> {
    try {
      const menuRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(menuRef, updateData);
      
      // Update menu items if provided
      if (updates.items) {
        await this.updateMenuItems(id, updates.items);
      }
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  }

  /**
   * Delete a menu
   */
  async delete(id: string): Promise<void> {
    try {
      const menuRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      await updateDoc(menuRef, { isActive: false, updatedAt: new Date() });
      
      // Also deactivate menu items
      await this.deactivateMenuItems(id);
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  }

  /**
   * Get menu items for a specific menu
   */
  private async getMenuItems(menuId: string): Promise<MenuItem[]> {
    try {
      const itemsRef = collection(this.firestoreService.getFirestore(), this.ITEMS_COLLECTION);
      const q = query(
        itemsRef,
        where('menuId', '==', menuId),
        where('available', '==', true),
        orderBy('category'),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date()
      })) as MenuItem[];
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  /**
   * Create menu items
   */
  private async createMenuItems(menuId: string, items: MenuItem[]): Promise<void> {
    try {
      const itemsRef = collection(this.firestoreService.getFirestore(), this.ITEMS_COLLECTION);
      
      for (const item of items) {
        const itemData = {
          ...item,
          menuId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await addDoc(itemsRef, itemData);
      }
    } catch (error) {
      console.error('Error creating menu items:', error);
      throw error;
    }
  }

  /**
   * Update menu items
   */
  private async updateMenuItems(menuId: string, items: MenuItem[]): Promise<void> {
    try {
      // First, deactivate all existing items
      await this.deactivateMenuItems(menuId);
      
      // Then create new items
      await this.createMenuItems(menuId, items);
    } catch (error) {
      console.error('Error updating menu items:', error);
      throw error;
    }
  }

  /**
   * Deactivate menu items
   */
  private async deactivateMenuItems(menuId: string): Promise<void> {
    try {
      const itemsRef = collection(this.firestoreService.getFirestore(), this.ITEMS_COLLECTION);
      const q = query(itemsRef, where('menuId', '==', menuId));
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, { 
          available: false, 
          updatedAt: new Date() 
        });
      }
    } catch (error) {
      console.error('Error deactivating menu items:', error);
      throw error;
    }
  }
}
