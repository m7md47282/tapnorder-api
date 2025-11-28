/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */

/**
 * @swagger
 * /place:
 *   post:
 *     tags: [Places]
 *     summary: Create a new place
 *     description: Creates a new restaurant or food establishment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlaceCommand'
 *           example:
 *             name: "My Restaurant"
 *             description: "A great place to eat"
 *             address:
 *               street: "123 Main St"
 *               city: "New York"
 *               state: "NY"
 *               zipCode: "10001"
 *               country: "USA"
 *               coordinates:
 *                 latitude: 40.7128
 *                 longitude: -74.0060
 *             contact:
 *               phone: "+1-555-123-4567"
 *               email: "contact@myrestaurant.com"
 *               website: "https://myrestaurant.com"
 *             businessHours:
 *               monday:
 *                 open: "09:00"
 *                 close: "22:00"
 *                 isOpen: true
 *               tuesday:
 *                 open: "09:00"
 *                 close: "22:00"
 *                 isOpen: true
 *             settings:
 *               currency: "USD"
 *               timezone: "America/New_York"
 *               language: "en"
 *               allowOnlineOrders: true
 *               requireOrderConfirmation: false
 *               minimumOrderAmount: 10.00
 *               deliveryFee: 2.99
 *               serviceFee: 1.50
 *               taxRate: 0.0875
 *             ownerId: "user123"
 *     responses:
 *       201:
 *         description: Place created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Place'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   put:
 *     tags: [Places]
 *     summary: Update a place
 *     description: Updates an existing place
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlaceCommand'
 *     responses:
 *       200:
 *         description: Place updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Place'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   delete:
 *     tags: [Places]
 *     summary: Delete a place
 *     description: Deletes a place by ID
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     responses:
 *       200:
 *         description: Place deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   get:
 *     tags: [Places]
 *     summary: Get place by ID
 *     description: Retrieves a place by its ID
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     responses:
 *       200:
 *         description: Place retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Place'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/owner/{ownerId}:
 *   get:
 *     tags: [Places]
 *     summary: Get places by owner
 *     description: Retrieves all places owned by a specific user
 *     parameters:
 *       - $ref: '#/components/parameters/OwnerId'
 *     responses:
 *       200:
 *         description: Places retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Place'
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/active:
 *   get:
 *     tags: [Places]
 *     summary: Get active places
 *     description: Retrieves all active places
 *     responses:
 *       200:
 *         description: Active places retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Place'
 *                     count:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/search:
 *   get:
 *     tags: [Places]
 *     summary: Search places
 *     description: Search places by name or description
 *     parameters:
 *       - $ref: '#/components/parameters/SearchQuery'
 *     responses:
 *       200:
 *         description: Places found successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Place'
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/location:
 *   get:
 *     tags: [Places]
 *     summary: Get places by location
 *     description: Retrieves places by city and optionally state
 *     parameters:
 *       - $ref: '#/components/parameters/CityQuery'
 *       - $ref: '#/components/parameters/StateQuery'
 *     responses:
 *       200:
 *         description: Places found successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Place'
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/online-orders:
 *   get:
 *     tags: [Places]
 *     summary: Get places with online orders
 *     description: Retrieves places that accept online orders
 *     responses:
 *       200:
 *         description: Places retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Place'
 *                     count:
 *                       type: integer
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/query:
 *   get:
 *     tags: [Places]
 *     summary: Query places with filters
 *     description: Query places with various filters
 *     parameters:
 *       - name: ownerId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by owner ID
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, pending_approval]
 *         description: Filter by status
 *       - name: city
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - name: state
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - name: allowOnlineOrders
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by online order availability
 *       - name: searchTerm
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *     responses:
 *       200:
 *         description: Places found successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Place'
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/nearby:
 *   get:
 *     tags: [Places]
 *     summary: Get nearby places
 *     description: Retrieves places within a specified radius of coordinates
 *     parameters:
 *       - $ref: '#/components/parameters/LatitudeQuery'
 *       - $ref: '#/components/parameters/LongitudeQuery'
 *       - $ref: '#/components/parameters/RadiusQuery'
 *     responses:
 *       200:
 *         description: Nearby places found successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Place'
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/{id}/activate:
 *   post:
 *     tags: [Places]
 *     summary: Activate a place
 *     description: Activates a place
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     responses:
 *       200:
 *         description: Place activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/{id}/deactivate:
 *   post:
 *     tags: [Places]
 *     summary: Deactivate a place
 *     description: Deactivates a place
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     responses:
 *       200:
 *         description: Place deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/{id}/suspend:
 *   post:
 *     tags: [Places]
 *     summary: Suspend a place
 *     description: Suspends a place with optional reason
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for suspension
 *     responses:
 *       200:
 *         description: Place suspended successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/{id}/can-accept-orders:
 *   get:
 *     tags: [Places]
 *     summary: Check if place can accept orders
 *     description: Checks if a place can currently accept orders
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     responses:
 *       200:
 *         description: Order acceptance status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         canAcceptOrders:
 *                           type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /place/{id}/is-open:
 *   get:
 *     tags: [Places]
 *     summary: Check if place is open
 *     description: Checks if a place is currently open based on business hours
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceId'
 *     responses:
 *       200:
 *         description: Place open status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isOpen:
 *                           type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /items:
 *   post:
 *     tags: [Items]
 *     summary: Create a new menu item
 *     description: Creates a new menu item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemCommand'
 *           example:
 *             name: "Cheeseburger"
 *             description: "Grilled beef patty with cheddar cheese"
 *             price: 9.99
 *             category: "Burgers"
 *             imageUrl: "https://example.com/cheeseburger.jpg"
 *             isAvailable: true
 *             preparationTime: 12
 *             ingredients: ["Beef", "Cheddar", "Bun", "Lettuce", "Tomato"]
 *             specs:
 *               allergens: ["Dairy", "Gluten"]
 *               calories: 650
 *               protein: 35.5
 *               carbs: 45.2
 *               fat: 28.1
 *               fiber: 3.2
 *             menuId: "RWyaJuLp61CYDKXobWc9"
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   put:
 *     tags: [Items]
 *     summary: Update a menu item
 *     description: Updates an existing menu item
 *     parameters:
 *       - $ref: '#/components/parameters/ItemId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateItemCommand'
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   delete:
 *     tags: [Items]
 *     summary: Delete a menu item
 *     description: Deletes a menu item by ID
 *     parameters:
 *       - $ref: '#/components/parameters/ItemId'
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   get:
 *     tags: [Items]
 *     summary: Get menu item by ID
 *     description: Retrieves a menu item by its ID
 *     parameters:
 *       - $ref: '#/components/parameters/ItemId'
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /items/menu:
 *   get:
 *     tags: [Items]
 *     summary: Get items by menu ID
 *     description: Retrieves all items for a specific menu
 *     parameters:
 *       - $ref: '#/components/parameters/MenuIdQuery'
 *     responses:
 *       200:
 *         description: Items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /items/category:
 *   get:
 *     tags: [Items]
 *     summary: Get items by category
 *     description: Retrieves items filtered by category within a menu
 *     parameters:
 *       - $ref: '#/components/parameters/MenuIdQuery'
 *       - $ref: '#/components/parameters/CategoryQuery'
 *     responses:
 *       200:
 *         description: Items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /items/available:
 *   get:
 *     tags: [Items]
 *     summary: Get available items
 *     description: Retrieves only available items for a specific menu
 *     parameters:
 *       - $ref: '#/components/parameters/MenuIdQuery'
 *     responses:
 *       200:
 *         description: Available items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /items/search:
 *   get:
 *     tags: [Items]
 *     summary: Search items
 *     description: Search items by name or description within a menu
 *     parameters:
 *       - $ref: '#/components/parameters/MenuIdQuery'
 *       - $ref: '#/components/parameters/SearchQuery'
 *     responses:
 *       200:
 *         description: Items found successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /items/query:
 *   get:
 *     tags: [Items]
 *     summary: Query items with filters
 *     description: Query items with various filters
 *     parameters:
 *       - $ref: '#/components/parameters/MenuIdQuery'
 *       - $ref: '#/components/parameters/CategoryQuery'
 *       - $ref: '#/components/parameters/IsAvailableQuery'
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *     responses:
 *       200:
 *         description: Items found successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */

/**
 * @swagger
 * /menu:
 *   post:
 *     tags: [Menus]
 *     summary: Create a menu for a place
 *     description: Creates a new menu for a specific place
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMenuCommand'
 *           example:
 *             placeId: "place123"
 *             name: "Main Menu"
 *             description: "Our main restaurant menu"
 *             categories: ["Appetizers", "Main Course", "Desserts", "Beverages"]
 *     responses:
 *       201:
 *         description: Menu created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Menu'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   get:
 *     tags: [Menus]
 *     summary: Get menu by place ID
 *     description: Retrieves the menu for a specific place
 *     parameters:
 *       - name: placeId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Place ID
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Menu'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 */
