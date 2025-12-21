import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService, UserRole } from './auth.service';
import { FirestoreService } from './firestore.service';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'cashier' | 'kitchen' | 'customer';
  phoneNumber?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: {
    language?: string;
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  avatar?: string;
  preferences?: User['preferences'];
}

export interface CreateUserData {
  email: string;
  displayName?: string;
  role: User['role'];
  phoneNumber?: string;
  password?: string;
}

export interface UpdateUserData {
  displayName?: string;
  phoneNumber?: string;
  avatar?: string;
  isActive?: boolean;
  preferences?: User['preferences'];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public users$ = this.usersSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Computed observables
  public staffUsers$ = this.users$.pipe(
    map(users => users.filter(user => ['admin', 'cashier', 'kitchen'].includes(user.role)))
  );

  public activeUsers$ = this.users$.pipe(
    map(users => users.filter(user => user.isActive))
  );

  public customers$ = this.users$.pipe(
    map(users => users.filter(user => user.role === 'customer'))
  );

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService
  ) {
    this.initializeCurrentUser();
  }

  /**
   * Initialize current user from auth service
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      const userRole = this.authService.getCurrentUserRole();
      if (userRole) {
        const user = await this.getUserById(userRole.uid);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error initializing current user:', error);
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const users = await this.firestoreService.getCollection('users');
      const formattedUsers = users.map((user: any) => ({
        ...user,
        createdAt: user.createdAt?.toDate() || new Date(),
        updatedAt: user.updatedAt?.toDate() || new Date(),
        lastLoginAt: user.lastLoginAt?.toDate()
      })) as User[];

      this.usersSubject.next(formattedUsers);
      return formattedUsers;
    } catch (error) {
      this.errorSubject.next('Failed to fetch users');
      console.error('Error fetching users:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const userData = await this.firestoreService.getDocument('users', id);
      if (!userData) return null;

      return {
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate()
      } as User;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.firestoreService.getCollection('users');
      const userData = users.find((user: any) => user.email === email);
      
      if (!userData) return null;

      return {
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate()
      } as User;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserData): Promise<string> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      // Create user in Firebase Auth if password is provided
      let authUser = null;
      if (userData.password) {
        authUser = await this.authService.signUp(userData.email, userData.password, userData.displayName);
      }

      // Create user document in Firestore
      const userDoc = {
        id: authUser?.uid || this.generateUserId(),
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        phoneNumber: userData.phoneNumber,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          language: 'en',
          theme: 'light',
          notifications: true
        }
      };

      const userId = await this.firestoreService.addDocument('users', userDoc);
      
      // Refresh users list
      await this.getAllUsers();
      
      return userId;
    } catch (error) {
      this.errorSubject.next('Failed to create user');
      console.error('Error creating user:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: UpdateUserData): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await this.firestoreService.updateDocument('users', userId, updateData);
      
      // Update current user if it's the same user
      const currentUser = this.currentUserSubject.value;
      if (currentUser && currentUser.id === userId) {
        this.currentUserSubject.next({ ...currentUser, ...updates });
      }
      
      // Refresh users list
      await this.getAllUsers();
    } catch (error) {
      this.errorSubject.next('Failed to update user');
      console.error('Error updating user:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      await this.updateUser(userId, { isActive: false });
    } catch (error) {
      this.errorSubject.next('Failed to delete user');
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      await this.updateUser(userId, profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: User['preferences']): Promise<void> {
    try {
      await this.updateUser(userId, { preferences });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.firestoreService.updateDocument('users', userId, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Get current user from state
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get all users from state
   */
  getCurrentUsers(): User[] {
    return this.usersSubject.value;
  }

  /**
   * Check if user has role
   */
  hasRole(user: User | null, roles: string[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: User | null): boolean {
    return this.hasRole(user, ['admin']);
  }

  /**
   * Check if user is staff
   */
  isStaff(user: User | null): boolean {
    return this.hasRole(user, ['admin', 'cashier', 'kitchen']);
  }

  /**
   * Check if user is customer
   */
  isCustomer(user: User | null): boolean {
    return this.hasRole(user, ['customer']);
  }

  /**
   * Get user display name
   */
  getUserDisplayName(user: User | null): string {
    if (!user) return 'Unknown User';
    return user.displayName || user.email || 'Unknown User';
  }

  /**
   * Get user avatar URL
   */
  getUserAvatar(user: User | null): string {
    if (!user || !user.avatar) {
      return this.getDefaultAvatar();
    }
    return user.avatar;
  }

  /**
   * Get default avatar
   */
  getDefaultAvatar(): string {
    return `https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128`;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Refresh all data
   */
  async refresh(): Promise<void> {
    await this.getAllUsers();
    await this.initializeCurrentUser();
  }

  /**
   * Generate user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user statistics
   */
  getUsersStats(): {
    totalUsers: number;
    activeUsers: number;
    staffUsers: number;
    customers: number;
    admins: number;
    cashiers: number;
    kitchenStaff: number;
  } {
    const users = this.usersSubject.value;
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      staffUsers: users.filter(u => ['admin', 'cashier', 'kitchen'].includes(u.role)).length,
      customers: users.filter(u => u.role === 'customer').length,
      admins: users.filter(u => u.role === 'admin').length,
      cashiers: users.filter(u => u.role === 'cashier').length,
      kitchenStaff: users.filter(u => u.role === 'kitchen').length
    };
  }

  /**
   * Search users
   */
  searchUsers(query: string): User[] {
    const users = this.usersSubject.value;
    const searchQuery = query.toLowerCase();
    
    return users.filter(user => 
      user.email.toLowerCase().includes(searchQuery) ||
      user.displayName?.toLowerCase().includes(searchQuery) ||
      user.role.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: User['role']): User[] {
    return this.usersSubject.value.filter(user => user.role === role);
  }

  /**
   * Format user role for display
   */
  formatUserRole(role: User['role']): string {
    const roleMap = {
      admin: 'Administrator',
      cashier: 'Cashier',
      kitchen: 'Kitchen Staff',
      customer: 'Customer'
    };
    return roleMap[role] || role;
  }

  /**
   * Get role color for UI
   */
  getRoleColor(role: User['role']): string {
    const colorMap = {
      admin: 'text-red-600 bg-red-100',
      cashier: 'text-blue-600 bg-blue-100',
      kitchen: 'text-green-600 bg-green-100',
      customer: 'text-gray-600 bg-gray-100'
    };
    return colorMap[role] || 'text-gray-600 bg-gray-100';
  }
}
