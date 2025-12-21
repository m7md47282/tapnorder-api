import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../../components/ui/card/card.component';
import { BadgeComponent } from '../../components/ui/badge/badge.component';
import { RealtimeService } from '../../services/realtime.service';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    BadgeComponent
  ],
  templateUrl: './order-tracking.component.html',
  styles: []
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  order: Order | null = null;
  isLoading = true;
  isRealTime = false;
  orderId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private realtimeService: RealtimeService,
    private notificationService: NotificationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    
    if (this.orderId) {
      this.setupRealTimeTracking();
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRealTimeTracking(): void {
    if (!this.orderId) return;

    this.isLoading = true;
    this.isRealTime = true;

    this.realtimeService.subscribeToOrder(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.order = order;
          this.isLoading = false;
          
          // Show toast for status changes (except initial load)
          if (order && !this.isLoading) {
            this.toastService.info(
              'Order Status Updated',
              `Your order is now ${this.getStatusText(order.status).toLowerCase()}`
            );
          }
        },
        error: (error) => {
          console.error('Error tracking order:', error);
          this.isLoading = false;
          this.toastService.error('Error', 'Failed to track order. Please try again.');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-orange-100 text-orange-800',
      'ready': 'bg-green-100 text-green-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready': '🍽️',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return iconMap[status] || '⏳';
  }

  getStatusIconClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-500',
      'confirmed': 'bg-blue-500',
      'preparing': 'bg-orange-500',
      'ready': 'bg-green-500',
      'delivered': 'bg-green-600',
      'cancelled': 'bg-red-500'
    };
    return classMap[status] || 'bg-gray-500';
  }
}
