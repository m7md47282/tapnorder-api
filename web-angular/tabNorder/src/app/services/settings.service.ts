import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface RestaurantSettings {
  name: string;
  logo: string;
  themeColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  features?: {
    onlineOrdering: boolean;
    tableReservations: boolean;
    loyaltyProgram: boolean;
    delivery: boolean;
    pickup: boolean;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  businessHours?: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
}

const defaultSettings: RestaurantSettings = {
  name: 'Tab N Order Restaurant',
  logo: '',
  themeColor: '#E57373',
  secondaryColor: '#F06292',
  address: '123 Main Street, City, State',
  phone: '+1 (555) 123-4567',
  email: 'info@tabnorder.com',
  taxRate: 8.5,
  currency: 'USD',
  timezone: 'America/New_York',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  notifications: {
    email: true,
    sms: false,
    push: true
  },
  features: {
    onlineOrdering: true,
    tableReservations: false,
    loyaltyProgram: false,
    delivery: true,
    pickup: true
  },
  socialMedia: {},
  businessHours: {
    monday: { open: '09:00', close: '22:00', isOpen: true },
    tuesday: { open: '09:00', close: '22:00', isOpen: true },
    wednesday: { open: '09:00', close: '22:00', isOpen: true },
    thursday: { open: '09:00', close: '22:00', isOpen: true },
    friday: { open: '09:00', close: '23:00', isOpen: true },
    saturday: { open: '10:00', close: '23:00', isOpen: true },
    sunday: { open: '10:00', close: '21:00', isOpen: true }
  }
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly STORAGE_KEY = 'tabnorder_restaurant_settings';
  private settingsSubject = new BehaviorSubject<RestaurantSettings>(defaultSettings);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public settings$ = this.settingsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Computed observables
  public themeColors$ = this.settings$.pipe(
    map(settings => ({
      primary: settings.themeColor,
      secondary: settings.secondaryColor,
      primaryHsl: this.hexToHSL(settings.themeColor),
      secondaryHsl: this.hexToHSL(settings.secondaryColor)
    }))
  );

  public businessInfo$ = this.settings$.pipe(
    map(settings => ({
      name: settings.name,
      logo: settings.logo,
      address: settings.address,
      phone: settings.phone,
      email: settings.email
    }))
  );

  public features$ = this.settings$.pipe(
    map(settings => settings.features || {})
  );

  public notifications$ = this.settings$.pipe(
    map(settings => settings.notifications || {})
  );

  constructor() {
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        const mergedSettings = { ...defaultSettings, ...parsedSettings };
        this.settingsSubject.next(mergedSettings);
      } else {
        this.settingsSubject.next(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      this.errorSubject.next('Failed to load settings');
      this.settingsSubject.next(defaultSettings);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Save settings to localStorage
   */
  async saveSettings(settings: RestaurantSettings): Promise<boolean> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      this.settingsSubject.next(settings);
      
      return true;
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      this.errorSubject.next('Failed to save settings');
      return false;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Update a single setting
   */
  async updateSetting<K extends keyof RestaurantSettings>(
    key: K,
    value: RestaurantSettings[K]
  ): Promise<boolean> {
    try {
      const currentSettings = this.settingsSubject.value;
      const newSettings = { ...currentSettings, [key]: value };
      return await this.saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating setting:', error);
      this.errorSubject.next('Failed to update setting');
      return false;
    }
  }

  /**
   * Update multiple settings
   */
  async updateSettings(updates: Partial<RestaurantSettings>): Promise<boolean> {
    try {
      const currentSettings = this.settingsSubject.value;
      const newSettings = { ...currentSettings, ...updates };
      return await this.saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      this.errorSubject.next('Failed to update settings');
      return false;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<boolean> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      localStorage.removeItem(this.STORAGE_KEY);
      this.settingsSubject.next(defaultSettings);
      
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.errorSubject.next('Failed to reset settings');
      return false;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Get current settings
   */
  getCurrentSettings(): RestaurantSettings {
    return this.settingsSubject.value;
  }

  /**
   * Get a specific setting
   */
  getSetting<K extends keyof RestaurantSettings>(key: K): RestaurantSettings[K] {
    return this.settingsSubject.value[key];
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof RestaurantSettings['features']): boolean {
    const features = this.getSetting('features');
    return features?.[feature] || false;
  }

  /**
   * Check if a notification type is enabled
   */
  isNotificationEnabled(type: keyof RestaurantSettings['notifications']): boolean {
    const notifications = this.getSetting('notifications');
    return notifications?.[type] || false;
  }

  /**
   * Get business hours for a specific day
   */
  getBusinessHours(day: string): RestaurantSettings['businessHours'][string] | null {
    const businessHours = this.getSetting('businessHours');
    return businessHours?.[day] || null;
  }

  /**
   * Check if restaurant is open now
   */
  isRestaurantOpen(): boolean {
    const now = new Date();
    const day = now.toLocaleLowerCase().substring(0, 3); // mon, tue, etc.
    const hours = this.getBusinessHours(day);
    
    if (!hours || !hours.isOpen) {
      return false;
    }

    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    return currentTime >= hours.open && currentTime <= hours.close;
  }

  /**
   * Get next opening time
   */
  getNextOpeningTime(): Date | null {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dayName = days[checkDate.getDay()];
      const hours = this.getBusinessHours(dayName);
      
      if (hours && hours.isOpen) {
        const [openHour, openMinute] = hours.open.split(':').map(Number);
        const openTime = new Date(checkDate);
        openTime.setHours(openHour, openMinute, 0, 0);
        
        if (openTime > now) {
          return openTime;
        }
      }
    }
    
    return null;
  }

  /**
   * Convert hex color to HSL
   */
  hexToHSL(hex: string): { h: number; s: number; l: number } {
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

  /**
   * Convert HSL to hex color
   */
  hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Generate color palette from primary color
   */
  generateColorPalette(primaryColor: string): {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
  } {
    const hsl = this.hexToHSL(primaryColor);
    
    return {
      primary: primaryColor,
      primaryLight: this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 20, 100)),
      primaryDark: this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 0)),
      secondary: this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
      secondaryLight: this.hslToHex((hsl.h + 30) % 360, hsl.s, Math.min(hsl.l + 20, 100)),
      secondaryDark: this.hslToHex((hsl.h + 30) % 360, hsl.s, Math.max(hsl.l - 20, 0))
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    const currency = this.getSetting('currency');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    const dateFormat = this.getSetting('dateFormat') || 'MM/DD/YYYY';
    // This would need a proper date formatting library like date-fns
    return date.toLocaleDateString();
  }

  /**
   * Format time
   */
  formatTime(date: Date): string {
    const timeFormat = this.getSetting('timeFormat') || '12h';
    return date.toLocaleTimeString('en-US', {
      hour12: timeFormat === '12h'
    });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Export settings
   */
  exportSettings(): string {
    return JSON.stringify(this.getCurrentSettings(), null, 2);
  }

  /**
   * Import settings
   */
  async importSettings(settingsJson: string): Promise<boolean> {
    try {
      const settings = JSON.parse(settingsJson);
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('Error importing settings:', error);
      this.errorSubject.next('Invalid settings format');
      return false;
    }
  }

  /**
   * Validate settings
   */
  validateSettings(settings: Partial<RestaurantSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.name && settings.name.trim().length === 0) {
      errors.push('Restaurant name is required');
    }

    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      errors.push('Invalid email format');
    }

    if (settings.phone && !/^\+?[\d\s\-\(\)]+$/.test(settings.phone)) {
      errors.push('Invalid phone format');
    }

    if (settings.taxRate !== undefined && (settings.taxRate < 0 || settings.taxRate > 100)) {
      errors.push('Tax rate must be between 0 and 100');
    }

    if (settings.themeColor && !/^#[0-9A-F]{6}$/i.test(settings.themeColor)) {
      errors.push('Invalid theme color format');
    }

    if (settings.secondaryColor && !/^#[0-9A-F]{6}$/i.test(settings.secondaryColor)) {
      errors.push('Invalid secondary color format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}