import { BaseRepository } from '../base.repository';
import { AddonGroup } from '../../entities/addon-group.entity';
import { QueryFilter } from '../types';

export interface IAddonGroupRepository {
  getAll(): Promise<AddonGroup[]>;
  getById(id: string): Promise<AddonGroup | null>;
  create(addonGroup: Omit<AddonGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, addonGroup: Partial<Omit<AddonGroup, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
  query(filters: QueryFilter[]): Promise<AddonGroup[]>;
  getByPlaceId(placeId: string): Promise<AddonGroup[]>;
  getByMenuId(menuId: string): Promise<AddonGroup[]>;
  getByCategoryId(categoryId: string): Promise<AddonGroup[]>;
  getByItemId(itemId: string): Promise<AddonGroup[]>;
  getActiveAddonGroups(placeId?: string, menuId?: string): Promise<AddonGroup[]>;
  searchAddonGroups(searchTerm: string, placeId?: string, menuId?: string): Promise<AddonGroup[]>;
}

export class AddonGroupRepository extends BaseRepository<AddonGroup> implements IAddonGroupRepository {
  constructor() {
    super('addonGroups');
  }

  async getAll(): Promise<AddonGroup[]> {
    return super.getAll();
  }

  async getById(id: string): Promise<AddonGroup | null> {
    return super.getById(id);
  }

  async create(addonGroup: Omit<AddonGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newAddonGroup: Omit<AddonGroup, 'id'> = {
      ...addonGroup,
      isActive: addonGroup.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return super.create(newAddonGroup);
  }

  async update(id: string, addonGroup: Partial<Omit<AddonGroup, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const updateData = {
      ...addonGroup,
      updatedAt: new Date()
    };
    return super.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    return super.delete(id);
  }

  async query(filters: QueryFilter[]): Promise<AddonGroup[]> {
    return super.query(filters);
  }

  async getByPlaceId(placeId: string): Promise<AddonGroup[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    return this.query(filters);
  }

  async getByMenuId(menuId: string): Promise<AddonGroup[]> {
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId }
    ];
    return this.query(filters);
  }

  async getByCategoryId(categoryId: string): Promise<AddonGroup[]> {
    const filters: QueryFilter[] = [
      { field: 'appliesToCategoryIds', operator: 'array-contains', value: categoryId }
    ];
    return this.query(filters);
  }

  async getByItemId(itemId: string): Promise<AddonGroup[]> {
    const filters: QueryFilter[] = [
      { field: 'appliesToItemIds', operator: 'array-contains', value: itemId }
    ];
    return this.query(filters);
  }

  async getActiveAddonGroups(placeId?: string, menuId?: string): Promise<AddonGroup[]> {
    const filters: QueryFilter[] = [
      { field: 'isActive', operator: '==', value: true }
    ];
    
    if (placeId) {
      filters.push({ field: 'placeId', operator: '==', value: placeId });
    }
    
    if (menuId) {
      filters.push({ field: 'menuId', operator: '==', value: menuId });
    }
    
    return this.query(filters);
  }

  async searchAddonGroups(searchTerm: string, placeId?: string, menuId?: string): Promise<AddonGroup[]> {
    const filters: QueryFilter[] = [];
    
    if (placeId) {
      filters.push({ field: 'placeId', operator: '==', value: placeId });
    }
    
    if (menuId) {
      filters.push({ field: 'menuId', operator: '==', value: menuId });
    }
    
    const addonGroups = await this.query(filters);
    const searchLower = searchTerm.toLowerCase();
    
    return addonGroups.filter(addonGroup => 
      addonGroup.name.toLowerCase().includes(searchLower) ||
      addonGroup.description?.toLowerCase().includes(searchLower) ||
      addonGroup.options.some(option => 
        option.name.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
      )
    );
  }
}

