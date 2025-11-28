import { getStorage } from 'firebase-admin/storage';
import { getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Attachment, CreateAttachmentCommand } from '../../entities/attachment.entity';
import { IAttachmentRepository } from '../interfaces/attachment.repository.interface';
import * as path from 'path';
import { randomUUID } from 'crypto';

/**
 * Attachment Repository Implementation
 * Uses Firebase Storage for file storage and Firestore for metadata
 * Follows Clean Architecture - NO business logic, only data access
 */
export class AttachmentRepository implements IAttachmentRepository {
  private storage: ReturnType<typeof getStorage>;
  private db: Firestore;
  private readonly bucketName: string;
  private readonly collectionName = 'attachments';

  constructor() {
    const app = getApp();
    this.storage = getStorage(app);
    this.db = getFirestore(app);
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${app.options.projectId}.appspot.com`;
  }

  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(command: CreateAttachmentCommand): Promise<Attachment> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      
      // Generate unique file name
      const fileExtension = path.extname(command.fileName);
      const baseFileName = path.basename(command.fileName, fileExtension);
      const uniqueFileName = `${baseFileName}_${randomUUID()}${fileExtension}`;
      
      // Determine storage path
      const folder = command.folder || 'attachments';
      const storagePath = `${folder}/${uniqueFileName}`;
      
      // Create file reference
      const file = bucket.file(storagePath);
      
      // Upload file buffer
      const stream = file.createWriteStream({
        metadata: {
          contentType: command.mimeType,
          metadata: {
            originalFileName: command.fileName,
            uploadedBy: command.uploadedBy || '',
            relatedEntityType: command.relatedEntityType || '',
            relatedEntityId: command.relatedEntityId || '',
            ...command.metadata
          }
        }
      });

      // Write file buffer to stream
      await new Promise<void>((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(command.file);
      });

      // Make file publicly readable (or use signed URLs for private files)
      await file.makePublic();

      // Get download URL
      const url = `https://storage.googleapis.com/${this.bucketName}/${storagePath}`;

      // Get file metadata
      const [metadata] = await file.getMetadata();
      const fileSize = typeof metadata.size === 'string' 
        ? parseInt(metadata.size, 10) 
        : typeof metadata.size === 'number' 
          ? metadata.size 
          : 0;

      // Save attachment metadata to Firestore
      // Filter out undefined values as Firestore doesn't allow them
      const attachmentData: Record<string, any> = {
        fileName: uniqueFileName,
        originalFileName: command.fileName,
        fileType: fileExtension.replace('.', ''),
        mimeType: command.mimeType,
        fileSize,
        url,
        storagePath,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Only add optional fields if they have values (not undefined)
      if (command.uploadedBy) {
        attachmentData.uploadedBy = command.uploadedBy;
      }
      if (command.relatedEntityType) {
        attachmentData.relatedEntityType = command.relatedEntityType;
      }
      if (command.relatedEntityId) {
        attachmentData.relatedEntityId = command.relatedEntityId;
      }
      if (command.metadata) {
        attachmentData.metadata = command.metadata;
      }

      const docRef = await this.db.collection(this.collectionName).add(attachmentData);

      // Return the attachment with the generated ID
      return {
        ...attachmentData,
        id: docRef.id
      } as Attachment;
    } catch (error) {
      // Preserve the original error message for better debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Re-throw with full context but preserve original message
      const enhancedError = new Error(`Failed to upload file: ${errorMessage}`);
      if (errorStack) {
        enhancedError.stack = `${enhancedError.stack}\nOriginal error: ${errorStack}`;
      }
      throw enhancedError;
    }
  }

  /**
   * Get attachment by ID
   */
  async getById(id: string): Promise<Attachment | null> {
    try {
      const docRef = this.db.collection(this.collectionName).doc(id);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date()
      } as Attachment;
    } catch (error) {
      throw new Error(`Failed to get attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get attachment by storage path
   */
  async getByStoragePath(storagePath: string): Promise<Attachment | null> {
    try {
      const snapshot = await this.db.collection(this.collectionName)
        .where('storagePath', '==', storagePath)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date()
      } as Attachment;
    } catch (error) {
      throw new Error(`Failed to get attachment by path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete attachment from Firebase Storage
   */
  async deleteFile(id: string): Promise<void> {
    try {
      const attachment = await this.getById(id);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Delete from Firebase Storage
      await this.deleteByStoragePath(attachment.storagePath);

      // Delete metadata from Firestore
      await this.db.collection(this.collectionName).doc(id).delete();
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete attachment by storage path
   */
  async deleteByStoragePath(storagePath: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(storagePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
      }
    } catch (error) {
      throw new Error(`Failed to delete file from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get download URL for an attachment
   */
  async getDownloadUrl(storagePath: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(storagePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('File not found in storage');
      }

      // Return public URL
      return `https://storage.googleapis.com/${this.bucketName}/${storagePath}`;
    } catch (error) {
      throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(storagePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('File not found in storage');
      }

      // Generate signed URL
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiresIn * 1000)
      });

      return url;
    } catch (error) {
      throw new Error(`Failed to get signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

