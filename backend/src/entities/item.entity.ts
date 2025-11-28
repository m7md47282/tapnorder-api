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

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string; // Reference to the category this item belongs to
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number; // in minutes
  ingredients?: string[];
  specs: {
    allergens?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  }
  menuId?: string; // Reference to the menu this item belongs to (optional)
  addonGroups?: ItemAddonGroup[]; // Inline addon group definitions that can be selected with this item
  addonGroupIds?: string[]; // References to reusable addon groups
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemCommand {
  name: string;
  description?: string;
  price: number;
  categoryId: string; // Reference to the category this item belongs to
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  ingredients?: string[];
  specs: {
    allergens?: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  }
  menuId?: string;
  addonGroups?: ItemAddonGroup[]; // Inline addon group definitions available for this item
  addonGroupIds?: string[]; // References to reusable addon groups associated with this item
}

export interface UpdateItemCommand {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string; // Reference to the category this item belongs to
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  ingredients?: string[];
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
}

export interface ItemQuery {
  menuId?: string;
  categoryId?: string; // Filter by category ID
  isAvailable?: boolean;
  search?: string;
}
