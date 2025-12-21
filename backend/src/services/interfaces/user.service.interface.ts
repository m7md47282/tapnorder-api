import { AuthenticatedUser, SignupCommand, User, UserStatus } from '../../entities/user.entity';
import { IUserContext } from '../authorization.service';

export interface AdminCreateUserResult extends AuthenticatedUser {
  /**
   * For admin-created users, tokens are optional and SHOULD NOT be used
   * to authenticate as the created user. They are included only for
   * compatibility with existing auth responses.
   */
}

export interface AdminCreateUserCommand extends Omit<SignupCommand, 'places'> {
  /**
   * Place ID to associate with the user.
   * Required for all users except SUPER_ADMIN (who gets null).
   */
  placeId?: string | null;

  /**
   * Branch ID to associate with the user.
   * Optional - if null, user is "shared" across all branches of the place.
   */
  branchId?: string | null;

  /**
   * @deprecated Use placeId instead
   * Optional explicit list of place IDs (for backward compatibility during migration).
   */
  places?: string[];

  /**
   * Optional primary place context. Typically provided via query param
   * (e.g., place_id) and used for authorization and default association.
   */
  primaryPlaceId?: string;
}

export interface UserQuery {
  placeId?: string;
  branchId?: string;
  roleId?: number;
  status?: UserStatus | string;
}

export interface IUserService {
  /**
   * Create a new user account on behalf of an administrator.
   * - Super admins can create any role and associate with any places.
   * - Place admins can create crew users (kitchen, cashier, etc.) only
   *   for places they have access to, and only with allowed roles.
   */
  createUserForAdmin(
    context: IUserContext,
    command: AdminCreateUserCommand
  ): Promise<AdminCreateUserResult>;

  /**
   * Query users with optional filters.
   * - Super admins can query users from any place.
   * - Place admins can only query users from places they manage.
   */
  queryUsers(
    context: IUserContext,
    query: UserQuery
  ): Promise<User[]>;

  /**
   * Lightweight helper for fetching a user by ID when needed for
   * administrative screens.
   */
  getUserById(id: string): Promise<User | null>;
}


