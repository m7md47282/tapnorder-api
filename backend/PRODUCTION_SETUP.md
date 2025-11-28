# Production Setup Guide

## Environment Configuration

### 1. Development (Emulator)
```bash
# Use the development environment file
cp .env.development .env

# Start with emulator
npm run serve:dev
```

### 2. Production
```bash
# Use the production environment file
cp .env.production .env

# Set your actual Firebase credentials in .env
# FIREBASE_PROJECT_ID=your-actual-project-id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
# FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com

# Start in production mode
npm run start:prod
```

## Firebase Service Account Setup

### 1. Create Service Account
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### 2. Extract Credentials
From the downloaded JSON file, extract:
- `project_id` → `FIREBASE_PROJECT_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY`
- `client_email` → `FIREBASE_CLIENT_EMAIL`

### 3. Set Environment Variables
```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
export FIREBASE_CLIENT_EMAIL="your-service-account@your-project-id.iam.gserviceaccount.com"
export NODE_ENV="production"
```

## Deployment

### 1. Build and Deploy
```bash
# Build the project
npm run build

# Deploy to Firebase Functions
npm run deploy:prod
```

### 2. Verify Deployment
```bash
# Check deployed functions
firebase functions:list

# Test health endpoint
curl https://your-region-your-project-id.cloudfunctions.net/healthCheck
```

## Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Environment mode |
| `FIREBASE_PROJECT_ID` | `tab-n-order` | Your actual project ID | Firebase project identifier |
| `FIREBASE_PRIVATE_KEY` | Not needed | Service account private key | Firebase authentication |
| `FIREBASE_CLIENT_EMAIL` | Not needed | Service account email | Firebase authentication |
| `USE_FIREBASE_EMULATOR` | `true` | `false` | Use local emulator |
| `FIRESTORE_EMULATOR_HOST` | `localhost:8080` | Not set | Emulator host |

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate service account keys** regularly
4. **Use least privilege** for service accounts
5. **Enable audit logging** in Firebase Console

## Troubleshooting

### Connection Issues
```bash
# Check if Firebase project exists
firebase projects:list

# Verify service account permissions
firebase auth:export users.json --project your-project-id
```

### Environment Issues
```bash
# Check environment variables
echo $NODE_ENV
echo $FIREBASE_PROJECT_ID

# Test connection
npm run start:prod
```

### Deployment Issues
```bash
# Check Firebase CLI login
firebase login:list

# Check project selection
firebase use

# View deployment logs
firebase functions:log
```
