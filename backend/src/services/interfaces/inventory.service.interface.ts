import { Inventory, CreateInventoryCommand, UpdateInventoryCommand, InventoryQuery, InventoryAdjustment } from '../../entities/inventory.entity';

/**
 * Inventory Service Interface
 * Defines business logic operations for inventory management
 */
export interface IInventoryService {
  // CRUD operations
  createInventory(command: CreateInventoryCommand): Promise<Inventory>;
  updateInventory(command: UpdateInventoryCommand): Promise<Inventory>;
  deleteInventory(inventoryId: string): Promise<void>;
  getInventoryById(inventoryId: string): Promise<Inventory | null>;
  
  // Query operations
  getInventoryByPlaceId(placeId: string, branchId?: string): Promise<Inventory[]>;
  getInventoryByIngredientName(placeId: string, ingredientName: string, branchId?: string): Promise<Inventory | null>;
  getLowStockItems(placeId: string, branchId?: string): Promise<Inventory[]>;
  queryInventory(query: InventoryQuery): Promise<Inventory[]>;
  
  // Inventory adjustments
  adjustInventory(adjustment: InventoryAdjustment): Promise<Inventory>;
  reduceInventory(inventoryId: string, quantity: number, reason?: string): Promise<Inventory>;
  addInventory(inventoryId: string, quantity: number, reason?: string): Promise<Inventory>;
  
  // Business logic
  validateInventoryAvailability(inventoryId: string, requiredQuantity: number): Promise<boolean>;
  getAvailableQuantity(inventoryId: string): Promise<number>;
}

