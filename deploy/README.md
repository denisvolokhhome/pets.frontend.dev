# Breedly Docker Deployment Guide

Complete Docker deployment setup for Breedly application with FastAPI backend, Angular frontend, PostgreSQL database, and Nginx reverse proxy.

## 📁 Project Structure

```
pets.backend.dev/
└── deploy/
    ├── Dockerfile          # Backend Docker image
    └── .dockerignore       # Backend build exclusions

pets.frontend.dev/
└── deploy/
    ├── Dockerfile          # Frontend Docker image
    ├── .dockerignore       # Frontend build exclusions
    ├── docker-compose.yml  # Complete stack orchestration
    ├── nginx.conf          # Frontend nginx config
    ├── nginx-proxy.conf    # Main reverse proxy config
    ├── .env.example        # Environment variables template
    ├── build-and-push.sh   # Build and push script
    └── README.md           # This file
```

## 🚀 Quick Start

### 1. Initial Setup

```bash
cd pets.frontend.dev/deploy

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

### 2. Build and Push Images

```bash
# Make script executable
chmod +x build-and-push.sh

# Build and push to Docker Hub
./build-and-push.sh

# Or with specific version
./build-and-push.sh v1.0.0
```

### 3. Deploy on Server

```bash
# Pull latest images
docker-compose pull

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Database
POSTGRES_PASSWORD=your_secure_postgres_password

# Backend Security
SECRET_KEY=your-secret-key-minimum-32-characters-long

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Environment
DEBUG=false
```

### Cloudflare Tunnel Setup

1. Install cloudflared on your server:
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

2. Authenticate:
```bash
cloudflared tunnel login
```

3. Create tunnel:
```bash
cloudflared tunnel create breedly-dev
```

4. Configure tunnel (create `~/.cloudflared/config.yml`):
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /Users/denis.volokh/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: dev.breedly.us
    service: http://localhost:80
  - service: http_status:404
```

5. Route DNS:
```bash
cloudflared tunnel route dns breedly-dev dev.breedly.us
```

6. Run tunnel:
```bash
cloudflared tunnel run breedly-dev
```

Or as a service:
```bash
cloudflared service install
```

## 🐳 Docker Commands

### Build Images Manually

```bash
# Backend
cd pets.backend.dev
docker build -f deploy/Dockerfile -t denisvolokhhome/breedly-backend:latest .

# Frontend
cd pets.frontend.dev
docker build -f deploy/Dockerfile -t denisvolokhhome/breedly-frontend:latest .
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Execute commands in container
docker-compose exec backend bash
docker-compose exec postgres psql -U breedly_user -d breedly_db

# Remove everything including volumes
docker-compose down -v
```

### Database Management

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Backup database
docker-compose exec postgres pg_dump -U breedly_user breedly_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U breedly_user breedly_db < backup.sql
```

## 🔍 Troubleshooting

### Check Service Health

```bash
# All services
docker-compose ps

# Specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f
```

### Common Issues

1. **Backend won't start**
   - Check database connection: `docker-compose logs postgres`
   - Verify environment variables in `.env`
   - Check backend logs: `docker-compose logs backend`

2. **Frontend not accessible**
   - Check nginx logs: `docker-compose logs nginx`
   - Verify nginx config: `docker-compose exec nginx nginx -t`
   - Check frontend logs: `docker-compose logs frontend`

3. **Database connection issues**
   - Ensure postgres is healthy: `docker-compose ps postgres`
   - Check DATABASE_URL in backend environment
   - Verify postgres logs: `docker-compose logs postgres`

4. **Images not pulling**
   - Login to Docker Hub: `docker login -u denisvolokhhome`
   - Pull manually: `docker pull denisvolokhhome/breedly-backend:latest`

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images
docker rmi denisvolokhhome/breedly-backend:latest
docker rmi denisvolokhhome/breedly-frontend:latest

# Start fresh
docker-compose pull
docker-compose up -d
```

## 📊 Monitoring

### Health Checks

All services have health checks configured:

- **Backend**: `http://localhost:8000/health`
- **Frontend**: `http://localhost/`
- **Nginx**: `http://localhost/health`
- **Postgres**: `pg_isready`

### View Health Status

```bash
docker-compose ps
```

## 🔐 Security Notes

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Change default passwords** - Update POSTGRES_PASSWORD and SECRET_KEY
3. **Use strong SECRET_KEY** - Minimum 32 characters
4. **Keep images updated** - Regularly rebuild and push new versions
5. **Backup database regularly** - Use pg_dump for backups

## 📝 Deployment Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Update all environment variables in `.env`
- [ ] Build and push Docker images
- [ ] Configure Cloudflare tunnel
- [ ] Pull images on server
- [ ] Start services with docker-compose
- [ ] Run database migrations
- [ ] Verify all services are healthy
- [ ] Test application access via dev.breedly.us
- [ ] Set up database backups
- [ ] Configure monitoring/alerts

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: Review `.env` and `docker-compose.yml`
3. Check service health: `docker-compose ps`
4. Review this README for common solutions

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Angular Documentation](https://angular.io/docs)
