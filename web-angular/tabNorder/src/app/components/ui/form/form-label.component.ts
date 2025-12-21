import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label 
      [for]="htmlFor" 
      [class]="className"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      <ng-content></ng-content>
    </label>
  `,
  styleUrls: ['./form-label.component.css']
})
export class FormLabelComponent {
  @Input() htmlFor = '';
  @Input() className = '';
}
