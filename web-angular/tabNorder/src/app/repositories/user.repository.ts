import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { FirestoreService } from '../services/firestore.service';
import { User, CreateUserData, UpdateUserData } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class UserRepository {
  private readonly COLLECTION_NAME = 'users';

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const userRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return null;
      }

      const userData = userSnap.data() as Omit<User, 'id'>;
      return {
        id: userSnap.id,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate()
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as Omit<User, 'id'>;
      return {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate()
      };
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: User['role']): Promise<User[]> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        usersRef,
        where('role', '==', role),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  /**
   * Get active users
   */
  async getActiveUsers(): Promise<User[]> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        usersRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  }

  /**
   * Get staff users (admin, cashier, kitchen)
   */
  async getStaffUsers(): Promise<User[]> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        usersRef,
        where('role', 'in', ['admin', 'cashier', 'kitchen']),
        where('isActive', '==', true),
        orderBy('role'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching staff users:', error);
      throw error;
    }
  }

  /**
   * Get customers
   */
  async getCustomers(): Promise<User[]> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        usersRef,
        where('role', '==', 'customer'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchQuery: string): Promise<User[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation. For production, consider using Algolia or similar
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(usersRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const allUsers = querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });

      const query = searchQuery.toLowerCase();
      return allUsers.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.displayName?.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Create user
   */
  async createUser(userData: CreateUserData): Promise<string> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const userDoc = {
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
      
      const docRef = await addDoc(usersRef, userDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: UpdateUserData): Promise<void> {
    try {
      const userRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(id: string, profile: Partial<User>): Promise<void> {
    try {
      await this.updateUser(id, profile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(id: string, preferences: User['preferences']): Promise<void> {
    try {
      await this.updateUser(id, { preferences });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const userRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      await updateDoc(userRef, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(id: string): Promise<void> {
    try {
      await this.updateUser(id, { isActive: false });
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<void> {
    try {
      await this.updateUser(id, { isActive: true });
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (hard delete)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const userRef = doc(this.firestoreService.getFirestore(), this.COLLECTION_NAME, id);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    staffUsers: number;
    customers: number;
    admins: number;
    cashiers: number;
    kitchenStaff: number;
    recentSignups: number;
  }> {
    try {
      const users = await this.getActiveUsers();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentSignups = users.filter(user => user.createdAt >= thirtyDaysAgo).length;
      
      return {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        staffUsers: users.filter(u => ['admin', 'cashier', 'kitchen'].includes(u.role)).length,
        customers: users.filter(u => u.role === 'customer').length,
        admins: users.filter(u => u.role === 'admin').length,
        cashiers: users.filter(u => u.role === 'cashier').length,
        kitchenStaff: users.filter(u => u.role === 'kitchen').length,
        recentSignups
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time user updates
   */
  subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
    const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
    const q = query(usersRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
      callback(users);
    });
  }

  /**
   * Subscribe to user updates by role
   */
  subscribeToUsersByRole(role: User['role'], callback: (users: User[]) => void): Unsubscribe {
    const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
    const q = query(
      usersRef,
      where('role', '==', role),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
      callback(users);
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('Error checking if email exists:', error);
      return false;
    }
  }

  /**
   * Get users created in date range
   */
  async getUsersByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    try {
      const usersRef = collection(this.firestoreService.getFirestore(), this.COLLECTION_NAME);
      const q = query(
        usersRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const userData = doc.data() as Omit<User, 'id'>;
        return {
          id: doc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          lastLoginAt: userData.lastLoginAt?.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching users by date range:', error);
      throw error;
    }
  }
}
