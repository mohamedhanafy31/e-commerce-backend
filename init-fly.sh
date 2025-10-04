#!/bin/bash
# Initialize Fly.io app for E-commerce Backend

set -e

echo "🚀 Initializing Fly.io app for E-commerce Backend..."

# Check if fly CLI is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI not found. Please install it:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Create Fly.io app (only if it doesn't exist)
echo "📦 Creating Fly.io app..."
flyctl apps create ecommerce-backend || echo "✅ App already exists"

# Initialize the app configuration
echo "⚙️ Initializing app configuration..."
flyctl launch --no-deploy --name ecommerce-backend || echo "✅ Configuration already exists"

echo "✅ Fly.io app initialized successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./deploy.sh to deploy with Neon database"
echo "2. Or manually set secrets and deploy"
echo ""
echo "🔗 App will be available at: https://ecommerce-backend.fly.dev"
