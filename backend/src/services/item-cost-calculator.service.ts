import { Inventory } from '../entities/inventory.entity';
import { IInventoryService } from './interfaces/inventory.service.interface';
import { convertUnit, areUnitsCompatible } from '../shared/utils/unit-converter.util';

/**
 * Item Recipe Ingredient
 * Represents an ingredient in an item recipe
 */
export interface ItemRecipeIngredient {
  inventoryId: string;        // Reference to inventory item
  ingredientName: string;       // e.g., "Coffee"
  quantity: number;            // e.g., 9 (grams)
  unit: Inventory['unit'];     // e.g., "gram"
}

/**
 * Item Cost Calculation Result
 */
export interface ItemCostCalculation {
  calculatedCost: number;      // Total cost to make one unit
  availableUnits: number;      // How many units can be made with current inventory
  ingredientCosts: Array<{
    inventoryId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  limitingIngredient?: {
    inventoryId: string;
    ingredientName: string;
    availableQuantity: number;
    requiredQuantity: number;
  };
}

/**
 * Item Cost Calculator Service
 * Calculates item costs and available units based on inventory
 * All calculations happen in the backend
 */
export class ItemCostCalculatorService {
  private readonly inventoryService: IInventoryService;

  constructor(inventoryService: IInventoryService) {
    this.inventoryService = inventoryService;
  }

  /**
   * Calculate cost and available units for an item
   * @param recipe - Item recipe ingredients
   * @param placeId - Place ID
   * @param branchId - Optional branch ID
   * @returns Cost calculation result
   */
  async calculateItemCost(
    recipe: ItemRecipeIngredient[],
    placeId: string,
    branchId?: string
  ): Promise<ItemCostCalculation> {
    if (!recipe || recipe.length === 0) {
      throw new Error('Recipe cannot be empty');
    }

    const ingredientCosts: ItemCostCalculation['ingredientCosts'] = [];
    let totalCost = 0;
    let minAvailableUnits = Infinity;
    let limitingIngredient: ItemCostCalculation['limitingIngredient'] = undefined;

    // Process each ingredient in the recipe
    for (const recipeIngredient of recipe) {
      // Get inventory item
      const inventory = await this.inventoryService.getInventoryById(recipeIngredient.inventoryId);
      
      if (!inventory) {
        throw new Error(`Inventory item not found: ${recipeIngredient.inventoryId}`);
      }

      // Validate place/branch match
      if (inventory.placeId !== placeId) {
        throw new Error(`Inventory item does not belong to place: ${placeId}`);
      }

      if (branchId && inventory.branchId !== branchId) {
        // If branch-specific, must match
        if (inventory.branchId) {
          throw new Error(`Inventory item does not belong to branch: ${branchId}`);
        }
        // If inventory is shared (no branchId), it's OK
      }

      // Convert recipe quantity to inventory unit if needed
      let recipeQuantityInInventoryUnit = recipeIngredient.quantity;
      
      if (recipeIngredient.unit !== inventory.unit) {
        if (!areUnitsCompatible(recipeIngredient.unit, inventory.unit)) {
          throw new Error(
            `Cannot convert ${recipeIngredient.unit} to ${inventory.unit} for ingredient ${recipeIngredient.ingredientName}`
          );
        }
        recipeQuantityInInventoryUnit = convertUnit(
          recipeIngredient.quantity,
          recipeIngredient.unit,
          inventory.unit
        );
      }

      // Calculate cost for this ingredient
      const ingredientCost = recipeQuantityInInventoryUnit * inventory.costPerUnit;
      totalCost += ingredientCost;

      ingredientCosts.push({
        inventoryId: inventory.id,
        ingredientName: recipeIngredient.ingredientName,
        quantity: recipeQuantityInInventoryUnit,
        unit: inventory.unit,
        cost: ingredientCost
      });

      // Calculate available units for this ingredient
      const availableUnitsForIngredient = Math.floor(
        inventory.currentQuantity / recipeQuantityInInventoryUnit
      );

      // Track the limiting ingredient (the one with least available units)
      if (availableUnitsForIngredient < minAvailableUnits) {
        minAvailableUnits = availableUnitsForIngredient;
        limitingIngredient = {
          inventoryId: inventory.id,
          ingredientName: recipeIngredient.ingredientName,
          availableQuantity: inventory.currentQuantity,
          requiredQuantity: recipeQuantityInInventoryUnit
        };
      }
    }

    // If no limiting ingredient found (shouldn't happen), set to 0
    if (minAvailableUnits === Infinity) {
      minAvailableUnits = 0;
    }

    return {
      calculatedCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      availableUnits: Math.max(0, minAvailableUnits),
      ingredientCosts,
      limitingIngredient
    };
  }

  /**
   * Validate if enough inventory exists to make a quantity of items
   * @param recipe - Item recipe
   * @param quantity - Number of items to make
   * @param placeId - Place ID
   * @param branchId - Optional branch ID
   * @returns true if enough inventory, false otherwise
   */
  async validateInventoryForQuantity(
    recipe: ItemRecipeIngredient[],
    quantity: number,
    placeId: string,
    branchId?: string
  ): Promise<{ valid: boolean; missingIngredients?: Array<{ ingredientName: string; available: number; required: number }> }> {
    const missingIngredients: Array<{ ingredientName: string; available: number; required: number }> = [];

    for (const recipeIngredient of recipe) {
      const inventory = await this.inventoryService.getInventoryById(recipeIngredient.inventoryId);
      
      if (!inventory) {
        return { valid: false, missingIngredients: [{ ingredientName: recipeIngredient.ingredientName, available: 0, required: recipeIngredient.quantity * quantity }] };
      }

      // Convert units if needed
      let requiredQuantity = recipeIngredient.quantity * quantity;
      if (recipeIngredient.unit !== inventory.unit) {
        if (!areUnitsCompatible(recipeIngredient.unit, inventory.unit)) {
          return { valid: false, missingIngredients: [{ ingredientName: recipeIngredient.ingredientName, available: inventory.currentQuantity, required: requiredQuantity }] };
        }
        requiredQuantity = convertUnit(requiredQuantity, recipeIngredient.unit, inventory.unit);
      }

      if (inventory.currentQuantity < requiredQuantity) {
        missingIngredients.push({
          ingredientName: recipeIngredient.ingredientName,
          available: inventory.currentQuantity,
          required: requiredQuantity
        });
      }
    }

    return {
      valid: missingIngredients.length === 0,
      missingIngredients: missingIngredients.length > 0 ? missingIngredients : undefined
    };
  }

  /**
   * Calculate inventory reduction for an order
   * @param recipe - Item recipe
   * @param quantity - Number of items ordered
   * @param placeId - Place ID
   * @param branchId - Optional branch ID
   * @returns Array of inventory reductions to apply
   */
  async calculateInventoryReduction(
    recipe: ItemRecipeIngredient[],
    quantity: number,
    placeId: string,
    branchId?: string
  ): Promise<Array<{ inventoryId: string; quantity: number; unit: string }>> {
    const reductions: Array<{ inventoryId: string; quantity: number; unit: string }> = [];

    for (const recipeIngredient of recipe) {
      const inventory = await this.inventoryService.getInventoryById(recipeIngredient.inventoryId);
      
      if (!inventory) {
        throw new Error(`Inventory item not found: ${recipeIngredient.inventoryId}`);
      }

      // Convert units if needed
      let reductionQuantity = recipeIngredient.quantity * quantity;
      if (recipeIngredient.unit !== inventory.unit) {
        if (!areUnitsCompatible(recipeIngredient.unit, inventory.unit)) {
          throw new Error(`Cannot convert ${recipeIngredient.unit} to ${inventory.unit}`);
        }
        reductionQuantity = convertUnit(reductionQuantity, recipeIngredient.unit, inventory.unit);
      }

      reductions.push({
        inventoryId: inventory.id,
        quantity: reductionQuantity,
        unit: inventory.unit
      });
    }

    return reductions;
  }
}

