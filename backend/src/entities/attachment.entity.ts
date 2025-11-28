import { BaseModel } from '../repositories/types';

/**
 * Attachment Entity
 * Represents a file attachment stored in Firebase Storage
 */
export interface Attachment extends BaseModel {
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number; // in bytes
  url: string; // Firebase Storage download URL
  storagePath: string; // Path in Firebase Storage
  uploadedBy?: string; // User ID who uploaded the file
  relatedEntityType?: string; // e.g., 'item', 'menu', 'place'
  relatedEntityId?: string; // ID of the related entity
  metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * Create Attachment Command
 */
export interface CreateAttachmentCommand {
  file: Buffer | Uint8Array;
  fileName: string;
  mimeType: string;
  uploadedBy?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
  folder?: string; // Optional folder path in storage
}

/**
 * Attachment Query
 */
export interface AttachmentQuery {
  uploadedBy?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  fileType?: string;
  mimeType?: string;
}

