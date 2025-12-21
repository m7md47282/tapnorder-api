import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent, CardContentComponent } from '../../components/ui/card/card.component';
import { BadgeComponent } from '../../components/ui/badge/badge.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-index',
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
  template: `
    <div class="min-h-screen bg-background">
      <!-- Header -->
      <header class="border-b">
        <div class="container mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-bold text-primary">Tab N Order</h1>
              <app-badge variant="success">Angular</app-badge>
            </div>
            <nav class="flex items-center space-x-4">
              <a routerLink="/menu" class="text-sm font-medium hover:text-primary">Menu</a>
              <a routerLink="/demo" class="text-sm font-medium hover:text-primary">Demo</a>
              <a routerLink="/login" class="text-sm font-medium hover:text-primary">Login</a>
            </nav>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="py-20">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-4xl font-bold text-foreground mb-4">
            Welcome to Tab N Order
          </h2>
          <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Modern restaurant ordering system built with Angular. Experience seamless ordering, real-time updates, and beautiful design.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <app-button variant="hero" size="lg" (onClick)="showToast()">
              Get Started
            </app-button>
            <app-button variant="outline" size="lg" routerLink="/demo">
              Try Demo
            </app-button>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20 bg-muted/50">
        <div class="container mx-auto px-4">
          <h3 class="text-3xl font-bold text-center mb-12">Features</h3>
          <div class="grid md:grid-cols-3 gap-8">
            <app-card>
              <app-card-header>
                <app-card-title>Real-time Orders</app-card-title>
                <app-card-description>
                  Get instant updates on order status and kitchen progress
                </app-card-description>
              </app-card-header>
              <app-card-content>
                <p class="text-sm text-muted-foreground">
                  Built with Firebase for real-time synchronization across all devices.
                </p>
              </app-card-content>
            </app-card>

            <app-card>
              <app-card-header>
                <app-card-title>Modern UI</app-card-title>
                <app-card-description>
                  Beautiful, responsive design with Tailwind CSS
                </app-card-description>
              </app-card-header>
              <app-card-content>
                <p class="text-sm text-muted-foreground">
                  Clean, modern interface that works perfectly on all devices.
                </p>
              </app-card-content>
            </app-card>

            <app-card>
              <app-card-header>
                <app-card-title>Role-based Access</app-card-title>
                <app-card-description>
                  Secure access control for different user roles
                </app-card-description>
              </app-card-header>
              <app-card-content>
                <p class="text-sm text-muted-foreground">
                  Admin, cashier, kitchen, and customer dashboards with appropriate permissions.
                </p>
              </app-card-content>
            </app-card>
          </div>
        </div>
      </section>

      <!-- Status Section -->
      <section class="py-20">
        <div class="container mx-auto px-4 text-center">
          <h3 class="text-3xl font-bold mb-8">Migration Status</h3>
          <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <app-card>
              <app-card-header>
                <app-card-title>✅ Completed</app-card-title>
              </app-card-header>
              <app-card-content>
                <ul class="text-sm text-muted-foreground space-y-2">
                  <li>• Firebase Integration</li>
                  <li>• Authentication & Guards</li>
                  <li>• State Management Services</li>
                  <li>• UI Components (Button, Card, Input, etc.)</li>
                  <li>• Routing & Navigation</li>
                  <li>• Tailwind CSS Setup</li>
                </ul>
              </app-card-content>
            </app-card>

            <app-card>
              <app-card-header>
                <app-card-title>🚧 In Progress</app-card-title>
              </app-card-header>
              <app-card-content>
                <ul class="text-sm text-muted-foreground space-y-2">
                  <li>• Page Components Migration</li>
                  <li>• Layout Components</li>
                  <li>• Business Logic Services</li>
                  <li>• Form Handling</li>
                  <li>• Real-time Features</li>
                </ul>
              </app-card-content>
            </app-card>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t py-8">
        <div class="container mx-auto px-4 text-center">
          <p class="text-sm text-muted-foreground">
            Tab N Order - Built with Angular & Firebase
          </p>
        </div>
      </footer>
    </div>
  `,
  styles: []
})
export class IndexComponent {
  constructor(private toastService: ToastService) {}

  showToast(): void {
    this.toastService.success(
      'Welcome!',
      'Tab N Order Angular migration is in progress. This is a toast notification!'
    );
  }
}
