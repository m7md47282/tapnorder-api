export interface Category {
  id: string;
  name: string;
  description?: string;
  menuId?: string; // Reference to the menu this category belongs to (optional)
  displayOrder?: number; // Order in which category appears in menu
  isActive: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryCommand {
  name: string;
  description?: string;
  menuId?: string;
  displayOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
}

export interface UpdateCategoryCommand {
  id: string;
  name?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
}

export interface CategoryQuery {
  menuId?: string;
  isActive?: boolean;
  search?: string;
}

