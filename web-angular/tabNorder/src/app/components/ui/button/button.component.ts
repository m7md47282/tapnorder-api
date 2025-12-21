import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn.util';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border-2 border-primary bg-transparent text-primary shadow-sm hover:bg-primary hover:text-primary-foreground hover:shadow-elegant",
        secondary: "bg-gradient-secondary text-secondary-foreground shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-hero text-white shadow-glow hover:shadow-[0_0_50px_hsl(var(--primary)/0.4)] hover:scale-105 active:scale-95 text-base font-bold",
        card: "bg-gradient-card text-white shadow-elegant hover:shadow-glow hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        xl: "h-16 rounded-3xl px-10 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
type ButtonSize = VariantProps<typeof buttonVariants>['size'];

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="cn(buttonVariants({ variant, size }), className)"
      [disabled]="disabled"
      [type]="type"
      (click)="onClick.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: []
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'default';
  @Input() size: ButtonSize = 'default';
  @Input() className: string = '';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  buttonVariants = buttonVariants;
  cn = cn;

  @Output() onClick = new EventEmitter<MouseEvent>();
}
