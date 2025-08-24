import { Request, Response } from 'express';
import { MenuService } from '../services/menu.service';
import { Menu, MenuItem } from '../repositories/menu/menu.repository';

type ApiResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  private sendResponse<T>(res: Response, statusCode: number, response: ApiResponse<T>): void {
    res.status(statusCode).json(response);
  }

  private handleError(res: Response, error: unknown): void {
    const err = error as Error;
    if (err.message === 'Menu not found for the given place ID' || err.message === 'Menu item not found') {
      this.sendResponse(res, 404, {
        success: false,
        error: err.message
      });
      return;
    }

    this.sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }

  private validatePlaceId(placeId: string | undefined): placeId is string {
    return typeof placeId === 'string' && placeId.trim().length > 0;
  }

  private validateMenuItemData(data: Partial<MenuItem>): boolean {
    if (!data) return false;
    
    if ('price' in data && (typeof data.price !== 'number' || data.price < 0)) {
      return false;
    }
    
    if ('available' in data && typeof data.available !== 'boolean') {
      return false;
    }
    
    if ('name' in data && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
      return false;
    }

    return true;
  }

  getMenuByPlaceId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId } = req.params;
      
      if (!this.validatePlaceId(placeId)) {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid place ID'
        });
        return;
      }

      const menu = await this.menuService.getMenuByPlaceId(placeId);

      if (!menu) {
        this.sendResponse(res, 404, {
          success: false,
          error: 'Menu not found'
        });
        return;
      }

      this.sendResponse(res, 200, {
        success: true,
        data: menu
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId } = req.params;
      const menuData = req.body as Partial<Omit<Menu, 'id' | 'createdAt' | 'updatedAt' | 'placeId'>>;

      if (!this.validatePlaceId(placeId)) {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid place ID'
        });
        return;
      }

      if (!menuData || typeof menuData !== 'object') {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid menu data'
        });
        return;
      }

      await this.menuService.updateMenu(placeId, menuData);
      
      this.sendResponse(res, 200, {
        success: true,
        message: 'Menu updated successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  createMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId } = req.params;
      const menuData = req.body as Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>;

      if (!this.validatePlaceId(placeId)) {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid place ID'
        });
        return;
      }

      if (!menuData || !Array.isArray(menuData.items)) {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid menu data. Menu items array is required'
        });
        return;
      }

      const menuId = await this.menuService.createMenu(placeId, menuData);
      
      this.sendResponse(res, 201, {
        success: true,
        message: 'Menu created successfully',
        data: { id: menuId }
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateMenuItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId, itemId } = req.params;
      const itemData = req.body as Partial<MenuItem>;

      if (!this.validatePlaceId(placeId)) {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid place ID'
        });
        return;
      }

      if (!itemId || typeof itemId !== 'string' || itemId.trim().length === 0) {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid item ID'
        });
        return;
      }

      if (!this.validateMenuItemData(itemData)) {
        this.sendResponse(res, 400, {
          success: false,
          error: 'Invalid menu item data'
        });
        return;
      }

      await this.menuService.updateMenuItem(placeId, itemId, itemData);
      
      this.sendResponse(res, 200, {
        success: true,
        message: 'Menu item updated successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };
}