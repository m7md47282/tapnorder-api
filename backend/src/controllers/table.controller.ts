import { Request, Response } from 'express';
import { TableService } from '../services/table.service';
import { ITableService } from '../services/interfaces/table.service.interface';
import { TableRepository } from '../repositories/table/table.repository';
import { CreateTableCommand, UpdateTableCommand, TableQuery } from '../entities/table.entity';

/**
 * Table Controller - Presentation Layer (Firebase Functions)
 * NO business logic - delegates to service layer
 * Handles HTTP requests and responses
 * Follows Clean Architecture principles
 */
export class TableController {
  private readonly tableService: ITableService;

  constructor(tableService?: ITableService) {
    this.tableService = tableService ?? new TableService(new TableRepository());
  }

  /**
   * Create a new table
   * POST /tables
   */
  async createTable(req: Request, res: Response): Promise<void> {
    try {
      const command: CreateTableCommand = req.body;
      
      if (!command.placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }

      if (!command.tableNumber) {
        res.status(400).json({
          success: false,
          message: 'Table number is required',
          errors: ['Table number must be provided']
        });
        return;
      }

      if (!command.capacity || command.capacity < 1) {
        res.status(400).json({
          success: false,
          message: 'Table capacity must be at least 1',
          errors: ['Capacity must be a positive integer']
        });
        return;
      }

      const table = await this.tableService.createTable(command);
      
      res.status(201).json({
        success: true,
        data: table,
        message: 'Table created successfully'
      });
    } catch (error) {
      console.error('Error creating table:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create table',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Update an existing table
   * PUT /tables/{id}
   */
  async updateTable(req: Request, res: Response): Promise<void> {
    try {
      const tableId = req.params[0];
      
      if (!tableId) {
        res.status(400).json({
          success: false,
          message: 'Table ID is required',
          errors: ['Table ID must be provided in path, query parameter, or request body']
        });
        return;
      }
      
      const bodyData = { ...req.body };
      delete bodyData.id;
      
      const command: UpdateTableCommand = {
        id: tableId,
        ...bodyData
      };

      const table = await this.tableService.updateTable(command);
      
      res.status(200).json({
        success: true,
        data: table,
        message: 'Table updated successfully'
      });
    } catch (error) {
      console.error('Error updating table:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update table',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Delete a table
   * DELETE /tables/{id}
   */
  async deleteTable(req: Request, res: Response): Promise<void> {
    try {
      const tableId = req.params[0];
      
      if (!tableId) {
        res.status(400).json({
          success: false,
          message: 'Table ID is required',
          errors: ['Table ID must be provided in path, query parameter, or request body']
        });
        return;
      }

      await this.tableService.deleteTable(tableId);
      
      res.status(200).json({
        success: true,
        message: 'Table deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting table:', error);
      const statusCode = error instanceof Error && error.message.includes('active order') ? 400 : 404;
      res.status(statusCode).json({
        success: false,
        message: 'Failed to delete table',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get table by ID
   * GET /tables/{id}
   */
  async getTableById(req: Request, res: Response): Promise<void> {
    try {
      const tableId = req.params[0];
      
      if (!tableId) {
        res.status(400).json({
          success: false,
          message: 'Table ID is required',
          errors: ['Table ID must be provided in path or query parameter']
        });
        return;
      }

      const table = await this.tableService.getTableById(tableId);
      
      if (!table) {
        res.status(404).json({
          success: false,
          message: 'Table not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: table,
        message: 'Table retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting table:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve table',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Query tables with filters
   * GET /tables?place_id=xxx&branch_id=xxx&status=xxx&location=xxx&is_active=true&search=xxx
   */
  async queryTables(req: Request, res: Response): Promise<void> {
    try {
      const {
        placeId,
        place_id,
        branchId,
        branch_id,
        status,
        location,
        isActive,
        is_active,
        search,
        q
      } = req.query;

      const finalPlaceId = (placeId || place_id) as string;
      if (!finalPlaceId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }

      const query: TableQuery = {
        placeId: finalPlaceId,
        branchId: (branchId || branch_id) as string,
        status: status as any,
        location: location as string,
        isActive: isActive === 'true' || is_active === 'true' ? true :
                 isActive === 'false' || is_active === 'false' ? false : undefined,
        search: (search || q) as string
      };

      const tables = await this.tableService.queryTables(query);
      
      res.status(200).json({
        success: true,
        data: tables,
        message: 'Tables retrieved successfully',
        count: tables.length
      });
    } catch (error) {
      console.error('Error querying tables:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tables',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
}

