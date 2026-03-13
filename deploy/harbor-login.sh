#!/bin/bash

# Login to Harbor Registry
# Usage: ./harbor-login.sh

set -e

# Load registry configuration
if [ ! -f registry.env ]; then
    echo "❌ Error: registry.env file not found!"
    echo "Please copy registry.env.example to registry.env and configure it."
    exit 1
fi

source registry.env

echo "========================================="
echo "Logging in to Harbor Registry"
echo "Registry: ${REGISTRY_URL}"
echo "Username: ${REGISTRY_USERNAME}"
echo "========================================="

echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY_URL} -u ${REGISTRY_USERNAME} --password-stdin

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully logged in to Harbor registry"
    echo ""
    echo "You can now pull images:"
    echo "  docker-compose pull"
else
    echo ""
    echo "❌ Failed to login to Harbor registry"
    exit 1
fi
