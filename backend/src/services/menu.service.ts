import { MenuRepository, Menu, MenuItem } from '../repositories/menu/menu.repository';
import { DatabaseClientFactory } from '../database/database-client';

export class MenuService {
  private readonly menuRepository: MenuRepository;

  constructor(menuRepository?: MenuRepository) {
    this.menuRepository = menuRepository || new MenuRepository(DatabaseClientFactory.getClient());
  }

  async getMenuByPlaceId(placeId: string): Promise<Menu | null> {
    return this.menuRepository.getByPlaceId(placeId);
  }

  async updateMenu(placeId: string, menuData: Partial<Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'placeId'>>): Promise<void> {
    const menu = await this.menuRepository.getByPlaceId(placeId);
    if (!menu) {
      throw new Error('Menu not found for the given place ID');
    }

    const updatedMenu: Menu = {
      ...menu,
      ...menuData,
      updatedAt: new Date()
    };

    await this.menuRepository.update(menu.id, updatedMenu);
  }

  async createMenu(placeId: string, menuData: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newMenu: Omit<Menu, 'id'> = {
      ...menuData,
      placeId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.menuRepository.create(newMenu);
  }

  async updateMenuItem(placeId: string, itemId: string, itemData: Partial<MenuItem>): Promise<void> {
    const menu = await this.menuRepository.getByPlaceId(placeId);
    if (!menu) {
      throw new Error('Menu not found for the given place ID');
    }

    const itemIndex = menu.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Menu item not found');
    }

    const currentItem = menu.items[itemIndex];
    if (!currentItem) {
      throw new Error('Menu item not found');
    }

    // Create updated item with only defined values from itemData
    const updatedItem: MenuItem = {
      ...currentItem,
      ...(itemData.name !== undefined && { name: itemData.name }),
      ...(itemData.description !== undefined && { description: itemData.description }),
      ...(itemData.price !== undefined && { price: itemData.price }),
      ...(itemData.available !== undefined && { available: itemData.available })
    };

    menu.items[itemIndex] = updatedItem;
    menu.updatedAt = new Date();

    await this.menuRepository.update(menu.id, menu);
  }
}
