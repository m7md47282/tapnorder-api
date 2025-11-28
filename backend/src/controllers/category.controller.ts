import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { CreateCategoryCommand, UpdateCategoryCommand, CategoryQuery } from '../entities/category.entity';
import { ErrorHandler } from '../shared/errors/error-handler';
import { 
  ValidationError, 
  MissingRequiredFieldError,
  ItemNotFoundError
} from '../shared/errors/custom-errors';

export class CategoryController {
  private readonly categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Create a new category
   * POST /categories
   */
  createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'POST') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST method for creating category data'
        });
      }

      if (!req.body.name) {
        throw new MissingRequiredFieldError('name', {
          field: 'name',
          value: req.body.name
        });
      }

      const command: CreateCategoryCommand = {
        name: req.body.name,
        description: req.body.description,
        menuId: req.body.menuId,
        displayOrder: req.body.displayOrder,
        isActive: req.body.isActive,
        imageUrl: req.body.imageUrl
      };

      const category = await this.categoryService.createCategory(command);
      
      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        category, 
        'Category created successfully', 
        201, 
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Update an existing category
   * PUT /categories/{categoryId} or PUT /categories with id in body
   */
  updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'PUT') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      
      // Try to get ID from path parameter first, then from request body
      const categoryId = req.params[0] || req.body?.id;
      if (!categoryId) {
        res.status(400).json({
          success: false,
          message: 'Category ID is required. Provide it either in the URL path (/categories/{id}) or in the request body ({"id": "..."})'
        });
        return;
      }

      const command: UpdateCategoryCommand = {
        id: categoryId,
        name: req.body.name,
        description: req.body.description,
        displayOrder: req.body.displayOrder,
        isActive: req.body.isActive,
        imageUrl: req.body.imageUrl
      };

      const category = await this.categoryService.updateCategory(command);
      
      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Delete a category
   * DELETE /categories/{categoryId}
   */
  deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'DELETE') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      const categoryId = req.params[0];
      if (!categoryId) {
        res.status(400).json({
          success: false,
          message: 'Category ID is required'
        });
        return;
      }

      await this.categoryService.deleteCategory(categoryId);
      
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get category by ID
   * GET /categories/{categoryId}
   */
  getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving category data'
        });
      }
      
      const categoryId = req.params[0];

      if (!categoryId) {  
        throw new MissingRequiredFieldError('id', {
          field: 'id',
          value: categoryId,
          suggestion: 'Provide category ID as a path parameter'
        });
      }

      const category = await this.categoryService.getCategoryById(categoryId);
      
      if (!category) {
        throw new ItemNotFoundError(categoryId);
      }

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        category, 
        'Category retrieved successfully', 
        200, 
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get categories by menu ID
   * GET /categories?menuId=xxx
   */
  getCategoriesByMenuId = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      const menuId = (req.query.menuId || req.query.menu_id) as string;
      if (!menuId) {
        res.status(400).json({
          success: false,
          message: 'Menu ID is required for this operation'
        });
        return;
      }
      const categories = await this.categoryService.getCategoriesByMenuId(menuId);
      
      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get active categories
   * GET /categories?menuId=xxx&isActive=true (menuId is optional)
   */
  getActiveCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      const menuId = (req.query.menuId || req.query.menu_id) as string | undefined;
      const categories = await this.categoryService.getActiveCategories(menuId);
      
      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Search categories
   * GET /categories?menuId=xxx&search=xxx (menuId is optional)
   */
  searchCategories = async (req: Request, res: Response): Promise<void> => {
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
      const categories = await this.categoryService.searchCategories(menuId, searchTerm);
      
      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Query categories with filters
   * GET /categories?menuId=xxx&isActive=true|false&search=xxx
   */
  queryCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      if(req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      // Support both camelCase (preferred) and snake_case (backward compatibility)
      const query: CategoryQuery = {
        menuId: (req.query.menuId || req.query.menu_id) as string | undefined,
        isActive: req.query.isActive === 'true' || req.query.is_active === 'true' ? true : 
                  req.query.isActive === 'false' || req.query.is_active === 'false' ? false : undefined,
        search: (req.query.search || req.query.q) as string | undefined
      };

      const categories = await this.categoryService.queryCategories(query);
      
      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    ErrorHandler.handleError(error, {} as Request, res);
  }
}

