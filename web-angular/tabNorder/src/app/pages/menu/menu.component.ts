import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../components/ui/card/card.component';
import { BadgeComponent } from '../../components/ui/badge/badge.component';
import { MenuService } from '../../services/menu.service';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './menu.component.html',
  styles: []
})
export class MenuComponent implements OnInit {
  menuItems: MenuItem[] = [];
  filteredMenuItems: MenuItem[] = [];
  categories: string[] = ['All', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'];
  selectedCategory: string = 'All';

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.loadMenuItems();
  }

  loadMenuItems(): void {
    // Mock data for now - will be replaced with actual service call
    this.menuItems = [
      {
        id: '1',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan cheese and croutons',
        price: 12.99,
        category: 'Appetizers',
        available: true
      },
      {
        id: '2',
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with lemon butter sauce',
        price: 24.99,
        category: 'Main Course',
        available: true
      },
      {
        id: '3',
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with vanilla ice cream',
        price: 8.99,
        category: 'Desserts',
        available: true
      },
      {
        id: '4',
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 4.99,
        category: 'Beverages',
        available: false
      }
    ];
    this.filteredMenuItems = this.menuItems;
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    if (category === 'All') {
      this.filteredMenuItems = this.menuItems;
    } else {
      this.filteredMenuItems = this.menuItems.filter(item => item.category === category);
    }
  }

  addToCart(item: MenuItem): void {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', item);
  }
}
