import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../components/ui/card/card.component';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent
  ],
  template: `
    <div class="min-h-screen bg-background">
      <header class="border-b">
        <div class="container mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-primary">Demo</h1>
            <nav class="flex items-center space-x-4">
              <a routerLink="/" class="text-sm font-medium hover:text-primary">Home</a>
            </nav>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-foreground mb-4">Try Our Demo</h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            Experience our restaurant ordering system with a live demo. See how easy it is to place orders and track them in real-time.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <app-card>
            <app-card-header>
              <app-card-title>Customer Menu</app-card-title>
              <app-card-description>
                Browse our menu and place orders
              </app-card-description>
            </app-card-header>
            <app-card-content>
              <app-button routerLink="/demo/customer-menu" class="w-full">
                Try Menu Demo
              </app-button>
            </app-card-content>
          </app-card>

          <app-card>
            <app-card-header>
              <app-card-title>Shopping Cart</app-card-title>
              <app-card-description>
                Manage your cart and checkout
              </app-card-description>
            </app-card-header>
            <app-card-content>
              <app-button routerLink="/demo/cart" class="w-full">
                Try Cart Demo
              </app-button>
            </app-card-content>
          </app-card>

          <app-card>
            <app-card-header>
              <app-card-title>Order Tracking</app-card-title>
              <app-card-description>
                Track your order in real-time
              </app-card-description>
            </app-card-header>
            <app-card-content>
              <app-button routerLink="/demo/order-tracking" class="w-full">
                Try Tracking Demo
              </app-button>
            </app-card-content>
          </app-card>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class DemoComponent {}
