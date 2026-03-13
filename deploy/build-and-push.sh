#!/bin/bash

# Build and Push Docker Images to Harbor Registry
# Usage: ./build-and-push.sh [version]

set -e

# Load registry configuration
if [ ! -f registry.env ]; then
    echo "❌ Error: registry.env file not found!"
    echo "Please copy registry.env.example to registry.env and configure it."
    exit 1
fi

source registry.env

VERSION=${1:-latest}
BACKEND_IMAGE="${REGISTRY_URL}/${REGISTRY_PROJECT}/${BACKEND_IMAGE_NAME}"
FRONTEND_IMAGE="${REGISTRY_URL}/${REGISTRY_PROJECT}/${FRONTEND_IMAGE_NAME}"

echo "========================================="
echo "Building and Pushing Breedly Docker Images"
echo "Registry: ${REGISTRY_URL}"
echo "Project: ${REGISTRY_PROJECT}"
echo "Version: ${VERSION}"
echo "========================================="

# Login to Harbor
echo ""
echo "Logging in to Harbor registry..."
echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY_URL} -u ${REGISTRY_USERNAME} --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ Failed to login to Harbor registry"
    exit 1
fi

# Build Backend
echo ""
echo "Building Backend Image..."
cd ../../pets.backend.dev
docker build -f deploy/Dockerfile -t ${BACKEND_IMAGE}:${VERSION} .
docker tag ${BACKEND_IMAGE}:${VERSION} ${BACKEND_IMAGE}:latest

# Push Backend
echo ""
echo "Pushing Backend Image..."
docker push ${BACKEND_IMAGE}:${VERSION}
docker push ${BACKEND_IMAGE}:latest

# Build Frontend
echo ""
echo "Building Frontend Image..."
cd ../pets.frontend.dev
docker build -f deploy/Dockerfile -t ${FRONTEND_IMAGE}:${VERSION} .
docker tag ${FRONTEND_IMAGE}:${VERSION} ${FRONTEND_IMAGE}:latest

# Push Frontend
echo ""
echo "Pushing Frontend Image..."
docker push ${FRONTEND_IMAGE}:${VERSION}
docker push ${FRONTEND_IMAGE}:latest

echo ""
echo "========================================="
echo "✅ Build and Push Complete!"
echo "========================================="
echo "Backend: ${BACKEND_IMAGE}:${VERSION}"
echo "Frontend: ${FRONTEND_IMAGE}:${VERSION}"
echo ""
echo "To deploy, run: docker-compose pull && docker-compose up -d"
