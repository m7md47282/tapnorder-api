import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  icon: string;
  title: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css']
})
export class HowItWorksComponent {
  steps: Step[] = [
    {
      icon: '📱',
      title: 'Scan the QR Code',
      description: 'Each table has a unique QR code that customers scan to access the digital menu instantly.',
      color: 'text-primary'
    },
    {
      icon: '📋',
      title: 'Browse the Menu',
      description: 'Customers view a clean, categorized menu with photos, descriptions, and prices.',
      color: 'text-secondary'
    },
    {
      icon: '🛒',
      title: 'Place Your Order',
      description: 'With a few taps, items are added to the order and sent directly to the kitchen.',
      color: 'text-primary'
    },
    {
      icon: '🧾',
      title: 'Track & Request Bill',
      description: 'Customers can track order status and request the bill without flagging a waiter.',
      color: 'text-secondary'
    }
  ];
}
