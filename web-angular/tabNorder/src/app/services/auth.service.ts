import { Injectable } from '@angular/core';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserRole {
  uid: string;
  email: string;
  role: 'admin' | 'cashier' | 'kitchen' | 'customer';
  displayName?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private userRoleSubject = new BehaviorSubject<UserRole | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public userRole$ = this.userRoleSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {
    // Listen to auth state changes
    onAuthStateChanged(this.firebaseService.getAuth(), (user) => {
      this.currentUserSubject.next(user);
      if (user) {
        this.loadUserRole(user.uid);
      } else {
        this.userRoleSubject.next(null);
      }
    });
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.firebaseService.getAuth(),
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.firebaseService.getAuth(),
        email,
        password
      );
      
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.firebaseService.getAuth());
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.firebaseService.getAuth(), email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.firebaseService.getAuth(), provider);
      const user = result.user;
      
      // Check if user exists in our system
      let userRole = await this.getUserRole(user.uid);
      
      // If user doesn't exist, create a default customer role
      if (!userRole) {
        userRole = {
          uid: user.uid,
          email: user.email || '',
          role: 'customer',
          displayName: user.displayName || '',
          createdAt: new Date()
        };
        await this.setUserRole(userRole);
      }
      
      this.currentUserSubject.next(user);
      this.userRoleSubject.next(userRole);
      
      return user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserRole(): UserRole | null {
    return this.userRoleSubject.value;
  }

  async getUserRole(uid: string): Promise<UserRole | null> {
    try {
      const doc = await this.firebaseService.getDoc(`userRoles/${uid}`);
      if (doc.exists()) {
        const data = doc.data();
        return {
          uid: data['uid'],
          email: data['email'],
          role: data['role'],
          displayName: data['displayName'],
          createdAt: data['createdAt']?.toDate() || new Date()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  async setUserRole(userRole: UserRole): Promise<void> {
    try {
      await this.firebaseService.setDoc(`userRoles/${userRole.uid}`, {
        uid: userRole.uid,
        email: userRole.email,
        role: userRole.role,
        displayName: userRole.displayName,
        createdAt: userRole.createdAt
      });
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(requiredRoles: string[]): boolean {
    const userRole = this.userRoleSubject.value;
    if (!userRole) return false;
    return requiredRoles.includes(userRole.role);
  }

  private async loadUserRole(uid: string): Promise<void> {
    try {
      // This would typically fetch from Firestore
      // For now, we'll create a mock user role
      const userRole: UserRole = {
        uid,
        email: this.currentUserSubject.value?.email || '',
        role: 'customer', // Default role
        displayName: this.currentUserSubject.value?.displayName || '',
        createdAt: new Date()
      };
      
      this.userRoleSubject.next(userRole);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }
}
