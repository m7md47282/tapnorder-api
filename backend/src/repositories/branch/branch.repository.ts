import { BaseRepository } from '../base.repository';
import { Branch } from '../../entities/branch.entity';
import { IBranchRepository } from '../interfaces/branch.repository.interface';
import { QueryFilter } from '../types';

/**
 * Branch Repository - Extends BaseRepository, Implements IBranchRepository
 * Follows SOLID principles and Clean Architecture
 * NO business logic - only data access operations
 * Uses Firebase directly for data persistence
 */
export class BranchRepository extends BaseRepository<Branch> implements IBranchRepository {
  constructor() {
    super('branches');
  }

  async getByPlaceId(placeId: string): Promise<Branch[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    return this.query(filters);
  }

  async getByStatus(status: Branch['status']): Promise<Branch[]> {
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: status }
    ];
    return this.query(filters);
  }

  async getByLocation(city: string, state?: string): Promise<Branch[]> {
    const filters: QueryFilter[] = [
      { field: 'address.city', operator: '==', value: city }
    ];
    
    if (state) {
      filters.push({ field: 'address.state', operator: '==', value: state });
    }
    
    return this.query(filters);
  }

  async getActiveBranches(): Promise<Branch[]> {
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: 'active' }
    ];
    return this.query(filters);
  }

  async searchBranches(searchTerm: string): Promise<Branch[]> {
    // Note: Firebase doesn't support full-text search natively
    // This is a simplified implementation - in production, consider using
    // Algolia, Elasticsearch, or Firebase Extensions for full-text search
    const filters: QueryFilter[] = [
      { field: 'name', operator: '>=', value: searchTerm },
      { field: 'name', operator: '<=', value: searchTerm + '\uf8ff' }
    ];
    return this.query(filters);
  }

  async getBranchesWithOnlineOrders(): Promise<Branch[]> {
    const filters: QueryFilter[] = [
      { field: 'settings.allowOnlineOrders', operator: '==', value: true },
      { field: 'status', operator: '==', value: 'active' }
    ];
    return this.query(filters);
  }

  async getByPlaceIdAndStatus(placeId: string, status: Branch['status']): Promise<Branch[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'status', operator: '==', value: status }
    ];
    return this.query(filters);
  }

  async getNearbyBranches(latitude: number, longitude: number, radiusKm: number): Promise<Branch[]> {
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

  async queryBranches(filters: QueryFilter[]): Promise<Branch[]> {
    return this.query(filters);
  }
}

