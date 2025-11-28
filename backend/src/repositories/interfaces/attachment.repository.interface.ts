import { Attachment, CreateAttachmentCommand } from '../../entities/attachment.entity';

/**
 * Attachment Repository Interface
 * Handles file storage operations using Firebase Storage
 */
export interface IAttachmentRepository {
  /**
   * Upload a file to Firebase Storage
   * @param command - Attachment creation command
   * @returns Promise resolving to the created attachment with URL
   */
  uploadFile(command: CreateAttachmentCommand): Promise<Attachment>;

  /**
   * Get attachment by ID
   * @param id - Attachment ID
   * @returns Promise resolving to attachment or null if not found
   */
  getById(id: string): Promise<Attachment | null>;

  /**
   * Get attachment by storage path
   * @param storagePath - Path in Firebase Storage
   * @returns Promise resolving to attachment or null if not found
   */
  getByStoragePath(storagePath: string): Promise<Attachment | null>;

  /**
   * Delete attachment from Firebase Storage
   * @param id - Attachment ID
   * @returns Promise that resolves when deletion is complete
   */
  deleteFile(id: string): Promise<void>;

  /**
   * Delete attachment by storage path
   * @param storagePath - Path in Firebase Storage
   * @returns Promise that resolves when deletion is complete
   */
  deleteByStoragePath(storagePath: string): Promise<void>;

  /**
   * Get download URL for an attachment
   * @param storagePath - Path in Firebase Storage
   * @returns Promise resolving to download URL
   */
  getDownloadUrl(storagePath: string): Promise<string>;

  /**
   * Generate a signed URL for temporary access
   * @param storagePath - Path in Firebase Storage
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Promise resolving to signed URL
   */
  getSignedUrl(storagePath: string, expiresIn?: number): Promise<string>;
}

