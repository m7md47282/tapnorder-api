import { Request, Response } from 'express';
import { AttachmentService } from '../services/attachment.service';
import { CreateAttachmentCommand, AttachmentQuery } from '../entities/attachment.entity';
import { logger } from 'firebase-functions/v2';
import { ErrorHandler, ApiResponse } from '../shared/errors/error-handler';
import { 
  ValidationError, 
  InvalidInputError, 
  MissingRequiredFieldError,
  ResourceNotFoundError
} from '../shared/errors/custom-errors';

/**
 * Attachment Controller - Presentation Layer
 * Follows SOLID principles and Clean Architecture
 * NO business logic - delegates to services
 * Handles HTTP requests and responses only
 */
export class AttachmentController {
  private attachmentService: AttachmentService;

  constructor() {
    this.attachmentService = new AttachmentService();
  }

  private sendResponse<T>(res: Response, statusCode: number, response: ApiResponse<T>): void {
    res.status(statusCode).json(response);
  }

  private handleError(res: Response, error: unknown): void {
    ErrorHandler.handleError(error, {} as Request, res);
  }

  /**
   * Upload attachment
   * POST /attachments
   * Accepts JSON with base64 encoded file or raw buffer
   * Body: { file: string (base64), fileName: string, mimeType: string, ... }
   */
  uploadAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use POST method for uploading attachments'
        });
      }

      // Validate required fields
      if (!req.body.file) {
        throw new MissingRequiredFieldError('file', {
          field: 'file',
          value: undefined,
          suggestion: 'Provide a file as base64 string or buffer in the request body'
        });
      }

      if (!req.body.fileName) {
        throw new MissingRequiredFieldError('fileName', {
          field: 'fileName',
          value: undefined,
          suggestion: 'Provide a file name in the request body'
        });
      }

      if (!req.body.mimeType) {
        throw new MissingRequiredFieldError('mimeType', {
          field: 'mimeType',
          value: undefined,
          suggestion: 'Provide a MIME type in the request body'
        });
      }

      // Convert base64 to buffer if needed
      let fileBuffer: Buffer;
      if (typeof req.body.file === 'string') {
        // Assume base64 encoded string
        // Remove data URL prefix if present (e.g., "data:image/png;base64,")
        const base64Data = req.body.file.includes(',') 
          ? req.body.file.split(',')[1] 
          : req.body.file;
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(req.body.file)) {
        fileBuffer = req.body.file;
      } else if (req.body.file instanceof Uint8Array) {
        fileBuffer = Buffer.from(req.body.file);
      } else {
        throw new InvalidInputError('Invalid file format. Expected base64 string or buffer', {
          field: 'file',
          value: typeof req.body.file
        });
      }

      // Extract metadata from request body or query
      const uploadedBy = req.body.uploadedBy || req.query.uploadedBy as string;
      const relatedEntityType = req.body.relatedEntityType || req.query.relatedEntityType as string;
      const relatedEntityId = req.body.relatedEntityId || req.query.relatedEntityId as string;
      const folder = req.body.folder || req.query.folder as string || 'attachments';
      const metadata = req.body.metadata || (req.query.metadata ? JSON.parse(req.query.metadata as string) : undefined);

      // Create attachment command
      const command: CreateAttachmentCommand = {
        file: fileBuffer,
        fileName: req.body.fileName,
        mimeType: req.body.mimeType,
        uploadedBy,
        relatedEntityType,
        relatedEntityId,
        metadata,
        folder
      };

      // Upload attachment
      const attachment = await this.attachmentService.uploadAttachment(command);

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        attachment,
        'Attachment uploaded successfully',
        201,
        req
      );
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get attachment by ID
   * GET /attachments/{id}
   */
  getAttachmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving attachment data'
        });
      }

      // Extract ID from path
      const requestPath = req.path || req.url?.split('?')[0] || '';
      const pathParts = requestPath.split('/').filter(p => p);
      const attachmentId = pathParts[1]; // Second segment after 'attachments'

      if (!attachmentId) {
        throw new MissingRequiredFieldError('id', {
          field: 'id',
          value: attachmentId,
          suggestion: 'Provide attachment ID in the URL path: /attachments/{id}'
        });
      }

      const attachment = await this.attachmentService.getAttachmentById(attachmentId);

      if (!attachment) {
        throw new ResourceNotFoundError('Attachment', attachmentId);
      }

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        attachment,
        'Attachment retrieved successfully',
        200,
        req
      );
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get attachments with filters
   * GET /attachments?uploadedBy=xxx&relatedEntityType=xxx&relatedEntityId=xxx
   */
  getAttachments = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving attachments'
        });
      }

      const query: AttachmentQuery = {
        uploadedBy: req.query.uploaded_by as string || req.query.uploadedBy as string,
        relatedEntityType: req.query.related_entity_type as string || req.query.relatedEntityType as string,
        relatedEntityId: req.query.related_entity_id as string || req.query.relatedEntityId as string,
        fileType: req.query.file_type as string || req.query.fileType as string,
        mimeType: req.query.mime_type as string || req.query.mimeType as string
      };

      const attachments = await this.attachmentService.queryAttachments(query);

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        attachments,
        'Attachments retrieved successfully',
        200,
        req
      );
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Delete attachment
   * DELETE /attachments/{id}
   */
  deleteAttachment = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'DELETE') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use DELETE method for deleting attachments'
        });
      }

      // Extract ID from path
      const requestPath = req.path || req.url?.split('?')[0] || '';
      const pathParts = requestPath.split('/').filter(p => p);
      const attachmentId = pathParts[1]; // Second segment after 'attachments'

      if (!attachmentId) {
        throw new MissingRequiredFieldError('id', {
          field: 'id',
          value: attachmentId,
          suggestion: 'Provide attachment ID in the URL path: /attachments/{id}'
        });
      }

      await this.attachmentService.deleteAttachment(attachmentId);

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        null,
        'Attachment deleted successfully',
        200,
        req
      );
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * Get signed URL for attachment
   * GET /attachments/{id}/signed-url?expiresIn=3600
   */
  getSignedUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.method !== 'GET') {
        throw new ValidationError('Method not allowed', {
          field: 'method',
          value: req.method,
          suggestion: 'Use GET method for retrieving signed URL'
        });
      }

      // Extract ID from path
      const requestPath = req.path || req.url?.split('?')[0] || '';
      const pathParts = requestPath.split('/').filter(p => p);
      const attachmentId = pathParts[1]; // Second segment after 'attachments'

      if (!attachmentId) {
        throw new MissingRequiredFieldError('id', {
          field: 'id',
          value: attachmentId,
          suggestion: 'Provide attachment ID in the URL path: /attachments/{id}/signed-url'
        });
      }

      const expiresIn = req.query.expiresIn 
        ? parseInt(req.query.expiresIn as string, 10)
        : 3600; // Default 1 hour

      const signedUrl = await this.attachmentService.getSignedUrl(attachmentId, expiresIn);

      const { statusCode, response } = ErrorHandler.createSuccessResponse(
        { signedUrl, expiresIn },
        'Signed URL generated successfully',
        200,
        req
      );
      this.sendResponse(res, statusCode, response);
    } catch (error) {
      this.handleError(res, error);
    }
  };
}

