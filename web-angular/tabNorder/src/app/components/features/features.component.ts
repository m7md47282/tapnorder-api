import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      icon: '📱',
      title: 'No App Download Needed',
      description: 'Customers use their existing camera app to scan QR codes. No additional apps cluttering their phones.',
      gradient: 'from-primary to-primary-soft'
    },
    {
      icon: '⚡',
      title: 'Fast Digital Menu Browsing',
      description: 'Lightning-fast menu loading with high-quality images, detailed descriptions, and real-time availability.',
      gradient: 'from-secondary to-secondary-soft'
    },
    {
      icon: '✅',
      title: 'Direct-to-Kitchen Orders',
      description: 'Orders go straight to the kitchen display, eliminating miscommunication and reducing wait times.',
      gradient: 'from-primary to-secondary'
    },
    {
      icon: '🔔',
      title: 'Table Calling & Requests',
      description: 'Customers can easily call for assistance or make special requests without waving down staff.',
      gradient: 'from-secondary to-primary'
    },
    {
      icon: '👥',
      title: 'Staff Efficiency Boost',
      description: 'Free up your staff to focus on service quality while the system handles order taking.',
      gradient: 'from-primary-dark to-primary'
    },
    {
      icon: '📈',
      title: 'Increased Order Accuracy',
      description: 'Eliminate human error in order taking with digital precision and automated kitchen integration.',
      gradient: 'from-secondary-soft to-secondary'
    }
  ];
}
