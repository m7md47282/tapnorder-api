import { Request, Response } from 'express';
import { MenuService } from '../services/menu.service';
import { Menu } from '../repositories/menu/types';
import { logger } from 'firebase-functions/v2';
import { ErrorHandler, ApiResponse } from '../shared/errors/error-handler';
import { 
  ValidationError, 
  InvalidInputError, 
  MissingRequiredFieldError,
  MenuNotFoundError
} from '../shared/errors/custom-errors';

/**
 * Menu Controller - Presentation Layer
 * Follows SOLID principles and Clean Architecture
 * NO business logic - delegates to services
 * Handles HTTP requests and responses only
 */
export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  private sendResponse<T>(res: Response, statusCode: number, response: ApiResponse<T>): void {
    res.status(statusCode).json(response);
  }

  private handleError(res: Response, error: unknown): void {
    ErrorHandler.handleError(error, {} as Request, res);
  }

  private validatePlaceId(placeId: string | undefined): placeId is string {
    return typeof placeId === 'string' && placeId.trim().length > 0;
  }

  private validateMenuData(data: Partial<Menu>): void {
    if (!data) {
      throw new InvalidInputError('Menu data is required');
    }
    
    if ('name' in data && data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new ValidationError('Menu name must be a non-empty string', {
          field: 'name',
          value: data.name
        });
      }
    }

    if ('description' in data && data.description !== undefined) {
      if (typeof data.description !== 'string') {
        throw new ValidationError('Menu description must be a string', {
          field: 'description',
          value: data.description
        });
      }
    }

    if ('categories' in data && data.categories !== undefined) {
      if (!Array.isArray(data.categories)) {
        throw new ValidationError('Menu categories must be an array', {
          field: 'categories',
          value: data.categories
        });
      }
    }

    if ('isActive' in data && data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') {
        throw new ValidationError('Menu isActive must be a boolean', {
          field: 'isActive',
          value: data.isActive
        });
      }
    }
  }

  getMenuByPlaceId = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving menu data'
        });
      }
      
      const placeId = req.query.placeId as string;
      
      if (!this.validatePlaceId(placeId)) {
        throw new MissingRequiredFieldError('placeId', {
          field: 'placeId',
          value: placeId,
          suggestion: 'Provide a valid place ID as a query parameter'
        });
      }

      const menu = await this.menuService.getMenuByPlaceId(placeId);

      if (!menu) {
        throw new MenuNotFoundError(placeId);
      }

      const { statusCode, response } = ErrorHandler.createSuccessResponse(menu, 'Menu retrieved successfully', 200, req);
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  createMenuForPlace = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'POST') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST method for creating menu data'
        });
      }

      logger.info('req.query', req.query.placeId);

      const placeId = req.query.placeId as string;
      if (!this.validatePlaceId(placeId)) {
        throw new MissingRequiredFieldError('placeId', {
          field: 'placeId',
          value: placeId,
          suggestion: 'Provide a valid place ID as a query parameter'
        });
      }

      this.validateMenuData(req.body);

      const menuId = await this.menuService.createMenu(placeId, req.body);
  
      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        { menuId }, 
        'Menu created successfully', 
        201, 
        req
      );
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };


  updateMenuForPlace = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'PUT') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use PUT method for updating menu data'
        });
      }

      const placeId = req.query.placeId as string;
      if (!this.validatePlaceId(placeId)) {
        throw new MissingRequiredFieldError('placeId', {
          field: 'placeId',
          value: placeId,
          suggestion: 'Provide a valid place ID as a query parameter'
        });
      }

      this.validateMenuData(req.body);

      await this.menuService.updateMenu(placeId, req.body);

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        null, 
        'Menu updated successfully', 
        200, 
        req
      );
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };


}

