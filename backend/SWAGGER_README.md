# TabNorder API Documentation

This document describes how to use the Swagger API documentation for the TabNorder backend.

## Overview

The TabNorder API provides endpoints for managing restaurants, menus, and menu items. The API is built with TypeScript and follows Clean Architecture principles.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Running the API with Swagger Documentation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server with Swagger:**
   ```bash
   npm run server:swagger
   ```

3. **Access the Swagger UI:**
   - Open your browser and go to: `http://localhost:3000/api-docs`
   - The Swagger UI provides an interactive interface to test all API endpoints

4. **Access raw OpenAPI JSON:**
   - Raw OpenAPI specification: `http://localhost:3000/api-docs.json`

## API Endpoints

### Health Check
- `GET /health` - Check API health status

### Places Management
- `POST /place` - Create a new place
- `GET /place/{id}` - Get place by ID
- `PUT /place/{id}` - Update place
- `DELETE /place/{id}` - Delete place
- `GET /place/owner/{ownerId}` - Get places by owner
- `GET /place/active` - Get active places
- `GET /place/search?q={term}` - Search places
- `GET /place/location?city={city}&state={state}` - Get places by location
- `GET /place/online-orders` - Get places with online orders
- `GET /place/query` - Query places with filters
- `GET /place/nearby?lat={lat}&lng={lng}&radius={radius}` - Get nearby places
- `POST /place/{id}/activate` - Activate place
- `POST /place/{id}/deactivate` - Deactivate place
- `POST /place/{id}/suspend` - Suspend place
- `GET /place/{id}/can-accept-orders` - Check if place can accept orders
- `GET /place/{id}/is-open` - Check if place is open

### Items Management
- `POST /items` - Create a new menu item
- `GET /items/{id}` - Get item by ID
- `PUT /items/{id}` - Update item
- `DELETE /items/{id}` - Delete item
- `GET /items/menu?menuId={id}` - Get items by menu ID
- `GET /items/category?menuId={id}&category={category}` - Get items by category
- `GET /items/available?menuId={id}` - Get available items
- `GET /items/search?menuId={id}&q={term}` - Search items
- `GET /items/query` - Query items with filters

### Menu Management
- `POST /menu` - Create menu for a place
- `GET /menu?placeId={id}` - Get menu by place ID

## Data Models

### Place
Represents a restaurant or food establishment with:
- Basic info (name, description)
- Address with coordinates
- Contact information
- Business hours
- Settings (currency, timezone, fees, etc.)
- Status and ownership

### Item
Represents a menu item with:
- Basic info (name, description, price)
- Category and availability
- Nutritional specifications
- Preparation time and ingredients
- Menu association

### Menu
Represents a restaurant menu with:
- Place association
- Categories and items
- Active status

## Authentication

Currently, the API expects an `ownerId` in the request body for place creation. In a production environment, this would be handled through proper authentication middleware.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Response Format

Successful responses follow this format:

```json
{
  "success": true,
  "data": { /* Response data */ },
  "message": "Success message",
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "requestId": "unique-request-id"
  }
}
```

## Testing with Swagger UI

1. **Navigate to the Swagger UI** at `http://localhost:3000/api-docs`

2. **Expand any endpoint** to see its details

3. **Click "Try it out"** to test the endpoint

4. **Fill in the required parameters** and request body

5. **Click "Execute"** to send the request

6. **View the response** in the UI

## Example Requests

### Create a Place
```bash
curl -X POST http://localhost:3000/place \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Restaurant",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "businessHours": {
      "monday": {
        "open": "09:00",
        "close": "22:00",
        "isOpen": true
      }
    },
    "settings": {
      "currency": "USD",
      "timezone": "America/New_York",
      "language": "en",
      "allowOnlineOrders": true,
      "requireOrderConfirmation": false
    },
    "ownerId": "user123"
  }'
```

### Create a Menu Item
```bash
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cheeseburger",
    "price": 9.99,
    "category": "Burgers",
    "specs": {
      "allergens": ["Dairy", "Gluten"],
      "calories": 650
    },
    "menuId": "RWyaJuLp61CYDKXobWc9"
  }'
```

## Development

### Adding New Endpoints

1. **Add the endpoint** to the appropriate controller
2. **Update the Swagger documentation** in `src/swagger/api-docs.ts`
3. **Add the route** to `src/server.ts`
4. **Test the endpoint** using Swagger UI

### Updating Schemas

1. **Modify the schema** in `src/swagger/swagger.config.ts`
2. **Update the API documentation** in `src/swagger/api-docs.ts`
3. **Test the changes** using Swagger UI

## Production Deployment

For production deployment with Firebase Functions:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   npm run deploy
   ```

3. **Access the production API:**
   - Production URL: `https://us-central1-tab-n-order.cloudfunctions.net`
   - Note: Swagger UI is only available in local development mode

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change the PORT environment variable: `PORT=3001 npm run server:swagger`

2. **Swagger UI not loading:**
   - Check that all dependencies are installed: `npm install`
   - Verify the server is running: `npm run server:swagger`

3. **API endpoints not working:**
   - Check the server logs for errors
   - Verify the request format matches the API documentation

### Getting Help

- Check the server logs for detailed error messages
- Use the Swagger UI to test endpoints interactively
- Review the API documentation in the Swagger UI

## License

This project is licensed under the MIT License.

