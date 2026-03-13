#!/bin/bash

# Quick deployment script for server
# Usage: ./deploy.sh

set -e

echo "========================================="
echo "Deploying Breedly Application"
echo "========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Pull latest images
echo ""
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Show logs
echo ""
echo "📝 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Access your application at: http://dev.breedly.us"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose logs -f"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Status:       docker-compose ps"
