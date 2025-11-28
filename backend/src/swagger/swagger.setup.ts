import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config';
import { Express } from 'express';

/**
 * Swagger Setup for TabNorder Backend API
 * Configures Swagger UI and API documentation
 */
export class SwaggerSetup {
  /**
   * Setup Swagger UI for the Express application
   * @param app Express application instance
   */
  static setupSwagger(app: Express): void {
    // Swagger UI options
    const swaggerUiOptions = {
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #2c3e50; }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 4px; }
      `,
      customSiteTitle: 'TabNorder API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor: (req: any) => {
          // Add any custom headers or modifications to requests
          return req;
        },
        responseInterceptor: (res: any) => {
          // Add any custom response processing
          return res;
        }
      }
    };

    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // Serve raw OpenAPI JSON
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Redirect root to API docs
    app.get('/', (req, res) => {
      res.redirect('/api-docs');
    });

    console.log('📚 Swagger documentation available at:');
    console.log('   - UI: http://localhost:5002/api-docs');
    console.log('   - JSON: http://localhost:5002/api-docs.json');
  }

  /**
   * Get Swagger specification
   * @returns Swagger specification object
   */
  static getSwaggerSpec() {
    return swaggerSpec;
  }

  /**
   * Validate Swagger specification
   * @returns Validation result
   */
  static validateSwaggerSpec(): { valid: boolean; errors?: string[] } {
    try {
      // Basic validation - check if required fields exist
      const spec = swaggerSpec as any;
      
      if (!spec.openapi) {
        return { valid: false, errors: ['Missing openapi version'] };
      }
      
      if (!spec.info || !spec.info.title) {
        return { valid: false, errors: ['Missing API info or title'] };
      }
      
      if (!spec.paths || Object.keys(spec.paths).length === 0) {
        return { valid: false, errors: ['No API paths defined'] };
      }
      
      if (!spec.components || !spec.components.schemas) {
        return { valid: false, errors: ['No schemas defined'] };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }
}
