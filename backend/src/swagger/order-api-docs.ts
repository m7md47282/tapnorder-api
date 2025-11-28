/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     description: Creates a new order with items, customer information, and payment details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderCommand'
 *           example:
 *             placeId: "place-123"
 *             customer:
 *               name: "John Doe"
 *               phone: "+1234567890"
 *               email: "john@example.com"
 *               isGuest: false
 *             items:
 *               - itemId: "item-1"
 *                 itemName: "Burger"
 *                 itemPrice: 12.99
 *                 quantity: 2
 *                 specialInstructions: "No pickles"
 *               - itemId: "item-2"
 *                 itemName: "Fries"
 *                 itemPrice: 4.99
 *                 quantity: 1
 *             type: "dine_in"
 *             payment:
 *               method: "card"
 *               amount: 30.97
 *             source: "pos"
 *             lastUpdatedBy: "cashier-123"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   get:
 *     tags: [Orders]
 *     summary: Get orders with filters
 *     description: Retrieves orders for a specific place with optional filtering
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceIdQuery'
 *       - $ref: '#/components/parameters/OrderStatusQuery'
 *       - $ref: '#/components/parameters/OrderTypeQuery'
 *       - $ref: '#/components/parameters/CustomerIdQuery'
 *       - $ref: '#/components/parameters/DateFromQuery'
 *       - $ref: '#/components/parameters/DateToQuery'
 *       - $ref: '#/components/parameters/OrderNumberQuery'
 *       - $ref: '#/components/parameters/SourceQuery'
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                         $ref: '#/components/schemas/Order'
 *                     count:
 *                       type: integer
 *                       description: Number of orders returned
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *
 * /orderDetail/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     description: Retrieves a specific order by its ID
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFoundResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *   put:
 *     tags: [Orders]
 *     summary: Update order status
 *     description: Updates the status of an existing order
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, preparing, ready, completed, cancelled]
 *                 description: New status of the order
 *               lastUpdatedBy:
 *                 type: string
 *                 description: User ID who made the update
 *             required: [status, lastUpdatedBy]
 *           example:
 *             status: "confirmed"
 *             lastUpdatedBy: "kitchen-staff-123"
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *
 * /orderSearch:
 *   get:
 *     tags: [Orders]
 *     summary: Search orders
 *     description: Search orders by order number or customer name
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceIdQuery'
 *       - $ref: '#/components/parameters/SearchTermQuery'
 *     responses:
 *       200:
 *         description: Orders found successfully
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
 *                         $ref: '#/components/schemas/Order'
 *                     count:
 *                       type: integer
 *                       description: Number of orders found
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *
 * /orderRealtime:
 *   get:
 *     tags: [Orders Realtime]
 *     summary: Real-time orders stream
 *     description: |
 *       Establishes a Server-Sent Events (SSE) connection for real-time order updates.
 *       This endpoint streams live updates of all orders for a specific place.
 *       Perfect for cashier dashboards that need instant updates without page refresh.
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceIdQuery'
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional comma-separated list of statuses to filter (e.g., pending,confirmed,preparing)
 *     responses:
 *       200:
 *         description: Real-time order updates stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream
 *             examples:
 *               connection:
 *                 summary: Initial connection message
 *                 value: |
 *                   data: {"type":"connection","message":"Connected to real-time orders","timestamp":"2024-12-01T10:30:00.000Z"}
 *               
 *               orders_update:
 *                 summary: Orders update message
 *                 value: |
 *                   data: {"type":"orders_update","data":[{"id":"order-123","orderNumber":"ORD-001","status":"pending","total":25.98}],"count":1,"timestamp":"2024-12-01T10:30:00.000Z"}
 *               
 *               heartbeat:
 *                 summary: Heartbeat message
 *                 value: |
 *                   data: {"type":"heartbeat","timestamp":"2024-12-01T10:30:00.000Z"}
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *     x-code-samples:
 *       - lang: JavaScript
 *         source: |
 *           const eventSource = new EventSource('/orderRealtime?placeId=place-123');
 *           eventSource.onmessage = (event) => {
 *             const data = JSON.parse(event.data);
 *             if (data.type === 'orders_update') {
 *               updateOrdersList(data.data);
 *             }
 *           };
 *       - lang: Angular
 *         source: |
 *           this.eventSource = new EventSource('/orderRealtime?placeId=place-123');
 *           this.eventSource.onmessage = (event) => {
 *             const data = JSON.parse(event.data);
 *             this.ordersSubject.next(data.data);
 *           };
 *
 * /orderRealtimeStatus:
 *   get:
 *     tags: [Orders Realtime]
 *     summary: Real-time orders by status stream
 *     description: |
 *       Establishes a Server-Sent Events (SSE) connection for real-time order updates filtered by status.
 *       This endpoint is perfect for kitchen dashboards that only need to see orders requiring attention.
 *       Only streams orders with the specified statuses.
 *     parameters:
 *       - $ref: '#/components/parameters/PlaceIdQuery'
 *       - $ref: '#/components/parameters/StatusListQuery'
 *     responses:
 *       200:
 *         description: Real-time order updates stream filtered by status
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream
 *             examples:
 *               connection:
 *                 summary: Initial connection message
 *                 value: |
 *                   data: {"type":"connection","message":"Connected to real-time orders by status","timestamp":"2024-12-01T10:30:00.000Z"}
 *               
 *               orders_update:
 *                 summary: Filtered orders update message
 *                 value: |
 *                   data: {"type":"orders_update","data":[{"id":"order-123","orderNumber":"ORD-001","status":"preparing","total":25.98}],"count":1,"timestamp":"2024-12-01T10:30:00.000Z"}
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *     x-code-samples:
 *       - lang: JavaScript
 *         source: |
 *           const eventSource = new EventSource('/orderRealtimeStatus?placeId=place-123&status=pending,confirmed,preparing');
 *           eventSource.onmessage = (event) => {
 *             const data = JSON.parse(event.data);
 *             if (data.type === 'orders_update') {
 *               updateKitchenOrders(data.data);
 *             }
 *           };
 *
 * /orderRealtimeSingle/{id}:
 *   get:
 *     tags: [Orders Realtime]
 *     summary: Real-time single order stream
 *     description: |
 *       Establishes a Server-Sent Events (SSE) connection for real-time updates of a specific order.
 *       This endpoint is useful for order detail pages or tracking specific orders.
 *     parameters:
 *       - $ref: '#/components/parameters/OrderId'
 *     responses:
 *       200:
 *         description: Real-time single order updates stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream
 *             examples:
 *               connection:
 *                 summary: Initial connection message
 *                 value: |
 *                   data: {"type":"connection","message":"Connected to real-time order updates","orderId":"order-123","timestamp":"2024-12-01T10:30:00.000Z"}
 *               
 *               order_update:
 *                 summary: Single order update message
 *                 value: |
 *                   data: {"type":"order_update","data":{"id":"order-123","orderNumber":"ORD-001","status":"preparing","total":25.98},"timestamp":"2024-12-01T10:30:00.000Z"}
 *       400:
 *         $ref: '#/components/responses/BadRequestResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerErrorResponse'
 *     x-code-samples:
 *       - lang: JavaScript
 *         source: |
 *           const eventSource = new EventSource('/orderRealtimeSingle/order-123');
 *           eventSource.onmessage = (event) => {
 *             const data = JSON.parse(event.data);
 *             if (data.type === 'order_update') {
 *               updateOrderDetails(data.data);
 *             }
 *           };
 */








