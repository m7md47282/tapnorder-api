import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p 
      *ngIf="message || hasError" 
      [class]="className"
      class="text-sm font-medium text-destructive"
    >
      {{ message || errorMessage }}
    </p>
  `,
  styleUrls: ['./form-message.component.css']
})
export class FormMessageComponent {
  @Input() message = '';
  @Input() errorMessage = '';
  @Input() hasError = false;
  @Input() className = '';
}
