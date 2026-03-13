# Breedly Deployment - Quick Reference

## 🚀 Quick Start (3 Steps)

```bash
# 1. Setup environment
./setup.sh

# 2. Build and push images
./build-and-push.sh

# 3. Deploy on server
./deploy.sh
```

## 📁 File Locations

```
pets.backend.dev/deploy/
├── Dockerfile          # Backend image
└── .dockerignore       # Backend exclusions

pets.frontend.dev/deploy/
├── Dockerfile          # Frontend image
├── docker-compose.yml  # Stack definition
├── nginx-proxy.conf    # Reverse proxy
├── .env               # Your secrets (not in git)
├── setup.sh           # Initial setup
├── build-and-push.sh  # Build & push
└── deploy.sh          # Deploy
```

## 🔑 Essential Commands

### Development Machine

```bash
cd pets.frontend.dev/deploy

# First time setup
./setup.sh

# Build and push new version
./build-and-push.sh

# Build specific version
./build-and-push.sh v1.2.3
```

### Server

```bash
cd pets.frontend.dev/deploy

# Deploy latest
./deploy.sh

# Or manually
docker-compose pull
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart service
docker-compose restart backend

# Stop everything
docker-compose down
```

### Database

```bash
# Migrations
docker-compose exec backend alembic upgrade head

# Backup
docker-compose exec postgres pg_dump -U breedly_user breedly_db > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U breedly_user breedly_db < backup.sql
```

## 🌐 URLs

- **Application**: http://dev.breedly.us
- **API**: http://dev.breedly.us/api
- **Health**: http://dev.breedly.us/health

## 🔍 Troubleshooting

```bash
# Check all logs
docker-compose logs -f

# Check specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
docker-compose logs postgres

# Check health
docker-compose ps
curl http://localhost/health

# Restart everything
docker-compose restart

# Nuclear option (reset everything)
docker-compose down -v
docker-compose pull
docker-compose up -d
```

## 📊 Service Ports

- **Nginx**: 80 (external), 443 (HTTPS ready)
- **Backend**: 8000 (internal only)
- **Frontend**: 80 (internal only)
- **Postgres**: 5432 (internal only)

## 🔐 Environment Variables

Required in `.env`:
- `POSTGRES_PASSWORD` - Database password
- `SECRET_KEY` - Backend secret (32+ chars)

Optional:
- `GOOGLE_CLIENT_ID` - OAuth
- `GOOGLE_CLIENT_SECRET` - OAuth
- `DEBUG` - Set to false in production

## 🐳 Docker Hub

- **Username**: denisvolokhhome
- **Backend Image**: denisvolokhhome/breedly-backend
- **Frontend Image**: denisvolokhhome/breedly-frontend

## ☁️ Cloudflare Tunnel

```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Setup
cloudflared tunnel login
cloudflared tunnel create breedly-dev
cloudflared tunnel route dns breedly-dev dev.breedly.us

# Run as service
cloudflared service install
```

## 📞 Quick Help

| Issue | Command |
|-------|---------|
| Can't access site | `docker-compose logs nginx` |
| API errors | `docker-compose logs backend` |
| Database issues | `docker-compose logs postgres` |
| Frontend not loading | `docker-compose logs frontend` |
| Need to restart | `docker-compose restart` |
| Complete reset | `docker-compose down -v && docker-compose up -d` |

## 📚 Full Documentation

See `README.md` for complete documentation.
