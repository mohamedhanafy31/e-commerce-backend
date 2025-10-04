#!/bin/bash
# Railway deployment setup script

echo "🚀 Setting up Railway deployment..."

# Install Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
else
    echo "✅ Railway CLI already installed"
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

echo "🎉 Railway setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: railway deploy"
echo "2. Set environment variables in Railway dashboard"
echo "3. Run: railway run npm run db:migrate:prod"
echo "4. Optional: railway run npm run db:seed"
