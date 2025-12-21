import { Inventory, CreateInventoryCommand, UpdateInventoryCommand, InventoryQuery, InventoryAdjustment } from '../entities/inventory.entity';
import { IInventoryRepository } from '../repositories/interfaces/inventory.repository.interface';
import { InventoryRepository } from '../repositories/inventory/inventory.repository';
import { IInventoryService } from './interfaces/inventory.service.interface';
import { QueryFilter } from '../repositories/types';

/**
 * Inventory Service - Contains ALL business logic and validation
 * Follows SOLID principles and Clean Architecture
 * Uses repository for data access ONLY
 */
export class InventoryService implements IInventoryService {
  private readonly inventoryRepository: IInventoryRepository;

  constructor(inventoryRepository?: IInventoryRepository) {
    this.inventoryRepository = inventoryRepository ?? new InventoryRepository();
  }

  async createInventory(command: CreateInventoryCommand): Promise<Inventory> {
    // Business validation
    this.validateCreateCommand(command);

    // Check if inventory with same ingredient name already exists for this place/branch
    const existing = await this.inventoryRepository.getByIngredientName(
      command.placeId,
      command.ingredientName,
      command.branchId
    );

    if (existing) {
      throw new Error(
        `Inventory item "${command.ingredientName}" already exists for this ${command.branchId ? 'branch' : 'place'}`
      );
    }

    // Create inventory
    const inventoryData: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'> = {
      placeId: command.placeId,
      branchId: command.branchId,
      ingredientName: command.ingredientName,
      unit: command.unit,
      currentQuantity: command.currentQuantity,
      costPerUnit: command.costPerUnit,
      minStockLevel: command.minStockLevel,
      supplier: command.supplier,
      notes: command.notes
    };

    const inventoryId = await this.inventoryRepository.create(inventoryData);
    const createdInventory = await this.inventoryRepository.getById(inventoryId);

    if (!createdInventory) {
      throw new Error('Failed to create inventory');
    }

    return createdInventory;
  }

  async updateInventory(command: UpdateInventoryCommand): Promise<Inventory> {
    // Business validation
    this.validateUpdateCommand(command);

    // Check if inventory exists
    const existing = await this.inventoryRepository.getById(command.id);
    if (!existing) {
      throw new Error('Inventory not found');
    }

    // Update inventory
    const updateData: Partial<Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>> = {
      ...(command.ingredientName !== undefined && { ingredientName: command.ingredientName }),
      ...(command.unit !== undefined && { unit: command.unit }),
      ...(command.currentQuantity !== undefined && { currentQuantity: command.currentQuantity }),
      ...(command.costPerUnit !== undefined && { costPerUnit: command.costPerUnit }),
      ...(command.minStockLevel !== undefined && { minStockLevel: command.minStockLevel }),
      ...(command.supplier !== undefined && { supplier: command.supplier }),
      ...(command.lastRestocked !== undefined && { lastRestocked: command.lastRestocked }),
      ...(command.notes !== undefined && { notes: command.notes })
    };

    await this.inventoryRepository.update(command.id, updateData);
    const updatedInventory = await this.inventoryRepository.getById(command.id);

    if (!updatedInventory) {
      throw new Error('Failed to retrieve updated inventory');
    }

    return updatedInventory;
  }

  async deleteInventory(inventoryId: string): Promise<void> {
    if (!inventoryId || inventoryId.trim() === '') {
      throw new Error('Inventory ID is required');
    }

    const existing = await this.inventoryRepository.getById(inventoryId);
    if (!existing) {
      throw new Error('Inventory not found');
    }

    await this.inventoryRepository.delete(inventoryId);
  }

  async getInventoryById(inventoryId: string): Promise<Inventory | null> {
    if (!inventoryId || inventoryId.trim() === '') {
      throw new Error('Inventory ID is required');
    }

    return await this.inventoryRepository.getById(inventoryId);
  }

  async getInventoryByPlaceId(placeId: string, branchId?: string): Promise<Inventory[]> {
    if (!placeId || placeId.trim() === '') {
      throw new Error('Place ID is required');
    }

    if (branchId) {
      return await this.inventoryRepository.getByPlaceIdAndBranchId(placeId, branchId);
    }
    return await this.inventoryRepository.getByPlaceId(placeId);
  }

  async getInventoryByIngredientName(placeId: string, ingredientName: string, branchId?: string): Promise<Inventory | null> {
    if (!placeId || placeId.trim() === '') {
      throw new Error('Place ID is required');
    }
    if (!ingredientName || ingredientName.trim() === '') {
      throw new Error('Ingredient name is required');
    }

    return await this.inventoryRepository.getByIngredientName(placeId, ingredientName, branchId);
  }

  async getLowStockItems(placeId: string, branchId?: string): Promise<Inventory[]> {
    if (!placeId || placeId.trim() === '') {
      throw new Error('Place ID is required');
    }

    return await this.inventoryRepository.getLowStockItems(placeId, branchId);
  }

  async queryInventory(query: InventoryQuery): Promise<Inventory[]> {
    const filters: QueryFilter[] = [];

    if (query.placeId) {
      filters.push({ field: 'placeId', operator: '==', value: query.placeId });
    }

    if (query.branchId) {
      filters.push({ field: 'branchId', operator: '==', value: query.branchId });
    }

    if (query.ingredientName) {
      filters.push({ field: 'ingredientName', operator: '==', value: query.ingredientName });
    }

    if (query.unit) {
      filters.push({ field: 'unit', operator: '==', value: query.unit });
    }

    let results = await this.inventoryRepository.queryInventory(filters);

    // Apply low stock filter if requested
    if (query.lowStock) {
      results = results.filter(inv => 
        inv.minStockLevel !== undefined && inv.currentQuantity < inv.minStockLevel
      );
    }

    // Apply search filter if requested
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(inv => 
        inv.ingredientName.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  async adjustInventory(adjustment: InventoryAdjustment): Promise<Inventory> {
    if (!adjustment.inventoryId || adjustment.inventoryId.trim() === '') {
      throw new Error('Inventory ID is required');
    }

    if (adjustment.quantity === 0) {
      throw new Error('Adjustment quantity cannot be zero');
    }

    const inventory = await this.inventoryRepository.getById(adjustment.inventoryId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const newQuantity = inventory.currentQuantity + adjustment.quantity;

    if (newQuantity < 0) {
      throw new Error(`Insufficient inventory. Available: ${inventory.currentQuantity}, Requested: ${Math.abs(adjustment.quantity)}`);
    }

    // Update inventory
    const updateData: Partial<Inventory> = {
      currentQuantity: newQuantity,
      lastRestocked: adjustment.reason === 'restock' ? new Date() : inventory.lastRestocked,
      notes: adjustment.notes || inventory.notes
    };

    await this.inventoryRepository.update(adjustment.inventoryId, updateData);
    const updated = await this.inventoryRepository.getById(adjustment.inventoryId);

    if (!updated) {
      throw new Error('Failed to retrieve updated inventory');
    }

    return updated;
  }

  async reduceInventory(inventoryId: string, quantity: number, reason?: string): Promise<Inventory> {
    if (quantity <= 0) {
      throw new Error('Reduction quantity must be positive');
    }

    return this.adjustInventory({
      inventoryId,
      quantity: -quantity,
      reason: reason as InventoryAdjustment['reason'] || 'adjustment',
      notes: reason ? `Reduced: ${reason}` : undefined,
      adjustedBy: 'system' // TODO: Get from user context
    });
  }

  async addInventory(inventoryId: string, quantity: number, reason?: string): Promise<Inventory> {
    if (quantity <= 0) {
      throw new Error('Addition quantity must be positive');
    }

    return this.adjustInventory({
      inventoryId,
      quantity,
      reason: 'restock',
      notes: reason ? `Restocked: ${reason}` : undefined,
      adjustedBy: 'system' // TODO: Get from user context
    });
  }

  async validateInventoryAvailability(inventoryId: string, requiredQuantity: number): Promise<boolean> {
    const inventory = await this.inventoryRepository.getById(inventoryId);
    if (!inventory) {
      return false;
    }

    return inventory.currentQuantity >= requiredQuantity;
  }

  async getAvailableQuantity(inventoryId: string): Promise<number> {
    const inventory = await this.inventoryRepository.getById(inventoryId);
    if (!inventory) {
      return 0;
    }

    return inventory.currentQuantity;
  }

  // Private validation methods
  private validateCreateCommand(command: CreateInventoryCommand): void {
    if (!command.placeId || command.placeId.trim() === '') {
      throw new Error('Place ID is required');
    }
    if (!command.ingredientName || command.ingredientName.trim() === '') {
      throw new Error('Ingredient name is required');
    }
    if (!command.unit) {
      throw new Error('Unit is required');
    }
    if (command.currentQuantity === undefined || command.currentQuantity < 0) {
      throw new Error('Current quantity must be a non-negative number');
    }
    if (command.costPerUnit === undefined || command.costPerUnit < 0) {
      throw new Error('Cost per unit must be a non-negative number');
    }
    if (command.minStockLevel !== undefined && command.minStockLevel < 0) {
      throw new Error('Minimum stock level must be a non-negative number');
    }
  }

  private validateUpdateCommand(command: UpdateInventoryCommand): void {
    if (!command.id || command.id.trim() === '') {
      throw new Error('Inventory ID is required');
    }
    if (command.currentQuantity !== undefined && command.currentQuantity < 0) {
      throw new Error('Current quantity must be a non-negative number');
    }
    if (command.costPerUnit !== undefined && command.costPerUnit < 0) {
      throw new Error('Cost per unit must be a non-negative number');
    }
    if (command.minStockLevel !== undefined && command.minStockLevel < 0) {
      throw new Error('Minimum stock level must be a non-negative number');
    }
  }
}

