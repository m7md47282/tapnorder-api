import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { OfflineService } from '../../services/offline.service';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!isOnline" class="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      <div class="flex items-center justify-center gap-2">
        <span>📡</span>
        <span>You're offline. Some features may be limited.</span>
        <span *ngIf="offlineDataCount > 0" class="bg-yellow-600 text-yellow-100 px-2 py-1 rounded-full text-xs">
          {{ offlineDataCount }} items cached
        </span>
      </div>
    </div>
    
    <div *ngIf="isOnline && wasOffline" class="fixed top-0 left-0 right-0 z-50 bg-green-500 text-green-900 px-4 py-2 text-center text-sm font-medium animate-pulse">
      <div class="flex items-center justify-center gap-2">
        <span>✅</span>
        <span>You're back online!</span>
      </div>
    </div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isOnline = true;
  wasOffline = false;
  offlineDataCount = 0;

  constructor(private offlineService: OfflineService) {}

  ngOnInit(): void {
    // Subscribe to online status
    this.offlineService.isOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOnline => {
        if (!isOnline && this.isOnline) {
          this.wasOffline = true;
          // Hide the "back online" message after 3 seconds
          setTimeout(() => {
            this.wasOffline = false;
          }, 3000);
        }
        this.isOnline = isOnline;
      });

    // Subscribe to offline data count
    this.offlineService.offlineData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.offlineDataCount = data.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
