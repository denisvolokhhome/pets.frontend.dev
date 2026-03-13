# Harbor Registry Setup Guide

This guide explains how to configure and use your self-hosted Harbor registry for Breedly deployment.

## 📋 Prerequisites

- Harbor registry installed and accessible
- Harbor project created (e.g., `breedly`)
- Harbor credentials (username/password or robot token)

## 🔧 Configuration

### 1. Create Registry Configuration

```bash
cd pets.frontend.dev/deploy
cp registry.env.example registry.env
nano registry.env
```

### 2. Update Registry Configuration

Edit `registry.env` with your Harbor details:

```bash
# Harbor Registry URL (without https://)
REGISTRY_URL=harbor.yourdomain.com

# Harbor Project Name
REGISTRY_PROJECT=breedly

# Harbor Username (or robot account name)
REGISTRY_USERNAME=admin

# Harbor Password or Robot Token
REGISTRY_PASSWORD=your_harbor_password_or_robot_token

# Image Names
BACKEND_IMAGE_NAME=breedly-backend
FRONTEND_IMAGE_NAME=breedly-frontend
```

## 🤖 Using Harbor Robot Accounts (Recommended)

Robot accounts are more secure than using admin credentials.

### Create Robot Account in Harbor:

1. Login to Harbor web UI
2. Go to your project (e.g., `breedly`)
3. Click **Robot Accounts** tab
4. Click **+ NEW ROBOT ACCOUNT**
5. Configure:
   - **Name**: `breedly-deploy`
   - **Expiration**: Set appropriate expiration
   - **Permissions**: 
     - ✅ Push artifact
     - ✅ Pull artifact
6. Click **ADD**
7. **Copy the token** (you won't see it again!)

### Use Robot Account in registry.env:

```bash
REGISTRY_USERNAME=robot$breedly-deploy
REGISTRY_PASSWORD=<copied-robot-token>
```

## 🚀 Build and Push Images

### From Development Machine:

```bash
cd pets.frontend.dev/deploy

# Build and push latest
./build-and-push.sh

# Build and push specific version
./build-and-push.sh v1.0.0
```

This will:
1. Login to Harbor
2. Build backend image
3. Build frontend image
4. Tag images with version and `latest`
5. Push to Harbor registry

## 📥 Deploy on Server

### 1. Setup Registry Configuration on Server

Copy `registry.env` to your server:

```bash
scp registry.env user@server:/path/to/deploy/
```

Or create it directly on the server:

```bash
cd /path/to/deploy
cp registry.env.example registry.env
nano registry.env
```

### 2. Login to Harbor

```bash
./harbor-login.sh
```

### 3. Deploy Application

```bash
./deploy.sh
```

Or manually:

```bash
docker-compose pull
docker-compose up -d
```

## 🔐 Security Best Practices

### 1. Use Robot Accounts
- Create separate robot accounts for CI/CD and deployment
- Set appropriate expiration dates
- Limit permissions to only what's needed

### 2. Protect Credentials
- Never commit `registry.env` to git (it's in `.gitignore`)
- Use environment variables in CI/CD pipelines
- Rotate credentials regularly

### 3. Use HTTPS
- Always use HTTPS for Harbor registry
- Ensure valid SSL certificates

### 4. Image Scanning
- Enable Harbor's vulnerability scanning
- Set policies to prevent pulling vulnerable images

## 🔍 Troubleshooting

### Login Failed

```bash
# Check registry URL (no https:// prefix)
REGISTRY_URL=harbor.yourdomain.com  # ✅ Correct
REGISTRY_URL=https://harbor.yourdomain.com  # ❌ Wrong

# Test login manually
docker login harbor.yourdomain.com -u admin
```

### Cannot Pull Images

```bash
# Ensure you're logged in
./harbor-login.sh

# Check image exists in Harbor
# Visit: https://harbor.yourdomain.com

# Verify image name in docker-compose.yml matches Harbor
docker-compose config | grep image
```

### Permission Denied

```bash
# Check robot account permissions
# In Harbor UI: Project → Robot Accounts → Check permissions

# Ensure robot account has:
# - Pull artifact
# - Push artifact (for build machine)
```

### SSL Certificate Issues

```bash
# For self-signed certificates, add to Docker daemon
sudo mkdir -p /etc/docker/certs.d/harbor.yourdomain.com
sudo cp ca.crt /etc/docker/certs.d/harbor.yourdomain.com/
sudo systemctl restart docker
```

## 📊 Image Management

### List Images

```bash
# In Harbor UI
https://harbor.yourdomain.com → Projects → breedly → Repositories

# Via Docker CLI
docker images | grep harbor.yourdomain.com
```

### Pull Specific Version

```bash
docker pull harbor.yourdomain.com/breedly/breedly-backend:v1.0.0
docker pull harbor.yourdomain.com/breedly/breedly-frontend:v1.0.0
```

### Clean Old Images

```bash
# In Harbor UI: Set retention policies
# Projects → breedly → Policy → Tag Retention

# Example: Keep last 10 tags, delete older
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push to Harbor

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Login to Harbor
        run: |
          echo "${{ secrets.HARBOR_PASSWORD }}" | docker login ${{ secrets.HARBOR_URL }} -u ${{ secrets.HARBOR_USERNAME }} --password-stdin
      
      - name: Build and Push
        run: |
          cd pets.frontend.dev/deploy
          export REGISTRY_URL=${{ secrets.HARBOR_URL }}
          export REGISTRY_PROJECT=breedly
          export REGISTRY_USERNAME=${{ secrets.HARBOR_USERNAME }}
          export REGISTRY_PASSWORD=${{ secrets.HARBOR_PASSWORD }}
          export BACKEND_IMAGE_NAME=breedly-backend
          export FRONTEND_IMAGE_NAME=breedly-frontend
          ./build-and-push.sh
```

## 📝 Quick Reference

### Build and Push
```bash
./build-and-push.sh              # Build and push latest
./build-and-push.sh v1.0.0       # Build and push version
```

### Server Deployment
```bash
./harbor-login.sh                # Login to Harbor
./deploy.sh                      # Deploy application
docker-compose pull              # Pull latest images
docker-compose up -d             # Start services
```

### Image URLs
```
Backend:  harbor.yourdomain.com/breedly/breedly-backend:latest
Frontend: harbor.yourdomain.com/breedly/breedly-frontend:latest
```

## 🆘 Support

For Harbor-specific issues:
- [Harbor Documentation](https://goharbor.io/docs/)
- [Harbor GitHub](https://github.com/goharbor/harbor)

For deployment issues, see `README.md`
