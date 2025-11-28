import { Attachment, CreateAttachmentCommand, AttachmentQuery } from '../../entities/attachment.entity';

/**
 * Attachment Service Interface
 * Contains business logic for attachment operations
 */
export interface IAttachmentService {
  /**
   * Upload a file attachment
   * @param command - Attachment creation command
   * @returns Promise resolving to the created attachment
   */
  uploadAttachment(command: CreateAttachmentCommand): Promise<Attachment>;

  /**
   * Get attachment by ID
   * @param id - Attachment ID
   * @returns Promise resolving to attachment or null if not found
   */
  getAttachmentById(id: string): Promise<Attachment | null>;

  /**
   * Delete attachment
   * @param id - Attachment ID
   * @returns Promise that resolves when deletion is complete
   */
  deleteAttachment(id: string): Promise<void>;

  /**
   * Get attachments by query
   * @param query - Query parameters
   * @returns Promise resolving to array of attachments
   */
  queryAttachments(query: AttachmentQuery): Promise<Attachment[]>;

  /**
   * Get signed URL for temporary access
   * @param id - Attachment ID
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Promise resolving to signed URL
   */
  getSignedUrl(id: string, expiresIn?: number): Promise<string>;
}

