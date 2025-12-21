import { Category, CreateCategoryCommand, UpdateCategoryCommand, CategoryQuery } from '../entities/category.entity';
import { IMenuService } from './interfaces/menu.service.interface';
import { MenuService } from './menu.service';
import { CategoryRepository, ICategoryRepository } from '../repositories/category/category.repository';
import { ItemRepository, IItemRepository } from '../repositories/item/item.repository';
import { IBranchService } from './interfaces/branch.service.interface';
import { BranchService } from './branch.service';

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
  private readonly itemRepository: IItemRepository;
  private readonly branchService: IBranchService;

  constructor(
    menuService?: IMenuService, 
    categoryRepository?: ICategoryRepository,
    itemRepository?: IItemRepository,
    branchService?: IBranchService
  ) {
    this.menuService = menuService ?? new MenuService();
    this.categoryRepository = categoryRepository ?? new CategoryRepository();
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.branchService = branchService ?? new BranchService();
  }

  async createCategory(command: CreateCategoryCommand): Promise<Category> {
    // Business validation
    this.validateCreateCommand(command);

    // Handle placeId: Get menu by placeId if placeId is provided and menuId is not
    let effectiveMenuId = command.menuId;
    let effectivePlaceId = command.placeId;

    if (command.placeId && !command.menuId) {
      const menu = await this.menuService.getMenuByPlaceId(command.placeId);
      if (!menu) {
        // Menu not found - allow creating category without menuId (menuId is optional)
        effectiveMenuId = undefined;
      } else {
        effectiveMenuId = menu.id;
        effectivePlaceId = menu.placeId;
      }
    } else if (command.menuId && command.placeId) {
      // If both are provided, validate they match
      const menu = await this.menuService.getMenuById(command.menuId);
      if (!menu) {
        throw new Error('Menu not found');
      }
      if (menu.placeId !== command.placeId) {
        throw new Error(`Menu does not belong to place ID: ${command.placeId}`);
      }
      effectivePlaceId = menu.placeId;
    } else if (command.menuId) {
      // Get placeId from menu
      const menu = await this.menuService.getMenuById(command.menuId);
      if (!menu) {
        throw new Error('Menu not found');
      }
      effectivePlaceId = menu.placeId;
    }

    // Validate branch belongs to place (if both are provided)
    if (command.branchId && effectivePlaceId) {
      const isValid = await this.branchService.validateBranchPlace(command.branchId, effectivePlaceId);
      if (!isValid) {
        throw new Error(`Branch ID ${command.branchId} does not belong to place ID ${effectivePlaceId}`);
      }
    }

    // Check for duplicate categories
    // If branchId is provided, check in that branch; otherwise check in menu (if menuId exists)
    if (command.branchId && effectiveMenuId) {
      // Check for duplicate in the same branch
      const existingCategories = await this.categoryRepository.getByMenuIdAndBranchId(effectiveMenuId, command.branchId);
      const duplicateCategory = existingCategories.find(category => 
        category.name.toLowerCase() === command.name.toLowerCase()
      );

      if (duplicateCategory) {
        throw new Error(`Category with name "${command.name}" already exists in this branch`);
      }
    } else if (command.branchId && !effectiveMenuId) {
      // Check for duplicate in branch (no menuId)
      const existingCategories = await this.categoryRepository.getByBranchId(command.branchId);
      const duplicateCategory = existingCategories.find(category => 
        category.name.toLowerCase() === command.name.toLowerCase()
      );

      if (duplicateCategory) {
        throw new Error(`Category with name "${command.name}" already exists in this branch`);
      }
    } else if (effectiveMenuId) {
      // Check for duplicate in menu (no branchId - shared category)
      const existingCategories = await this.categoryRepository.getByMenuId(effectiveMenuId);
      const duplicateCategory = existingCategories.find(category => 
        category.name.toLowerCase() === command.name.toLowerCase() &&
        !category.branchId // Only check shared categories (no branchId)
      );

      if (duplicateCategory) {
        throw new Error(`Category with name "${command.name}" already exists in this menu`);
      }
    }

    // Create new category
    const categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
      name: command.name,
      description: command.description,
      ...(effectiveMenuId && { menuId: effectiveMenuId }),
      ...(effectivePlaceId && { placeId: effectivePlaceId }),
      ...(command.branchId && { branchId: command.branchId }),
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

    // Validate placeId: Get menu by placeId and verify category belongs to that place
    let effectiveMenuId = existingCategory.menuId;
    let effectivePlaceId = command.placeId;
    
    if (command.placeId) {
      const menu = await this.menuService.getMenuByPlaceId(command.placeId);
      if (!menu) {
        throw new Error(`Menu not found for place ID: ${command.placeId}`);
      }

      // If category has a menuId, verify it matches the menu from placeId
      if (existingCategory.menuId && existingCategory.menuId !== menu.id) {
        throw new Error(`Category does not belong to place ID: ${command.placeId}`);
      }

      effectiveMenuId = menu.id;
      effectivePlaceId = menu.placeId;
    } else if (existingCategory.menuId) {
      // Get placeId from menu if not provided
      const menu = await this.menuService.getMenuById(existingCategory.menuId);
      if (menu) {
        effectivePlaceId = menu.placeId;
      }
    }

    // Check for duplicate name if name is being updated (only if menuId exists)
    if (command.name && command.name !== existingCategory.name && effectiveMenuId) {
      const existingCategories = await this.categoryRepository.getByMenuId(effectiveMenuId);
      const duplicateCategory = existingCategories.find(category => 
        category.id !== command.id && 
        category.name.toLowerCase() === command.name!.toLowerCase()
      );

      if (duplicateCategory) {
        throw new Error(`Category with name "${command.name}" already exists in this menu`);
      }
    }

    // Validate branchId if provided
    if (command.branchId && effectivePlaceId) {
      const isValid = await this.branchService.validateBranchPlace(command.branchId, effectivePlaceId);
      if (!isValid) {
        throw new Error(`Branch ID ${command.branchId} does not belong to place ID ${effectivePlaceId}`);
      }
    }

    // Update category
    const updateData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'menuId'>> = {
      ...(command.name !== undefined && { name: command.name }),
      ...(command.description !== undefined && { description: command.description }),
      ...(command.displayOrder !== undefined && { displayOrder: command.displayOrder }),
      ...(command.isActive !== undefined && { isActive: command.isActive }),
      ...(command.imageUrl !== undefined && { imageUrl: command.imageUrl }),
      ...(command.branchId !== undefined && { branchId: command.branchId }),
      ...(effectivePlaceId && { placeId: effectivePlaceId })
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
    if (!query.placeId || !query.placeId.trim()) {
      throw new Error('Place ID is required');
    }
    if (query.menuId && !query.menuId.trim()) {
      throw new Error('Menu ID cannot be empty');
    }

    // Handle placeId: Get menu by placeId first, then use menuId for filtering
    let effectiveMenuId = query.menuId;
    const menu = await this.menuService.getMenuByPlaceId(query.placeId);
    if (menu) {
      effectiveMenuId = menu.id;
    }

    // Get base categories
    let categories: Category[] = [];

    // If we have menuId (either from query or from placeId), start with menu categories
    if (effectiveMenuId) {
      // Handle branchId filter with menuId
      if (query.branchId) {
        // Get both branch-specific categories AND shared categories (categories without branchId)
        const branchSpecificCategories = await this.categoryRepository.getByMenuIdAndBranchId(effectiveMenuId, query.branchId);
        const sharedCategories = await this.categoryRepository.getSharedCategoriesByMenuId(effectiveMenuId);
        
        // Combine both sets and remove duplicates by ID
        const categoryMap = new Map<string, Category>();
        [...branchSpecificCategories, ...sharedCategories].forEach(category => {
          categoryMap.set(category.id, category);
        });
        categories = Array.from(categoryMap.values());
      } else {
        // No branchId filter - get all categories for the menu (both shared and branch-specific)
        categories = await this.categoryRepository.getByMenuId(effectiveMenuId);
      }

      // Apply search filter if provided
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        categories = categories.filter(category => 
          category.name.toLowerCase().includes(searchLower) ||
          category.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply isActive filter if provided
      if (query.isActive !== undefined) {
        categories = categories.filter(category => category.isActive === query.isActive);
      }
    } else {
      // No menu found - query categories directly by placeId
      categories = await this.categoryRepository.getByPlaceId(query.placeId);
      
      // Apply branchId filter if provided
      if (query.branchId) {
        categories = categories.filter(category => category.branchId === query.branchId);
      }
      
      // Apply search filter if provided
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        categories = categories.filter(category => 
          category.name.toLowerCase().includes(searchLower) ||
          category.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply isActive filter if provided
      if (query.isActive !== undefined) {
        categories = categories.filter(category => category.isActive === query.isActive);
      }
    }

    return categories;
  }

  private validateCreateCommand(command: CreateCategoryCommand): void {
    if (!command.name || command.name.trim() === '') {
      throw new Error('Category name is required');
    }
    if (!command.placeId || command.placeId.trim() === '') {
      throw new Error('Place ID is required');
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
    if (!command.placeId || command.placeId.trim() === '') {
      throw new Error('Place ID is required');
    }
    if (command.name !== undefined && command.name.trim() === '') {
      throw new Error('Category name cannot be empty');
    }
    if (command.displayOrder !== undefined && command.displayOrder < 0) {
      throw new Error('Display order must be a non-negative number');
    }
  }
}

