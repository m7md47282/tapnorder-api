import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-description',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p 
      [class]="className"
      class="text-sm text-muted-foreground"
    >
      <ng-content></ng-content>
    </p>
  `,
  styleUrls: ['./form-description.component.css']
})
export class FormDescriptionComponent {
  @Input() className = '';
}
