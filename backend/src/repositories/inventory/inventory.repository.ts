import { BaseRepository } from '../base.repository';
import { Inventory } from '../../entities/inventory.entity';
import { IInventoryRepository } from '../interfaces/inventory.repository.interface';
import { QueryFilter } from '../types';

/**
 * Inventory Repository
 * Handles data access for inventory operations
 * NO business logic - only data persistence
 */
export class InventoryRepository extends BaseRepository<Inventory> implements IInventoryRepository {
  constructor() {
    super('inventory');
  }

  async getByPlaceId(placeId: string): Promise<Inventory[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    return this.query(filters);
  }

  async getByBranchId(branchId: string): Promise<Inventory[]> {
    const filters: QueryFilter[] = [
      { field: 'branchId', operator: '==', value: branchId }
    ];
    return this.query(filters);
  }

  async getByPlaceIdAndBranchId(placeId: string, branchId: string): Promise<Inventory[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'branchId', operator: '==', value: branchId }
    ];
    return this.query(filters);
  }

  async getByIngredientName(placeId: string, ingredientName: string, branchId?: string): Promise<Inventory | null> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'ingredientName', operator: '==', value: ingredientName }
    ];
    
    if (branchId) {
      filters.push({ field: 'branchId', operator: '==', value: branchId });
    } else {
      // If no branchId, get shared inventory (branchId is null/undefined)
      filters.push({ field: 'branchId', operator: '==', value: null });
    }
    
    return this.queryOne(filters);
  }

  async getLowStockItems(placeId: string, branchId?: string): Promise<Inventory[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    
    if (branchId) {
      filters.push({ field: 'branchId', operator: '==', value: branchId });
    }
    
    const allInventory = await this.query(filters);
    
    // Filter items where currentQuantity < minStockLevel
    return allInventory.filter(inv => 
      inv.minStockLevel !== undefined && 
      inv.currentQuantity < inv.minStockLevel
    );
  }

  async searchByIngredientName(placeId: string, searchTerm: string, branchId?: string): Promise<Inventory[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    
    if (branchId) {
      filters.push({ field: 'branchId', operator: '==', value: branchId });
    }
    
    const allInventory = await this.query(filters);
    const searchLower = searchTerm.toLowerCase();
    
    return allInventory.filter(inv => 
      inv.ingredientName.toLowerCase().includes(searchLower)
    );
  }

  async queryInventory(filters: QueryFilter[]): Promise<Inventory[]> {
    return this.query(filters);
  }
}

