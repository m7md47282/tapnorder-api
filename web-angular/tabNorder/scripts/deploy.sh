#!/bin/bash

# Deployment script for tabNorder Angular application
# Usage: ./scripts/deploy.sh [environment] [platform]
# Environments: staging, production
# Platforms: firebase, vercel, netlify

set -e

ENVIRONMENT=${1:-production}
PLATFORM=${2:-firebase}

echo "🚀 Deploying tabNorder to $PLATFORM ($ENVIRONMENT)"

# Check if environment is valid
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid environments: staging, production"
    exit 1
fi

# Check if platform is valid
if [[ ! "$PLATFORM" =~ ^(firebase|vercel|netlify)$ ]]; then
    echo "❌ Invalid platform: $PLATFORM"
    echo "Valid platforms: firebase, vercel, netlify"
    exit 1
fi

# Build the application
echo "🏗️  Building application for $ENVIRONMENT..."
./scripts/build.sh $ENVIRONMENT

# Deploy based on platform
case $PLATFORM in
    "firebase")
        echo "🔥 Deploying to Firebase..."
        if command -v firebase &> /dev/null; then
            firebase deploy --project=$ENVIRONMENT
        else
            echo "❌ Firebase CLI not found. Please install it first."
            exit 1
        fi
        ;;
    "vercel")
        echo "▲ Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not found. Please install it first."
            exit 1
        fi
        ;;
    "netlify")
        echo "🌐 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist/tabNorder
        else
            echo "❌ Netlify CLI not found. Please install it first."
            exit 1
        fi
        ;;
esac

echo "✅ Deployment completed successfully!"
