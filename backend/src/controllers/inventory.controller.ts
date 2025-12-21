import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { CreateInventoryCommand, UpdateInventoryCommand, InventoryQuery, InventoryAdjustment } from '../entities/inventory.entity';
import { ErrorHandler } from '../shared/errors/error-handler';
import { 
  ValidationError, 
  MissingRequiredFieldError,
  ItemNotFoundError
} from '../shared/errors/custom-errors';

export class InventoryController {
  private readonly inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Create new inventory item
   * POST /inventory
   */
  createInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST method for creating inventory'
        });
      }

      if (!req.body.placeId) {
        throw new MissingRequiredFieldError('placeId', {
          field: 'placeId',
          value: req.body.placeId
        });
      }

      if (!req.body.ingredientName) {
        throw new MissingRequiredFieldError('ingredientName', {
          field: 'ingredientName',
          value: req.body.ingredientName
        });
      }

      if (!req.body.unit) {
        throw new MissingRequiredFieldError('unit', {
          field: 'unit',
          value: req.body.unit
        });
      }

      if (req.body.currentQuantity === undefined) {
        throw new MissingRequiredFieldError('currentQuantity', {
          field: 'currentQuantity',
          value: req.body.currentQuantity
        });
      }

      if (req.body.costPerUnit === undefined) {
        throw new MissingRequiredFieldError('costPerUnit', {
          field: 'costPerUnit',
          value: req.body.costPerUnit
        });
      }

      const command: CreateInventoryCommand = {
        placeId: req.body.placeId,
        branchId: req.body.branchId,
        ingredientName: req.body.ingredientName,
        unit: req.body.unit,
        currentQuantity: req.body.currentQuantity,
        costPerUnit: req.body.costPerUnit,
        minStockLevel: req.body.minStockLevel,
        supplier: req.body.supplier,
        notes: req.body.notes
      };

      const inventory = await this.inventoryService.createInventory(command);

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        inventory,
        'Inventory created successfully',
        201,
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Update inventory item
   * PUT /inventory/{id}
   */
  updateInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'PUT') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }

      const inventoryId = req.params[0] || (req.query.id as string) || req.body?.id;
      if (!inventoryId) {
        res.status(400).json({
          success: false,
          message: 'Inventory ID is required. Provide it either in the URL path (/inventory/{id}), as a query parameter (?id=...), or in the request body ({"id": "..."})'
        });
        return;
      }

      const command: UpdateInventoryCommand = {
        id: inventoryId,
        ingredientName: req.body.ingredientName,
        unit: req.body.unit,
        currentQuantity: req.body.currentQuantity,
        costPerUnit: req.body.costPerUnit,
        minStockLevel: req.body.minStockLevel,
        supplier: req.body.supplier,
        lastRestocked: req.body.lastRestocked ? new Date(req.body.lastRestocked) : undefined,
        notes: req.body.notes
      };

      const inventory = await this.inventoryService.updateInventory(command);

      res.status(200).json({
        success: true,
        data: inventory,
        message: 'Inventory updated successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Delete inventory item
   * DELETE /inventory/{id}
   */
  deleteInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'DELETE') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }

      const inventoryId = req.params[0] || (req.query.id as string) || req.query.inventoryId as string;
      if (!inventoryId) {
        res.status(400).json({
          success: false,
          message: 'Inventory ID is required. Provide it either in the URL path (/inventory/{id}) or as a query parameter (?id=...)'
        });
        return;
      }

      await this.inventoryService.deleteInventory(inventoryId);

      res.status(200).json({
        success: true,
        message: 'Inventory deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get inventory by ID
   * GET /inventory/{id} or GET /inventory?id={id}
   */
  getInventoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving inventory'
        });
      }

      const inventoryId = (req.query.id as string) || req.query.inventoryId as string;

      if (!inventoryId) {
        throw new MissingRequiredFieldError('id', {
          field: 'id',
          value: inventoryId,
          suggestion: 'Provide inventory ID either in the URL path (/inventory/{id}) or as a query parameter (?id=...)'
        });
      }

      const inventory = await this.inventoryService.getInventoryById(inventoryId);

      if (!inventory) {
        throw new ItemNotFoundError(inventoryId);
      }

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        inventory,
        'Inventory retrieved successfully',
        200,
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get inventory by place ID
   * GET /inventory?place_id=xxx&branch_id=xxx
   */
  getInventoryByPlaceId = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }

      const placeId = (req.query.placeId || req.query.place_id) as string;
      const branchId = (req.query.branchId || req.query.branch_id) as string | undefined;

      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      const inventory = await this.inventoryService.getInventoryByPlaceId(placeId, branchId);

      res.status(200).json({
        success: true,
        data: inventory,
        count: inventory.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get low stock items
   * GET /inventory?place_id=xxx&branch_id=xxx&low_stock=true
   */
  getLowStockItems = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }

      const placeId = (req.query.placeId || req.query.place_id) as string;
      const branchId = (req.query.branchId || req.query.branch_id) as string | undefined;

      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      const inventory = await this.inventoryService.getLowStockItems(placeId, branchId);

      res.status(200).json({
        success: true,
        data: inventory,
        count: inventory.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Query inventory with filters
   * GET /inventory?place_id=xxx&branch_id=xxx&ingredient_name=xxx&unit=xxx&low_stock=true&search=xxx
   */
  queryInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }

      const query: InventoryQuery = {
        placeId: (req.query.placeId || req.query.place_id) as string,
        branchId: (req.query.branchId || req.query.branch_id) as string,
        ingredientName: (req.query.ingredientName || req.query.ingredient_name) as string,
        unit: (req.query.unit) as InventoryQuery['unit'],
        lowStock: req.query.lowStock === 'true' || req.query.low_stock === 'true',
        search: (req.query.search || req.query.q) as string
      };

      const inventory = await this.inventoryService.queryInventory(query);

      res.status(200).json({
        success: true,
        data: inventory,
        count: inventory.length
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Adjust inventory (add or reduce)
   * POST /inventory/adjust
   */
  adjustInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
        return;
      }

      if (!req.body.inventoryId) {
        res.status(400).json({
          success: false,
          message: 'Inventory ID is required'
        });
        return;
      }

      if (req.body.quantity === undefined) {
        res.status(400).json({
          success: false,
          message: 'Quantity is required'
        });
        return;
      }

      if (!req.body.reason) {
        res.status(400).json({
          success: false,
          message: 'Reason is required'
        });
        return;
      }

      const adjustment: InventoryAdjustment = {
        inventoryId: req.body.inventoryId,
        quantity: req.body.quantity,
        reason: req.body.reason,
        notes: req.body.notes,
        adjustedBy: req.body.adjustedBy || 'system'
      };

      const inventory = await this.inventoryService.adjustInventory(adjustment);

      res.status(200).json({
        success: true,
        data: inventory,
        message: 'Inventory adjusted successfully'
      });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown): void {
    ErrorHandler.handleError(error, {} as Request, res);
  }
}

