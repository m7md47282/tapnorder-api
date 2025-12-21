import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../../components/ui/card/card.component';

@Component({
  selector: 'app-demo-cart',
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
            <h1 class="text-2xl font-bold text-primary">Demo - Shopping Cart</h1>
            <nav class="flex items-center space-x-4">
              <a routerLink="/demo" class="text-sm font-medium hover:text-primary">Demo Home</a>
            </nav>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8">
        <app-card>
          <app-card-header>
            <app-card-title>Shopping Cart Demo</app-card-title>
            <app-card-description>
              This is a demo of the shopping cart interface
            </app-card-description>
          </app-card-header>
          <app-card-content>
            <div class="text-center py-8">
              <p class="text-muted-foreground mb-4">Shopping cart demo functionality will be implemented here</p>
              <app-button routerLink="/demo">
                Back to Demo
              </app-button>
            </div>
          </app-card-content>
        </app-card>
      </main>
    </div>
  `,
  styles: []
})
export class DemoCartComponent {}
