# Podman Quick Start Guide

This guide provides quick instructions for deploying Everything OpenCode with Podman.

## Prerequisites

- Podman 4.0+ installed
- Git installed
- 4GB+ RAM available

## Quick Deployment

### Option 1: Using the Deployment Script (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/everything-opencode.git
cd everything-opencode

# Make the script executable
chmod +x deploy-podman.sh

# Deploy Everything OpenCode
./deploy-podman.sh
```

The script will:

1. Check Podman installation
2. Build the container image
3. Create network and volume
4. Start the container
5. Verify health check

### Option 2: Manual Deployment

```bash
# Build the image
podman build -t everything-opencode:latest .

# Create network
podman network create everything-opencode-net

# Create volume
podman volume create everything-opencode-data

# Run the container
podman run -d \
  --name everything-opencode \
  --network everything-opencode-net \
  -p 3000:3000 \
  -p 3005:3005 \
  -v everything-opencode-data:/app/data:Z \
  everything-opencode:latest
```

### Option 3: Using Podman Compose

```bash
# Install podman-compose if not already installed
pip3 install podman-compose

# Start all services
podman-compose up -d

# View logs
podman-compose logs -f
```

## Access the Application

Once deployed, access the application at:

- **Main Application**: http://localhost:3000
- **Debug Server**: http://localhost:3005
- **Health Check**: http://localhost:3000/health
- **JavaScript Runner**: http://localhost:4000
- **Python Runner**: http://localhost:4001

## Management Commands

### Using the Script

```bash
# View logs
./deploy-podman.sh logs

# Access container shell
./deploy-podman.sh shell

# Restart container
./deploy-podman.sh restart

# Stop container
./deploy-podman.sh stop

# Check status
./deploy-podman.sh status
```

### Manual Podman Commands

```bash
# View container logs
podman logs -f everything-opencode

# Access container shell
podman exec -it everything-opencode /bin/sh

# View container stats
podman stats everything-opencode

# Stop container
podman stop everything-opencode

# Remove container
podman rm everything-opencode

# View all containers
podman ps -a
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
NODE_ENV=production
DEBUG_ENABLED=true
PORT=3000
DEBUG_PORT=3005
LOG_LEVEL=info
CORS_ORIGIN=*
MAX_FILE_SIZE=10MB
DATABASE_URL=postgresql://opencode:password@postgres:5432/opencode
REDIS_URL=redis://redis:6379
```

### Application Configuration

Create a `config/` directory for configuration files:

```bash
mkdir -p config
```

## Troubleshooting

### Common Issues

1. **Permission denied errors**

   ```bash
   # Fix volume permissions
   podman unshare chown -R 1000:1000 $(pwd)/data
   ```

2. **Port already in use**

   ```bash
   # Check what's using the port
   sudo lsof -i :3000

   # Or use a different port
   podman run -p 3001:3000 ...
   ```

3. **Container won't start**

   ```bash
   # Check logs
   podman logs everything-opencode

   # Run in foreground to see errors
   podman run --rm -p 3000:3000 everything-opencode:latest
   ```

4. **Network issues**

   ```bash
   # Check network configuration
   podman network inspect everything-opencode-net

   # Test container connectivity
   podman exec everything-opencode curl http://google.com
   ```

### Getting Help

- View detailed logs: `podman logs everything-opencode`
- Check container status: `podman inspect everything-opencode`
- Access container shell: `podman exec -it everything-opencode /bin/sh`
- Check system resources: `podman stats`

## Next Steps

1. **Configure the application** in the `config/` directory
2. **Set up database** (PostgreSQL) for persistent storage
3. **Configure Redis** for caching and sessions
4. **Set up Nginx** as a reverse proxy
5. **Configure SSL/TLS** for secure connections
6. **Set up monitoring** with the provided monitoring stack

## Additional Resources

- [Full Podman Deployment Guide](PODMAN-DEPLOYMENT.md)
- [Podman Documentation](https://docs.podman.io/)
- [Podman Compose Documentation](https://github.com/containers/podman-compose)

---

**Note**: For production deployments, refer to the comprehensive [PODMAN-DEPLOYMENT.md](PODMAN-DEPLOYMENT.md) guide for security, monitoring, and scaling considerations.
