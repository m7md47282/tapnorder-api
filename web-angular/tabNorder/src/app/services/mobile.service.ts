import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MobileService {
  private readonly MOBILE_BREAKPOINT = 768;
  private isMobileSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public isMobile$ = this.isMobileSubject.asObservable();
  public isDesktop$ = this.isMobile$.pipe(map(isMobile => !isMobile));

  constructor() {
    this.initializeMobileDetection();
  }

  /**
   * Initialize mobile detection
   */
  private initializeMobileDetection(): void {
    // Initial check
    this.checkIsMobile();

    // Listen for window resize events
    fromEvent(window, 'resize')
      .pipe(
        startWith(null),
        map(() => this.checkIsMobile()),
        distinctUntilChanged()
      )
      .subscribe();
  }

  /**
   * Check if current viewport is mobile
   */
  private checkIsMobile(): boolean {
    const isMobile = window.innerWidth < this.MOBILE_BREAKPOINT;
    this.isMobileSubject.next(isMobile);
    return isMobile;
  }

  /**
   * Get current mobile state
   */
  get isMobile(): boolean {
    return this.isMobileSubject.value;
  }

  /**
   * Get current desktop state
   */
  get isDesktop(): boolean {
    return !this.isMobileSubject.value;
  }

  /**
   * Get current viewport width
   */
  get viewportWidth(): number {
    return window.innerWidth;
  }

  /**
   * Get current viewport height
   */
  get viewportHeight(): number {
    return window.innerHeight;
  }

  /**
   * Check if viewport is tablet size
   */
  get isTablet(): boolean {
    const width = this.viewportWidth;
    return width >= this.MOBILE_BREAKPOINT && width < 1024;
  }

  /**
   * Check if viewport is large desktop
   */
  get isLargeDesktop(): boolean {
    return this.viewportWidth >= 1440;
  }

  /**
   * Get device type
   */
  get deviceType(): 'mobile' | 'tablet' | 'desktop' | 'large-desktop' {
    const width = this.viewportWidth;
    
    if (width < this.MOBILE_BREAKPOINT) {
      return 'mobile';
    } else if (width < 1024) {
      return 'tablet';
    } else if (width < 1440) {
      return 'desktop';
    } else {
      return 'large-desktop';
    }
  }

  /**
   * Get responsive breakpoint
   */
  get currentBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
    const width = this.viewportWidth;
    
    if (width < 640) {
      return 'sm';
    } else if (width < 768) {
      return 'md';
    } else if (width < 1024) {
      return 'lg';
    } else if (width < 1280) {
      return 'xl';
    } else {
      return '2xl';
    }
  }

  /**
   * Check if viewport matches a specific breakpoint
   */
  matchesBreakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'): boolean {
    const current = this.currentBreakpoint;
    const breakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(current);
    const targetIndex = breakpoints.indexOf(breakpoint);
    
    return currentIndex >= targetIndex;
  }

  /**
   * Get responsive class based on current breakpoint
   */
  getResponsiveClass(baseClass: string): string {
    const breakpoint = this.currentBreakpoint;
    return `${baseClass}-${breakpoint}`;
  }

  /**
   * Check if device supports touch
   */
  get isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Check if device is iOS
   */
  get isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Check if device is Android
   */
  get isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  /**
   * Check if device is mobile OS
   */
  get isMobileOS(): boolean {
    return this.isIOS || this.isAndroid;
  }

  /**
   * Get device orientation
   */
  get orientation(): 'portrait' | 'landscape' {
    return this.viewportHeight > this.viewportWidth ? 'portrait' : 'landscape';
  }

  /**
   * Check if device is in portrait mode
   */
  get isPortrait(): boolean {
    return this.orientation === 'portrait';
  }

  /**
   * Check if device is in landscape mode
   */
  get isLandscape(): boolean {
    return this.orientation === 'landscape';
  }

  /**
   * Get responsive utilities for CSS classes
   */
  getResponsiveClasses(): {
    mobile: string;
    tablet: string;
    desktop: string;
    touch: string;
    noTouch: string;
    portrait: string;
    landscape: string;
  } {
    return {
      mobile: this.isMobile ? 'mobile' : 'not-mobile',
      tablet: this.isTablet ? 'tablet' : 'not-tablet',
      desktop: this.isDesktop ? 'desktop' : 'not-desktop',
      touch: this.isTouchDevice ? 'touch' : 'no-touch',
      noTouch: !this.isTouchDevice ? 'no-touch' : 'touch',
      portrait: this.isPortrait ? 'portrait' : 'landscape',
      landscape: this.isLandscape ? 'landscape' : 'portrait'
    };
  }

  /**
   * Force refresh mobile detection
   */
  refresh(): void {
    this.checkIsMobile();
  }
}
