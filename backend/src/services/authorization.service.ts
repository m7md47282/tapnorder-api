import { User, UserRole } from '../entities/user.entity';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/custom-errors';

export interface IUserContext {
  user: User;
}

export interface IAuthorizationService {
  assertAuthenticated(context?: IUserContext): void;
  assertCanAccessPlace(context: IUserContext, placeId: string): void;
  assertCanAccessBranch(context: IUserContext, placeId: string, branchId?: string | null): void;
  assertCanManageUsers(context: IUserContext): void;
  isSuperAdmin(context: IUserContext): boolean;
}

export class AuthorizationService implements IAuthorizationService {
  assertAuthenticated(context?: IUserContext): void {
    if (!context || !context.user) {
      throw new UnauthorizedError('Authentication required', {
        type: 'AUTH_REQUIRED'
      });
    }
  }

  assertCanAccessPlace(context: IUserContext, placeId: string): void {
    this.assertAuthenticated(context);

    const { user } = context;

    if (!placeId || placeId.trim() === '') {
      throw new ForbiddenError('Place ID is required for authorization', {
        field: 'placeId'
      });
    }

    // Super admin can access any place (they have placeId = null)
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Users must have a placeId
    if (!user.placeId) {
      throw new ForbiddenError('User is not associated with any place', {
        type: 'NO_PLACE_ASSIGNED',
        value: user.id
      });
    }

    // Check if user's placeId matches the requested placeId
    if (user.placeId !== placeId) {
      throw new ForbiddenError('User is not allowed to access this place', {
        type: 'PLACE_ACCESS_FORBIDDEN',
        value: placeId
      });
    }
  }

  /**
   * Assert that the user can access a specific branch.
   * - Super admin can access any branch
   * - Users with branchId = null (shared) can access all branches of their place
   * - Users with a specific branchId can only access that branch
   */
  assertCanAccessBranch(context: IUserContext, placeId: string, branchId?: string | null): void {
    // First check place access
    this.assertCanAccessPlace(context, placeId);

    // If no branchId specified, allow (shared user can access any branch)
    if (!branchId) {
      return;
    }

    const { user } = context;

    // Super admin can access any branch
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // If user has no branchId (shared), they can access all branches
    if (!user.branchId) {
      return;
    }

    // If user has a specific branchId, it must match
    if (user.branchId !== branchId) {
      throw new ForbiddenError('User is not allowed to access this branch', {
        type: 'BRANCH_ACCESS_FORBIDDEN',
        value: branchId
      });
    }
  }

  assertCanManageUsers(context: IUserContext): void {
    this.assertAuthenticated(context);

    if (context.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Only super admins can manage users', {
        type: 'USER_MANAGEMENT_FORBIDDEN'
      });
    }
  }

  isSuperAdmin(context: IUserContext): boolean {
    return !!context?.user && context.user.role === UserRole.SUPER_ADMIN;
  }
}


