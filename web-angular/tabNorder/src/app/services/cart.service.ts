import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MenuItem } from '../models/menu.model';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  comments?: string;
  customizations?: {
    [key: string]: {
      name: string;
      price: number;
    }[];
  };
  imageUrl?: string;
  category?: string;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private readonly CART_STORAGE_KEY = 'tabNorder_cart';
  private readonly TAX_RATE = 0.085; // 8.5%

  // Public observables
  public cart$ = this.cartSubject.asObservable();
  public cartSummary$ = this.cart$.pipe(
    map(items => this.calculateCartSummary(items))
  );
  public itemCount$ = this.cart$.pipe(
    map(items => items.reduce((count, item) => count + item.quantity, 0))
  );
  public subtotal$ = this.cart$.pipe(
    map(items => items.reduce((sum, item) => sum + item.totalPrice, 0))
  );
  public tax$ = this.cart$.pipe(
    map(items => this.calculateTax(items))
  );
  public total$ = this.cart$.pipe(
    map(items => this.calculateTotal(items))
  );

  constructor() {
    this.loadCartFromStorage();
  }

  /**
   * Add item to cart
   */
  addItem(menuItem: MenuItem, quantity: number = 1, comments?: string, customizations?: any): void {
    const existingItem = this.findCartItem(menuItem.id, customizations);
    
    if (existingItem) {
      this.updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const cartItem: CartItem = {
        id: this.generateCartItemId(menuItem.id, customizations),
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        totalPrice: menuItem.price * quantity,
        comments,
        customizations,
        imageUrl: menuItem.imageUrl,
        category: menuItem.category
      };
      
      const currentCart = this.cartSubject.value;
      this.cartSubject.next([...currentCart, cartItem]);
      this.saveCartToStorage();
    }
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId: string): void {
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.filter(item => item.id !== itemId);
    this.cartSubject.next(updatedCart);
    this.saveCartToStorage();
  }

  /**
   * Update item quantity
   */
  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: item.price * quantity }
        : item
    );
    this.cartSubject.next(updatedCart);
    this.saveCartToStorage();
  }

  /**
   * Update item comments
   */
  updateItemComments(itemId: string, comments: string): void {
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.map(item => 
      item.id === itemId 
        ? { ...item, comments }
        : item
    );
    this.cartSubject.next(updatedCart);
    this.saveCartToStorage();
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    this.cartSubject.next([]);
    this.saveCartToStorage();
  }

  /**
   * Get current cart items
   */
  getCartItems(): CartItem[] {
    return this.cartSubject.value;
  }

  /**
   * Get cart summary
   */
  getCartSummary(): CartSummary {
    const items = this.cartSubject.value;
    return this.calculateCartSummary(items);
  }

  /**
   * Check if cart is empty
   */
  isCartEmpty(): boolean {
    return this.cartSubject.value.length === 0;
  }

  /**
   * Get item count
   */
  getItemCount(): number {
    return this.cartSubject.value.reduce((count, item) => count + item.quantity, 0);
  }

  /**
   * Get subtotal
   */
  getSubtotal(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  /**
   * Get tax amount
   */
  getTax(): number {
    return this.calculateTax(this.cartSubject.value);
  }

  /**
   * Get total amount
   */
  getTotal(): number {
    return this.calculateTotal(this.cartSubject.value);
  }

  /**
   * Check if item exists in cart
   */
  hasItem(menuItemId: string, customizations?: any): boolean {
    return this.findCartItem(menuItemId, customizations) !== null;
  }

  /**
   * Get item quantity in cart
   */
  getItemQuantity(menuItemId: string, customizations?: any): number {
    const item = this.findCartItem(menuItemId, customizations);
    return item ? item.quantity : 0;
  }

  /**
   * Find cart item by menu item ID and customizations
   */
  private findCartItem(menuItemId: string, customizations?: any): CartItem | null {
    const currentCart = this.cartSubject.value;
    return currentCart.find(item => 
      item.menuItemId === menuItemId && 
      this.areCustomizationsEqual(item.customizations, customizations)
    ) || null;
  }

  /**
   * Generate unique cart item ID
   */
  private generateCartItemId(menuItemId: string, customizations?: any): string {
    const customizationsKey = customizations ? JSON.stringify(customizations) : '';
    return `${menuItemId}_${customizationsKey}_${Date.now()}`;
  }

  /**
   * Check if customizations are equal
   */
  private areCustomizationsEqual(customizations1?: any, customizations2?: any): boolean {
    if (!customizations1 && !customizations2) return true;
    if (!customizations1 || !customizations2) return false;
    return JSON.stringify(customizations1) === JSON.stringify(customizations2);
  }

  /**
   * Calculate cart summary
   */
  private calculateCartSummary(items: CartItem[]): CartSummary {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = this.calculateTax(items);
    const total = subtotal + tax;
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
      items,
      subtotal,
      tax,
      total,
      itemCount
    };
  }

  /**
   * Calculate tax
   */
  private calculateTax(items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return subtotal * this.TAX_RATE;
  }

  /**
   * Calculate total
   */
  private calculateTotal(items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return subtotal + this.calculateTax(items);
  }

  /**
   * Save cart to localStorage
   */
  private saveCartToStorage(): void {
    try {
      const cartData = this.cartSubject.value;
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  /**
   * Load cart from localStorage
   */
  private loadCartFromStorage(): void {
    try {
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      if (cartData) {
        const items = JSON.parse(cartData) as CartItem[];
        this.cartSubject.next(items);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.clearCart();
    }
  }

  /**
   * Convert cart items to order items
   */
  toOrderItems(): any[] {
    return this.cartSubject.value.map(item => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      comments: item.comments,
      customizations: item.customizations
    }));
  }

  /**
   * Validate cart before checkout
   */
  validateCart(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const items = this.cartSubject.value;

    if (items.length === 0) {
      errors.push('Cart is empty');
    }

    items.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.name}`);
      }
      if (item.price <= 0) {
        errors.push(`Invalid price for ${item.name}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get cart statistics
   */
  getCartStats(): {
    itemCount: number;
    uniqueItems: number;
    subtotal: number;
    tax: number;
    total: number;
    averageItemPrice: number;
  } {
    const items = this.cartSubject.value;
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const uniqueItems = items.length;
    const subtotal = this.getSubtotal();
    const tax = this.getTax();
    const total = this.getTotal();
    const averageItemPrice = uniqueItems > 0 ? subtotal / uniqueItems : 0;

    return {
      itemCount,
      uniqueItems,
      subtotal,
      tax,
      total,
      averageItemPrice
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Get cart item by ID
   */
  getCartItem(itemId: string): CartItem | null {
    return this.cartSubject.value.find(item => item.id === itemId) || null;
  }

  /**
   * Duplicate cart item
   */
  duplicateItem(itemId: string): void {
    const item = this.getCartItem(itemId);
    if (item) {
      this.addItem(
        {
          id: item.menuItemId,
          name: item.name,
          price: item.price,
          available: true,
          category: item.category,
          imageUrl: item.imageUrl
        } as MenuItem,
        item.quantity,
        item.comments,
        item.customizations
      );
    }
  }
}