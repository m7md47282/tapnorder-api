export interface Category {
  id: string;
  name: string;
  description?: string;
  menuId?: string; // Reference to the menu this category belongs to (optional)
  placeId?: string; // Reference to the place this category belongs to (optional)
  branchId?: string; // Reference to the branch this category belongs to (optional)
  displayOrder?: number; // Order in which category appears in menu
  isActive: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryCommand {
  name: string;
  description?: string;
  menuId?: string; // Optional - can create category without menuId
  placeId: string; // Reference to the place (required - will get menu by placeId if menuId not provided)
  branchId?: string; // Reference to the branch this category belongs to (optional)
  displayOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
}

export interface UpdateCategoryCommand {
  id: string;
  name?: string;
  description?: string;
  placeId: string; // Reference to the place (required)
  branchId?: string; // Reference to the branch this category belongs to (optional)
  displayOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
}

export interface CategoryQuery {
  menuId?: string;
  placeId: string; // Filter by place ID (required - will get menu by placeId, then categories by menuId)
  branchId?: string; // Filter by branch ID (only return categories that have items in this branch)
  isActive?: boolean;
  search?: string;
}

