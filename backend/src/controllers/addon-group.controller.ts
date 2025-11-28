import { Request, Response } from 'express';
import { AddonGroupService } from '../services/addon-group.service';
import { CreateAddonGroupCommand, UpdateAddonGroupCommand, AddonGroupQuery } from '../entities/addon-group.entity';
import { ErrorHandler } from '../shared/errors/error-handler';
import { 
  ValidationError, 
  MissingRequiredFieldError,
  ItemNotFoundError
} from '../shared/errors/custom-errors';

export class AddonGroupController {
  private readonly addonGroupService: AddonGroupService;

  constructor() {
    this.addonGroupService = new AddonGroupService();
  }

  /**
   * Create a new addon group
   * POST /addonGroups
   */
  createAddonGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST method for creating addon group'
        });
      }

      if (!req.body.name) {
        throw new MissingRequiredFieldError('name', {
          field: 'name',
          value: req.body.name
        });
      }

      if (!req.body.selectionType) {
        throw new MissingRequiredFieldError('selectionType', {
          field: 'selectionType',
          value: req.body.selectionType
        });
      }

      if (!req.body.options || !Array.isArray(req.body.options) || req.body.options.length === 0) {
        throw new MissingRequiredFieldError('options', {
          field: 'options',
          value: req.body.options
        });
      }

      const command: CreateAddonGroupCommand = {
        name: req.body.name,
        description: req.body.description,
        selectionType: req.body.selectionType,
        minSelect: req.body.minSelect,
        maxSelect: req.body.maxSelect,
        isRequired: req.body.isRequired,
        menuId: req.body.menuId,
        placeId: req.body.placeId,
        appliesToCategoryIds: req.body.appliesToCategoryIds,
        appliesToItemIds: req.body.appliesToItemIds,
        options: req.body.options
      };

      const addonGroup = await this.addonGroupService.createAddonGroup(command);
      
      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        addonGroup, 
        'Addon group created successfully', 
        201, 
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Update an existing addon group
   * PUT /addonGroups/{id}
   */
  updateAddonGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'PUT') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      
      // Try to get ID from path parameter first, then from request body
      const addonGroupId = req.params[0] || req.body?.id;
      if (!addonGroupId) {
        res.status(400).json({
          success: false,
          message: 'Addon group ID is required. Provide it either in the URL path (/addonGroups/{id}) or in the request body ({"id": "..."})'
        });
        return;
      }

      const command: UpdateAddonGroupCommand = {
        id: addonGroupId,
        name: req.body.name,
        description: req.body.description,
        selectionType: req.body.selectionType,
        minSelect: req.body.minSelect,
        maxSelect: req.body.maxSelect,
        isRequired: req.body.isRequired,
        isActive: req.body.isActive,
        menuId: req.body.menuId,
        placeId: req.body.placeId,
        appliesToCategoryIds: req.body.appliesToCategoryIds,
        appliesToItemIds: req.body.appliesToItemIds,
        options: req.body.options
      };

      const addonGroup = await this.addonGroupService.updateAddonGroup(command);
      
      res.status(200).json({
        success: true,
        data: addonGroup,
        message: 'Addon group updated successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Delete an addon group
   * DELETE /addonGroups/{id}
   */
  deleteAddonGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'DELETE') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      
      const addonGroupId = req.params[0];
      if (!addonGroupId) {
        res.status(400).json({
          success: false,
          message: 'Addon group ID is required'
        });
        return;
      }

      await this.addonGroupService.deleteAddonGroup(addonGroupId);
      
      res.status(200).json({
        success: true,
        message: 'Addon group deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get addon group by ID
   * GET /addonGroups/{id}
   */
  getAddonGroupById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving addon group data'
        });
      }
      
      const addonGroupId = req.params[0];

      if (!addonGroupId) {  
        throw new MissingRequiredFieldError('id', {
          field: 'id',
          value: addonGroupId,
          suggestion: 'Provide addon group ID as a path parameter'
        });
      }

      const addonGroup = await this.addonGroupService.getAddonGroupById(addonGroupId);
      
      if (!addonGroup) {
        throw new ItemNotFoundError(addonGroupId);
      }

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        addonGroup, 
        'Addon group retrieved successfully', 
        200, 
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Query addon groups with filters
   * GET /addonGroups?placeId=xxx&menuId=xxx&categoryId=xxx&itemId=xxx&isActive=true|false&search=xxx
   */
  queryAddonGroups = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }
      
      // Support both camelCase (preferred) and snake_case (backward compatibility)
      const query: AddonGroupQuery = {
        placeId: (req.query.placeId || req.query.place_id) as string | undefined,
        menuId: (req.query.menuId || req.query.menu_id) as string | undefined,
        categoryId: (req.query.categoryId || req.query.category_id) as string | undefined,
        itemId: (req.query.itemId || req.query.item_id) as string | undefined,
        isActive: req.query.isActive === 'true' || req.query.is_active === 'true' ? true : 
                  req.query.isActive === 'false' || req.query.is_active === 'false' ? false : undefined,
        search: (req.query.search || req.query.q) as string | undefined
      };

      const addonGroups = await this.addonGroupService.queryAddonGroups(query);
      
      res.status(200).json({
        success: true,
        data: addonGroups,
        count: addonGroups.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    ErrorHandler.handleError(error, {} as Request, res);
  }
}

