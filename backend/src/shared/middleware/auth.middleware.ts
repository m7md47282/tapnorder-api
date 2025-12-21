import { Request } from 'express';
import { AuthService } from '../../services/auth.service';
import { AuthenticatedUser } from '../../entities/user.entity';
import { UnauthorizedError } from '../errors/custom-errors';

export interface AuthenticatedRequest extends Request {
  authenticatedUser?: AuthenticatedUser;
}

export class AuthMiddleware {
  private static authService: AuthService | null = null;

  private static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService();
    }
    return this.authService;
  }

  /**
   * Extract the authenticated user from the Authorization header (Bearer token).
   * Used in Firebase HTTP functions before delegating to controllers.
   * Throws error if token is missing.
   */
  static async attachAuthenticatedUser(request: AuthenticatedRequest): Promise<void> {
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7);
    } else if (typeof request.query.idToken === 'string') {
      token = request.query.idToken;
    } else if (typeof request.query.token === 'string') {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedError('Authorization token is required', {
        type: 'AUTH_TOKEN_MISSING'
      });
    }

    const authService = this.getAuthService();
    const authenticatedUser = await authService.getCurrentUser(token);
    request.authenticatedUser = authenticatedUser;
  }

  /**
   * Optionally extract the authenticated user from the Authorization header (Bearer token).
   * Does not throw if token is missing - allows guest access.
   * Used for endpoints that support both authenticated and guest users.
   */
  static async attachAuthenticatedUserIfPresent(request: AuthenticatedRequest): Promise<void> {
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7);
    } else if (typeof request.query.idToken === 'string') {
      token = request.query.idToken;
    } else if (typeof request.query.token === 'string') {
      token = request.query.token;
    }

    // If no token, leave authenticatedUser undefined (guest access)
    if (!token) {
      request.authenticatedUser = undefined;
      return;
    }

    // If token is present, validate and attach user
    try {
      const authService = this.getAuthService();
      const authenticatedUser = await authService.getCurrentUser(token);
      request.authenticatedUser = authenticatedUser;
    } catch (error) {
      // If token is invalid, treat as guest (don't throw)
      console.warn('Invalid auth token provided, treating as guest:', error);
      request.authenticatedUser = undefined;
    }
  }
}


