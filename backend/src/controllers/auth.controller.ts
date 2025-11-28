import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginCommand, SignupCommand } from '../entities/user.entity';
import { ErrorHandler } from '../shared/errors/error-handler';
import { MissingRequiredFieldError, ValidationError } from '../shared/errors/custom-errors';
import { CorsMiddleware } from '../shared/middleware/cors.middleware';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService?: AuthService) {
    this.authService = authService ?? new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        throw new ValidationError('Method not allowed for signup', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST /signup to register users'
        });
      }

      const email = this.extractEmail(req);
      const password = this.extractPassword(req);
      const roleId = this.extractRoleId(req);
      const roleKey = this.extractRoleKey(req);

      const command: SignupCommand = {
        email,
        password,
        displayName: req.body?.displayName,
        deviceInfo: req.body?.deviceInfo || req.headers['user-agent'],
        metadata: req.body?.metadata,
        preferredRoleId: roleId,
        roleId,
        roleKey,
        preferences: this.extractPreferences(req),
        places: this.extractPlaces(req),
        ipAddress: this.getRequestIp(req)
      };

      const signupResponse = await this.authService.signup(command);
      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        signupResponse,
        'User registered successfully',
        201,
        req
      );
      CorsMiddleware.setCorsHeaders(res, req.headers.origin);
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        throw new ValidationError('Method not allowed for login', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST /login for user login'
        });
      }

      const email = this.extractEmail(req);
      const password = this.extractPassword(req);
      const roleId = this.extractRoleId(req);

      const command: LoginCommand = {
        email,
        password,
        deviceInfo: req.body?.deviceInfo || req.headers['user-agent'],
        metadata: req.body?.metadata,
        preferredRoleId: roleId,
        ipAddress: this.getRequestIp(req)
      };

      const authResponse = await this.authService.login(command);
      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        authResponse,
        'User logged in successfully',
        200,
        req
      );
      CorsMiddleware.setCorsHeaders(res, req.headers.origin);
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        throw new ValidationError('Method not allowed for profile retrieval', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET /login to fetch the authenticated user'
        });
      }

      const idToken = this.extractTokenFromRequest(req);
      if (!idToken) {
        throw new MissingRequiredFieldError('Authorization token', {
          suggestion: 'Provide a Bearer token in the Authorization header or idToken query parameter'
        });
      }

      const authResponse = await this.authService.getCurrentUser(idToken);
      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        authResponse,
        'Current user retrieved successfully',
        200,
        req
      );
      CorsMiddleware.setCorsHeaders(res, req.headers.origin);
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  private extractTokenFromRequest(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.slice(7);
    }

    return (req.query.idToken as string) ||
      (req.query.token as string);
  }

  private getRequestIp(req: Request): string | undefined {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip;
  }

  private extractRoleId(req: Request): number | undefined {
    const rawRoleId = req.body?.roleId ?? req.body?.role_id;
    if (rawRoleId === undefined) return undefined;
    const parsed = typeof rawRoleId === 'string' ? Number(rawRoleId) : rawRoleId;
    return typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : undefined;
  }

  private extractRoleKey(req: Request): string | undefined {
    const raw = req.body?.roleKey ?? req.body?.role_key ?? req.body?.role;
    if (typeof raw !== 'string') {
      return undefined;
    }
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private extractPlaces(req: Request): string[] | undefined {
    if (!Array.isArray(req.body?.places)) {
      return undefined;
    }
    const places = req.body.places
      .filter((placeId: unknown): placeId is string => typeof placeId === 'string' && placeId.trim().length > 0)
      .map((placeId: string) => placeId.trim());
    return places.length > 0 ? places : undefined;
  }

  private extractPreferences(req: Request): Record<string, unknown> | undefined {
    const prefs = req.body?.preferences;
    if (prefs && typeof prefs === 'object') {
      return prefs;
    }
    return undefined;
  }

  private handleError(req: Request, res: Response, error: unknown): void {
    // Set CORS headers before sending error response
    CorsMiddleware.setCorsHeaders(res, req.headers.origin);
    ErrorHandler.handleError(error, req, res);
  }

  private extractEmail(req: Request): string {
    const email = req.body?.email;
    if (!email || typeof email !== 'string' || email.trim() === '') {
      throw new MissingRequiredFieldError('email', {
        suggestion: 'Provide a valid email address'
      });
    }
    return email.trim().toLowerCase();
  }

  private extractPassword(req: Request): string {
    const password = req.body?.password;
    if (!password || typeof password !== 'string' || password.trim() === '') {
      throw new MissingRequiredFieldError('password', {
        suggestion: 'Provide a password'
      });
    }
    return password;
  }
}

