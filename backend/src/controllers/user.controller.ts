import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { IUserService, AdminCreateUserCommand } from '../services/interfaces/user.service.interface';
import { AuthenticatedRequest } from '../shared/middleware/auth.middleware';
import { ErrorHandler } from '../shared/errors/error-handler';
import { MissingRequiredFieldError, ValidationError } from '../shared/errors/custom-errors';

/**
 * User Controller - Administrative user management endpoints.
 * 
 * Notes:
 * - NO business logic here; delegates to UserService.
 * - Requires authentication via AuthMiddleware.
 */
export class UserController {
  private readonly userService: IUserService;

  constructor(userService?: IUserService) {
    this.userService = userService ?? new UserService();
  }

  /**
   * Get users with optional filters
   * GET /users?placeId=xxx&branchId=xxx&roleId=xxx&status=xxx
   * 
   * Behaviour:
   * - Super admin: can query users from any place.
   * - Place admin: can only query users from places they manage.
   */
  getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        throw new ValidationError('Method not allowed for getting users', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET /users to query users'
        });
      }

      const authenticated = req.authenticatedUser;
      if (!authenticated) {
        throw new MissingRequiredFieldError('authenticatedUser', {
          suggestion: 'Attach AuthMiddleware.attachAuthenticatedUser before hitting this controller'
        });
      }

      // Support both camelCase (preferred) and snake_case (backward compatibility)
      const placeId = (req.query.placeId || req.query.place_id) as string | undefined;
      const branchId = (req.query.branchId || req.query.branch_id) as string | undefined;
      const roleId = req.query.roleId || req.query.role_id ? Number(req.query.roleId || req.query.role_id) : undefined;
      const status = (req.query.status as string | undefined);

      const users = await this.userService.queryUsers(
        { user: authenticated.user },
        {
          placeId,
          branchId,
          roleId,
          status
        }
      );

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        users,
        'Users retrieved successfully',
        200,
        req
      );
      res.status(statusCode).json({
        ...response,
        count: users.length
      });
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  /**
   * Create a new user (admin or crew)
   * POST /users
   * 
   * Behaviour:
   * - Super admin: can create any role and associate with any places.
   * - Place admin: can create crew users (kitchen, cashier, waiter, etc.)
   *   only for places they manage.
   */
  createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        throw new ValidationError('Method not allowed for user creation', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST /users to create users'
        });
      }

      const authenticated = req.authenticatedUser;
      if (!authenticated) {
        throw new MissingRequiredFieldError('authenticatedUser', {
          suggestion: 'Attach AuthMiddleware.attachAuthenticatedUser before hitting this controller'
        });
      }

      const primaryPlaceId = (req.query.place_id || req.query.placeId) as string | undefined;
      const branchId = (req.body?.branchId || req.body?.branch_id || req.query.branch_id) as string | undefined;

      const command: AdminCreateUserCommand = {
        email: req.body?.email,
        password: req.body?.password,
        displayName: req.body?.displayName,
        deviceInfo: req.body?.deviceInfo || req.headers['user-agent'],
        metadata: req.body?.metadata,
        preferredRoleId: req.body?.roleId ?? req.body?.role_id,
        roleId: req.body?.roleId ?? req.body?.role_id,
        roleKey: req.body?.roleKey ?? req.body?.role_key ?? req.body?.role,
        preferences: req.body?.preferences,
        placeId: req.body?.placeId || req.body?.place_id,
        branchId: branchId || null,
        ipAddress: this.getRequestIp(req),
        primaryPlaceId,
        // Backward compatibility
        places: Array.isArray(req.body?.places) ? req.body.places : undefined
      };

      const result = await this.userService.createUserForAdmin(
        { user: authenticated.user },
        command
      );

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        result,
        'User created successfully',
        201,
        req
      );
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  private getRequestIp(req: Request): string | undefined {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip;
  }

  private handleError(req: Request, res: Response, error: unknown): void {
    ErrorHandler.handleError(error, req, res);
  }
}


