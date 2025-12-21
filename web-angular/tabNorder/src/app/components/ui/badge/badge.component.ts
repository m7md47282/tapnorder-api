import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn.util';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn(badgeVariants({ variant }), className)">
      <ng-content></ng-content>
    </div>
  `,
  styles: []
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() className: string = '';

  badgeVariants = badgeVariants;
  cn = cn;
}
