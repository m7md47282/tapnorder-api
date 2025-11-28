import { Place } from '../../entities/place.entity';
import { IBaseRepository } from '../base.repository';
import { QueryFilter } from '../types';

/**
 * Place Repository Interface
 * Follows Interface Segregation Principle
 * Defines contract for place data operations
 * Extends IBaseRepository for common CRUD operations
 */
export interface IPlaceRepository extends IBaseRepository<Place> {
  // Place-specific queries
  getByOwnerId(ownerId: string): Promise<Place[]>;
  getByStatus(status: Place['status']): Promise<Place[]>;
  getByLocation(city: string, state?: string): Promise<Place[]>;
  getActivePlaces(): Promise<Place[]>;
  searchPlaces(searchTerm: string): Promise<Place[]>;
  getPlacesWithOnlineOrders(): Promise<Place[]>;
  
  // Business-specific queries
  getByOwnerIdAndStatus(ownerId: string, status: Place['status']): Promise<Place[]>;
  getNearbyPlaces(latitude: number, longitude: number, radiusKm: number): Promise<Place[]>;
  
  // Advanced filtering
  queryPlaces(filters: QueryFilter[]): Promise<Place[]>;
}
