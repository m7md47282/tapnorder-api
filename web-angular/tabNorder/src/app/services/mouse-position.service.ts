import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged, throttleTime } from 'rxjs/operators';

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseMovement {
  deltaX: number;
  deltaY: number;
  velocity: number;
}

@Injectable({
  providedIn: 'root'
})
export class MousePositionService {
  private mousePositionSubject = new BehaviorSubject<MousePosition>({ x: 0, y: 0 });
  private mouseMovementSubject = new BehaviorSubject<MouseMovement>({ deltaX: 0, deltaY: 0, velocity: 0 });
  private isMouseMovingSubject = new BehaviorSubject<boolean>(false);
  private lastPosition: MousePosition = { x: 0, y: 0 };
  private lastUpdateTime = Date.now();

  // Public observables
  public mousePosition$ = this.mousePositionSubject.asObservable();
  public mouseMovement$ = this.mouseMovementSubject.asObservable();
  public isMouseMoving$ = this.isMouseMovingSubject.asObservable();

  // Throttled observables for performance
  public mousePositionThrottled$ = this.mousePosition$.pipe(
    throttleTime(16), // ~60fps
    distinctUntilChanged((prev, curr) => prev.x === curr.x && prev.y === curr.y)
  );

  public mouseMovementThrottled$ = this.mouseMovement$.pipe(
    throttleTime(16), // ~60fps
    distinctUntilChanged((prev, curr) => 
      prev.deltaX === curr.deltaX && 
      prev.deltaY === curr.deltaY && 
      prev.velocity === curr.velocity
    )
  );

  constructor() {
    this.initializeMouseTracking();
  }

  /**
   * Initialize mouse tracking
   */
  private initializeMouseTracking(): void {
    // Track mouse movement
    fromEvent<MouseEvent>(document, 'mousemove')
      .pipe(
        map(event => ({ x: event.clientX, y: event.clientY })),
        throttleTime(16) // ~60fps
      )
      .subscribe(position => {
        this.updateMousePosition(position);
      });

    // Track mouse enter/leave
    fromEvent<MouseEvent>(document, 'mouseenter')
      .subscribe(() => {
        this.isMouseMovingSubject.next(true);
      });

    fromEvent<MouseEvent>(document, 'mouseleave')
      .subscribe(() => {
        this.isMouseMovingSubject.next(false);
      });

    // Track mouse stop (no movement for 100ms)
    this.mousePosition$
      .pipe(
        throttleTime(100),
        map(() => false)
      )
      .subscribe(() => {
        this.isMouseMovingSubject.next(false);
      });
  }

  /**
   * Update mouse position and calculate movement
   */
  private updateMousePosition(position: MousePosition): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    
    // Calculate movement delta
    const deltaX = position.x - this.lastPosition.x;
    const deltaY = position.y - this.lastPosition.y;
    
    // Calculate velocity (pixels per second)
    const velocity = deltaTime > 0 ? Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (deltaTime / 1000) : 0;
    
    // Update subjects
    this.mousePositionSubject.next(position);
    this.mouseMovementSubject.next({ deltaX, deltaY, velocity });
    this.isMouseMovingSubject.next(true);
    
    // Update tracking variables
    this.lastPosition = { ...position };
    this.lastUpdateTime = currentTime;
  }

  /**
   * Get current mouse position
   */
  get currentPosition(): MousePosition {
    return this.mousePositionSubject.value;
  }

  /**
   * Get current mouse movement
   */
  get currentMovement(): MouseMovement {
    return this.mouseMovementSubject.value;
  }

  /**
   * Check if mouse is currently moving
   */
  get isMouseMoving(): boolean {
    return this.isMouseMovingSubject.value;
  }

  /**
   * Get mouse position relative to an element
   */
  getMousePositionRelativeTo(element: HTMLElement): MousePosition {
    const rect = element.getBoundingClientRect();
    const position = this.currentPosition;
    
    return {
      x: position.x - rect.left,
      y: position.y - rect.top
    };
  }

  /**
   * Get mouse position as percentage of viewport
   */
  getMousePositionAsPercentage(): { x: number; y: number } {
    const position = this.currentPosition;
    
    return {
      x: (position.x / window.innerWidth) * 100,
      y: (position.y / window.innerHeight) * 100
    };
  }

  /**
   * Check if mouse is over an element
   */
  isMouseOverElement(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const position = this.currentPosition;
    
    return (
      position.x >= rect.left &&
      position.x <= rect.right &&
      position.y >= rect.top &&
      position.y <= rect.bottom
    );
  }

  /**
   * Get distance from mouse to a point
   */
  getDistanceToPoint(x: number, y: number): number {
    const position = this.currentPosition;
    const deltaX = position.x - x;
    const deltaY = position.y - y;
    
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Get angle from mouse to a point (in radians)
   */
  getAngleToPoint(x: number, y: number): number {
    const position = this.currentPosition;
    const deltaX = x - position.x;
    const deltaY = y - position.y;
    
    return Math.atan2(deltaY, deltaX);
  }

  /**
   * Get mouse velocity in pixels per second
   */
  get mouseVelocity(): number {
    return this.currentMovement.velocity;
  }

  /**
   * Check if mouse is moving fast
   */
  get isMouseMovingFast(): boolean {
    return this.mouseVelocity > 100; // pixels per second
  }

  /**
   * Get mouse movement direction
   */
  get mouseDirection(): 'up' | 'down' | 'left' | 'right' | 'none' {
    const movement = this.currentMovement;
    const threshold = 1; // minimum movement to register direction
    
    if (Math.abs(movement.deltaX) < threshold && Math.abs(movement.deltaY) < threshold) {
      return 'none';
    }
    
    if (Math.abs(movement.deltaX) > Math.abs(movement.deltaY)) {
      return movement.deltaX > 0 ? 'right' : 'left';
    } else {
      return movement.deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Get mouse trail effect data
   */
  getMouseTrailData(trailLength: number = 10): MousePosition[] {
    // This would need to be implemented with a trail buffer
    // For now, return current position
    return [this.currentPosition];
  }

  /**
   * Check if mouse is in a specific region
   */
  isMouseInRegion(x: number, y: number, width: number, height: number): boolean {
    const position = this.currentPosition;
    
    return (
      position.x >= x &&
      position.x <= x + width &&
      position.y >= y &&
      position.y <= y + height
    );
  }

  /**
   * Get mouse position with smoothing
   */
  getSmoothedMousePosition(smoothingFactor: number = 0.1): MousePosition {
    // This would implement smoothing logic
    // For now, return current position
    return this.currentPosition;
  }

  /**
   * Subscribe to mouse position changes with custom throttling
   */
  subscribeToMousePosition(throttleMs: number = 16): Observable<MousePosition> {
    return this.mousePosition$.pipe(throttleTime(throttleMs));
  }

  /**
   * Subscribe to mouse movement with custom throttling
   */
  subscribeToMouseMovement(throttleMs: number = 16): Observable<MouseMovement> {
    return this.mouseMovement$.pipe(throttleTime(throttleMs));
  }

  /**
   * Get mouse position relative to center of viewport
   */
  getMousePositionFromCenter(): MousePosition {
    const position = this.currentPosition;
    
    return {
      x: position.x - window.innerWidth / 2,
      y: position.y - window.innerHeight / 2
    };
  }

  /**
   * Check if mouse is in center region of viewport
   */
  get isMouseInCenter(): boolean {
    const centerPosition = this.getMousePositionFromCenter();
    const centerThreshold = 100; // pixels from center
    
    return (
      Math.abs(centerPosition.x) < centerThreshold &&
      Math.abs(centerPosition.y) < centerThreshold
    );
  }

  /**
   * Get mouse position normalized to -1 to 1 range
   */
  getNormalizedMousePosition(): MousePosition {
    const position = this.currentPosition;
    
    return {
      x: (position.x / window.innerWidth) * 2 - 1,
      y: (position.y / window.innerHeight) * 2 - 1
    };
  }
}
