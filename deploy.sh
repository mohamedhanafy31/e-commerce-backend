#!/bin/bash
# Deployment script for Fly.io

set -e

echo "🚀 Starting deployment to Fly.io..."

# Check if fly CLI is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI not found. Please install it: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Login check
echo "🔐 Checking Fly.io login status..."
if ! flyctl auth whoami &> /dev/null; then
    echo "🔑 Please log in to Fly.io:"
    flyctl auth login
fi

# Set Neon database URL
echo "🗄️ Setting up Neon database connection..."
flyctl secrets set DATABASE_URL="postgresql://neondb_owner:npg_RM2zV7FJnOtv@ep-small-mountain-agpzm0ka-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Generate a secure JWT secret if not set
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-super-secure-jwt-secret-change-me-$(date +%s)")
flyctl secrets set JWT_SECRET="$JWT_SECRET"

# Set other environment variables
flyctl secrets set \
    NODE_ENV="production" \
    PORT="8080" \
    ALLOWED_ORIGINS="https://your-frontend-domain.com" \
    JWT_EXPIRES_HOURS="24" \
    RATE_LIMIT="1000/minute" \
    BCRYPT_ROUNDS="12"

echo "✅ Environment variables set successfully"

# Copy Dockerfile for Fly deployment
cp Dockerfile.fly Dockerfile

# Deploy the application
echo "🚀 Deploying to Fly.io..."
flyctl deploy --remote-only

# Restore original Dockerfile
cp Dockerfile Dockerfile.bak

echo "🎉 Deployment completed successfully!"
echo "🔗 Your app should be available at: https://ecommerce-backend.fly.dev"
echo "💊 Health check: https://ecommerce-backend.fly.dev/health"
echo "📚 API docs: https://ecommerce-backend.fly.dev/api/v1"
