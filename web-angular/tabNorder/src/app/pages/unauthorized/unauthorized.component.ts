import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background">
      <div class="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 class="mt-6 text-3xl font-bold text-foreground">
            Access Denied
          </h2>
          <p class="mt-2 text-sm text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
        <div class="mt-8 space-y-4">
          <button
            (click)="goBack()"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Go Back
          </button>
          <button
            (click)="goHome()"
            class="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
