import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta.component.html',
  styleUrls: ['./cta.component.css']
})
export class CtaComponent {
  onStartFreeTrial(): void {
    // Handle start free trial logic
    console.log('Start free trial clicked');
  }

  onScheduleDemo(): void {
    // Handle schedule demo logic
    console.log('Schedule demo clicked');
  }
}
