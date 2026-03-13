# Insecure Registry Setup (HTTP Harbor)

Since your Harbor registry is using HTTP (not HTTPS) at `http://192.168.68.110`, you need to configure Docker to allow insecure registries.

## ⚠️ Important Notes

- This configuration is for **local/development** environments only
- For production, always use HTTPS with valid SSL certificates
- Insecure registries transmit credentials and images unencrypted

## 🔧 Configure Docker for Insecure Registry

### macOS (Docker Desktop)

1. **Open Docker Desktop**
2. Click **Settings** (gear icon)
3. Go to **Docker Engine**
4. Add to the JSON configuration:

```json
{
  "insecure-registries": [
    "192.168.68.110:80"
  ]
}
```

5. Click **Apply & Restart**

### Linux

1. **Edit Docker daemon configuration:**

```bash
sudo nano /etc/docker/daemon.json
```

2. **Add insecure registry:**

```json
{
  "insecure-registries": [
    "192.168.68.110:80"
  ]
}
```

3. **Restart Docker:**

```bash
sudo systemctl restart docker
```

### Windows (Docker Desktop)

1. **Open Docker Desktop**
2. Click **Settings** (gear icon)
3. Go to **Docker Engine**
4. Add to the JSON configuration:

```json
{
  "insecure-registries": [
    "192.168.68.110:80"
  ]
}
```

5. Click **Apply & Restart**

## ✅ Verify Configuration

### Test Docker Login

```bash
docker login 192.168.68.110:80
```

Enter your Harbor credentials:
- Username: `admin` (or your Harbor username)
- Password: Your Harbor password

### Test Image Pull

```bash
# Try pulling a test image (if one exists)
docker pull 192.168.68.110:80/library/hello-world
```

## 🚀 Build and Push to Harbor

Once Docker is configured:

```bash
cd pets.frontend.dev/deploy

# Build and push images
./build-and-push.sh
```

## 🔍 Troubleshooting

### Error: "http: server gave HTTP response to HTTPS client"

This means Docker is not configured for insecure registry.

**Solution:** Add `192.168.68.110:80` to insecure-registries in Docker daemon config.

### Error: "unauthorized: authentication required"

**Solution:** Login to Harbor first:

```bash
docker login 192.168.68.110:80
# Enter username and password
```

### Error: "connection refused"

**Possible causes:**
1. Harbor is not running
2. Wrong IP address
3. Firewall blocking port 80

**Check Harbor status:**

```bash
# Ping the server
ping 192.168.68.110

# Check if Harbor is accessible
curl http://192.168.68.110
```

### Error: "denied: requested access to the resource is denied"

**Solution:** 
1. Ensure the project `breedly` exists in Harbor
2. Check user has push permissions
3. Verify project is public or user is a member

## 📋 Harbor Project Setup

### Create Project in Harbor

1. **Login to Harbor UI:**
   - Open browser: `http://192.168.68.110`
   - Login with admin credentials

2. **Create Project:**
   - Click **+ NEW PROJECT**
   - Project Name: `breedly`
   - Access Level: Choose **Private** or **Public**
   - Click **OK**

3. **Verify Project:**
   - You should see `breedly` in the projects list

## 🔐 Security Recommendations

### For Local Development

Current setup is fine for local development on your network.

### For Production Deployment

If you plan to use this in production:

1. **Enable HTTPS on Harbor:**
   - Get SSL certificate (Let's Encrypt or self-signed)
   - Configure Harbor with HTTPS
   - Update `REGISTRY_URL` to use domain name

2. **Remove insecure-registries:**
   - Once HTTPS is enabled, remove from Docker config
   - Restart Docker

3. **Use Robot Accounts:**
   - Create robot accounts instead of using admin
   - Set appropriate permissions
   - Use tokens instead of passwords

## 📝 Quick Reference

### Docker Daemon Config Location

- **macOS**: Docker Desktop → Settings → Docker Engine
- **Linux**: `/etc/docker/daemon.json`
- **Windows**: Docker Desktop → Settings → Docker Engine

### Required Configuration

```json
{
  "insecure-registries": ["192.168.68.110:80"]
}
```

### Test Commands

```bash
# Login
docker login 192.168.68.110:80

# Build and push
cd pets.frontend.dev/deploy
./build-and-push.sh

# Pull images
docker pull 192.168.68.110:80/breedly/breedly-backend:latest
docker pull 192.168.68.110:80/breedly/breedly-frontend:latest
```

## 🆘 Need Help?

If you encounter issues:

1. Check Docker daemon is running: `docker ps`
2. Verify insecure-registries config: `docker info | grep -A 5 "Insecure Registries"`
3. Check Harbor is accessible: `curl http://192.168.68.110:80`
4. Review Harbor logs if needed

For more details, see `HARBOR_SETUP.md`
