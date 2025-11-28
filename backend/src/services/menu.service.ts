import { IMenuRepository } from '../repositories/interfaces/menu.repository.interface';
import { Menu } from '../repositories/menu/types';
import { MenuRepository } from '../repositories/menu/menu.repository';
import { Item } from '../entities/item.entity';
import { IMenuService } from './interfaces/menu.service.interface';

/**
 * Menu Service - Simplified version using Firebase directly
 * Contains ALL business logic and validation
 * Uses Firebase repository directly
 */
export class MenuService implements IMenuService {
  private menuRepository: IMenuRepository;

  constructor(menuRepository?: IMenuRepository) {
    this.menuRepository = menuRepository ?? new MenuRepository();
  }

  async getMenuByPlaceId(placeId: string): Promise<Menu | null> {
    return this.menuRepository.getByPlaceId(placeId);
  }

  async getMenuById(id: string): Promise<Menu | null> {
    return this.menuRepository.getById(id);
  }

  async getMenuWithItems(placeId: string): Promise<{ menu: Menu; items: Item[] } | null> {
    const menu = await this.menuRepository.getByPlaceId(placeId);
    if (!menu) return null;
    // Item fetching should be via ItemService; placeholder returns empty for now
    return { menu, items: [] };
  }

  async updateMenu(placeId: string, menuData: Partial<Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'placeId'>>): Promise<void> {
    const menu = await this.menuRepository.getByPlaceId(placeId);
    if (!menu) {
      throw new Error('Menu not found for the given place ID');
    }

    await this.menuRepository.update(menu.id, menuData);
  }

  async createMenu(placeId: string, menuData: Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'placeId'>): Promise<string> {
    console.log('MenuService: Starting createMenu for placeId:', placeId);
    
    const newMenu: Omit<Menu, 'id'> = {
      ...menuData,
      placeId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const menuId = await this.menuRepository.create(newMenu as any);
    console.log('MenuService: Repository.createMenu completed, menuId:', menuId);
    
    return menuId;
  }

  // Item operations should be handled by a dedicated ItemService, not MenuService

}
