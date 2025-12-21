import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../../components/ui/card/card.component';

import { CartService } from '../../services/cart.service';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,

  ],
  templateUrl: './cart.component.html',
  styles: []
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  tax: number = 0;
  total: number = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.loadCartItems();
  }

  loadCartItems(): void {
    // Mock data for now - will be replaced with actual service call
    this.cartItems = [
      {
        id: '1',
        name: 'Caesar Salad',
        price: 12.99,
        quantity: 2,
        total: 25.98
      },
      {
        id: '2',
        name: 'Grilled Salmon',
        price: 24.99,
        quantity: 1,
        total: 24.99
      }
    ];
    this.calculateTotals();
  }

  updateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const item = this.cartItems.find(i => i.id === itemId);
    if (item) {
      item.quantity = newQuantity;
      item.total = item.price * item.quantity;
      this.calculateTotals();
    }
  }

  removeItem(itemId: string): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.total, 0);
    this.tax = this.subtotal * 0.085; // 8.5% tax
    this.total = this.subtotal + this.tax;
  }

  proceedToCheckout(): void {
    // TODO: Implement checkout functionality
    console.log('Proceeding to checkout with total:', this.total);
  }
}