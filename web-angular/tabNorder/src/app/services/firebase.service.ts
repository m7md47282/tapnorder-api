import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc, setDoc, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private storage: FirebaseStorage;
  private messaging: Promise<Messaging | null>;

  constructor() {
    // Initialize Firebase
    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);

    // Initialize messaging if supported
    this.messaging = isSupported().then(supported => {
      if (supported) {
        return getMessaging(this.app);
      }
      return null;
    });

    console.log('Firebase initialized successfully');
  }

  getApp(): FirebaseApp {
    return this.app;
  }

  getAuth(): Auth {
    return this.auth;
  }

  getFirestore(): Firestore {
    return this.db;
  }

  getStorage(): FirebaseStorage {
    return this.storage;
  }

  getMessaging(): Promise<Messaging | null> {
    return this.messaging;
  }

  // Check if we're in demo mode
  isDemoMode(): boolean {
    return window.location.pathname.includes('/demo');
  }

  async getDoc(path: string): Promise<DocumentSnapshot> {
    const docRef = doc(this.db, path);
    return await getDoc(docRef);
  }

  async setDoc(path: string, data: any): Promise<void> {
    const docRef = doc(this.db, path);
    return await setDoc(docRef, data);
  }
}
