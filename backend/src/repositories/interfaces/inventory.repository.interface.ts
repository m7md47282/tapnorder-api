import { Inventory, InventoryQuery } from '../../entities/inventory.entity';
import { IBaseRepository } from '../base.repository';
import { QueryFilter } from '../types';

/**
 * Inventory Repository Interface
 * Follows Interface Segregation Principle
 */
export interface IInventoryRepository extends IBaseRepository<Inventory> {
  // Inventory-specific queries
  getByPlaceId(placeId: string): Promise<Inventory[]>;
  getByBranchId(branchId: string): Promise<Inventory[]>;
  getByPlaceIdAndBranchId(placeId: string, branchId: string): Promise<Inventory[]>;
  getByIngredientName(placeId: string, ingredientName: string, branchId?: string): Promise<Inventory | null>;
  getLowStockItems(placeId: string, branchId?: string): Promise<Inventory[]>;
  searchByIngredientName(placeId: string, searchTerm: string, branchId?: string): Promise<Inventory[]>;
  queryInventory(filters: QueryFilter[]): Promise<Inventory[]>;
}

