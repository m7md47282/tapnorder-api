import { Request, Response } from 'express';
import { BranchService } from '../services/branch.service';
import { IBranchService } from '../services/interfaces/branch.service.interface';
import { BranchRepository } from '../repositories/branch/branch.repository';
import { CreateBranchCommand, UpdateBranchCommand, BranchQuery } from '../entities/branch.entity';

/**
 * Branch Controller - Presentation Layer (Firebase Functions)
 * NO business logic - delegates to service layer
 * Handles HTTP requests and responses
 * Follows Clean Architecture principles
 */
export class BranchController {
  private readonly branchService: IBranchService;

  constructor(branchService?: IBranchService) {
    this.branchService = branchService ?? new BranchService(new BranchRepository());
  }

  /**
   * Create a new branch
   * POST /branches
   */
  async createBranch(req: Request, res: Response): Promise<void> {
    try {
      const command: CreateBranchCommand = req.body;
      
      if (!command.placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }

      const branch = await this.branchService.createBranch(command);
      
      res.status(201).json({
        success: true,
        data: branch,
        message: 'Branch created successfully'
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create branch',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Update an existing branch
   * PUT /branches/{id} or PUT /branches?id={id} or PUT /branches with id in body
   */
  async updateBranch(req: Request, res: Response): Promise<void> {
    try {
      // Try multiple sources for branch ID (in order of preference):
      // 1. Path parameter (req.params[0] - set by middleware)
      // 2. Query parameter (req.query.id)
      // 3. Request body (req.body.id)
      const branchId = (req.params?.[0] as string) || 
                      (req.query.id as string) || 
                      (req.body?.id as string);
      
      if(!branchId) {
        res.status(400).json({
          success: false,
          message: 'Branch ID is required',
          errors: ['Branch ID must be provided in path, query parameter, or request body']
        });
        return;
      }
      
      // Extract update data from body, excluding the id field
      const bodyData = { ...req.body };
      delete bodyData.id;
      
      const command: UpdateBranchCommand = {
        id: branchId,
        ...bodyData
      };

      const branch = await this.branchService.updateBranch(command);
      
      res.status(200).json({
        success: true,
        data: branch,
        message: 'Branch updated successfully'
      });
    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update branch',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Delete a branch
   * DELETE /branches/{id} or DELETE /branches?id={id}
   */
  async deleteBranch(req: Request, res: Response): Promise<void> {
    try {
      // Try multiple sources for branch ID
      const branchId = (req.params?.[0] as string) || 
                      (req.query.id as string) || 
                      (req.body?.id as string);
      
      if(!branchId) {
        res.status(400).json({
          success: false,
          message: 'Branch ID is required',
          errors: ['Branch ID must be provided in path, query parameter, or request body']
        });
        return;
      }
      
      await this.branchService.deleteBranch(branchId);
      
      res.status(200).json({
        success: true,
        message: 'Branch deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting branch:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to delete branch',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get a branch by ID
   * GET /branches/{id} or GET /branches?id={id}
   */
  async getBranchById(req: Request, res: Response): Promise<void> {
    try {
      // Try multiple sources for branch ID
      const branchId = (req.params?.[0] as string) || 
                      (req.query.id as string);
      
      if(!branchId) {
        res.status(400).json({
          success: false,
          message: 'Branch ID is required',
          errors: ['Branch ID must be provided in path or query parameter']
        });
        return;
      }
      
      const branch = await this.branchService.getBranchById(branchId);
      
      if (!branch) {
        res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: branch
      });
    } catch (error) {
      console.error('Error getting branch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get branch',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Query branches with optional filters
   * GET /branches?place_id=xxx&status=active&city=xxx&state=xxx&allow_online_orders=true&search=xxx
   */
  async queryBranches(req: Request, res: Response): Promise<void> {
    try {
      const query: BranchQuery = {
        placeId: (req.query.place_id || req.query.placeId) as string,
        status: req.query.status as BranchQuery['status'],
        city: req.query.city as string,
        state: req.query.state as string,
        allowOnlineOrders: req.query.allow_online_orders === 'true' ? true : 
                          req.query.allow_online_orders === 'false' ? false : undefined,
        searchTerm: (req.query.search || req.query.q) as string
      };

      const branches = await this.branchService.queryBranches(query);
      
      res.status(200).json({
        success: true,
        data: branches,
        count: branches.length
      });
    } catch (error) {
      console.error('Error querying branches:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to query branches',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
}

