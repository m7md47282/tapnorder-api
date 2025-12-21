import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private readonly DEFAULT_DURATION = 5000; // 5 seconds

  constructor() {}

  show(toast: Omit<Toast, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const newToast: Toast = {
      ...toast,
      id,
      timestamp: new Date(),
      duration: toast.duration || this.DEFAULT_DURATION
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }

    return id;
  }

  success(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'info', title, message, duration });
  }

  remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const updatedToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(updatedToasts);
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  getToasts(): Toast[] {
    return this.toastsSubject.value;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Convenience methods for common scenarios
  showOrderUpdate(orderId: string, status: string): string {
    return this.success(
      'Order Updated',
      `Order #${orderId} is now ${status}`,
      3000
    );
  }

  showMenuUpdate(itemName: string): string {
    return this.info(
      'Menu Updated',
      `${itemName} has been updated`,
      3000
    );
  }

  showCartUpdate(action: 'added' | 'removed' | 'updated', itemName: string): string {
    const messages = {
      added: `${itemName} added to cart`,
      removed: `${itemName} removed from cart`,
      updated: `${itemName} quantity updated`
    };

    return this.success('Cart Updated', messages[action], 2000);
  }

  showError(error: any): string {
    const message = error?.message || error?.toString() || 'An unexpected error occurred';
    return this.error('Error', message, 5000);
  }

  showNetworkError(): string {
    return this.error(
      'Connection Error',
      'Please check your internet connection and try again',
      5000
    );
  }

  showAuthError(): string {
    return this.error(
      'Authentication Error',
      'Please log in again to continue',
      5000
    );
  }

  showPermissionError(): string {
    return this.error(
      'Permission Denied',
      'You don\'t have permission to perform this action',
      5000
    );
  }
}
