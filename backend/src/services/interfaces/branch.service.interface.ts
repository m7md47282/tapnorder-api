import { Branch, CreateBranchCommand, UpdateBranchCommand, BranchQuery } from '../../entities/branch.entity';

/**
 * Branch Service Interface
 * Follows Interface Segregation Principle
 * Defines contract for branch business operations
 * Contains ALL business logic and validation
 */
export interface IBranchService {
  // Core CRUD Operations
  createBranch(command: CreateBranchCommand): Promise<Branch>;
  updateBranch(command: UpdateBranchCommand): Promise<Branch>;
  deleteBranch(branchId: string): Promise<void>;
  getBranchById(branchId: string): Promise<Branch | null>;
  
  // Business Operations
  getBranchesByPlace(placeId: string): Promise<Branch[]>;
  getActiveBranches(): Promise<Branch[]>;
  searchBranches(searchTerm: string): Promise<Branch[]>;
  getBranchesByLocation(city: string, state?: string): Promise<Branch[]>;
  getBranchesWithOnlineOrders(): Promise<Branch[]>;
  
  // Status Management
  activateBranch(branchId: string): Promise<void>;
  deactivateBranch(branchId: string): Promise<void>;
  suspendBranch(branchId: string, reason?: string): Promise<void>;
  
  // Business Validation
  validateBranchPlace(branchId: string, placeId: string): Promise<boolean>;
  canBranchAcceptOrders(branchId: string): Promise<boolean>;
  isBranchOpen(branchId: string): Promise<boolean>;
  
  // Advanced Queries
  queryBranches(query: BranchQuery): Promise<Branch[]>;
  getNearbyBranches(latitude: number, longitude: number, radiusKm: number): Promise<Branch[]>;
  
  // Business Rules
  validateBusinessHours(businessHours: Branch['businessHours']): boolean;
  validateAddress(address: Branch['address']): boolean;
  validateContact(contact: Branch['contact']): boolean;
}

