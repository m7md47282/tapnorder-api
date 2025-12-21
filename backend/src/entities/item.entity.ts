// ItemAddonGroup for inline addon group definitions in items
export interface ItemAddonGroup {
  groupId?: string; // Reference ID of the addon group (optional for inline definitions)
  name: string;
  description?: string;
  selectionType: 'single' | 'multiple' | 'quantity';
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  options: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    isAvailable?: boolean;
    imageUrl?: string;
    maxQuantity?: number;
    defaultQuantity?: number;
    isDefault?: boolean;
  }>;
}

/**
 * Item Recipe Ingredient
 * Represents an ingredient in an item recipe with quantity and unit
 */
export interface ItemRecipeIngredient {
  inventoryId: string;        // Reference to inventory item
  ingredientName: string;      // e.g., "Coffee", "Milk"
  quantity: number;           // e.g., 9 (grams), 0.2 (liters)
  unit: 'kilogram' | 'gram' | 'liter' | 'milliliter' | 'piece' | 'cup';
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;              // Selling price (can be set manually or calculated with markup)
  calculatedCost?: number;     // Auto-calculated cost from ingredients (backend only)
  availableUnits?: number;    // Auto-calculated: how many units can be made (backend only)
  categoryId: string; // Reference to the category this item belongs to
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number; // in minutes
  recipe?: ItemRecipeIngredient[]; // Structured recipe with quantities (replaces ingredients)
  ingredients?: string[];    // Legacy: kept for backward compatibility (display only)
  specs: {
    allergens?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  }
  menuId?: string; // Reference to the menu this item belongs to (optional)
  placeId?: string; // Reference to the place this item belongs to (optional)
  branchId?: string; // Reference to the branch this item belongs to (optional)
  addonGroups?: ItemAddonGroup[]; // Inline addon group definitions that can be selected with this item
  addonGroupIds?: string[]; // References to reusable addon groups
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemCommand {
  name: string;
  description?: string;
  price?: number;             // Optional: selling price (if not provided, will use calculatedCost * markup)
  categoryId: string; // Reference to the category this item belongs to
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  recipe?: ItemRecipeIngredient[]; // Recipe with ingredient quantities (required for cost calculation)
  ingredients?: string[];     // Legacy: kept for backward compatibility (display only)
  specs: {
    allergens?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  }
  menuId?: string;
  placeId?: string; // Reference to the place (will get menu by placeId if menuId not provided)
  branchId?: string; // Reference to the branch this item belongs to (optional)
  addonGroups?: ItemAddonGroup[]; // Inline addon group definitions available for this item
  addonGroupIds?: string[]; // References to reusable addon groups associated with this item
}

export interface UpdateItemCommand {
  id: string;
  name?: string;
  description?: string;
  price?: number;             // Optional: selling price
  categoryId?: string; // Reference to the category this item belongs to
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  recipe?: ItemRecipeIngredient[]; // Recipe with ingredient quantities
  ingredients?: string[];     // Legacy: kept for backward compatibility (display only)
  specs: {
    allergens?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  }
  addonGroups?: ItemAddonGroup[]; // Inline addon group definitions available for this item
  addonGroupIds?: string[]; // References to reusable addon groups associated with this item
  branchId?: string; // Reference to the branch this item belongs to (optional)
}

export interface ItemQuery {
  menuId?: string;
  placeId?: string; // Filter by place ID (will get menu by placeId, then items by menuId)
  branchId?: string; // Filter by branch ID
  categoryId?: string; // Filter by category ID
  isAvailable?: boolean;
  search?: string;
}
