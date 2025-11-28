import { Item, CreateItemCommand, UpdateItemCommand, ItemQuery } from '../entities/item.entity';
import { IMenuService } from './interfaces/menu.service.interface';
import { MenuService } from './menu.service';
import { ItemRepository, IItemRepository } from '../repositories/item/item.repository';
import { Menu } from '../repositories/menu/types';
import { IAddonGroupService } from './addon-group.service';
import { AddonGroupService } from './addon-group.service';

export interface IItemService {
  createItem(command: CreateItemCommand): Promise<Item>;
  updateItem(command: UpdateItemCommand): Promise<Item>;
  deleteItem(itemId: string): Promise<void>;
  getItemById(itemId: string): Promise<Item | null>;
  getItemsByMenuId(menuId?: string): Promise<Item[]>;
  getItemsByCategoryId(menuId: string | undefined, categoryId: string): Promise<Item[]>;
  getAvailableItems(menuId?: string): Promise<Item[]>;
  searchItems(menuId: string | undefined, searchTerm: string): Promise<Item[]>;
  queryItems(query: ItemQuery): Promise<Item[]>;
}

export class ItemService implements IItemService {
  private readonly menuService: IMenuService;
  private readonly itemRepository: IItemRepository;
  private readonly addonGroupService: IAddonGroupService;

  constructor(
    menuService?: IMenuService, 
    itemRepository?: IItemRepository,
    addonGroupService?: IAddonGroupService
  ) {
    this.menuService = menuService ?? new MenuService();
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.addonGroupService = addonGroupService ?? new AddonGroupService();
  }

  async createItem(command: CreateItemCommand): Promise<Item> {
    // Business validation
    this.validateCreateCommand(command);

    // Check if menu exists (only if menuId is provided)
    if (command.menuId) {
      const menu: Menu | null = await this.menuService.getMenuById(command.menuId);
      if (!menu) {
        throw new Error('Menu not found');
      }
      
      // Check if item with same name already exists in menu
      const existingItems = await this.itemRepository.getByMenuId(command.menuId);
      const duplicateItem = existingItems.find(item => 
        item.name.toLowerCase() === command.name.toLowerCase()
      );

      if (duplicateItem) {
        throw new Error(`Item with name "${command.name}" already exists in this menu`);
      }
    }

    // Validate addonGroupIds if provided
    if (command.addonGroupIds && command.addonGroupIds.length > 0) {
      await this.validateAddonGroupIds(command.addonGroupIds);
    }

    // Validate inline addonGroups if provided
    if (command.addonGroups && command.addonGroups.length > 0) {
      this.validateItemAddonGroups(command.addonGroups);
    }

    // Create new item - filter out undefined values
    const itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> = {
      name: command.name,
      description: command.description,
      price: command.price,
      isAvailable: command.isAvailable ?? true,
      categoryId: command.categoryId,
      imageUrl: command.imageUrl,
      preparationTime: command.preparationTime,
      ingredients: command.ingredients,
      specs: command.specs,
      ...(command.menuId && { menuId: command.menuId }),
      ...(command.addonGroups && { addonGroups: command.addonGroups }),
      ...(command.addonGroupIds && { addonGroupIds: command.addonGroupIds })
    };

    const itemId = await this.itemRepository.create(itemData as any);
    const createdItem = await this.itemRepository.getById(itemId);
    
    if (!createdItem) {
      throw new Error('Failed to create item');
    }

    return createdItem;
  }

  async updateItem(command: UpdateItemCommand): Promise<Item> {
    // Business validation
    this.validateUpdateCommand(command);

    // Check if item exists
    const existingItem = await this.itemRepository.getById(command.id);
    if (!existingItem) {
      throw new Error('Item not found');
    }

    // Check for duplicate name if name is being updated (only if menuId exists)
    if (command.name && command.name !== existingItem.name && existingItem.menuId) {
      const existingItems = await this.itemRepository.getByMenuId(existingItem.menuId);
      const duplicateItem = existingItems.find(item => 
        item.id !== command.id && 
        item.name.toLowerCase() === command.name!.toLowerCase()
      );

      if (duplicateItem) {
        throw new Error(`Item with name "${command.name}" already exists in this menu`);
      }
    }

    // Validate addonGroupIds if being updated
    if (command.addonGroupIds !== undefined && command.addonGroupIds.length > 0) {
      await this.validateAddonGroupIds(command.addonGroupIds);
    }

    // Validate inline addonGroups if being updated
    if (command.addonGroups !== undefined && command.addonGroups.length > 0) {
      this.validateItemAddonGroups(command.addonGroups);
    }

    // Update item
    const updateData: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'menuId'>> = {
      ...(command.name !== undefined && { name: command.name }),
      ...(command.description !== undefined && { description: command.description }),
      ...(command.price !== undefined && { price: command.price }),
      ...(command.categoryId !== undefined && { categoryId: command.categoryId }),
      ...(command.isAvailable !== undefined && { isAvailable: command.isAvailable }),
      ...(command.imageUrl !== undefined && { imageUrl: command.imageUrl }),
      ...(command.preparationTime !== undefined && { preparationTime: command.preparationTime }),
      ...(command.ingredients !== undefined && { ingredients: command.ingredients }),
      ...(command.specs !== undefined && { specs: command.specs }),
      ...(command.addonGroups !== undefined && { addonGroups: command.addonGroups }),
      ...(command.addonGroupIds !== undefined && { addonGroupIds: command.addonGroupIds })
    };

    await this.itemRepository.update(command.id, updateData as any);
    
    const updatedItem = await this.itemRepository.getById(command.id);
    if (!updatedItem) {
      throw new Error('Failed to update item');
    }

    return updatedItem;
  }

  async deleteItem(itemId: string): Promise<void> {
    if (!itemId || itemId.trim() === '') {
      throw new Error('Item ID is required');
    }

    // Check if item exists
    const existingItem = await this.itemRepository.getById(itemId);
    if (!existingItem) {
      throw new Error('Item not found');
    }

    await this.itemRepository.delete(itemId);
  }

  async getItemById(itemId: string): Promise<Item | null> {
    if (!itemId || itemId.trim() === '') {
      throw new Error('Item ID is required');
    }

    const item = await this.itemRepository.getById(itemId);
    return item ?? null;
  }

  async getItemsByMenuId(menuId?: string): Promise<Item[]> {
    if (menuId && menuId.trim() !== '') {
      return this.itemRepository.getByMenuId(menuId);
    }
    // If no menuId provided, return all items
    return this.itemRepository.getAll();
  }

  async getItemsByCategoryId(menuId: string | undefined, categoryId: string): Promise<Item[]> {
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    if (menuId && menuId.trim() !== '') {
      return this.itemRepository.getByCategoryId(menuId, categoryId);
    }
    // If no menuId provided, query by categoryId only
    return this.itemRepository.getByCategoryIdOnly(categoryId);
  }

  async getAvailableItems(menuId?: string): Promise<Item[]> {
    const items = menuId && menuId.trim() !== '' 
      ? await this.itemRepository.getByMenuId(menuId)
      : await this.itemRepository.getAll();
    return items.filter(item => item.isAvailable);
  }

  async searchItems(menuId: string | undefined, searchTerm: string): Promise<Item[]> {
    if (!searchTerm || searchTerm.trim() === '') {
      throw new Error('Search term is required');
    }

    const items = menuId && menuId.trim() !== ''
      ? await this.itemRepository.getByMenuId(menuId)
      : await this.itemRepository.getAll();
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower))
    );
  }

  async queryItems(query: ItemQuery): Promise<Item[]> {
    if (query.menuId && !query.menuId.trim()) {
      throw new Error('Menu ID cannot be empty');
    }

    // Handle search
    if (query.search) {
      return this.searchItems(query.menuId, query.search);
    }

    // Handle category filter
    if (query.categoryId) {
      return this.getItemsByCategoryId(query.menuId, query.categoryId);
    }

    // Handle availability filter
    if (query.isAvailable !== undefined) {
      return query.isAvailable 
        ? this.getAvailableItems(query.menuId)
        : this.getItemsByMenuId(query.menuId);
    }

    // If no specific filters, return items by menuId or all items
    return this.getItemsByMenuId(query.menuId);
  }

  // No conversion needed: repository returns Item shape directly

  private validateCreateCommand(command: CreateItemCommand): void {
    if (!command.name || command.name.trim() === '') {
      throw new Error('Item name is required');
    }
    if (!command.categoryId || command.categoryId.trim() === '') {
      throw new Error('Item category ID is required');
    }
    if (command.price === undefined || command.price < 0) {
      throw new Error('Item price must be a non-negative number');
    }
    // menuId is now optional, so we don't validate it
    if (command.preparationTime !== undefined && command.preparationTime < 0) {
      throw new Error('Preparation time must be a non-negative number');
    }
    if (command.specs) {
      this.validateSpecs(command.specs);
    }
  }

  private validateUpdateCommand(command: UpdateItemCommand): void {
    if (!command.id || command.id.trim() === '') {
      throw new Error('Item ID is required');
    }
    if (command.name !== undefined && command.name.trim() === '') {
      throw new Error('Item name cannot be empty');
    }
    if (command.categoryId !== undefined && command.categoryId.trim() === '') {
      throw new Error('Item category ID cannot be empty');
    }
    if (command.price !== undefined && command.price < 0) {
      throw new Error('Item price must be a non-negative number');
    }
    if (command.preparationTime !== undefined && command.preparationTime < 0) {
      throw new Error('Preparation time must be a non-negative number');
    }
    if (command.specs) {
      this.validateSpecs(command.specs);
    }
  }

  private validateSpecs(specs: Item['specs']): void {
    if (specs.calories !== undefined && specs.calories < 0) {
      throw new Error('Calories must be a non-negative number');
    }
    if (specs.protein !== undefined && specs.protein < 0) {
      throw new Error('Protein must be a non-negative number');
    }
    if (specs.carbs !== undefined && specs.carbs < 0) {
      throw new Error('Carbs must be a non-negative number');
    }
    if (specs.fat !== undefined && specs.fat < 0) {
      throw new Error('Fat must be a non-negative number');
    }
    if (specs.fiber !== undefined && specs.fiber < 0) {
      throw new Error('Fiber must be a non-negative number');
    }
  }

  /**
   * Validate that all addonGroupIds reference existing addon groups
   */
  private async validateAddonGroupIds(addonGroupIds: string[]): Promise<void> {
    if (!addonGroupIds || addonGroupIds.length === 0) {
      return;
    }

    // Check for duplicate IDs
    const uniqueIds = new Set(addonGroupIds);
    if (uniqueIds.size !== addonGroupIds.length) {
      throw new Error('Duplicate addon group IDs are not allowed');
    }

    // Validate each addon group exists
    for (const addonGroupId of addonGroupIds) {
      if (!addonGroupId || addonGroupId.trim() === '') {
        throw new Error('Addon group ID cannot be empty');
      }

      const addonGroup = await this.addonGroupService.getAddonGroupById(addonGroupId);
      if (!addonGroup) {
        throw new Error(`Addon group with ID "${addonGroupId}" not found`);
      }

      // Optionally check if addon group is active
      if (!addonGroup.isActive) {
        throw new Error(`Addon group with ID "${addonGroupId}" is not active`);
      }
    }
  }

  /**
   * Validate inline addon groups structure
   */
  private validateItemAddonGroups(addonGroups: Item['addonGroups']): void {
    if (!addonGroups || addonGroups.length === 0) {
      return;
    }

    for (const addonGroup of addonGroups) {
      if (!addonGroup.name || addonGroup.name.trim() === '') {
        throw new Error('Addon group name is required');
      }

      if (!addonGroup.selectionType || !['single', 'multiple', 'quantity'].includes(addonGroup.selectionType)) {
        throw new Error('Selection type must be one of: single, multiple, quantity');
      }

      if (!addonGroup.options || addonGroup.options.length === 0) {
        throw new Error('At least one option is required for addon group');
      }

      if (addonGroup.minSelect !== undefined && addonGroup.minSelect < 0) {
        throw new Error('Minimum select must be a non-negative number');
      }

      if (addonGroup.maxSelect !== undefined && addonGroup.maxSelect < 0) {
        throw new Error('Maximum select must be a non-negative number');
      }

      if (addonGroup.minSelect !== undefined && addonGroup.maxSelect !== undefined && addonGroup.minSelect > addonGroup.maxSelect) {
        throw new Error('Minimum select cannot be greater than maximum select');
      }

      if (addonGroup.selectionType === 'single' && addonGroup.maxSelect && addonGroup.maxSelect > 1) {
        throw new Error('Maximum select cannot be greater than 1 for single selection type');
      }

      // Validate each option
      for (const option of addonGroup.options) {
        if (!option.id || option.id.trim() === '') {
          throw new Error('Option ID is required');
        }

        if (!option.name || option.name.trim() === '') {
          throw new Error('Option name is required');
        }

        if (option.price === undefined || option.price === null) {
          throw new Error('Option price is required');
        }

        if (typeof option.price !== 'number') {
          throw new Error('Option price must be a number');
        }

        // Validate quantity-specific fields for quantity selection type
        if (addonGroup.selectionType === 'quantity') {
          if (option.maxQuantity !== undefined && option.maxQuantity < 1) {
            throw new Error('Maximum quantity must be at least 1 for quantity selection type');
          }

          if (option.defaultQuantity !== undefined && option.defaultQuantity < 0) {
            throw new Error('Default quantity must be a non-negative number');
          }

          if (option.defaultQuantity !== undefined && option.maxQuantity !== undefined && option.defaultQuantity > option.maxQuantity) {
            throw new Error('Default quantity cannot be greater than maximum quantity');
          }
        }
      }

      // Check for duplicate option IDs within the addon group
      const optionIds = addonGroup.options.map(opt => opt.id);
      const uniqueOptionIds = new Set(optionIds);
      if (optionIds.length !== uniqueOptionIds.size) {
        throw new Error(`Duplicate option IDs are not allowed in addon group "${addonGroup.name}"`);
      }
    }
  }
}
