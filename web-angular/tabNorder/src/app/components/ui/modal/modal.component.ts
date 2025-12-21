import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../utils/cn.util';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      (click)="onBackdropClick($event)"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>
      
      <!-- Modal -->
      <div
        #modalRef
        [class]="cn(
          'relative z-50 w-full max-w-md rounded-lg border bg-background shadow-lg transition-all',
          sizeClasses,
          className
        )"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <!-- Header -->
        <div *ngIf="title || showCloseButton" class="flex items-center justify-between p-6 pb-0">
          <h2 *ngIf="title" [id]="titleId" class="text-lg font-semibold">
            {{ title }}
          </h2>
          <button
            *ngIf="showCloseButton"
            (click)="close()"
            class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span class="sr-only">Close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="showFooter" class="flex items-center justify-end space-x-2 p-6 pt-0">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showCloseButton: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() closeOnBackdropClick: boolean = true;
  @Input() className: string = '';

  @Output() onClose = new EventEmitter<void>();
  @Output() onOpen = new EventEmitter<void>();

  @ViewChild('modalRef') modalRef!: ElementRef;

  titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  cn = cn;

  get sizeClasses(): string {
    const sizeMap = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };
    return sizeMap[this.size];
  }

  ngOnInit(): void {
    if (this.isOpen) {
      this.onOpen.emit();
      this.trapFocus();
    }
  }

  ngOnDestroy(): void {
    this.removeFocusTrap();
  }

  close(): void {
    this.isOpen = false;
    this.onClose.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdropClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  private trapFocus(): void {
    // Simple focus trap - focus the modal element
    setTimeout(() => {
      if (this.modalRef?.nativeElement) {
        this.modalRef.nativeElement.focus();
      }
    }, 0);
  }

  private removeFocusTrap(): void {
    // Cleanup if needed
  }
}

@Component({
  selector: 'app-modal-trigger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="cn('inline-flex items-center justify-center', className)"
      (click)="onClick.emit()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: []
})
export class ModalTriggerComponent {
  @Input() className: string = '';
  @Output() onClick = new EventEmitter<void>();

  cn = cn;
}

@Component({
  selector: 'app-modal-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('text-sm text-muted-foreground', className)">
      <ng-content></ng-content>
    </div>
  `,
  styles: []
})
export class ModalContentComponent {
  @Input() className: string = '';
  cn = cn;
}

@Component({
  selector: 'app-modal-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('flex items-center justify-end space-x-2', className)">
      <ng-content></ng-content>
    </div>
  `,
  styles: []
})
export class ModalFooterComponent {
  @Input() className: string = '';
  cn = cn;
}
