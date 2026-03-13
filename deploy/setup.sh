#!/bin/bash

# Initial setup script for Breedly deployment
# Usage: ./setup.sh

set -e

echo "========================================="
echo "Breedly Deployment - Initial Setup"
echo "========================================="

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
    else
        cp .env.example .env
        echo "✅ Created new .env file from template"
    fi
else
    cp .env.example .env
    echo "✅ Created .env file from template"
fi

echo ""
echo "📝 Please edit .env file with your configuration:"
echo "   - POSTGRES_PASSWORD (required)"
echo "   - SECRET_KEY (required, min 32 chars)"
echo "   - GOOGLE_CLIENT_ID (optional)"
echo "   - GOOGLE_CLIENT_SECRET (optional)"
echo ""
read -p "Press Enter to open .env in nano editor (or Ctrl+C to skip)..."
nano .env || vi .env || echo "Please edit .env manually"

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Build and push Docker images:"
echo "   ./build-and-push.sh"
echo ""
echo "2. On your server, set up Cloudflare tunnel:"
echo "   cloudflared tunnel login"
echo "   cloudflared tunnel create breedly-dev"
echo "   cloudflared tunnel route dns breedly-dev dev.breedly.us"
echo "   cloudflared service install"
echo ""
echo "3. Deploy to server:"
echo "   ./deploy.sh"
echo ""
echo "4. Run database migrations:"
echo "   docker-compose exec backend alembic upgrade head"
echo ""
echo "See README.md for detailed instructions"
