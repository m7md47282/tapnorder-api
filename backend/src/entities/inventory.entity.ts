import { BaseModel } from '../repositories/types';

/**
 * Inventory Unit Types
 * Standard units for ingredient measurement
 */
export type InventoryUnit = 
  | 'kilogram'    // kg
  | 'gram'        // g
  | 'liter'       // L
  | 'milliliter'  // mL
  | 'piece'       // pcs
  | 'cup';        // cup

/**
 * Inventory Entity
 * Represents ingredient inventory for a place/branch
 */
export interface Inventory extends BaseModel {
  placeId: string;              // Place this inventory belongs to
  branchId?: string;             // Optional: branch-specific inventory
  ingredientName: string;        // e.g., "Milk", "Coffee", "Sugar"
  unit: InventoryUnit;           // Unit of measurement
  currentQuantity: number;       // Current stock quantity
  costPerUnit: number;           // Cost per unit (e.g., cost per liter, cost per kilo)
  minStockLevel?: number;        // Alert when below this level
  supplier?: string;             // Supplier information
  lastRestocked?: Date;          // Last restock date
  notes?: string;                // Additional notes
}

/**
 * Create Inventory Command
 */
export interface CreateInventoryCommand {
  placeId: string;
  branchId?: string;
  ingredientName: string;
  unit: InventoryUnit;
  currentQuantity: number;
  costPerUnit: number;
  minStockLevel?: number;
  supplier?: string;
  notes?: string;
}

/**
 * Update Inventory Command
 */
export interface UpdateInventoryCommand {
  id: string;
  ingredientName?: string;
  unit?: InventoryUnit;
  currentQuantity?: number;
  costPerUnit?: number;
  minStockLevel?: number;
  supplier?: string;
  lastRestocked?: Date;
  notes?: string;
}

/**
 * Inventory Query
 */
export interface InventoryQuery {
  placeId?: string;
  branchId?: string;
  ingredientName?: string;
  unit?: InventoryUnit;
  lowStock?: boolean;            // Filter for items below minStockLevel
  search?: string;                // Search by ingredient name
}

/**
 * Inventory Adjustment
 * For restocking or adjusting inventory quantities
 */
export interface InventoryAdjustment {
  inventoryId: string;
  quantity: number;               // Positive for adding, negative for subtracting
  reason: 'restock' | 'adjustment' | 'waste' | 'damage' | 'other';
  notes?: string;
  adjustedBy: string;             // User ID who made the adjustment
}

