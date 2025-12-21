import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../../components/ui/card/card.component';

@Component({
  selector: 'app-cashier-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent
  ],
  template: `
    <div class="min-h-screen bg-background">
      <header class="border-b">
        <div class="container mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-primary">Cashier Dashboard</h1>
            <nav class="flex items-center space-x-4">
              <a routerLink="/" class="text-sm font-medium hover:text-primary">Home</a>
              <app-button variant="outline" size="sm">Logout</app-button>
            </nav>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8">
        <app-card>
          <app-card-header>
            <app-card-title>Cashier Operations</app-card-title>
          </app-card-header>
          <app-card-content>
            <div class="text-center py-8">
              <p class="text-muted-foreground">Cashier dashboard functionality will be implemented here</p>
            </div>
          </app-card-content>
        </app-card>
      </main>
    </div>
  `,
  styles: []
})
export class CashierDashboardComponent {}
