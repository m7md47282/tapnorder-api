import { Request, Response } from 'express';
import { ItemService } from '../services/item.service';
import { CreateItemCommand, UpdateItemCommand, ItemQuery } from '../entities/item.entity';
import { ErrorHandler } from '../shared/errors/error-handler';
import { 
  ValidationError, 
  MissingRequiredFieldError,
  ItemNotFoundError
} from '../shared/errors/custom-errors';

export class ItemsController {
  private readonly itemService: ItemService;

  constructor() {
    this.itemService = new ItemService();
  }

  /**
   * Create a new item
   * POST /items
   */
  createItem = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'POST') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST method for creating item data'
        });
      }

      if (!req.body.name) {
        throw new MissingRequiredFieldError('name', {
          field: 'name',
          value: req.body.name
        });
      }

      const command: CreateItemCommand = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        // Support both 'category' and 'categoryId' for backward compatibility
        categoryId: req.body.categoryId !== undefined ? req.body.categoryId : req.body.category,
        imageUrl: req.body.imageUrl,
        isAvailable: req.body.isAvailable,
        preparationTime: req.body.preparationTime,
        ingredients: req.body.ingredients,
        specs: req.body.specs,
        menuId: req.body.menuId,
        addonGroups: req.body.addonGroups,
        addonGroupIds: req.body.addonGroupIds
      };

      const item = await this.itemService.createItem(command);
      
      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        item, 
        'Item created successfully', 
        201, 
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Update an existing item
   * PUT /items/{itemId} or PUT /items?id={itemId} or PUT /items with id in body
   */
  updateItem = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'PUT') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      
      // Try to get ID from path parameter first, then query parameter, then request body
      const itemId = req.params[0] || (req.query.id as string) || req.query.itemId as string || req.body?.id;
      if (!itemId) {
        res.status(400).json({
          success: false,
          message: 'Item ID is required. Provide it either in the URL path (/items/{id}), as a query parameter (?id=...), or in the request body ({"id": "..."})'
        });
        return;
      }

      const command: UpdateItemCommand = {
        id: itemId,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        // Support both 'category' and 'categoryId' for backward compatibility
        // Use categoryId if provided, otherwise fall back to category, or undefined if neither provided
        categoryId: req.body.categoryId !== undefined ? req.body.categoryId : (req.body.category !== undefined ? req.body.category : undefined),
        imageUrl: req.body.imageUrl,
        isAvailable: req.body.isAvailable,
        preparationTime: req.body.preparationTime,
        ingredients: req.body.ingredients,
        specs: req.body.specs,
        addonGroups: req.body.addonGroups,
        addonGroupIds: req.body.addonGroupIds
      };

      const item = await this.itemService.updateItem(command);
      
      res.status(200).json({
        success: true,
        data: item,
        message: 'Item updated successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Delete an item
   * DELETE /items/{itemId} or DELETE /items?id={itemId}
   */
  deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'DELETE') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      // Try to get ID from path parameter first, then from query parameter
      const itemId = req.params[0] || (req.query.id as string) || req.query.itemId as string;
      if (!itemId) {
        res.status(400).json({
          success: false,
          message: 'Item ID is required. Provide it either in the URL path (/items/{id}) or as a query parameter (?id=...)'
        });
        return;
      }

      await this.itemService.deleteItem(itemId);
      
      res.status(200).json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get item by ID
   * GET /items/{itemId} or GET /itemDetail?id={itemId}
   */
  getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving item data'
        });
      }
      
      // Try to get ID from path parameter first, then from query parameter
      const itemId = (req.query.id as string);

      if (!itemId) {  
        throw new MissingRequiredFieldError('id', {
          field: 'id',
          value: itemId,
          suggestion: 'Provide item ID either in the URL path (/items/{id}) or as a query parameter (?id=...)'
        });
      }

      const item = await this.itemService.getItemById(itemId);
      
      if (!item) {
        throw new ItemNotFoundError(itemId);
      }

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        item, 
        'Item retrieved successfully', 
        200, 
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get items by menu ID
   * GET /items?menuId=menuId
   */
  getItemsByMenuId = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      const menuId = (req.query.menuId || req.query.menu_id) as string | undefined;
      const items = await this.itemService.getItemsByMenuId(menuId);
      
      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get items by category ID
   * GET /items?menu_id=xxx&category_id=xxx
   */
  getItemsByCategoryId = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      const menuId = (req.query.menu_id || req.query.menuId) as string | undefined;
      const categoryId = (req.query.category_id || req.query.categoryId) as string;
      if (!categoryId) {
        res.status(400).json({
          success: false,
          message: 'Category ID is required'
        });
        return;
      }
      const items = await this.itemService.getItemsByCategoryId(menuId, categoryId);
      
      res.status(200).json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };


  /**
   * Get available items
   * GET /items?menuId=menuId&isAvailable=true
   */
  getAvailableItems = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      const menuId = (req.query.menuId || req.query.menu_id) as string | undefined;
      const items = await this.itemService.getAvailableItems(menuId);
      
      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };


  /**
   * Search items
   * GET /items?menuId=menuId&search=searchTerm
   */
  searchItems = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      const menuId = (req.query.menuId || req.query.menu_id) as string | undefined;
      const searchTerm = (req.query.search || req.query.q) as string;
      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }
      const items = await this.itemService.searchItems(menuId, searchTerm);
      
      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Query items with filters
   * GET /items?menuId=xxx&categoryId=xxx&isAvailable=true|false&search=xxx
   */
  queryItems = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      // Support both camelCase (preferred) and snake_case (backward compatibility)
      const query: ItemQuery = {
        menuId: (req.query.menuId || req.query.menu_id) as string,
        categoryId: (req.query.categoryId || req.query.category_id) as string,
        isAvailable: req.query.isAvailable === 'true' || req.query.is_available === 'true' ? true : 
                    req.query.isAvailable === 'false' || req.query.is_available === 'false' ? false : undefined,
        search: (req.query.search || req.query.q) as string
      };

      const items = await this.itemService.queryItems(query);
      
      res.status(200).json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    ErrorHandler.handleError(error, {} as Request, res);
  }
}