import { AddonGroup, CreateAddonGroupCommand, UpdateAddonGroupCommand, AddonGroupQuery, AddonOption } from '../entities/addon-group.entity';
import { AddonGroupRepository, IAddonGroupRepository } from '../repositories/addon-group/addon-group.repository';
import { IMenuService } from './interfaces/menu.service.interface';
import { MenuService } from './menu.service';
import { Menu } from '../repositories/menu/types';

export interface IAddonGroupService {
  createAddonGroup(command: CreateAddonGroupCommand): Promise<AddonGroup>;
  updateAddonGroup(command: UpdateAddonGroupCommand): Promise<AddonGroup>;
  deleteAddonGroup(addonGroupId: string): Promise<void>;
  getAddonGroupById(addonGroupId: string): Promise<AddonGroup | null>;
  getAllAddonGroups(): Promise<AddonGroup[]>;
  queryAddonGroups(query: AddonGroupQuery): Promise<AddonGroup[]>;
}

export class AddonGroupService implements IAddonGroupService {
  private readonly addonGroupRepository: IAddonGroupRepository;
  private readonly menuService: IMenuService;

  constructor(addonGroupRepository?: IAddonGroupRepository, menuService?: IMenuService) {
    this.addonGroupRepository = addonGroupRepository ?? new AddonGroupRepository();
    this.menuService = menuService ?? new MenuService();
  }

  async createAddonGroup(command: CreateAddonGroupCommand): Promise<AddonGroup> {
    // Business validation
    this.validateCreateCommand(command);

    // Check if menu exists (only if menuId is provided)
    if (command.menuId) {
      const menu: Menu | null = await this.menuService.getMenuById(command.menuId);
      if (!menu) {
        throw new Error('Menu not found');
      }
    }

    // Validate options
    this.validateOptions(command.options, command.selectionType);

    // Create new addon group
    const addonGroupData: Omit<AddonGroup, 'id' | 'createdAt' | 'updatedAt'> = {
      name: command.name,
      description: command.description,
      selectionType: command.selectionType,
      minSelect: command.minSelect,
      maxSelect: command.maxSelect,
      isRequired: command.isRequired ?? false,
      isActive: true,
      menuId: command.menuId,
      placeId: command.placeId,
      appliesToCategoryIds: command.appliesToCategoryIds,
      appliesToItemIds: command.appliesToItemIds,
      options: command.options
    };

    const addonGroupId = await this.addonGroupRepository.create(addonGroupData);
    const createdAddonGroup = await this.addonGroupRepository.getById(addonGroupId);
    
    if (!createdAddonGroup) {
      throw new Error('Failed to create addon group');
    }

    return createdAddonGroup;
  }

  async updateAddonGroup(command: UpdateAddonGroupCommand): Promise<AddonGroup> {
    // Business validation
    this.validateUpdateCommand(command);

    // Check if addon group exists
    const existingAddonGroup = await this.addonGroupRepository.getById(command.id);
    if (!existingAddonGroup) {
      throw new Error('Addon group not found');
    }

    // Check if menu exists (only if menuId is being updated)
    if (command.menuId && command.menuId !== existingAddonGroup.menuId) {
      const menu: Menu | null = await this.menuService.getMenuById(command.menuId);
      if (!menu) {
        throw new Error('Menu not found');
      }
    }

    // Validate options if being updated
    if (command.options) {
      const selectionType = command.selectionType ?? existingAddonGroup.selectionType;
      this.validateOptions(command.options, selectionType);
    }

    // Update addon group
    const updateData: Partial<Omit<AddonGroup, 'id' | 'createdAt' | 'updatedAt'>> = {
      ...(command.name !== undefined && { name: command.name }),
      ...(command.description !== undefined && { description: command.description }),
      ...(command.selectionType !== undefined && { selectionType: command.selectionType }),
      ...(command.minSelect !== undefined && { minSelect: command.minSelect }),
      ...(command.maxSelect !== undefined && { maxSelect: command.maxSelect }),
      ...(command.isRequired !== undefined && { isRequired: command.isRequired }),
      ...(command.isActive !== undefined && { isActive: command.isActive }),
      ...(command.menuId !== undefined && { menuId: command.menuId }),
      ...(command.placeId !== undefined && { placeId: command.placeId }),
      ...(command.appliesToCategoryIds !== undefined && { appliesToCategoryIds: command.appliesToCategoryIds }),
      ...(command.appliesToItemIds !== undefined && { appliesToItemIds: command.appliesToItemIds }),
      ...(command.options !== undefined && { options: command.options })
    };

    await this.addonGroupRepository.update(command.id, updateData);
    
    const updatedAddonGroup = await this.addonGroupRepository.getById(command.id);
    if (!updatedAddonGroup) {
      throw new Error('Failed to update addon group');
    }

    return updatedAddonGroup;
  }

  async deleteAddonGroup(addonGroupId: string): Promise<void> {
    if (!addonGroupId || addonGroupId.trim() === '') {
      throw new Error('Addon group ID is required');
    }

    // Check if addon group exists
    const existingAddonGroup = await this.addonGroupRepository.getById(addonGroupId);
    if (!existingAddonGroup) {
      throw new Error('Addon group not found');
    }

    // TODO: Check if addon group is referenced by items before deleting
    // This would require checking items that reference this addon group

    await this.addonGroupRepository.delete(addonGroupId);
  }

  async getAddonGroupById(addonGroupId: string): Promise<AddonGroup | null> {
    if (!addonGroupId || addonGroupId.trim() === '') {
      throw new Error('Addon group ID is required');
    }

    const addonGroup = await this.addonGroupRepository.getById(addonGroupId);
    return addonGroup ?? null;
  }

  async getAllAddonGroups(): Promise<AddonGroup[]> {
    return this.addonGroupRepository.getAll();
  }

  async queryAddonGroups(query: AddonGroupQuery): Promise<AddonGroup[]> {
    const filters: Array<{ field: string; operator: '==' | 'array-contains'; value: unknown }> = [];

    if (query.placeId) {
      filters.push({ field: 'placeId', operator: '==', value: query.placeId });
    }

    if (query.menuId) {
      filters.push({ field: 'menuId', operator: '==', value: query.menuId });
    }

    if (query.categoryId) {
      filters.push({ field: 'appliesToCategoryIds', operator: 'array-contains', value: query.categoryId });
    }

    if (query.itemId) {
      filters.push({ field: 'appliesToItemIds', operator: 'array-contains', value: query.itemId });
    }

    if (query.isActive !== undefined) {
      filters.push({ field: 'isActive', operator: '==', value: query.isActive });
    }

    let addonGroups: AddonGroup[];

    if (filters.length > 0) {
      addonGroups = await this.addonGroupRepository.query(filters);
    } else {
      addonGroups = await this.addonGroupRepository.getAll();
    }

    // Apply search filter if provided
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      addonGroups = addonGroups.filter(addonGroup => 
        addonGroup.name.toLowerCase().includes(searchLower) ||
        addonGroup.description?.toLowerCase().includes(searchLower) ||
        addonGroup.options.some(option => 
          option.name.toLowerCase().includes(searchLower) ||
          option.description?.toLowerCase().includes(searchLower)
        )
      );
    }

    return addonGroups;
  }

  private validateCreateCommand(command: CreateAddonGroupCommand): void {
    if (!command.name || command.name.trim() === '') {
      throw new Error('Addon group name is required');
    }

    if (!command.selectionType || !['single', 'multiple', 'quantity'].includes(command.selectionType)) {
      throw new Error('Selection type must be one of: single, multiple, quantity');
    }

    if (!command.options || command.options.length === 0) {
      throw new Error('At least one option is required');
    }

    if (command.minSelect !== undefined && command.minSelect < 0) {
      throw new Error('Minimum select must be a non-negative number');
    }

    if (command.maxSelect !== undefined && command.maxSelect < 0) {
      throw new Error('Maximum select must be a non-negative number');
    }

    if (command.minSelect !== undefined && command.maxSelect !== undefined && command.minSelect > command.maxSelect) {
      throw new Error('Minimum select cannot be greater than maximum select');
    }

    if (command.selectionType === 'single' && command.maxSelect && command.maxSelect > 1) {
      throw new Error('Maximum select cannot be greater than 1 for single selection type');
    }
  }

  private validateUpdateCommand(command: UpdateAddonGroupCommand): void {
    if (!command.id || command.id.trim() === '') {
      throw new Error('Addon group ID is required');
    }

    if (command.name !== undefined && command.name.trim() === '') {
      throw new Error('Addon group name cannot be empty');
    }

    if (command.selectionType !== undefined && !['single', 'multiple', 'quantity'].includes(command.selectionType)) {
      throw new Error('Selection type must be one of: single, multiple, quantity');
    }

    if (command.minSelect !== undefined && command.minSelect < 0) {
      throw new Error('Minimum select must be a non-negative number');
    }

    if (command.maxSelect !== undefined && command.maxSelect < 0) {
      throw new Error('Maximum select must be a non-negative number');
    }

    if (command.minSelect !== undefined && command.maxSelect !== undefined && command.minSelect > command.maxSelect) {
      throw new Error('Minimum select cannot be greater than maximum select');
    }

    if (command.selectionType === 'single' && command.maxSelect && command.maxSelect > 1) {
      throw new Error('Maximum select cannot be greater than 1 for single selection type');
    }
  }

  private validateOptions(options: AddonOption[], selectionType: string): void {
    if (!options || options.length === 0) {
      throw new Error('At least one option is required');
    }

    // Validate each option
    for (const option of options) {
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
      if (selectionType === 'quantity') {
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

    // Check for duplicate option IDs
    const optionIds = options.map(opt => opt.id);
    const uniqueOptionIds = new Set(optionIds);
    if (optionIds.length !== uniqueOptionIds.size) {
      throw new Error('Duplicate option IDs are not allowed');
    }
  }
}

