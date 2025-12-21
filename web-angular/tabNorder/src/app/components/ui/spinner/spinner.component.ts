import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../utils/cn.util';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('animate-spin rounded-full border-2 border-solid', getSpinnerClasses())">
      <div class="sr-only">Loading...</div>
    </div>
  `,
  styles: []
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'primary' | 'secondary' | 'white' = 'primary';
  @Input() className: string = '';

  cn = cn;

  getSpinnerClasses(): string {
    const sizeClasses = {
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-4'
    };

    const variantClasses = {
      primary: 'border-primary border-t-transparent',
      secondary: 'border-secondary border-t-transparent',
      white: 'border-white border-t-transparent'
    };

    return `${sizeClasses[this.size]} ${variantClasses[this.variant]} ${this.className}`;
  }
}

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <div [class]="cn('flex items-center justify-center p-8', className)">
      <div class="flex flex-col items-center space-y-4">
        <app-spinner [size]="size" [variant]="variant" />
        <p *ngIf="message" [class]="cn('text-sm text-muted-foreground', messageClassName)">
          {{ message }}
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class LoadingComponent {
  @Input() message: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'primary' | 'secondary' | 'white' = 'primary';
  @Input() className: string = '';
  @Input() messageClassName: string = '';

  cn = cn;
}
