import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TabNorder Backend API',
    version: '1.0.0',
    description: 'RESTful API for TabNorder - Restaurant menu management system',
    contact: {
      name: 'TabNorder Team',
      email: 'support@tabnorder.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5002',
      description: 'Local Development Server (Firebase Emulator)'
    },
    {
      url: 'https://us-central1-tab-n-order.cloudfunctions.net',
      description: 'Production Server (Firebase Cloud Functions)'
    }
  ],
  components: {
    schemas: {
      // Common Response Schemas
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indicates if the request was successful'
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          message: {
            type: 'string',
            description: 'Response message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of error messages'
          },
          metadata: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'string',
                format: 'date-time'
              },
              version: {
                type: 'string'
              },
              requestId: {
                type: 'string'
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of error details'
          }
        }
      },

      // Place Schemas
      Place: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the place'
          },
          name: {
            type: 'string',
            description: 'Name of the restaurant/place'
          },
          description: {
            type: 'string',
            description: 'Description of the place'
          },
          address: {
            $ref: '#/components/schemas/Address'
          },
          contact: {
            $ref: '#/components/schemas/Contact'
          },
          businessHours: {
            $ref: '#/components/schemas/BusinessHours'
          },
          settings: {
            $ref: '#/components/schemas/PlaceSettings'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended', 'pending_approval'],
            description: 'Current status of the place'
          },
          ownerId: {
            type: 'string',
            description: 'ID of the user who owns this place'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'name', 'address', 'businessHours', 'settings', 'status', 'ownerId', 'createdAt', 'updatedAt']
      },
      Address: {
        type: 'object',
        properties: {
          street: {
            type: 'string',
            description: 'Street address'
          },
          city: {
            type: 'string',
            description: 'City name'
          },
          state: {
            type: 'string',
            description: 'State or province'
          },
          zipCode: {
            type: 'string',
            description: 'ZIP or postal code'
          },
          country: {
            type: 'string',
            description: 'Country name'
          },
          coordinates: {
            $ref: '#/components/schemas/Coordinates'
          }
        },
        required: ['street', 'city', 'state', 'zipCode', 'country']
      },
      Coordinates: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            format: 'double',
            description: 'Latitude coordinate'
          },
          longitude: {
            type: 'number',
            format: 'double',
            description: 'Longitude coordinate'
          }
        },
        required: ['latitude', 'longitude']
      },
      Contact: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'Phone number'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address'
          },
          website: {
            type: 'string',
            format: 'uri',
            description: 'Website URL'
          }
        }
      },
      BusinessHours: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/DayHours'
        },
        description: 'Business hours for each day of the week'
      },
      DayHours: {
        type: 'object',
        properties: {
          open: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            description: 'Opening time in HH:MM format'
          },
          close: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            description: 'Closing time in HH:MM format'
          },
          isOpen: {
            type: 'boolean',
            description: 'Whether the place is open on this day'
          }
        },
        required: ['open', 'close', 'isOpen']
      },
      PlaceSettings: {
        type: 'object',
        properties: {
          currency: {
            type: 'string',
            description: 'Currency code (e.g., USD, EUR)'
          },
          timezone: {
            type: 'string',
            description: 'Timezone (e.g., America/New_York)'
          },
          language: {
            type: 'string',
            description: 'Language code (e.g., en, es)'
          },
          allowOnlineOrders: {
            type: 'boolean',
            description: 'Whether online orders are allowed'
          },
          requireOrderConfirmation: {
            type: 'boolean',
            description: 'Whether order confirmation is required'
          },
          minimumOrderAmount: {
            type: 'number',
            format: 'double',
            description: 'Minimum order amount'
          },
          deliveryFee: {
            type: 'number',
            format: 'double',
            description: 'Delivery fee'
          },
          serviceFee: {
            type: 'number',
            format: 'double',
            description: 'Service fee'
          },
          taxRate: {
            type: 'number',
            format: 'double',
            description: 'Tax rate as decimal (e.g., 0.0875 for 8.75%)'
          }
        },
        required: ['currency', 'timezone', 'language', 'allowOnlineOrders', 'requireOrderConfirmation']
      },
      CreatePlaceCommand: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the restaurant/place'
          },
          description: {
            type: 'string',
            description: 'Description of the place'
          },
          address: {
            $ref: '#/components/schemas/Address'
          },
          contact: {
            $ref: '#/components/schemas/Contact'
          },
          businessHours: {
            $ref: '#/components/schemas/BusinessHours'
          },
          settings: {
            $ref: '#/components/schemas/PlaceSettings'
          },
          ownerId: {
            type: 'string',
            description: 'ID of the user who owns this place'
          }
        },
        required: ['name', 'address', 'businessHours', 'settings', 'ownerId']
      },
      UpdatePlaceCommand: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID of the place to update'
          },
          name: {
            type: 'string',
            description: 'Name of the restaurant/place'
          },
          description: {
            type: 'string',
            description: 'Description of the place'
          },
          address: {
            $ref: '#/components/schemas/Address'
          },
          contact: {
            $ref: '#/components/schemas/Contact'
          },
          businessHours: {
            $ref: '#/components/schemas/BusinessHours'
          },
          settings: {
            $ref: '#/components/schemas/PlaceSettings'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended', 'pending_approval']
          }
        },
        required: ['id']
      },
      PlaceQuery: {
        type: 'object',
        properties: {
          ownerId: {
            type: 'string',
            description: 'Filter by owner ID'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended', 'pending_approval'],
            description: 'Filter by status'
          },
          city: {
            type: 'string',
            description: 'Filter by city'
          },
          state: {
            type: 'string',
            description: 'Filter by state'
          },
          allowOnlineOrders: {
            type: 'boolean',
            description: 'Filter by online order availability'
          },
          searchTerm: {
            type: 'string',
            description: 'Search term for name or description'
          }
        }
      },

      // Item Schemas
      Item: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the item'
          },
          name: {
            type: 'string',
            description: 'Name of the menu item'
          },
          description: {
            type: 'string',
            description: 'Description of the item'
          },
          price: {
            type: 'number',
            format: 'double',
            description: 'Price of the item'
          },
          category: {
            type: 'string',
            description: 'Category of the item (e.g., Appetizers, Main Course)'
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL of the item image'
          },
          isAvailable: {
            type: 'boolean',
            description: 'Whether the item is currently available'
          },
          preparationTime: {
            type: 'integer',
            description: 'Preparation time in minutes'
          },
          ingredients: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of ingredients'
          },
          specs: {
            $ref: '#/components/schemas/ItemSpecs'
          },
          menuId: {
            type: 'string',
            description: 'ID of the menu this item belongs to'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'name', 'price', 'category', 'isAvailable', 'specs', 'menuId', 'createdAt', 'updatedAt']
      },
      ItemSpecs: {
        type: 'object',
        properties: {
          allergens: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of allergens'
          },
          calories: {
            type: 'integer',
            description: 'Calorie count'
          },
          protein: {
            type: 'number',
            format: 'double',
            description: 'Protein content in grams'
          },
          carbs: {
            type: 'number',
            format: 'double',
            description: 'Carbohydrate content in grams'
          },
          fat: {
            type: 'number',
            format: 'double',
            description: 'Fat content in grams'
          },
          fiber: {
            type: 'number',
            format: 'double',
            description: 'Fiber content in grams'
          }
        }
      },
      CreateItemCommand: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the menu item'
          },
          description: {
            type: 'string',
            description: 'Description of the item'
          },
          price: {
            type: 'number',
            format: 'double',
            description: 'Price of the item'
          },
          category: {
            type: 'string',
            description: 'Category of the item'
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL of the item image'
          },
          isAvailable: {
            type: 'boolean',
            description: 'Whether the item is available',
            default: true
          },
          preparationTime: {
            type: 'integer',
            description: 'Preparation time in minutes'
          },
          ingredients: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of ingredients'
          },
          specs: {
            $ref: '#/components/schemas/ItemSpecs'
          },
          menuId: {
            type: 'string',
            description: 'ID of the menu this item belongs to'
          }
        },
        required: ['name', 'price', 'category', 'specs', 'menuId']
      },
      UpdateItemCommand: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID of the item to update'
          },
          name: {
            type: 'string',
            description: 'Name of the menu item'
          },
          description: {
            type: 'string',
            description: 'Description of the item'
          },
          price: {
            type: 'number',
            format: 'double',
            description: 'Price of the item'
          },
          category: {
            type: 'string',
            description: 'Category of the item'
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL of the item image'
          },
          isAvailable: {
            type: 'boolean',
            description: 'Whether the item is available'
          },
          preparationTime: {
            type: 'integer',
            description: 'Preparation time in minutes'
          },
          ingredients: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of ingredients'
          },
          specs: {
            $ref: '#/components/schemas/ItemSpecs'
          }
        },
        required: ['id']
      },
      ItemQuery: {
        type: 'object',
        properties: {
          menuId: {
            type: 'string',
            description: 'Filter by menu ID'
          },
          category: {
            type: 'string',
            description: 'Filter by category'
          },
          isAvailable: {
            type: 'boolean',
            description: 'Filter by availability'
          },
          search: {
            type: 'string',
            description: 'Search term for name or description'
          }
        }
      },

      // Menu Schemas
      Menu: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the menu'
          },
          placeId: {
            type: 'string',
            description: 'ID of the place this menu belongs to'
          },
          name: {
            type: 'string',
            description: 'Name of the menu'
          },
          description: {
            type: 'string',
            description: 'Description of the menu'
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of menu categories'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the menu is active'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'placeId', 'isActive', 'createdAt', 'updatedAt']
      },
      CreateMenuCommand: {
        type: 'object',
        properties: {
          placeId: {
            type: 'string',
            description: 'ID of the place this menu belongs to'
          },
          name: {
            type: 'string',
            description: 'Name of the menu'
          },
          description: {
            type: 'string',
            description: 'Description of the menu'
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of menu categories'
          }
        },
        required: ['placeId']
      }
    },
    parameters: {
      PlaceId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'Place ID'
      },
      ItemId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'Item ID'
      },
      OwnerId: {
        name: 'ownerId',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'Owner ID'
      },
      SearchQuery: {
        name: 'q',
        in: 'query',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'Search term'
      },
      CityQuery: {
        name: 'city',
        in: 'query',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'City name'
      },
      StateQuery: {
        name: 'state',
        in: 'query',
        schema: {
          type: 'string'
        },
        description: 'State name'
      },
      LatitudeQuery: {
        name: 'lat',
        in: 'query',
        required: true,
        schema: {
          type: 'number',
          format: 'double'
        },
        description: 'Latitude coordinate'
      },
      LongitudeQuery: {
        name: 'lng',
        in: 'query',
        required: true,
        schema: {
          type: 'number',
          format: 'double'
        },
        description: 'Longitude coordinate'
      },
      RadiusQuery: {
        name: 'radius',
        in: 'query',
        schema: {
          type: 'number',
          format: 'double',
          default: 10
        },
        description: 'Search radius in kilometers'
      },
      MenuIdQuery: {
        name: 'menuId',
        in: 'query',
        required: true,
        schema: {
          type: 'string'
        },
        description: 'Menu ID'
      },
      CategoryQuery: {
        name: 'category',
        in: 'query',
        schema: {
          type: 'string'
        },
        description: 'Item category'
      },
      IsAvailableQuery: {
        name: 'isAvailable',
        in: 'query',
        schema: {
          type: 'boolean'
        },
        description: 'Filter by availability'
      }
    },
    responses: {
      SuccessResponse: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            }
          }
        }
      },
      ErrorResponse: {
        description: 'Error response',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      NotFoundResponse: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      BadRequestResponse: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      MethodNotAllowedResponse: {
        description: 'Method not allowed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      InternalServerErrorResponse: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints'
    },
    {
      name: 'Places',
      description: 'Restaurant/place management endpoints'
    },
    {
      name: 'Items',
      description: 'Menu item management endpoints'
    },
    {
      name: 'Menus',
      description: 'Menu management endpoints'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/controllers/*.ts', './src/swagger/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
