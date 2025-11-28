import { IAttachmentService } from './interfaces/attachment.service.interface';
import { IAttachmentRepository } from '../repositories/interfaces/attachment.repository.interface';
import { AttachmentRepository } from '../repositories/attachment/attachment.repository';
import { Attachment, CreateAttachmentCommand, AttachmentQuery } from '../entities/attachment.entity';
import { 
  ValidationError, 
  InvalidInputError, 
  ResourceNotFoundError,
  BusinessRuleViolationError
} from '../shared/errors/custom-errors';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Attachment Service
 * Contains ALL business logic and validation for attachments
 * Follows SOLID principles and Clean Architecture
 */
export class AttachmentService implements IAttachmentService {
  private attachmentRepository: IAttachmentRepository;

  // Allowed MIME types
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  // Maximum file size: 10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  constructor(attachmentRepository?: IAttachmentRepository) {
    this.attachmentRepository = attachmentRepository ?? new AttachmentRepository();
  }

  /**
   * Upload a file attachment
   * Validates file type, size, and other business rules
   */
  async uploadAttachment(command: CreateAttachmentCommand): Promise<Attachment> {
    // 1. VALIDATION (Service Layer Responsibility)
    this.validateCreateCommand(command);

    // 2. BUSINESS LOGIC (Service Layer Responsibility)
    // File size validation
    if (command.file.length > this.MAX_FILE_SIZE) {
      throw new BusinessRuleViolationError(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        {
          field: 'file',
          value: command.file.length,
          constraint: `maxSize:${this.MAX_FILE_SIZE}`
        }
      );
    }

    // MIME type validation
    if (!this.ALLOWED_MIME_TYPES.includes(command.mimeType)) {
      throw new ValidationError(
        `File type not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
        {
          field: 'mimeType',
          value: command.mimeType,
          constraint: 'allowedMimeTypes'
        }
      );
    }

    // 3. PERSISTENCE (Delegate to Repository)
    const attachment = await this.attachmentRepository.uploadFile(command);

    return attachment;
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(id: string): Promise<Attachment | null> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new InvalidInputError('Attachment ID is required', {
        field: 'id',
        value: id
      });
    }

    const attachment = await this.attachmentRepository.getById(id);
    return attachment;
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id: string): Promise<void> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new InvalidInputError('Attachment ID is required', {
        field: 'id',
        value: id
      });
    }

    // Check if attachment exists
    const attachment = await this.attachmentRepository.getById(id);
    if (!attachment) {
      throw new ResourceNotFoundError('Attachment', id);
    }

    // Delete from storage and Firestore
    await this.attachmentRepository.deleteFile(id);
  }

  /**
   * Query attachments
   */
  async queryAttachments(query: AttachmentQuery): Promise<Attachment[]> {
    const db = getFirestore();
    let queryRef = db.collection('attachments') as any;

    // Apply filters
    if (query.uploadedBy) {
      queryRef = queryRef.where('uploadedBy', '==', query.uploadedBy);
    }

    if (query.relatedEntityType) {
      queryRef = queryRef.where('relatedEntityType', '==', query.relatedEntityType);
    }

    if (query.relatedEntityId) {
      queryRef = queryRef.where('relatedEntityId', '==', query.relatedEntityId);
    }

    if (query.fileType) {
      queryRef = queryRef.where('fileType', '==', query.fileType);
    }

    if (query.mimeType) {
      queryRef = queryRef.where('mimeType', '==', query.mimeType);
    }

    // Order by creation date (newest first)
    queryRef = queryRef.orderBy('createdAt', 'desc');

    const snapshot = await queryRef.get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Attachment[];
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(id: string, expiresIn: number = 3600): Promise<string> {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new InvalidInputError('Attachment ID is required', {
        field: 'id',
        value: id
      });
    }

    // Check if attachment exists
    const attachment = await this.attachmentRepository.getById(id);
    if (!attachment) {
      throw new ResourceNotFoundError('Attachment', id);
    }

    // Validate expiration time (max 7 days)
    const maxExpiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    if (expiresIn > maxExpiresIn) {
      throw new ValidationError(
        `Expiration time cannot exceed ${maxExpiresIn / (24 * 60 * 60)} days`,
        {
          field: 'expiresIn',
          value: expiresIn,
          constraint: `maxExpiresIn:${maxExpiresIn}`
        }
      );
    }

    return this.attachmentRepository.getSignedUrl(attachment.storagePath, expiresIn);
  }

  /**
   * Validate create command
   * Private method for validation logic
   */
  private validateCreateCommand(command: CreateAttachmentCommand): void {
    if (!command) {
      throw new InvalidInputError('Attachment command is required');
    }

    if (!command.file || !Buffer.isBuffer(command.file) && !(command.file instanceof Uint8Array)) {
      throw new ValidationError('File buffer is required', {
        field: 'file',
        value: command.file
      });
    }

    if (!command.fileName || typeof command.fileName !== 'string' || command.fileName.trim().length === 0) {
      throw new ValidationError('File name is required', {
        field: 'fileName',
        value: command.fileName
      });
    }

    if (!command.mimeType || typeof command.mimeType !== 'string' || command.mimeType.trim().length === 0) {
      throw new ValidationError('MIME type is required', {
        field: 'mimeType',
        value: command.mimeType
      });
    }

    // Validate file name format (no path traversal)
    if (command.fileName.includes('..') || command.fileName.includes('/') || command.fileName.includes('\\')) {
      throw new ValidationError('Invalid file name format', {
        field: 'fileName',
        value: command.fileName,
        constraint: 'noPathTraversal'
      });
    }
  }
}

