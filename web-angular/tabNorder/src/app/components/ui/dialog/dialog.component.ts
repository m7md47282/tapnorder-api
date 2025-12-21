import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../utils/cn.util';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center"
      (click)="onBackdropClick($event)"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <!-- Dialog -->
      <div
        #dialogRef
        [class]="cn(
          'relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg',
          className
        )"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <!-- Close button -->
        <button
          *ngIf="showCloseButton"
          (click)="close()"
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span class="sr-only">Close</span>
        </button>

        <!-- Header -->
        <div *ngIf="title" class="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 [id]="titleId" class="text-lg font-semibold leading-none tracking-tight">
            {{ title }}
          </h2>
          <p *ngIf="description" class="text-sm text-muted-foreground">
            {{ description }}
          </p>
        </div>

        <!-- Content -->
        <div class="mt-4">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="showFooter" class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DialogComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() showCloseButton: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() closeOnBackdropClick: boolean = true;
  @Input() className: string = '';

  @Output() onClose = new EventEmitter<void>();
  @Output() onOpen = new EventEmitter<void>();

  @ViewChild('dialogRef') dialogRef!: ElementRef;

  titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`;

  cn = cn;

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
    // Simple focus trap - focus the dialog element
    setTimeout(() => {
      if (this.dialogRef?.nativeElement) {
        this.dialogRef.nativeElement.focus();
      }
    }, 0);
  }

  private removeFocusTrap(): void {
    // Cleanup if needed
  }
}

@Component({
  selector: 'app-dialog-trigger',
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
export class DialogTriggerComponent {
  @Input() className: string = '';
  @Output() onClick = new EventEmitter<void>();

  cn = cn;
}

@Component({
  selector: 'app-dialog-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('text-sm text-muted-foreground', className)">
      <ng-content></ng-content>
    </div>
  `,
  styles: []
})
export class DialogContentComponent {
  @Input() className: string = '';
  cn = cn;
}

@Component({
  selector: 'app-dialog-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)">
      <ng-content></ng-content>
    </div>
  `,
  styles: []
})
export class DialogFooterComponent {
  @Input() className: string = '';
  cn = cn;
}
