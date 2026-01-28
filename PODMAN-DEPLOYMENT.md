# Podman Deployment Guide for Everything OpenCode

This guide provides comprehensive instructions for deploying Everything OpenCode using Podman, a daemonless container engine that provides a Docker-compatible CLI.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Podman Installation](#podman-installation)
4. [Building Container Images](#building-container-images)
5. [Running Containers](#running-containers)
6. [Podman Compose](#podman-compose)
7. [Production Deployment](#production-deployment)
8. [Networking](#networking)
9. [Storage & Volumes](#storage--volumes)
10. [Security](#security)
11. [Monitoring](#monitoring)
12. [Troubleshooting](#troubleshooting)
13. [Migration from Docker](#migration-from-docker)

## Prerequisites

### System Requirements

- **OS**: Linux (recommended), macOS, or Windows with WSL2
- **Podman**: Version 4.0+ (recommended)
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 10GB+ free space

### Required Tools

```bash
# Check if tools are installed
podman --version
podman-compose --version  # Optional but recommended
buildah --version         # For building images
```

## Quick Start

### 1. Clone and Build

```bash
# Clone the repository
git clone https://github.com/your-org/everything-opencode.git
cd everything-opencode

# Build the container image
podman build -t everything-opencode:latest .

# Run the container
podman run -d \
  --name everything-opencode \
  -p 3000:3000 \
  -p 3005:3005 \
  everything-opencode:latest
```

### 2. Verify Deployment

```bash
# Check container status
podman ps

# View logs
podman logs everything-opencode

# Test health endpoint
curl http://localhost:3000/health
```

## Podman Installation

### Linux (Ubuntu/Debian)

```bash
# Ubuntu 22.04+
sudo apt update
sudo apt install -y podman podman-docker podman-compose

# Enable user namespace (optional but recommended)
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER

# Configure storage (if using rootless)
mkdir -p ~/.config/containers
cat > ~/.config/containers/storage.conf << EOF
[storage]
driver = "overlay"
runroot = "/run/user/$(id -u)/containers"
graphroot = "$HOME/.local/share/containers/storage"
EOF
```

### macOS

```bash
# Install using Homebrew
brew install podman

# Initialize Podman machine
podman machine init
podman machine start

# Set environment variables
eval $(podman machine env)
```

### Windows (WSL2)

```bash
# Install in WSL2 (Ubuntu)
sudo apt update
sudo apt install -y podman podman-docker

# Configure for WSL2
sudo sh -c "echo 'user.max_user_namespaces=28633' > /etc/sysctl.d/99-podman.conf"
sudo sysctl -p /etc/sysctl.d/99-podman.conf
```

## Building Container Images

### Single Image Build

```bash
# Build from Dockerfile
podman build -t everything-opencode:latest .

# Build with specific platform
podman build --platform linux/amd64 -t everything-opencode:amd64 .

# Build with build arguments
podman build \
  --build-arg NODE_ENV=production \
  --build-arg NPM_TOKEN=your-token \
  -t everything-opencode:prod .
```

### Multi-Architecture Builds

```bash
# Create multi-arch manifest
podman manifest create everything-opencode:multi

# Build for different architectures
podman build --arch amd64 -t everything-opencode:amd64 .
podman build --arch arm64 -t everything-opencode:arm64 .

# Add to manifest
podman manifest add everything-opencode:multi everything-opencode:amd64
podman manifest add everything-opencode:multi everything-opencode:arm64

# Push manifest
podman manifest push everything-opencode:multi docker://your-registry/everything-opencode:latest
```

### Using Buildah (Alternative)

```bash
# Build with Buildah
buildah bud -t everything-opencode:latest .

# Multi-stage build optimization
buildah bud --target builder -t everything-opencode:builder .
buildah bud --target production -t everything-opencode:prod .
```

## Running Containers

### Basic Container

```bash
# Run in foreground
podman run -it --rm everything-opencode:latest

# Run in background
podman run -d \
  --name everything-opencode \
  -p 3000:3000 \
  -p 3005:3005 \
  everything-opencode:latest

# Run with environment variables
podman run -d \
  --name everything-opencode \
  -e NODE_ENV=production \
  -e DEBUG_ENABLED=false \
  -p 3000:3000 \
  everything-opencode:latest
```

### Container with Volumes

```bash
# Create volume
podman volume create everything-opencode-data

# Run with volume
podman run -d \
  --name everything-opencode \
  -v everything-opencode-data:/app/data \
  -v $(pwd)/config:/app/config:ro \
  -p 3000:3000 \
  everything-opencode:latest

# Bind mount local directory
podman run -d \
  --name everything-opencode-dev \
  -v $(pwd):/app:Z \
  -p 3000:3000 \
  everything-opencode:latest
```

### Container Networking

```bash
# Create custom network
podman network create everything-opencode-net

# Run containers on custom network
podman run -d \
  --name everything-opencode \
  --network everything-opencode-net \
  -p 3000:3000 \
  everything-opencode:latest

podman run -d \
  --name postgres \
  --network everything-opencode-net \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  docker.io/postgres:15
```

## Podman Compose

### Installation

```bash
# Install podman-compose
pip3 install podman-compose

# Or using package manager
sudo apt install podman-compose  # Ubuntu/Debian
brew install podman-compose      # macOS
```

### Basic Compose File

Create `podman-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: everything-opencode:latest
    container_name: everything-opencode
    ports:
      - '3000:3000'
      - '3005:3005'
    environment:
      - NODE_ENV=production
      - DEBUG_ENABLED=true
    volumes:
      - everything-opencode-data:/app/data
    networks:
      - everything-opencode-net

  postgres:
    image: docker.io/postgres:15
    container_name: postgres
    environment:
      - POSTGRES_DB=opencode
      - POSTGRES_USER=opencode
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - everything-opencode-net

  redis:
    image: docker.io/redis:7-alpine
    container_name: redis
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - everything-opencode-net

volumes:
  everything-opencode-data:
  postgres-data:
  redis-data:

networks:
  everything-opencode-net:
    driver: bridge
```

### Using Compose

```bash
# Start all services
podman-compose up -d

# View logs
podman-compose logs -f

# Stop services
podman-compose down

# Rebuild and restart
podman-compose up -d --build

# Scale services
podman-compose up -d --scale app=3
```

### Production Compose

Create `podman-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: everything-opencode-prod
    restart: unless-stopped
    ports:
      - '3000:3000'
      - '3005:3005'
    environment:
      - NODE_ENV=production
      - DEBUG_ENABLED=false
      - DATABASE_URL=postgresql://opencode:${DB_PASSWORD}@postgres:5432/opencode
      - REDIS_URL=redis://redis:6379
    volumes:
      - everything-opencode-data:/app/data
      - ./logs:/app/logs:Z
    networks:
      - everything-opencode-net
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: docker.io/postgres:15-alpine
    container_name: postgres-prod
    restart: unless-stopped
    environment:
      - POSTGRES_DB=opencode
      - POSTGRES_USER=opencode
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres-backups:/backups:Z
    networks:
      - everything-opencode-net
    command: >
      postgres -c max_connections=100
               -c shared_buffers=256MB
               -c effective_cache_size=1GB

  redis:
    image: docker.io/redis:7-alpine
    container_name: redis-prod
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - everything-opencode-net

  nginx:
    image: docker.io/nginx:alpine
    container_name: nginx-prod
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx:Z
    depends_on:
      - app
    networks:
      - everything-opencode-net

volumes:
  everything-opencode-data:
    driver: local
    driver_opts:
      type: none
      device: ${PWD}/data
      o: bind
  postgres-data:
  redis-data:

networks:
  everything-opencode-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Production Deployment

### Systemd Service Files

Create `/etc/systemd/system/everything-opencode.service`:

```ini
[Unit]
Description=Everything OpenCode Container
After=network.target podman.service
Requires=podman.service

[Service]
Type=notify
NotifyAccess=all
Environment=PODMAN_SYSTEMD_UNIT=%n
Restart=on-failure
TimeoutStopSec=70
ExecStartPre=/bin/rm -f %t/%n.ctr-id
ExecStart=/usr/bin/podman run \
  --cidfile=%t/%n.ctr-id \
  --cgroups=no-conmon \
  --sdnotify=conmon \
  --replace \
  --name everything-opencode \
  --hostname everything-opencode \
  --network host \
  --security-opt label=disable \
  --security-opt seccomp=unconfined \
  --volume everything-opencode-data:/app/data:Z \
  --volume /etc/localtime:/etc/localtime:ro \
  --env-file /etc/everything-opencode/env \
  everything-opencode:latest

ExecStop=/usr/bin/podman stop --ignore --cidfile=%t/%n.ctr-id
ExecStopPost=/usr/bin/podman rm -f --ignore --cidfile=%t/%n.ctr-id
PIDFile=%t/%n.pid

[Install]
WantedBy=default.target
```

### Environment File

Create `/etc/everything-opencode/env`:

```bash
NODE_ENV=production
DEBUG_ENABLED=false
PORT=3000
DEBUG_PORT=3005
DATABASE_URL=postgresql://opencode:${DB_PASSWORD}@localhost:5432/opencode
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
CORS_ORIGIN=https://your-domain.com
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
```

### Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

# Configuration
IMAGE_NAME="everything-opencode"
IMAGE_TAG="latest"
REGISTRY="your-registry.io"
CONTAINER_NAME="everything-opencode"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of Everything OpenCode${NC}"

# Pull latest image
echo -e "${YELLOW}Pulling latest image...${NC}"
podman pull ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

# Stop existing container
if podman ps -a --format "{{.Names}}" | grep -q ${CONTAINER_NAME}; then
    echo -e "${YELLOW}Stopping existing container...${NC}"
    podman stop ${CONTAINER_NAME} || true
    podman rm ${CONTAINER_NAME} || true
fi

# Run new container
echo -e "${YELLOW}Starting new container...${NC}"
podman run -d \
    --name ${CONTAINER_NAME} \
    --restart unless-stopped \
    --network host \
    --security-opt label=disable \
    --volume everything-opencode-data:/app/data:Z \
    --volume /etc/localtime:/etc/localtime:ro \
    --env-file /etc/everything-opencode/env \
    ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

# Wait for container to start
echo -e "${YELLOW}Waiting for container to start...${NC}"
sleep 10

# Check container status
if podman ps --format "{{.Names}} {{.Status}}" | grep -q "${CONTAINER_NAME} Up"; then
    echo -e "${GREEN}✅ Container started successfully${NC}"

    # Test health endpoint
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Container failed to start${NC}"
    podman logs ${CONTAINER_NAME}
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully${NC}"
```

### Health Monitoring

Create `health-check.sh`:

```bash
#!/bin/bash

CONTAINER_NAME="everything-opencode"
HEALTH_URL="http://localhost:3000/health"
MAX_RETRIES=3
RETRY_DELAY=5

check_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_URL})
    if [ "$response" -eq 200 ]; then
        echo "OK"
        return 0
    else
        echo "FAILED (HTTP $response)"
        return 1
    fi
}

restart_container() {
    echo "Restarting container..."
    podman restart ${CONTAINER_NAME}
    sleep 10
}

# Main health check loop
for i in $(seq 1 ${MAX_RETRIES}); do
    echo "Health check attempt $i/$MAX_RETRIES..."

    if check_health; then
        echo "Container is healthy"
        exit 0
    fi

    if [ $i -lt ${MAX_RETRIES} ]; then
        echo "Health check failed, retrying in ${RETRY_DELAY} seconds..."
        sleep ${RETRY_DELAY}
    fi
done

echo "Health check failed after ${MAX_RETRIES} attempts"
restart_container
exit 1
```

## Networking

### Port Forwarding

```bash
# Map container ports to host
podman run -d \
  --name everything-opencode \
  -p 3000:3000 \
  -p 3005:3005 \
  -p 4000:4000 \
  everything-opencode:latest

# Dynamic port mapping
podman run -d \
  --name everything-opencode \
  -p 3000-3010:3000-3010 \
  everything-opencode:latest
```

### Network Configuration

```bash
# List networks
podman network ls

# Inspect network
podman network inspect everything-opencode-net

# Create network with custom subnet
podman network create \
  --subnet 192.168.100.0/24 \
  --gateway 192.168.100.1 \
  everything-opencode-net

# Connect container to network
podman network connect everything-opencode-net everything-opencode

# Disconnect from network
podman network disconnect everything-opencode-net everything-opencode
```

### DNS Configuration

```bash
# Run with custom DNS
podman run -d \
  --name everything-opencode \
  --dns 8.8.8.8 \
  --dns 1.1.1.1 \
  --dns-search example.com \
  everything-opencode:latest

# Use host DNS
podman run -d \
  --name everything-opencode \
  --dns host \
  everything-opencode:latest
```

## Storage & Volumes

### Volume Management

```bash
# Create volume
podman volume create everything-opencode-data

# List volumes
podman volume ls

# Inspect volume
podman volume inspect everything-opencode-data

# Remove volume
podman volume rm everything-opencode-data

# Prune unused volumes
podman volume prune
```

### Bind Mounts

```bash
# Read-only bind mount
podman run -d \
  --name everything-opencode \
  -v /etc/ssl/certs:/etc/ssl/certs:ro \
  everything-opencode:latest

# Read-write bind mount with SELinux context
podman run -d \
  --name everything-opencode \
  -v $(pwd)/data:/app/data:Z \
  everything-opencode:latest

# Multiple bind mounts
podman run -d \
  --name everything-opencode \
  -v $(pwd)/config:/app/config:ro,Z \
  -v $(pwd)/logs:/app/logs:Z \
  -v $(pwd)/data:/app/data:Z \
  everything-opencode:latest
```

### tmpfs Mounts

```bash
# Use tmpfs for temporary files
podman run -d \
  --name everything-opencode \
  --tmpfs /tmp:rw,size=512m,mode=1777 \
  --tmpfs /run:rw,size=128m,mode=1777 \
  everything-opencode:latest
```

## Security

### Rootless Containers

```bash
# Run as non-root user (default in Podman)
podman run -d \
  --name everything-opencode \
  --user 1000:1000 \
  everything-opencode:latest

# Check if running rootless
podman info --format '{{.Host.Security.Rootless}}'
```

### Security Options

```bash
# Run with security options
podman run -d \
  --name everything-opencode \
  --security-opt no-new-privileges \
  --security-opt label=disable \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  everything-opencode:latest

# Read-only root filesystem
podman run -d \
  --name everything-opencode \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /run \
  --tmpfs /var/tmp \
  everything-opencode:latest
```

### SELinux Context

```bash
# Set SELinux context
podman run -d \
  --name everything-opencode \
  --security-opt label=type:container_runtime_t \
  -v $(pwd)/data:/app/data:Z \
  everything-opencode:latest

# Disable SELinux (not recommended)
podman run -d \
  --name everything-opencode \
  --security-opt label=disable \
  everything-opencode:latest
```

### Resource Limits

```bash
# Set resource limits
podman run -d \
  --name everything-opencode \
  --memory 512m \
  --memory-swap 1g \
  --cpus 1.5 \
  --cpu-shares 512 \
  --blkio-weight 100 \
  everything-opencode:latest

# Set ulimits
podman run -d \
  --name everything-opencode \
  --ulimit nofile=1024:1024 \
  --ulimit nproc=2048:2048 \
  everything-opencode:latest
```

## Monitoring

### Container Metrics

```bash
# View container stats
podman stats

# View container resource usage
podman stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Monitor specific container
podman stats everything-opencode
```

### Log Management

```bash
# View logs
podman logs everything-opencode

# Follow logs
podman logs -f everything-opencode

# View logs with timestamps
podman logs --timestamps everything-opencode

# View last N lines
podman logs --tail 100 everything-opencode

# Export logs to file
podman logs everything-opencode > everything-opencode.log
```

### Health Checks

```bash
# Run health check manually
podman healthcheck run everything-opencode

# View health status
podman inspect --format='{{.State.Health.Status}}' everything-opencode

# View health log
podman inspect --format='{{json .State.Health.Log}}' everything-opencode | jq .
```

### System Monitoring

```bash
# Check Podman system info
podman info

# Check system events
podman events

# Check container processes
podman top everything-opencode

# Check container file changes
podman diff everything-opencode
```

## Troubleshooting

### Common Issues

#### Permission Issues

```bash
# Check user mappings
podman unshare cat /proc/self/uid_map
podman unshare cat /proc/self/gid_map

# Fix volume permissions
podman unshare chown -R 1000:1000 /path/to/volume
```

#### Network Issues

```bash
# Check network configuration
podman network inspect everything-opencode-net

# Test container connectivity
podman exec everything-opencode curl -I http://google.com

# Check DNS resolution
podman exec everything-opencode nslookup google.com
```

#### Storage Issues

```bash
# Check storage configuration
podman info --format '{{.Store}}'

# Clean up storage
podman system prune -a

# Reset storage (warning: destructive)
podman system reset
```

### Debug Commands

```bash
# Debug container startup
podman run --rm -it --entrypoint /bin/sh everything-opencode:latest

# Inspect container configuration
podman inspect everything-opencode

# Check container logs with debug level
podman --log-level=debug run --name test everything-opencode:latest

# Export container for analysis
podman export everything-opencode -o container.tar
```

### Performance Issues

```bash
# Check container performance
podman stats --no-stream

# Check host resource usage
top -p $(pgrep -f conmon)

# Check storage performance
podman run --rm -it --volume /tmp:/tmp:Z alpine dd if=/dev/zero of=/tmp/test bs=1M count=100
```

## Migration from Docker

### Command Comparison

| Docker Command   | Podman Equivalent | Notes                          |
| ---------------- | ----------------- | ------------------------------ |
| `docker`         | `podman`          | Direct replacement             |
| `docker-compose` | `podman-compose`  | Requires separate installation |
| `docker build`   | `podman build`    | Compatible                     |
| `docker run`     | `podman run`      | Mostly compatible              |
| `docker ps`      | `podman ps`       | Same output format             |
| `docker images`  | `podman images`   | Same output format             |
| `docker logs`    | `podman logs`     | Same output format             |

### Migration Script

Create `migrate-docker-to-podman.sh`:

```bash
#!/bin/bash

# Stop Docker containers
docker-compose down

# Export Docker volumes
for volume in $(docker volume ls -q | grep everything-opencode); do
    docker run --rm -v $volume:/data -v $(pwd):/backup alpine \
        tar czf /backup/$volume.tar.gz -C /data .
done

# Build with Podman
podman build -t everything-opencode:latest .

# Import volumes to Podman
for volume in $(ls *.tar.gz | grep everything-opencode); do
    vol_name=$(echo $volume | sed 's/.tar.gz//')
    podman volume create $vol_name
    podman run --rm -v $vol_name:/data -v $(pwd):/backup alpine \
        tar xzf /backup/$volume -C /data
done

# Start with Podman Compose
podman-compose up -d
```

### Docker Compatibility

```bash
# Enable Docker compatibility
alias docker=podman

# Or use podman-docker package
sudo apt install podman-docker

# Docker socket proxy (for tools that need Docker socket)
podman run -d \
  --name docker-socket-proxy \
  -v /run/user/$(id -u)/podman/podman.sock:/var/run/docker.sock \
  -p 2375:2375 \
  docker.io/tecnativa/docker-socket-proxy
```

## Best Practices

### 1. Use Rootless Containers

```bash
# Always run as non-root when possible
podman run --user 1000:1000 everything-opencode:latest
```

### 2. Implement Health Checks

```yaml
# In Dockerfile or podman-compose.yml
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
CMD curl -f http://localhost:3000/health || exit 1
```

### 3. Use Named Volumes

```bash
# Instead of bind mounts for persistent data
podman volume create everything-opencode-data
podman run -v everything-opencode-data:/app/data everything-opencode:latest
```

### 4. Set Resource Limits

```bash
# Prevent container from consuming all resources
podman run --memory 512m --cpus 1.0 everything-opencode:latest
```

### 5. Regular Updates

```bash
# Update images regularly
podman pull everything-opencode:latest
podman system prune -a
```

### 6. Backup Strategy

```bash
# Backup volumes
podman run --rm -v everything-opencode-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup container configuration
podman inspect everything-opencode > everything-opencode-inspect-$(date +%Y%m%d).json
```

## Additional Resources

### Official Documentation

- [Podman Documentation](https://docs.podman.io/)
- [Podman Compose Documentation](https://github.com/containers/podman-compose)
- [Buildah Documentation](https://github.com/containers/buildah)

### Community Resources

- [Podman Tutorials](https://podman.io/tutorials.html)
- [Podman Desktop](https://podman-desktop.io/)
- [Podman GitHub](https://github.com/containers/podman)

### Books & Courses

- "Podman in Action" by Daniel Walsh
- "Containers for Developers" (Podman focused)
- Linux Foundation Container courses

### Support

- [Podman Slack](https://podman.io/community.html)
- [GitHub Issues](https://github.com/containers/podman/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/podman)

---

**Note**: This guide assumes Podman 4.0+. Some commands may differ for older versions. Always check the official Podman documentation for the most up-to-date information.

For production deployments, consider using orchestration tools like Kubernetes or OpenShift in addition to Podman for better scalability and management.
