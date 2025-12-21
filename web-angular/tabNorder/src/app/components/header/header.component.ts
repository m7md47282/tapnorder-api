import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SettingsService, RestaurantSettings } from '../../services/settings.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  settings: RestaurantSettings | null = null;
  primaryColor: string = '#E57373';
  secondaryColor: string = '#F06292';
  logoImage = '/assets/logo.png';

  constructor(
    private settingsService: SettingsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.settingsService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        this.settings = settings;
        this.primaryColor = settings.themeColor;
        this.secondaryColor = settings.secondaryColor;
        this.applyThemeColor(settings.themeColor);
        this.applySecondaryColor(settings.secondaryColor);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onThemeColorChange(color: string): void {
    this.primaryColor = color;
    this.settingsService.updateSetting('themeColor', color).then(success => {
      if (success) {
        this.applyThemeColor(color);
        this.cdr.markForCheck();
      }
    });
  }

  onSecondaryColorChange(color: string): void {
    this.secondaryColor = color;
    this.settingsService.updateSetting('secondaryColor', color).then(success => {
      if (success) {
        this.applySecondaryColor(color);
        this.cdr.markForCheck();
      }
    });
  }

  onResetColors(): void {
    const defaultPrimary = '#E57373';
    const defaultSecondary = '#F06292';
    
    this.primaryColor = defaultPrimary;
    this.secondaryColor = defaultSecondary;
    
    this.settingsService.updateSettings({
      themeColor: defaultPrimary,
      secondaryColor: defaultSecondary
    }).then(success => {
      if (success) {
        this.applyThemeColor(defaultPrimary);
        this.applySecondaryColor(defaultSecondary);
        this.cdr.markForCheck();
      }
    });
  }

  private applyThemeColor(color: string): void {
    const root = document.documentElement;
    const hsl = this.hexToHSL(color);
    
    root.style.setProperty('--primary', color);
    root.style.setProperty('--primary-h', hsl.h.toString());
    root.style.setProperty('--primary-s', `${hsl.s}%`);
    root.style.setProperty('--primary-l', `${hsl.l}%`);
  }

  private applySecondaryColor(color: string): void {
    const root = document.documentElement;
    const hsl = this.hexToHSL(color);
    
    root.style.setProperty('--secondary', color);
    root.style.setProperty('--secondary-h', hsl.h.toString());
    root.style.setProperty('--secondary-s', `${hsl.s}%`);
    root.style.setProperty('--secondary-l', `${hsl.l}%`);
  }

  private hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
}
