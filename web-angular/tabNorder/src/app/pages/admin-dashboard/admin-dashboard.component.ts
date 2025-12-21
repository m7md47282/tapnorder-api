import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../../components/ui/card/card.component';

@Component({
  selector: 'app-admin-dashboard',
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
            <h1 class="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <nav class="flex items-center space-x-4">
              <a routerLink="/" class="text-sm font-medium hover:text-primary">Home</a>
              <app-button variant="outline" size="sm">Logout</app-button>
            </nav>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <app-card>
            <app-card-header>
              <app-card-title>Orders</app-card-title>
            </app-card-header>
            <app-card-content>
              <div class="text-center py-8">
                <p class="text-muted-foreground">Order management will be implemented here</p>
              </div>
            </app-card-content>
          </app-card>

          <app-card>
            <app-card-header>
              <app-card-title>Menu Management</app-card-title>
            </app-card-header>
            <app-card-content>
              <div class="text-center py-8">
                <p class="text-muted-foreground">Menu management will be implemented here</p>
              </div>
            </app-card-content>
          </app-card>

          <app-card>
            <app-card-header>
              <app-card-title>Analytics</app-card-title>
            </app-card-header>
            <app-card-content>
              <div class="text-center py-8">
                <p class="text-muted-foreground">Analytics will be implemented here</p>
              </div>
            </app-card-content>
          </app-card>
        </div>
      </main>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent {}
