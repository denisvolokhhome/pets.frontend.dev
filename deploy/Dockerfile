# Multi-stage build for Angular frontend
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files from parent directory
COPY ../package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application code from parent directory
COPY ../ .

# Build the application
RUN npm run build -- --configuration production

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config from deploy folder
COPY deploy/nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist/pets.frontend.dev /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
