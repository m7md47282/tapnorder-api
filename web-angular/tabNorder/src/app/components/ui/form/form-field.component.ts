import { Component, Input, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-2" [class]="className">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./form-field.component.css']
})
export class FormFieldComponent {
  @Input() className = '';
}
