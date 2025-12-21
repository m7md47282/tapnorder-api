import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MousePositionService } from '../../services/mouse-position.service';

interface Dimensions {
  width: number;
  height: number;
}

interface EmojiPosition {
  x: number;
  y: number;
  id: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  mousePosition = { x: 0, y: 0 };
  dimensions: Dimensions = { width: 0, height: 0 };
  email = '';

  constructor(
    private mousePositionService: MousePositionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mousePositionService.mousePosition$
      .pipe(takeUntil(this.destroy$))
      .subscribe(position => {
        this.mousePosition = position;
        this.updateEmojiPositions();
      });

    this.updateDimensions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateDimensions();
  }

  private updateDimensions(): void {
    this.dimensions = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.updateEmojiPositions();
  }

  private updateEmojiPositions(): void {
    if (this.dimensions.width === 0 || this.dimensions.height === 0) return;
    
    // Calculate offset from center for each emoji position
    const emojiPositions: EmojiPosition[] = [
      { x: this.dimensions.width * 0.25, y: this.dimensions.height * 0.25, id: 'pizza' },
      { x: this.dimensions.width * 0.75, y: this.dimensions.height * 0.25, id: 'burger' },
      { x: this.dimensions.width * 0.75, y: this.dimensions.height * 0.75, id: 'coffee' },
      { x: this.dimensions.width * 0.25, y: this.dimensions.height * 0.75, id: 'sushi' },
      { x: this.dimensions.width * 0.5, y: this.dimensions.height * 0.2, id: 'icecream' },
      { x: this.dimensions.width * 0.2, y: this.dimensions.height * 0.5, id: 'taco' },
      { x: this.dimensions.width * 0.8, y: this.dimensions.height * 0.5, id: 'donut' },
      { x: this.dimensions.width * 0.5, y: this.dimensions.height * 0.8, id: 'salad' },
      { x: this.dimensions.width * 0.15, y: this.dimensions.height * 0.15, id: 'cake' },
      { x: this.dimensions.width * 0.85, y: this.dimensions.height * 0.15, id: 'hotdog' },
      { x: this.dimensions.width * 0.15, y: this.dimensions.height * 0.85, id: 'fries' },
      { x: this.dimensions.width * 0.85, y: this.dimensions.height * 0.85, id: 'coffeecup' }
    ];

    // Calculate individual magnetic attraction for each emoji
    const sensitivity = 0.08;
    
    emojiPositions.forEach(pos => {
      const distanceX = this.mousePosition.x - pos.x;
      const distanceY = this.mousePosition.y - pos.y;
      
      // Calculate distance from mouse to emoji
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      // Stronger attraction when closer (magnetic effect)
      const magneticStrength = Math.max(0.1, 1 - (distance / 1000));
      const adjustedSensitivity = sensitivity * magneticStrength;
      
      const offsetX = distanceX * adjustedSensitivity;
      const offsetY = distanceY * adjustedSensitivity;
      
      // Set individual CSS custom properties for each emoji
      document.documentElement.style.setProperty(`--mouse-x-${pos.id}`, `${offsetX}px`);
      document.documentElement.style.setProperty(`--mouse-y-${pos.id}`, `${offsetY}px`);
    });
  }

  onSignUp(): void {
    if (this.email) {
      // Handle sign up logic
      console.log('Sign up with email:', this.email);
    }
  }

  onTryDemo(): void {
    this.router.navigate(['/demo']);
  }

  onViewMenu(): void {
    this.router.navigate(['/menu/1']);
  }
}
