import { Category, CreateCategoryCommand, UpdateCategoryCommand, CategoryQuery } from '../entities/category.entity';
import { IMenuService } from './interfaces/menu.service.interface';
import { MenuService } from './menu.service';
import { CategoryRepository, ICategoryRepository } from '../repositories/category/category.repository';
import { Menu } from '../repositories/menu/types';

export interface ICategoryService {
  createCategory(command: CreateCategoryCommand): Promise<Category>;
  updateCategory(command: UpdateCategoryCommand): Promise<Category>;
  deleteCategory(categoryId: string): Promise<void>;
  getCategoryById(categoryId: string): Promise<Category | null>;
  getAllCategories(): Promise<Category[]>;
  getCategoriesByMenuId(menuId: string): Promise<Category[]>;
  getActiveCategories(menuId?: string): Promise<Category[]>;
  searchCategories(menuId: string | undefined, searchTerm: string): Promise<Category[]>;
  queryCategories(query: CategoryQuery): Promise<Category[]>;
}

export class CategoryService implements ICategoryService {
  private readonly menuService: IMenuService;
  private readonly categoryRepository: ICategoryRepository;

  constructor(menuService?: IMenuService, categoryRepository?: ICategoryRepository) {
    this.menuService = menuService ?? new MenuService();
    this.categoryRepository = categoryRepository ?? new CategoryRepository();
  }

  async createCategory(command: CreateCategoryCommand): Promise<Category> {
    // Business validation
    this.validateCreateCommand(command);

    // Check if menu exists (only if menuId is provided)
    if (command.menuId) {
      const menu: Menu | null = await this.menuService.getMenuById(command.menuId);
      if (!menu) {
        throw new Error('Menu not found');
      }

      // Check if category with same name already exists in menu
      const existingCategories = await this.categoryRepository.getByMenuId(command.menuId);
      const duplicateCategory = existingCategories.find(category => 
        category.name.toLowerCase() === command.name.toLowerCase()
      );

      if (duplicateCategory) {
        throw new Error(`Category with name "${command.name}" already exists in this menu`);
      }
    }

    // Create new category
    const categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
      name: command.name,
      description: command.description,
      ...(command.menuId && { menuId: command.menuId }),
      displayOrder: command.displayOrder,
      isActive: command.isActive ?? true,
      imageUrl: command.imageUrl
    };

    const categoryId = await this.categoryRepository.create(categoryData as any);
    const createdCategory = await this.categoryRepository.getById(categoryId);
    
    if (!createdCategory) {
      throw new Error('Failed to create category');
    }

    return createdCategory;
  }

  async updateCategory(command: UpdateCategoryCommand): Promise<Category> {
    // Business validation
    this.validateUpdateCommand(command);

    // Check if category exists
    const existingCategory = await this.categoryRepository.getById(command.id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check for duplicate name if name is being updated (only if menuId exists)
    if (command.name && command.name !== existingCategory.name && existingCategory.menuId) {
      const existingCategories = await this.categoryRepository.getByMenuId(existingCategory.menuId);
      const duplicateCategory = existingCategories.find(category => 
        category.id !== command.id && 
        category.name.toLowerCase() === command.name!.toLowerCase()
      );

      if (duplicateCategory) {
        throw new Error(`Category with name "${command.name}" already exists in this menu`);
      }
    }

    // Update category
    const updateData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'menuId'>> = {
      ...(command.name !== undefined && { name: command.name }),
      ...(command.description !== undefined && { description: command.description }),
      ...(command.displayOrder !== undefined && { displayOrder: command.displayOrder }),
      ...(command.isActive !== undefined && { isActive: command.isActive }),
      ...(command.imageUrl !== undefined && { imageUrl: command.imageUrl })
    };

    await this.categoryRepository.update(command.id, updateData as any);
    
    const updatedCategory = await this.categoryRepository.getById(command.id);
    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }

    return updatedCategory;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Check if category exists
    const existingCategory = await this.categoryRepository.getById(categoryId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // TODO: Check if category has items before deleting
    // This would require checking items that reference this category

    await this.categoryRepository.delete(categoryId);
  }

  async getCategoryById(categoryId: string): Promise<Category | null> {
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    const category = await this.categoryRepository.getById(categoryId);
    return category ?? null;
  }

  async getCategoriesByMenuId(menuId: string): Promise<Category[]> {
    if (!menuId || menuId.trim() === '') {
      throw new Error('Menu ID is required');
    }

    return this.categoryRepository.getByMenuId(menuId);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.getAll();
  }

  async getActiveCategories(menuId?: string): Promise<Category[]> {
    if (menuId && menuId.trim() !== '') {
      return this.categoryRepository.getActiveCategories(menuId);
    }
    return this.categoryRepository.getAllActive();
  }

  async searchCategories(menuId: string | undefined, searchTerm: string): Promise<Category[]> {
    if (!searchTerm || searchTerm.trim() === '') {
      throw new Error('Search term is required');
    }

    if (menuId && menuId.trim() !== '') {
      return this.categoryRepository.searchCategories(menuId, searchTerm);
    }
    return this.categoryRepository.searchAll(searchTerm);
  }

  async queryCategories(query: CategoryQuery): Promise<Category[]> {
    if (query.menuId && !query.menuId.trim()) {
      throw new Error('Menu ID cannot be empty');
    }

    // If menuId is provided, filter by menu
    if (query.menuId) {
      if (query.search) {
        return this.searchCategories(query.menuId, query.search);
      }
      if (query.isActive !== undefined) {
        return query.isActive 
          ? this.getActiveCategories(query.menuId)
          : this.getCategoriesByMenuId(query.menuId);
      }
      return this.getCategoriesByMenuId(query.menuId);
    }

    // If no menuId provided, query all categories (with optional filters)
    if (query.search) {
      return this.searchCategories(undefined, query.search);
    }
    if (query.isActive !== undefined) {
      return query.isActive 
        ? this.getActiveCategories()
        : this.getAllCategories();
    }
    return this.getAllCategories();
  }

  private validateCreateCommand(command: CreateCategoryCommand): void {
    if (!command.name || command.name.trim() === '') {
      throw new Error('Category name is required');
    }
    // menuId is now optional, so we don't validate it
    if (command.displayOrder !== undefined && command.displayOrder < 0) {
      throw new Error('Display order must be a non-negative number');
    }
  }

  private validateUpdateCommand(command: UpdateCategoryCommand): void {
    if (!command.id || command.id.trim() === '') {
      throw new Error('Category ID is required');
    }
    if (command.name !== undefined && command.name.trim() === '') {
      throw new Error('Category name cannot be empty');
    }
    if (command.displayOrder !== undefined && command.displayOrder < 0) {
      throw new Error('Display order must be a non-negative number');
    }
  }
}

