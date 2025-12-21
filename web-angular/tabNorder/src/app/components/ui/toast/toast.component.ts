import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../services/toast.service';
import { cn } from '../../../utils/cn.util';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="toast"
      [class]="cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        getToastClasses(toast.type)
      )"
    >
      <div class="grid gap-1">
        <div class="text-sm font-semibold">{{ toast.title }}</div>
        <div *ngIf="toast.message" class="text-sm opacity-90">{{ toast.message }}</div>
        <div *ngIf="toast.action" class="mt-2">
          <button
            (click)="toast.action!.callback()"
            class="text-sm underline underline-offset-4 hover:no-underline"
          >
            {{ toast.action.label }}
          </button>
        </div>
      </div>
      <button
        (click)="onClose.emit(toast.id)"
        class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  `,
  styles: []
})
export class ToastComponent {
  @Input() toast: Toast | null = null;
  @Output() onClose = new EventEmitter<string>();

  cn = cn;

  getToastClasses(type: Toast['type']): string {
    const baseClasses = 'border-l-4';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-400 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-800`;
      default:
        return `${baseClasses} bg-background border-border text-foreground`;
    }
  }
}

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <app-toast
        *ngFor="let toast of toasts"
        [toast]="toast"
        (onClose)="removeToast($event)"
      />
    </div>
  `,
  styles: []
})
export class ToasterComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}
