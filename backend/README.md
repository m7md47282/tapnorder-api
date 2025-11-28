# TabNorder Backend

A Node.js/Express backend API for managing restaurant menus with Firebase integration.

## Features

- **TypeScript** - Full TypeScript support with strict type checking
- **Express.js** - Fast, unopinionated web framework
- **Firebase Integration** - Using Firebase Admin SDK for data persistence
- **Security** - Helmet for security headers, CORS configured
- **Validation** - Input validation and error handling
- **Compression** - Response compression for better performance
- **Development Tools** - ESLint, Jest, hot reload with tsx

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Menu Management
- `GET /api/menus/:placeId` - Get menu by place ID
- `POST /api/menus/:placeId` - Create new menu for a place
- `PUT /api/menus/:placeId` - Update menu for a place
- `PUT /api/menus/:placeId/items/:itemId` - Update specific menu item

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Firebase configuration:
   ```
   PROJECT_ID=your-firebase-project-id
   PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   SERVER_PORT=3000
   NODE_ENV=development
   ```

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests with Jest
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```
src/
├── app.ts                  # Main application entry point
├── controllers/            # Request handlers
│   └── menu.controller.ts
├── routes/                 # Express route definitions
│   └── menu.routes.ts
├── services/              # Business logic layer
│   └── menu.service.ts
├── repositories/          # Data access layer
│   ├── base.repository.ts
│   ├── firebase.repository.ts
│   └── menu/
│       ├── menu.repository.ts
│       └── types.ts
└── database/              # Database configuration
    ├── database-client.ts
    ├── types.ts
    └── clients/
        └── firebase-client.ts
```

## Technologies Used

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Testing:** Jest
- **Linting:** ESLint
- **Security:** Helmet, CORS
- **Development:** tsx (hot reload)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PROJECT_ID` | Firebase project ID | Yes |
| `PRIVATE_KEY` | Firebase service account private key | Yes |
| `CLIENT_EMAIL` | Firebase service account email | Yes |
| `SERVER_PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No |



