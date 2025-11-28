export interface AddonOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  isAvailable?: boolean;
  imageUrl?: string;
  maxQuantity?: number;
  defaultQuantity?: number;
  isDefault?: boolean;
}

export interface AddonGroup {
  id: string;
  name: string;
  description?: string;
  selectionType: 'single' | 'multiple' | 'quantity';
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  isActive?: boolean;
  menuId?: string;
  placeId?: string;
  appliesToCategoryIds?: string[];
  appliesToItemIds?: string[];
  options: AddonOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddonGroupCommand {
  name: string;
  description?: string;
  selectionType: 'single' | 'multiple' | 'quantity';
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  menuId?: string;
  placeId?: string;
  appliesToCategoryIds?: string[];
  appliesToItemIds?: string[];
  options: AddonOption[];
}

export interface UpdateAddonGroupCommand {
  id: string;
  name?: string;
  description?: string;
  selectionType?: 'single' | 'multiple' | 'quantity';
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  isActive?: boolean;
  menuId?: string;
  placeId?: string;
  appliesToCategoryIds?: string[];
  appliesToItemIds?: string[];
  options?: AddonOption[];
}

export interface AddonGroupQuery {
  placeId?: string;
  menuId?: string;
  categoryId?: string;
  itemId?: string;
  isActive?: boolean;
  search?: string;
}

