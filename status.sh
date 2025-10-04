#!/bin/bash
# Status check script for Fly.io deployment

echo "🔍 Checking Fly.io deployment status..."

# Check if fly CLI is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI not installed. Install with: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check login status
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged into Fly.io. Run: flyctl auth login"
    exit 1
fi

echo "✅ Fly CLI installed and logged in"

# Check app status
echo "📱 App Status:"
flyctl status --app ecommerce-backend || echo "❌ App not found or not deployed"

# Check health endpoint
echo ""
echo "🏥 Health Check:"
curl -s https://ecommerce-backend.fly.dev/health || echo "❌ Health endpoint not accessible"

echo ""
echo "📊 Deployment Info:"
flyctl info --app ecommerce-backend || echo "❌ App info not available"

echo ""
echo "🪵 Recent Logs (last 10 lines):"
flyctl logs --app ecommerce-backend --lines 10 || echo "❌ Unable to fetch logs"
