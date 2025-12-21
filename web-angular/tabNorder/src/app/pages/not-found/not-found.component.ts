import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../components/ui/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background">
      <div class="text-center">
        <h1 class="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p class="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <app-button routerLink="/">
            Go Home
          </app-button>
          <app-button variant="outline" (click)="goBack()">
            Go Back
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
