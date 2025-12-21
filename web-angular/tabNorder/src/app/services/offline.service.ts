import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface OfflineData {
  key: string;
  data: any;
  timestamp: Date;
  type: 'menu' | 'order' | 'user' | 'cart';
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private offlineDataSubject = new BehaviorSubject<OfflineData[]>([]);
  private readonly OFFLINE_STORAGE_KEY = 'tabnorder_offline_data';

  public isOnline$ = this.isOnlineSubject.asObservable();
  public offlineData$ = this.offlineDataSubject.asObservable();

  constructor() {
    this.initializeOnlineStatus();
    this.loadOfflineData();
  }

  /**
   * Initialize online status monitoring
   */
  private initializeOnlineStatus(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(distinctUntilChanged())
      .subscribe(isOnline => {
        this.isOnlineSubject.next(isOnline);
        
        if (isOnline) {
          this.handleOnlineStatus();
        } else {
          this.handleOfflineStatus();
        }
      });
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  /**
   * Store data for offline use
   */
  storeOfflineData(key: string, data: any, type: OfflineData['type']): void {
    const offlineData: OfflineData = {
      key,
      data,
      timestamp: new Date(),
      type
    };

    const currentData = this.offlineDataSubject.value;
    const existingIndex = currentData.findIndex(item => item.key === key);
    
    if (existingIndex >= 0) {
      currentData[existingIndex] = offlineData;
    } else {
      currentData.push(offlineData);
    }

    this.offlineDataSubject.next(currentData);
    this.saveOfflineData(currentData);
  }

  /**
   * Retrieve offline data
   */
  getOfflineData(key: string): any | null {
    const data = this.offlineDataSubject.value.find(item => item.key === key);
    return data ? data.data : null;
  }

  /**
   * Get all offline data of a specific type
   */
  getOfflineDataByType(type: OfflineData['type']): OfflineData[] {
    return this.offlineDataSubject.value.filter(item => item.type === type);
  }

  /**
   * Remove offline data
   */
  removeOfflineData(key: string): void {
    const currentData = this.offlineDataSubject.value.filter(item => item.key !== key);
    this.offlineDataSubject.next(currentData);
    this.saveOfflineData(currentData);
  }

  /**
   * Clear all offline data
   */
  clearOfflineData(): void {
    this.offlineDataSubject.next([]);
    this.saveOfflineData([]);
  }

  /**
   * Get offline data count
   */
  getOfflineDataCount(): number {
    return this.offlineDataSubject.value.length;
  }

  /**
   * Check if data exists offline
   */
  hasOfflineData(key: string): boolean {
    return this.offlineDataSubject.value.some(item => item.key === key);
  }

  /**
   * Get offline data age
   */
  getOfflineDataAge(key: string): number | null {
    const data = this.offlineDataSubject.value.find(item => item.key === key);
    return data ? Date.now() - data.timestamp.getTime() : null;
  }

  /**
   * Check if offline data is stale (older than specified time)
   */
  isOfflineDataStale(key: string, maxAgeMs: number = 3600000): boolean {
    const age = this.getOfflineDataAge(key);
    return age !== null && age > maxAgeMs;
  }

  /**
   * Clean up stale offline data
   */
  cleanupStaleData(maxAgeMs: number = 3600000): void {
    const currentData = this.offlineDataSubject.value;
    const filteredData = currentData.filter(item => {
      const age = Date.now() - item.timestamp.getTime();
      return age <= maxAgeMs;
    });

    if (filteredData.length !== currentData.length) {
      this.offlineDataSubject.next(filteredData);
      this.saveOfflineData(filteredData);
    }
  }

  /**
   * Handle online status change
   */
  private handleOnlineStatus(): void {
    console.log('App is back online');
    // Here you could trigger sync operations
    this.syncOfflineData();
  }

  /**
   * Handle offline status change
   */
  private handleOfflineStatus(): void {
    console.log('App is offline');
    // Here you could show offline indicators
  }

  /**
   * Sync offline data when back online
   */
  private syncOfflineData(): void {
    const offlineData = this.offlineDataSubject.value;
    
    // Group data by type for efficient syncing
    const dataByType = offlineData.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, OfflineData[]>);

    // Sync each type of data
    Object.entries(dataByType).forEach(([type, items]) => {
      this.syncDataByType(type as OfflineData['type'], items);
    });
  }

  /**
   * Sync specific type of data
   */
  private syncDataByType(type: OfflineData['type'], items: OfflineData[]): void {
    // This would be implemented based on your specific sync requirements
    console.log(`Syncing ${items.length} ${type} items`);
    
    // Example implementation:
    items.forEach(item => {
      // Here you would make API calls to sync the data
      // For now, we'll just log the sync attempt
      console.log(`Syncing ${type} data:`, item.key);
      
      // After successful sync, remove from offline storage
      // this.removeOfflineData(item.key);
    });
  }

  /**
   * Save offline data to localStorage
   */
  private saveOfflineData(data: OfflineData[]): void {
    try {
      localStorage.setItem(this.OFFLINE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  /**
   * Load offline data from localStorage
   */
  private loadOfflineData(): void {
    try {
      const stored = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        this.offlineDataSubject.next(data);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const data = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      const used = data ? new Blob([data]).size : 0;
      const available = 5 * 1024 * 1024; // 5MB typical limit
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Subscribe to specific offline data changes
   */
  subscribeToOfflineData(type?: OfflineData['type']): Observable<OfflineData[]> {
    if (type) {
      return this.offlineData$.pipe(
        map(data => data.filter(item => item.type === type))
      );
    }
    return this.offlineData$;
  }
}
