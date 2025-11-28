import { BaseModel } from '../repositories/types';

/**
 * Enumerates all supported user roles and their immutable numeric IDs.
 * The numeric mapping is required so we can store role references in Firestore
 * while keeping a consistent contract with the frontend.
 */
export enum UserRole {
  SUPER_ADMIN = 1,
  ADMIN = 2,
  RESTAURANT_MANAGER = 3,
  SHIFT_MANAGER = 4,
  WAITER = 5,
  CASHIER = 6,
  HOST = 7,
  CHEF = 8,
  BARTENDER = 9,
  DELIVERY_DRIVER = 10,
  INVENTORY_MANAGER = 11,
  ACCOUNTANT = 12,
  SALES_STAFF = 13,
  STORE_MANAGER = 14
}

export type UserStatus = 'active' | 'invited' | 'suspended' | 'disabled';

export interface UserMetadata {
  deviceInfo?: Record<string, unknown> | string;
  firebase?: {
    creationTime?: string | null;
    lastSignInTime?: string | null;
  };
  rawClaims?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface User extends BaseModel {
  firebaseUid: string;
  email?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  displayName?: string;
  photoUrl?: string;
  providerIds: string[];
  roleId: number;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date;
  lastLoginIp?: string;
  tenantId?: string | null;
  customClaims?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  metadata?: UserMetadata;
  places?: string[];
}

export interface LoginCommand {
  email: string;
  password: string;
  deviceInfo?: Record<string, unknown> | string;
  metadata?: Record<string, unknown>;
  preferredRoleId?: number;
  ipAddress?: string;
}

export interface SignupCommand extends LoginCommand {
  displayName?: string;
  roleId?: number;
  roleKey?: keyof typeof UserRole | string;
  preferences?: Record<string, unknown>;
  places?: string[];
}

export interface IdentityProfileSnapshot {
  uid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  providerIds: string[];
  tenantId?: string | null;
  customClaims?: Record<string, unknown>;
  creationTime?: string | null;
  lastLoginAt?: string | null;
}

export interface AuthenticatedUser {
  user: User;
  identityProfile: IdentityProfileSnapshot;
  expiresAt: string;
  token?: string;
  refreshToken?: string;
}

