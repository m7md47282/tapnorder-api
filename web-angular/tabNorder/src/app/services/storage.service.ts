import { Injectable } from '@angular/core';
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  getMetadata,
  updateMetadata,
  UploadTask,
  UploadTaskSnapshot
} from 'firebase/storage';
import { FirebaseService } from './firebase.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private firebaseService: FirebaseService) {}

  async uploadFile(
    file: File, 
    path: string, 
    metadata?: any
  ): Promise<string> {
    try {
      const storageRef = ref(this.firebaseService.getStorage(), path);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking can be implemented here
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async uploadFileWithProgress(
    file: File, 
    path: string, 
    metadata?: any
  ): Promise<Observable<UploadTaskSnapshot>> {
    try {
      const storageRef = ref(this.firebaseService.getStorage(), path);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      return new Observable(observer => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            observer.next(snapshot);
          },
          (error) => {
            console.error('Upload error:', error);
            observer.error(error);
          },
          () => {
            observer.complete();
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file with progress:', error);
      throw error;
    }
  }

  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(this.firebaseService.getStorage(), path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.firebaseService.getStorage(), path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getFileMetadata(path: string): Promise<any> {
    try {
      const storageRef = ref(this.firebaseService.getStorage(), path);
      return await getMetadata(storageRef);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  async updateFileMetadata(path: string, metadata: any): Promise<void> {
    try {
      const storageRef = ref(this.firebaseService.getStorage(), path);
      await updateMetadata(storageRef, metadata);
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  }

  // Helper methods for common file operations
  async uploadImage(
    file: File, 
    folder: string = 'images', 
    fileName?: string
  ): Promise<string> {
    const timestamp = Date.now();
    const name = fileName || `${timestamp}_${file.name}`;
    const path = `${folder}/${name}`;
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    return this.uploadFile(file, path, metadata);
  }

  async uploadMenuImage(file: File, menuItemId: string): Promise<string> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `menu_${menuItemId}_${timestamp}.${extension}`;
    return this.uploadImage(file, 'menu-images', fileName);
  }

  async uploadUserAvatar(file: File, userId: string): Promise<string> {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `avatar_${userId}_${timestamp}.${extension}`;
    return this.uploadImage(file, 'avatars', fileName);
  }
}
