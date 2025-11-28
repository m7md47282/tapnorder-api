import { BaseRepository } from '../base.repository';
import { Place } from '../../entities/place.entity';
import { IPlaceRepository } from '../interfaces/place.repository.interface';
import { QueryFilter } from '../types';

/**
 * Place Repository - Extends BaseRepository, Implements IPlaceRepository
 * Follows SOLID principles and Clean Architecture
 * NO business logic - only data access operations
 * Uses Firebase directly for data persistence
 */
export class PlaceRepository extends BaseRepository<Place> implements IPlaceRepository {
  constructor() {
    super('places');
  }

  async getByOwnerId(ownerId: string): Promise<Place[]> {
    const filters: QueryFilter[] = [
      { field: 'ownerId', operator: '==', value: ownerId }
    ];
    return this.query(filters);
  }

  async getByStatus(status: Place['status']): Promise<Place[]> {
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: status }
    ];
    return this.query(filters);
  }

  async getByLocation(city: string, state?: string): Promise<Place[]> {
    const filters: QueryFilter[] = [
      { field: 'address.city', operator: '==', value: city }
    ];
    
    if (state) {
      filters.push({ field: 'address.state', operator: '==', value: state });
    }
    
    return this.query(filters);
  }

  async getActivePlaces(): Promise<Place[]> {
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: 'active' }
    ];
    return this.query(filters);
  }

  async searchPlaces(searchTerm: string): Promise<Place[]> {
    // Note: Firebase doesn't support full-text search natively
    // This is a simplified implementation - in production, consider using
    // Algolia, Elasticsearch, or Firebase Extensions for full-text search
    const filters: QueryFilter[] = [
      { field: 'name', operator: '>=', value: searchTerm },
      { field: 'name', operator: '<=', value: searchTerm + '\uf8ff' }
    ];
    return this.query(filters);
  }

  async getPlacesWithOnlineOrders(): Promise<Place[]> {
    const filters: QueryFilter[] = [
      { field: 'settings.allowOnlineOrders', operator: '==', value: true },
      { field: 'status', operator: '==', value: 'active' }
    ];
    return this.query(filters);
  }

  async getByOwnerIdAndStatus(ownerId: string, status: Place['status']): Promise<Place[]> {
    const filters: QueryFilter[] = [
      { field: 'ownerId', operator: '==', value: ownerId },
      { field: 'status', operator: '==', value: status }
    ];
    return this.query(filters);
  }

  async getNearbyPlaces(latitude: number, longitude: number, radiusKm: number): Promise<Place[]> {
    // Note: This is a simplified implementation
    // For production, consider using GeoFirestore or similar geospatial libraries
    // This implementation would need to be enhanced with proper geospatial queries
    const filters: QueryFilter[] = [
      { field: 'address.coordinates.latitude', operator: '>=', value: latitude - (radiusKm / 111) }, // Rough conversion
      { field: 'address.coordinates.latitude', operator: '<=', value: latitude + (radiusKm / 111) },
      { field: 'address.coordinates.longitude', operator: '>=', value: longitude - (radiusKm / 111) },
      { field: 'address.coordinates.longitude', operator: '<=', value: longitude + (radiusKm / 111) }
    ];
    return this.query(filters);
  }

  async queryPlaces(filters: QueryFilter[]): Promise<Place[]> {
    return this.query(filters);
  }
}
