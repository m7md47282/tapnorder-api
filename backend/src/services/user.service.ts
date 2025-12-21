import { AuthService } from './auth.service';
import { AuthorizationService, IUserContext } from './authorization.service';
import { IUserService, AdminCreateUserCommand, AdminCreateUserResult, UserQuery } from './interfaces/user.service.interface';
import { AuthenticatedUser, User, UserRole } from '../entities/user.entity';
import { MissingRequiredFieldError, ValidationError, ForbiddenError } from '../shared/errors/custom-errors';
import { IUserRepository, UserRepository } from '../repositories/user/user.repository';
import { QueryFilter } from '../repositories/types';

/**
 * User Service - Administrative user management and crew onboarding.
 * 
 * Responsibilities:
 * - Apply business rules for which roles can create which other roles
 * - Enforce place-based authorization when creating crew users
 * - Delegate identity creation & persistence to AuthService
 */
export class UserService implements IUserService {
  private readonly authService: AuthService;
  private readonly authorizationService: AuthorizationService;
  private readonly userRepository: IUserRepository;

  // Roles that can be created by place-level admins (crew roles)
  private static readonly PLACE_CREW_ROLES: UserRole[] = [
    UserRole.WAITER,
    UserRole.CASHIER,
    UserRole.HOST,
    UserRole.CHEF,
    UserRole.BARTENDER,
    UserRole.DELIVERY_DRIVER,
    UserRole.INVENTORY_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.SALES_STAFF
  ];

  constructor(
    authService?: AuthService,
    authorizationService?: AuthorizationService,
    userRepository?: IUserRepository
  ) {
    this.authService = authService ?? new AuthService();
    this.authorizationService = authorizationService ?? new AuthorizationService();
    this.userRepository = userRepository ?? new UserRepository();
  }

  async createUserForAdmin(
    context: IUserContext,
    command: AdminCreateUserCommand
  ): Promise<AdminCreateUserResult> {
    this.authorizationService.assertAuthenticated(context);

    // Basic validation
    if (!command.email || command.email.trim() === '') {
      throw new MissingRequiredFieldError('email');
    }
    if (!command.password || command.password.trim() === '') {
      throw new MissingRequiredFieldError('password');
    }

    // Determine requested role
    const requestedRoleId = this.resolveRequestedRoleId(command);

    // Resolve placeId and branchId
    let placeId: string | null = null;
    let branchId: string | null = null;

    // Super admin has no placeId (can access all places)
    if (requestedRoleId === UserRole.SUPER_ADMIN) {
      placeId = null;
      branchId = null;
    } else {
      // All other users MUST have a placeId
      placeId = this.resolvePlaceId(command, context);
      
      // Validate branchId if provided
      if (command.branchId) {
        branchId = command.branchId;
        // TODO: Validate branch belongs to place (add validation when branch service is available)
      } else {
        // branchId is null = user is shared across all branches
        branchId = null;
      }
    }

    // Super admin can create any role
    if (this.authorizationService.isSuperAdmin(context)) {
      const signupCommand = this.buildSignupCommandForAdmin(command, requestedRoleId, placeId, branchId);
      return this.authService.signup(signupCommand as any as AdminCreateUserCommand) as Promise<AuthenticatedUser>;
    }

    // Place-level admin: can only create crew roles for their own places
    if (!placeId) {
      throw new MissingRequiredFieldError('placeId', {
        suggestion: 'Place ID is required for non-super-admin users'
      });
    }

    this.authorizationService.assertCanAccessPlace(context, placeId);

    if (!UserService.PLACE_CREW_ROLES.includes(requestedRoleId)) {
      throw new ForbiddenError('Place admins can only create crew users (kitchen, cashier, waiter, etc.)', {
        type: 'ROLE_NOT_ALLOWED_FOR_PLACE_ADMIN',
        value: requestedRoleId
      });
    }

    const signupCommand = this.buildSignupCommandForAdmin(command, requestedRoleId, placeId, branchId);
    return this.authService.signup(signupCommand as any as AdminCreateUserCommand) as Promise<AuthenticatedUser>;
  }

  async queryUsers(
    context: IUserContext,
    query: UserQuery
  ): Promise<User[]> {
    this.authorizationService.assertAuthenticated(context);

    // Build query filters
    const filters: QueryFilter[] = [];

    // Super admin can query any place, place admin can only query their own place
    if (this.authorizationService.isSuperAdmin(context)) {
      // Super admin can query any place or all places
      if (query.placeId) {
        filters.push({ field: 'placeId', operator: '==', value: query.placeId });
      }
    } else {
      // Place admin: must query their own place
      const userPlaceId = context.user.placeId;
      if (!userPlaceId) {
        throw new ForbiddenError('Place admin must have a placeId to query users', {
          type: 'MISSING_PLACE_ID',
          value: userPlaceId
        });
      }

      // If query specifies a placeId, verify access
      if (query.placeId) {
        if (query.placeId !== userPlaceId) {
          // Verify the user can access this place
          this.authorizationService.assertCanAccessPlace(context, query.placeId);
        }
        filters.push({ field: 'placeId', operator: '==', value: query.placeId });
      } else {
        // Use the user's placeId if not specified
        filters.push({ field: 'placeId', operator: '==', value: userPlaceId });
      }
    }

    // Add optional filters
    if (query.branchId) {
      filters.push({ field: 'branchId', operator: '==', value: query.branchId });
    }

    if (query.roleId !== undefined) {
      filters.push({ field: 'roleId', operator: '==', value: query.roleId });
    }

    if (query.status) {
      filters.push({ field: 'status', operator: '==', value: query.status });
    }

    // Query users using repository
    return this.userRepository.query(filters);
  }

  async getUserById(_id: string): Promise<User | null> {
    // For now delegate to AuthService via current-user flows if needed later.
    // A dedicated user repository-based method can be added when listing/querying users.
    return null;
  }

  private resolveRequestedRoleId(command: AdminCreateUserCommand): UserRole {
    if (command.roleId && Object.values(UserRole).includes(command.roleId)) {
      return command.roleId as UserRole;
    }

    if (command.roleKey && typeof command.roleKey === 'string') {
      const upper = command.roleKey.toUpperCase();
      if (upper in UserRole) {
        return (UserRole as any)[upper] as UserRole;
      }
    }

    throw new ValidationError('Role is required when creating users as admin', {
      field: 'roleId',
      value: command.roleId ?? command.roleKey,
      suggestion: 'Provide a valid roleId or roleKey for the new user'
    });
  }

  private resolvePlaceId(command: AdminCreateUserCommand, context: IUserContext): string {
    // Priority: explicit placeId > primaryPlaceId > first from places array > context user's placeId
    if (command.placeId && command.placeId.trim() !== '') {
      return command.placeId;
    }

    if (command.primaryPlaceId && command.primaryPlaceId.trim() !== '') {
      return command.primaryPlaceId;
    }

    if (Array.isArray(command.places) && command.places.length > 0) {
      const first = command.places[0];
      if (typeof first === 'string' && first.trim() !== '') {
        return first;
      }
    }

    // For place-level admins, use their own placeId
    if (context.user.placeId) {
      return context.user.placeId;
    }

    throw new MissingRequiredFieldError('placeId', {
      suggestion: 'Provide a placeId, primaryPlaceId query parameter, or include at least one place in the request'
    });
  }

  private buildSignupCommandForAdmin(
    command: AdminCreateUserCommand,
    roleId: UserRole,
    placeId: string | null,
    branchId: string | null
  ): AdminCreateUserCommand {
    return {
      email: command.email,
      password: command.password,
      displayName: command.displayName,
      deviceInfo: command.deviceInfo,
      metadata: command.metadata,
      preferredRoleId: roleId,
      roleId,
      roleKey: command.roleKey,
      preferences: command.preferences,
      placeId,
      branchId,
      ipAddress: command.ipAddress
    };
  }
}


