import { Branch } from '../../entities/branch.entity';
import { IBaseRepository } from '../base.repository';
import { QueryFilter } from '../types';

/**
 * Branch Repository Interface
 * Follows Interface Segregation Principle
 * Defines contract for branch data operations
 * Extends IBaseRepository for common CRUD operations
 */
export interface IBranchRepository extends IBaseRepository<Branch> {
  // Branch-specific queries
  getByPlaceId(placeId: string): Promise<Branch[]>;
  getByStatus(status: Branch['status']): Promise<Branch[]>;
  getByLocation(city: string, state?: string): Promise<Branch[]>;
  getActiveBranches(): Promise<Branch[]>;
  searchBranches(searchTerm: string): Promise<Branch[]>;
  getBranchesWithOnlineOrders(): Promise<Branch[]>;
  
  // Business-specific queries
  getByPlaceIdAndStatus(placeId: string, status: Branch['status']): Promise<Branch[]>;
  getNearbyBranches(latitude: number, longitude: number, radiusKm: number): Promise<Branch[]>;
  
  // Advanced filtering
  queryBranches(filters: QueryFilter[]): Promise<Branch[]>;
}

