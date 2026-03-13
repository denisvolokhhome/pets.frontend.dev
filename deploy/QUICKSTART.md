# Breedly Deployment - Quick Start Guide

Quick setup guide for deploying Breedly with local Harbor registry at `192.168.68.110`.

## 🚀 Step 1: Configure Docker for Insecure Registry

Since Harbor is using HTTP, configure Docker:

### macOS/Windows (Docker Desktop)
1. Open Docker Desktop → Settings → Docker Engine
2. Add this configuration:
```json
{
  "insecure-registries": ["192.168.68.110:80"]
}
```
3. Click **Apply & Restart**

### Linux
```bash
sudo nano /etc/docker/daemon.json
```
Add:
```json
{
  "insecure-registries": ["192.168.68.110:80"]
}
```
Then restart:
```bash
sudo systemctl restart docker
```

## 🔐 Step 2: Create Harbor Project

1. Open Harbor UI: `http://192.168.68.110:80`
2. Login with admin credentials
3. Click **+ NEW PROJECT**
4. Name: `breedly`
5. Click **OK**

## 🏗️ Step 3: Build and Push Images

```bash
cd pets.frontend.dev/deploy

# Registry config is already set in registry.env
# Update password if needed:
nano registry.env

# Build and push
./build-and-push.sh
```

This will:
- Login to Harbor at 192.168.68.110
- Build backend and frontend images
- Push to Harbor registry

## 📦 Step 4: Configure Environment

```bash
# Edit environment variables
nano .env
```

Update these required values:
```bash
POSTGRES_PASSWORD=your_secure_password
SECRET_KEY=your-secret-key-32-chars-minimum
```

## 🚀 Step 5: Deploy on Server

### On the deployment server:

```bash
# 1. Configure Docker for insecure registry (same as Step 1)

# 2. Copy deployment files to server
scp -r pets.frontend.dev/deploy user@server:/path/to/

# 3. SSH to server
ssh user@server
cd /path/to/deploy

# 4. Login to Harbor
./harbor-login.sh

# 5. Deploy
./deploy.sh
```

## ✅ Step 6: Verify Deployment

```bash
# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Test application
curl http://localhost/health
```

## 🌐 Step 7: Setup Cloudflare Tunnel

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared  # macOS
# or download from https://github.com/cloudflare/cloudflared/releases

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create breedly-dev

# Configure tunnel
nano ~/.cloudflared/config.yml
```

Add:
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /path/to/<TUNNEL-ID>.json

ingress:
  - hostname: dev.breedly.us
    service: http://localhost:80
  - service: http_status:404
```

```bash
# Route DNS
cloudflared tunnel route dns breedly-dev dev.breedly.us

# Run tunnel
cloudflared tunnel run breedly-dev

# Or install as service
cloudflared service install
```

## 📊 Image URLs

Your images will be at:
- Backend: `192.168.68.110:80/breedly/breedly-backend:latest`
- Frontend: `192.168.68.110:80/breedly/breedly-frontend:latest`

## 🔧 Common Commands

```bash
# Build and push new version
./build-and-push.sh v1.0.0

# Deploy latest
./deploy.sh

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart service
docker-compose restart backend

# Stop everything
docker-compose down

# Database migrations
docker-compose exec backend alembic upgrade head
```

## 🐛 Troubleshooting

### "http: server gave HTTP response to HTTPS client"
→ Add `192.168.68.110:80` to Docker's insecure-registries

### "unauthorized: authentication required"
→ Run `./harbor-login.sh`

### "connection refused"
→ Check Harbor is running: `curl http://192.168.68.110:80`

### "denied: requested access to the resource is denied"
→ Ensure `breedly` project exists in Harbor

## 📚 More Information

- **Insecure Registry Setup**: See `INSECURE_REGISTRY_SETUP.md`
- **Harbor Details**: See `HARBOR_SETUP.md`
- **Full Documentation**: See `README.md`

## ✨ You're Ready!

Your deployment setup is complete. Just follow the steps above to build, push, and deploy your application!
