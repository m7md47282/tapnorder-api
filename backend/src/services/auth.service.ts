import { getAuth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { IUserRepository, UserRepository } from '../repositories/user/user.repository';
import { AuthenticatedUser, IdentityProfileSnapshot, LoginCommand, SignupCommand, User, UserRole } from '../entities/user.entity';
import { IAuthService } from './interfaces/auth.service.interface';
import { MissingRequiredFieldError, ResourceAlreadyExistsError, UnauthorizedError } from '../shared/errors/custom-errors';
import { FirebaseConfig } from '../shared/config/firebase.config';

type UserPersistencePayload = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

const ROLE_NAME_TO_ID: Record<string, UserRole> = {
  SUPER_ADMIN: UserRole.SUPER_ADMIN,
  ADMIN: UserRole.ADMIN,
  RESTAURANT_MANAGER: UserRole.RESTAURANT_MANAGER,
  SHIFT_MANAGER: UserRole.SHIFT_MANAGER,
  WAITER: UserRole.WAITER,
  CASHIER: UserRole.CASHIER,
  HOST: UserRole.HOST,
  CHEF: UserRole.CHEF,
  BARTENDER: UserRole.BARTENDER,
  DELIVERY_DRIVER: UserRole.DELIVERY_DRIVER,
  INVENTORY_MANAGER: UserRole.INVENTORY_MANAGER,
  ACCOUNTANT: UserRole.ACCOUNTANT,
  SALES_STAFF: UserRole.SALES_STAFF,
  STORE_MANAGER: UserRole.STORE_MANAGER
};

interface IdentityToolkitAuthResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
  displayName?: string;
}

type IdentityToolkitEndpoint = 'accounts:signInWithPassword' | 'accounts:signUp';

export class AuthService implements IAuthService {
  private readonly identityToolkitBaseUrl = 'https://identitytoolkit.googleapis.com/v1';
  private readonly apiKey: string;

  constructor(
    private readonly userRepository: IUserRepository = new UserRepository()
  ) {
    this.apiKey = FirebaseConfig.getWebApiKey();
  }

  async signup(command: SignupCommand): Promise<AuthenticatedUser> {
    this.ensureCredentials(command);

    const identityResponse = await this.identityRequest('accounts:signUp', {
      email: command.email,
      password: command.password,
      returnSecureToken: true
    });

    if (command.displayName) {
      await getAuth().updateUser(identityResponse.localId, { displayName: command.displayName });
    }

    const { decodedToken, firebaseUser } = await this.verifyFirebaseToken(identityResponse.idToken);
    return this.persistAndBuildResponse(decodedToken, firebaseUser, command, identityResponse);
  }

  async login(command: LoginCommand): Promise<AuthenticatedUser> {
    this.ensureCredentials(command);

    const identityResponse = await this.identityRequest('accounts:signInWithPassword', {
      email: command.email,
      password: command.password,
      returnSecureToken: true
    });

    const { decodedToken, firebaseUser } = await this.verifyFirebaseToken(identityResponse.idToken);
    
    // On login, just retrieve existing user without updating database
    const existingUser = await this.userRepository.getByFirebaseUid(firebaseUser.uid);
    
    if (!existingUser) {
      // User doesn't exist in database - credentials not correct or user needs to sign up
      throw new UnauthorizedError('Invalid credentials or user not found. Please sign up first.', {
        field: 'email',
        value: command.email
      });
    }
    
    // User exists - just return it without updating
    return {
      user: existingUser,
      identityProfile: this.buildIdentityProfileSnapshot(decodedToken, firebaseUser),
      expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
      token: identityResponse.idToken,
      refreshToken: identityResponse.refreshToken
    };
  }

  async getCurrentUser(idToken: string): Promise<AuthenticatedUser> {
    if (!idToken) {
      throw new MissingRequiredFieldError('idToken');
    }

    const { decodedToken, firebaseUser } = await this.verifyFirebaseToken(idToken);
    return this.persistAndBuildResponse(decodedToken, firebaseUser);
  }

  private async verifyFirebaseToken(idToken: string): Promise<{
    decodedToken: DecodedIdToken;
    firebaseUser: UserRecord;
  }> {
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken, true);
      const firebaseUser = await auth.getUser(decodedToken.uid);
      return { decodedToken, firebaseUser };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired login token', {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  private async persistAndBuildResponse(
    decodedToken: DecodedIdToken,
    firebaseUser: UserRecord,
    command?: LoginCommand | SignupCommand,
    identityTokens?: IdentityToolkitAuthResponse
  ): Promise<AuthenticatedUser> {
    // Check if user already exists to preserve existing data
    const existingUser = await this.userRepository.getByFirebaseUid(firebaseUser.uid);
    
    // Resolve roleId - preserve existing if user exists, otherwise require it for new users
    let roleId: number;
    if (existingUser) {
      // User exists - preserve existing roleId, never overwrite it
      roleId = existingUser.roleId;
    } else {
      // New user - resolve roleId and ensure it's valid
      roleId = this.resolveRoleId(decodedToken, this.extractPreferredRoleId(command));
      
      // Ensure roleId is valid - no user should be created without a valid roleId
      if (!this.isValidRoleId(roleId)) {
        throw new MissingRequiredFieldError('roleId', {
          suggestion: 'User must have a valid roleId. Provide roleId, roleKey, or set it in Firebase custom claims.',
          field: 'roleId',
          value: roleId
        });
      }
    }

    const persistencePayload: UserPersistencePayload = {
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email ?? decodedToken.email,
      emailVerified: firebaseUser.emailVerified ?? decodedToken.email_verified ?? false,
      phoneNumber: firebaseUser.phoneNumber ?? decodedToken.phone_number,
      displayName: firebaseUser.displayName ?? decodedToken.name,
      photoUrl: firebaseUser.photoURL ?? decodedToken.picture,
      providerIds: firebaseUser.providerData?.map(provider => provider.providerId).filter(Boolean) ?? [],
      roleId,
      role: this.mapRoleIdToRole(roleId),
      status: existingUser?.status ?? 'active', // Preserve existing status or default to 'active' for new users
      lastLoginAt: new Date(),
      lastLoginIp: command?.ipAddress,
      tenantId: firebaseUser.tenantId ?? decodedToken.firebase?.tenant ?? null,
      customClaims: this.extractCustomClaims(decodedToken),
      preferences: this.extractPreferences(command) ?? existingUser?.preferences,
      metadata: {
        ...(command?.metadata ?? {}),
        deviceInfo: command?.deviceInfo,
        firebase: {
          creationTime: firebaseUser.metadata.creationTime,
          lastSignInTime: firebaseUser.metadata.lastSignInTime
        },
        rawClaims: this.sanitizeClaims(decodedToken)
      },
      ...(this.extractPlaces(command) ? { places: this.extractPlaces(command) } : existingUser?.places ? { places: existingUser.places } : {})
    };

    const sanitizedPayload = this.removeUndefinedValues(persistencePayload);
    const user = await this.userRepository.upsertByFirebaseUid(firebaseUser.uid, sanitizedPayload);

    return {
      user,
      identityProfile: this.buildIdentityProfileSnapshot(decodedToken, firebaseUser),
      expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
      token: identityTokens?.idToken,
      refreshToken: identityTokens?.refreshToken
    };
  }

  private resolveRoleId(decodedToken: DecodedIdToken, preferredRoleId?: number): number {
    const candidates: Array<number | undefined> = [
      preferredRoleId,
      this.normalizeRoleId((decodedToken as any).roleId),
      this.normalizeRoleId((decodedToken as any).role_id),
      this.normalizeRoleId((decodedToken as any).role),
      this.normalizeRoleId((decodedToken as any).roleID),
      this.mapRoleNameToId((decodedToken as any).roleName || (decodedToken as any).role),
      this.mapRoleNameToId((decodedToken as any)['custom:role']),
      this.normalizeRoleId((decodedToken as any).customRoleId)
    ];

    for (const candidate of candidates) {
      if (candidate && this.isValidRoleId(candidate)) {
        return candidate;
      }
    }

    return UserRole.WAITER;
  }

  private normalizeRoleId(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string' && !Number.isNaN(Number(value))) {
      return Number(value);
    }

    return undefined;
  }

  private isValidRoleId(value: number): value is UserRole {
    return Object.values(UserRole).includes(value);
  }

  private mapRoleIdToRole(roleId: number): UserRole {
    if (this.isValidRoleId(roleId)) {
      return roleId;
    }
    return UserRole.WAITER;
  }

  private mapRoleNameToId(roleName?: unknown): number | undefined {
    if (typeof roleName !== 'string') {
      return undefined;
    }

    const normalized = roleName.toUpperCase();
    return ROLE_NAME_TO_ID[normalized];
  }

  private extractPreferredRoleId(command?: LoginCommand | SignupCommand): number | undefined {
    if (!command) return undefined;
    const signupCommand = command as SignupCommand;

    return command.preferredRoleId ??
      signupCommand.roleId ??
      (signupCommand.roleKey ? this.mapRoleNameToId(signupCommand.roleKey) : undefined);
  }

  private extractCustomClaims(decodedToken: DecodedIdToken): Record<string, unknown> {
    const reservedClaims = new Set([
      'aud', 'auth_time', 'exp', 'firebase', 'iat', 'iss', 'sub', 'uid'
    ]);

    return Object.entries(decodedToken).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (!reservedClaims.has(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  private sanitizeClaims(decodedToken: DecodedIdToken): Record<string, unknown> {
    const sanitized = { ...decodedToken };
    if (sanitized.firebase) {
      sanitized.firebase = {
        identities: sanitized.firebase.identities,
        sign_in_provider: sanitized.firebase.sign_in_provider,
        tenant: sanitized.firebase.tenant
      };
    }
    return sanitized;
  }

  private buildIdentityProfileSnapshot(
    decodedToken: DecodedIdToken,
    firebaseUser: UserRecord
  ): IdentityProfileSnapshot {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? decodedToken.email,
      displayName: firebaseUser.displayName ?? decodedToken.name,
      photoUrl: firebaseUser.photoURL ?? decodedToken.picture,
      phoneNumber: firebaseUser.phoneNumber ?? decodedToken.phone_number,
      emailVerified: firebaseUser.emailVerified ?? decodedToken.email_verified ?? false,
      providerIds: firebaseUser.providerData?.map(provider => provider.providerId).filter(Boolean) ?? [],
      tenantId: firebaseUser.tenantId ?? decodedToken.firebase?.tenant ?? null,
      customClaims: this.extractCustomClaims(decodedToken),
      creationTime: firebaseUser.metadata.creationTime,
      lastLoginAt: firebaseUser.metadata.lastSignInTime
    };
  }

  private extractPlaces(command?: LoginCommand | SignupCommand): string[] | undefined {
    if (!command) return undefined;
    const signupCommand = command as SignupCommand;
    if (!signupCommand.places) {
      return undefined;
    }
    return Array.isArray(signupCommand.places)
      ? signupCommand.places.filter((placeId): placeId is string => typeof placeId === 'string' && placeId.trim().length > 0)
      : undefined;
  }

  private extractPreferences(command?: LoginCommand | SignupCommand): Record<string, unknown> | undefined {
    if (!command) return undefined;
    const signupCommand = command as SignupCommand;
    return signupCommand.preferences ??
      (command.metadata?.preferences as Record<string, unknown> | undefined);
  }

  private async identityRequest(
    endpoint: IdentityToolkitEndpoint,
    payload: Record<string, unknown>
  ): Promise<IdentityToolkitAuthResponse> {
    const url = `${this.identityToolkitBaseUrl}/${endpoint}?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json() as any;
    const email = typeof payload.email === 'string' ? payload.email : undefined;

    if (!response.ok) {
      const message = data?.error?.message ?? 'Authentication failed';
      switch (message) {
        case 'EMAIL_NOT_FOUND':
        case 'INVALID_PASSWORD':
        case 'USER_DISABLED':
          throw new UnauthorizedError('Invalid email or password');
        case 'EMAIL_EXISTS':
          throw new ResourceAlreadyExistsError('User', email ?? 'unknown', {
            field: 'email',
            value: email
          });
        default:
          throw new UnauthorizedError(message);
      }
    }

    return data as IdentityToolkitAuthResponse;
  }

  private ensureCredentials(command: LoginCommand | SignupCommand): void {
    if (!command.email || command.email.trim() === '') {
      throw new MissingRequiredFieldError('email');
    }
    if (!command.password || command.password.trim() === '') {
      throw new MissingRequiredFieldError('password');
    }
  }

  private removeUndefinedValues<T>(data: T): T {
    if (data === null || typeof data !== 'object' || data instanceof Date) {
      return data;
    }

    if (Array.isArray(data)) {
      return data
        .map(item => this.removeUndefinedValues(item))
        .filter(item => item !== undefined) as unknown as T;
    }

    const result: Record<string, unknown> = {};
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      result[key] = this.removeUndefinedValues(value);
    });
    return result as T;
  }
}

