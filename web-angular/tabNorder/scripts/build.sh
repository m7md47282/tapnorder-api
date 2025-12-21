#!/bin/bash

# Build script for tabNorder Angular application
# Usage: ./scripts/build.sh [environment]
# Environments: development, staging, production, test

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="tabNorder"

echo "🚀 Building tabNorder for environment: $ENVIRONMENT"

# Check if environment is valid
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production|test)$ ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid environments: development, staging, production, test"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test -- --watch=false --browsers=ChromeHeadless

# Build the application
echo "🏗️  Building application for $ENVIRONMENT..."
npm run build -- --configuration=$ENVIRONMENT

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Output directory: dist/$PROJECT_NAME"
    
    # Display build size
    if [ -d "dist/$PROJECT_NAME" ]; then
        echo "📊 Build size:"
        du -sh dist/$PROJECT_NAME
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
