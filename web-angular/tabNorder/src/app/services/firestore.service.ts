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
  onSnapshot,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firebaseService: FirebaseService) {}

  // Generic CRUD operations
  async getCollection(collectionName: string): Promise<DocumentData[]> {
    try {
      const querySnapshot = await getDocs(collection(this.firebaseService.getFirestore(), collectionName));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      throw error;
    }
  }

  async getDocument(collectionName: string, docId: string): Promise<DocumentData | null> {
    try {
      const docRef = doc(this.firebaseService.getFirestore(), collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error getting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  }

  async addDocument(collectionName: string, data: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firebaseService.getFirestore(), collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.firebaseService.getFirestore(), collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating document ${docId} in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(this.firebaseService.getFirestore(), collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
      throw error;
    }
  }

  // Query operations
  async queryCollection(
    collectionName: string, 
    field: string, 
    operator: any, 
    value: any
  ): Promise<DocumentData[]> {
    try {
      const q = query(
        collection(this.firebaseService.getFirestore(), collectionName),
        where(field, operator, value)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error querying collection ${collectionName}:`, error);
      throw error;
    }
  }

  async queryCollectionWithOrder(
    collectionName: string,
    orderByField: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<DocumentData[]> {
    try {
      let q = query(
        collection(this.firebaseService.getFirestore(), collectionName),
        orderBy(orderByField, orderDirection)
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error querying collection ${collectionName} with order:`, error);
      throw error;
    }
  }

  // Real-time listeners
  getCollectionSnapshot(collectionName: string): Observable<DocumentData[]> {
    return new Observable(observer => {
      const unsubscribe = onSnapshot(
        collection(this.firebaseService.getFirestore(), collectionName),
        (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          observer.next(data);
        },
        (error) => {
          console.error(`Error in collection snapshot ${collectionName}:`, error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  getDocumentSnapshot(collectionName: string, docId: string): Observable<DocumentData | null> {
    return new Observable(observer => {
      const docRef = doc(this.firebaseService.getFirestore(), collectionName, docId);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next({ id: docSnap.id, ...docSnap.data() });
          } else {
            observer.next(null);
          }
        },
        (error) => {
          console.error(`Error in document snapshot ${docId}:`, error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  // Batch operations
  async batchAdd(collectionName: string, documents: any[]): Promise<string[]> {
    try {
      const ids: string[] = [];
      for (const docData of documents) {
        const id = await this.addDocument(collectionName, docData);
        ids.push(id);
      }
      return ids;
    } catch (error) {
      console.error(`Error batch adding to ${collectionName}:`, error);
      throw error;
    }
  }

  async batchUpdate(collectionName: string, updates: { id: string; data: any }[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.updateDocument(collectionName, update.id, update.data);
      }
    } catch (error) {
      console.error(`Error batch updating ${collectionName}:`, error);
      throw error;
    }
  }
}
