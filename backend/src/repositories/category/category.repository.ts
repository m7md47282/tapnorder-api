import { BaseRepository } from '../base.repository';
import { Category } from '../../entities/category.entity';
import { QueryFilter } from '../types';

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getByMenuId(menuId: string): Promise<Category[]>;
  getByPlaceId(placeId: string): Promise<Category[]>;
  getByBranchId(branchId: string): Promise<Category[]>;
  getByMenuIdAndBranchId(menuId: string, branchId: string): Promise<Category[]>;
  getSharedCategoriesByMenuId(menuId: string): Promise<Category[]>; // Categories with menuId but no branchId (shared across branches)
  getActiveCategories(menuId: string): Promise<Category[]>;
  searchCategories(menuId: string, searchTerm: string): Promise<Category[]>;
  getAllActive(): Promise<Category[]>;
  searchAll(searchTerm: string): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  delete(id: string): Promise<void>;
  query(filters: QueryFilter[]): Promise<Category[]>;
}

export class CategoryRepository extends BaseRepository<Category> implements ICategoryRepository {
  constructor() {
    super('categories');
  }

  async getAll(): Promise<Category[]> {
    return super.getAll();
  }

  async getByMenuId(menuId: string): Promise<Category[]> {
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId }
    ];
    return this.query(filters);
  }

  async getByPlaceId(placeId: string): Promise<Category[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    return this.query(filters);
  }

  async getByBranchId(branchId: string): Promise<Category[]> {
    const filters: QueryFilter[] = [
      { field: 'branchId', operator: '==', value: branchId }
    ];
    return this.query(filters);
  }

  async getByMenuIdAndBranchId(menuId: string, branchId: string): Promise<Category[]> {
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId },
      { field: 'branchId', operator: '==', value: branchId }
    ];
    return this.query(filters);
  }

  async getSharedCategoriesByMenuId(menuId: string): Promise<Category[]> {
    // Get categories with menuId but no branchId (shared across all branches)
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId }
    ];
    const allMenuCategories = await this.query(filters);
    // Filter categories where branchId is null or undefined
    return allMenuCategories.filter(category => !category.branchId);
  }

  async getActiveCategories(menuId: string): Promise<Category[]> {
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId },
      { field: 'isActive', operator: '==', value: true }
    ];
    return this.query(filters);
  }

  async searchCategories(menuId: string, searchTerm: string): Promise<Category[]> {
    const filters: QueryFilter[] = [
      { field: 'menuId', operator: '==', value: menuId }
    ];
    
    const categories = await this.query(filters);
    const searchLower = searchTerm.toLowerCase();
    
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    );
  }

  async getAllActive(): Promise<Category[]> {
    const filters: QueryFilter[] = [
      { field: 'isActive', operator: '==', value: true }
    ];
    return this.query(filters);
  }

  async searchAll(searchTerm: string): Promise<Category[]> {
    const categories = await this.getAll();
    const searchLower = searchTerm.toLowerCase();
    
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    );
  }

  async getById(id: string): Promise<Category | null> {
    return super.getById(id);
  }

  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newCategory: Omit<Category, 'id'> = {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return super.create(newCategory);
  }

  async update(id: string, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const updateData = {
      ...category,
      updatedAt: new Date()
    };
    return super.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    return super.delete(id);
  }
}

