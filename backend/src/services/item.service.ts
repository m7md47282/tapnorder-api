import { Item, CreateItemCommand, UpdateItemCommand, ItemQuery } from '../entities/item.entity';
import { IMenuService } from './interfaces/menu.service.interface';
import { MenuService } from './menu.service';
import { ItemRepository, IItemRepository } from '../repositories/item/item.repository';
import { IAddonGroupService } from './addon-group.service';
import { AddonGroupService } from './addon-group.service';
import { IBranchService } from './interfaces/branch.service.interface';
import { BranchService } from './branch.service';
import { ItemCostCalculatorService } from './item-cost-calculator.service';
import { IInventoryService } from './interfaces/inventory.service.interface';
import { InventoryService } from './inventory.service';

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
  recalculateItem(itemId: string): Promise<Item>;
  recalculateItemsUsingInventory(inventoryId: string): Promise<void>;
}

export class ItemService implements IItemService {
  private readonly menuService: IMenuService;
  private readonly itemRepository: IItemRepository;
  private readonly addonGroupService: IAddonGroupService;
  private readonly branchService: IBranchService;
  private readonly inventoryService: IInventoryService;
  private readonly costCalculator: ItemCostCalculatorService;

  constructor(
    menuService?: IMenuService, 
    itemRepository?: IItemRepository,
    addonGroupService?: IAddonGroupService,
    branchService?: IBranchService,
    inventoryService?: IInventoryService
  ) {
    this.menuService = menuService ?? new MenuService();
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.addonGroupService = addonGroupService ?? new AddonGroupService();
    this.branchService = branchService ?? new BranchService();
    this.inventoryService = inventoryService ?? new InventoryService();
    this.costCalculator = new ItemCostCalculatorService(this.inventoryService);
  }

  async createItem(command: CreateItemCommand): Promise<Item> {
    // Business validation
    this.validateCreateCommand(command);

    // Handle placeId: Get menu by placeId if placeId is provided and menuId is not
    let effectiveMenuId = command.menuId;
    let effectivePlaceId = command.placeId;

    if (command.placeId && !command.menuId) {
      const menu = await this.menuService.getMenuByPlaceId(command.placeId);
      if (!menu) {
        // Menu not found - allow creating item without menuId (menuId is optional)
        effectiveMenuId = undefined;
        effectivePlaceId = command.placeId;
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

    // Check if menu exists (only if menuId is provided)
    if (effectiveMenuId) {
      // Check for duplicate items in the same branch (if branchId is provided)
      // or in the same menu (if no branchId)
      if (command.branchId) {
        const existingItems = await this.itemRepository.getByMenuIdAndBranchId(effectiveMenuId, command.branchId);
        const duplicateItem = existingItems.find(item => 
          item.name.toLowerCase() === command.name.toLowerCase()
        );

        if (duplicateItem) {
          throw new Error(`Item with name "${command.name}" already exists in this branch`);
        }
      } else {
        const existingItems = await this.itemRepository.getByMenuId(effectiveMenuId);
        const duplicateItem = existingItems.find(item => 
          item.name.toLowerCase() === command.name.toLowerCase()
        );

        if (duplicateItem) {
          throw new Error(`Item with name "${command.name}" already exists in this menu`);
        }
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

    // Calculate cost and available units if recipe is provided
    let calculatedCost: number | undefined;
    let availableUnits: number | undefined;
    
    if (command.recipe && command.recipe.length > 0) {
      try {
        const costCalculation = await this.costCalculator.calculateItemCost(
          command.recipe,
          effectivePlaceId!,
          command.branchId
        );
        calculatedCost = costCalculation.calculatedCost;
        availableUnits = costCalculation.availableUnits;
      } catch (error) {
        throw new Error(`Failed to calculate item cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Determine selling price: use provided price, or calculated cost with default markup (2x)
    const sellingPrice = command.price ?? (calculatedCost ? calculatedCost * 2 : 0);
    
    if (sellingPrice <= 0) {
      throw new Error('Item price must be greater than 0. Provide either price or recipe for cost calculation.');
    }

    // Create new item - filter out undefined values
    const itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'> = {
      name: command.name,
      description: command.description,
      price: sellingPrice,
      ...(calculatedCost !== undefined && { calculatedCost }),
      ...(availableUnits !== undefined && { availableUnits }),
      isAvailable: command.isAvailable ?? (availableUnits !== undefined ? availableUnits > 0 : true),
      categoryId: command.categoryId,
      imageUrl: command.imageUrl,
      preparationTime: command.preparationTime,
      recipe: command.recipe,
      ingredients: command.ingredients, // Legacy support
      specs: command.specs,
      ...(effectiveMenuId && { menuId: effectiveMenuId }),
      // Always include placeId if it was determined (from command or menu lookup)
      ...(effectivePlaceId !== undefined && { placeId: effectivePlaceId }),
      // Always include branchId if provided in command (including null)
      ...(command.branchId !== undefined && { branchId: command.branchId }),
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

    // Recalculate cost and available units if recipe is being updated
    let calculatedCost: number | undefined;
    let availableUnits: number | undefined;
    const recipeToUse = command.recipe !== undefined ? command.recipe : existingItem.recipe;
    
    if (recipeToUse && recipeToUse.length > 0) {
      try {
        // Get placeId from menu
        let placeId: string | undefined;
        if (existingItem.menuId) {
          const menu = await this.menuService.getMenuById(existingItem.menuId);
          placeId = menu?.placeId;
        }
        
        if (placeId) {
          const costCalculation = await this.costCalculator.calculateItemCost(
            recipeToUse,
            placeId,
            command.branchId ?? existingItem.branchId
          );
          calculatedCost = costCalculation.calculatedCost;
          availableUnits = costCalculation.availableUnits;
        }
      } catch (error) {
        // Log error but don't fail update if recipe calculation fails
        console.error('Failed to recalculate item cost:', error);
      }
    }

    // Update item
    const updateData: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'menuId'>> = {
      ...(command.name !== undefined && { name: command.name }),
      ...(command.description !== undefined && { description: command.description }),
      ...(command.price !== undefined && { price: command.price }),
      ...(calculatedCost !== undefined && { calculatedCost }),
      ...(availableUnits !== undefined && { availableUnits }),
      ...(command.categoryId !== undefined && { categoryId: command.categoryId }),
      ...(command.isAvailable !== undefined && { isAvailable: command.isAvailable }),
      ...(availableUnits !== undefined && { isAvailable: availableUnits > 0 && (command.isAvailable ?? existingItem.isAvailable) }),
      ...(command.imageUrl !== undefined && { imageUrl: command.imageUrl }),
      ...(command.preparationTime !== undefined && { preparationTime: command.preparationTime }),
      ...(command.recipe !== undefined && { recipe: command.recipe }),
      ...(command.ingredients !== undefined && { ingredients: command.ingredients }),
      ...(command.specs !== undefined && { specs: command.specs }),
      ...(command.branchId !== undefined && { branchId: command.branchId }),
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

  /**
   * Recalculate cost and available units for an item
   * Called when inventory changes
   */
  async recalculateItem(itemId: string): Promise<Item> {
    const item = await this.itemRepository.getById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    if (!item.recipe || item.recipe.length === 0) {
      return item; // No recipe, nothing to recalculate
    }

    // Get placeId from menu
    let placeId: string | undefined;
    if (item.menuId) {
      const menu = await this.menuService.getMenuById(item.menuId);
      placeId = menu?.placeId;
    }

    if (!placeId) {
      return item; // Can't recalculate without placeId
    }

    try {
      const costCalculation = await this.costCalculator.calculateItemCost(
        item.recipe,
        placeId,
        item.branchId
      );

      const updateData: Partial<Item> = {
        calculatedCost: costCalculation.calculatedCost,
        availableUnits: costCalculation.availableUnits,
        isAvailable: costCalculation.availableUnits > 0 && item.isAvailable
      };

      await this.itemRepository.update(itemId, updateData);
      const updatedItem = await this.itemRepository.getById(itemId);
      
      if (!updatedItem) {
        throw new Error('Failed to retrieve updated item');
      }

      return updatedItem;
    } catch (error) {
      console.error(`Failed to recalculate item ${itemId}:`, error);
      return item; // Return original item if recalculation fails
    }
  }

  /**
   * Recalculate all items that use a specific inventory item
   * Called when inventory is updated
   */
  async recalculateItemsUsingInventory(inventoryId: string): Promise<void> {
    // Get all items and filter those that use this inventory
    const allItems = await this.itemRepository.getAll();
    const affectedItems = allItems.filter(item => 
      item.recipe?.some(ingredient => ingredient.inventoryId === inventoryId)
    );

    // Recalculate each affected item
    await Promise.all(
      affectedItems.map(item => this.recalculateItem(item.id).catch(err => {
        console.error(`Failed to recalculate item ${item.id}:`, err);
      }))
    );
  }

  async queryItems(query: ItemQuery): Promise<Item[]> {
    if (query.menuId && !query.menuId.trim()) {
      throw new Error('Menu ID cannot be empty');
    }

    // Handle placeId: Get menu by placeId first, then use menuId for filtering
    let effectiveMenuId = query.menuId;
    if (query.placeId) {
      const menu = await this.menuService.getMenuByPlaceId(query.placeId);
      if (menu) {
        effectiveMenuId = menu.id;
      }
      // If no menu found, we'll query items directly by placeId
    }

    // Build base filters
    let items: Item[] = [];

    // If we have menuId (either from query or from placeId), start with menu items
    if (effectiveMenuId) {
      // Handle branchId filter with menuId
      if (query.branchId) {
        // Get both branch-specific items AND shared items (items without branchId)
        const branchSpecificItems = await this.itemRepository.getByMenuIdAndBranchId(effectiveMenuId, query.branchId);
        const sharedItems = await this.itemRepository.getSharedItemsByMenuId(effectiveMenuId);
        
        // Combine both sets and remove duplicates by ID
        const itemMap = new Map<string, Item>();
        [...branchSpecificItems, ...sharedItems].forEach(item => {
          itemMap.set(item.id, item);
        });
        items = Array.from(itemMap.values());
      } else {
        // No branchId filter - get all items for the menu (both shared and branch-specific)
        items = await this.itemRepository.getByMenuId(effectiveMenuId);
      }
    } else if (query.placeId) {
      // No menu found - query items directly by placeId
      if (query.branchId) {
        // Get both branch-specific items AND shared items (items without branchId)
        const branchSpecificItems = await this.itemRepository.getByPlaceIdAndBranchId(query.placeId, query.branchId);
        const sharedItems = await this.itemRepository.getSharedItemsByPlaceId(query.placeId);
        
        // Combine both sets and remove duplicates by ID
        const itemMap = new Map<string, Item>();
        [...branchSpecificItems, ...sharedItems].forEach(item => {
          itemMap.set(item.id, item);
        });
        items = Array.from(itemMap.values());
      } else {
        // No branchId filter - get all items for the place (both shared and branch-specific)
        items = await this.itemRepository.getByPlaceId(query.placeId);
      }
    } else if (query.branchId) {
      // If only branchId is provided (no menuId/placeId), filter by branchId only
      items = await this.itemRepository.getByBranchId(query.branchId);
    } else {
      // No menuId or branchId, get all items
      items = await this.itemRepository.getAll();
    }

    // Apply additional filters
    // Handle category filter
    if (query.categoryId) {
      items = items.filter(item => item.categoryId === query.categoryId);
    }

    // Handle availability filter
    if (query.isAvailable !== undefined) {
      items = items.filter(item => item.isAvailable === query.isAvailable);
    }

    // Handle search
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.ingredients?.some(ingredient => 
          ingredient.toLowerCase().includes(searchLower)
        )
      );
    }

    return items;
  }

  // No conversion needed: repository returns Item shape directly

  private validateCreateCommand(command: CreateItemCommand): void {
    if (!command.name || command.name.trim() === '') {
      throw new Error('Item name is required');
    }
    if (!command.categoryId || command.categoryId.trim() === '') {
      throw new Error('Item category ID is required');
    }
    // Price is now optional if recipe is provided (will be calculated)
    // But if provided, must be valid
    if (command.price !== undefined && command.price < 0) {
      throw new Error('Item price must be a non-negative number');
    }
    // Validate recipe if provided
    if (command.recipe && command.recipe.length > 0) {
      command.recipe.forEach((ingredient, index) => {
        if (!ingredient.inventoryId || ingredient.inventoryId.trim() === '') {
          throw new Error(`Recipe ingredient at index ${index} must have inventoryId`);
        }
        if (!ingredient.ingredientName || ingredient.ingredientName.trim() === '') {
          throw new Error(`Recipe ingredient at index ${index} must have ingredientName`);
        }
        if (ingredient.quantity <= 0) {
          throw new Error(`Recipe ingredient at index ${index} must have quantity greater than 0`);
        }
        if (!ingredient.unit) {
          throw new Error(`Recipe ingredient at index ${index} must have unit`);
        }
      });
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
    // Validate recipe if provided
    if (command.recipe && command.recipe.length > 0) {
      command.recipe.forEach((ingredient, index) => {
        if (!ingredient.inventoryId || ingredient.inventoryId.trim() === '') {
          throw new Error(`Recipe ingredient at index ${index} must have inventoryId`);
        }
        if (!ingredient.ingredientName || ingredient.ingredientName.trim() === '') {
          throw new Error(`Recipe ingredient at index ${index} must have ingredientName`);
        }
        if (ingredient.quantity <= 0) {
          throw new Error(`Recipe ingredient at index ${index} must have quantity greater than 0`);
        }
        if (!ingredient.unit) {
          throw new Error(`Recipe ingredient at index ${index} must have unit`);
        }
      });
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
