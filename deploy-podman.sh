#!/bin/bash
# Everything OpenCode Podman Deployment Script
# Quick start for deploying Everything OpenCode with Podman

set -e

# Configuration
IMAGE_NAME="everything-opencode"
CONTAINER_NAME="everything-opencode"
NETWORK_NAME="everything-opencode-net"
VOLUME_NAME="everything-opencode-data"
PORT_APP=3000
PORT_DEBUG=3005

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "Everything OpenCode Podman Deployment"
    echo "=========================================="
    echo -e "${NC}"
    echo "For Quadlet (systemd) deployment, use: sudo ./deploy-quadlet.sh"
    echo ""
}

print_step() {
    echo -e "${YELLOW}[STEP] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

check_podman() {
    print_step "Checking Podman installation..."
    if ! podman --version &> /dev/null; then
        print_error "Podman is not installed or not in PATH"
        echo "Please install Podman:"
        echo "  Ubuntu/Debian: sudo apt install podman podman-docker"
        echo "  macOS: brew install podman"
        echo "  Windows (WSL2): sudo apt install podman"
        exit 1
    fi
    PODMAN_VERSION=$(podman --version | awk '{print $3}')
    print_success "Podman $PODMAN_VERSION is installed"
}

build_image() {
    print_step "Building container image..."
    if [ -f "Dockerfile" ]; then
        podman build -t $IMAGE_NAME:latest .
        print_success "Image built successfully"
    else
        print_error "Dockerfile not found in current directory"
        exit 1
    fi
}

create_network() {
    print_step "Creating network..."
    if ! podman network exists $NETWORK_NAME; then
        podman network create $NETWORK_NAME
        print_success "Network '$NETWORK_NAME' created"
    else
        print_success "Network '$NETWORK_NAME' already exists"
    fi
}

create_volume() {
    print_step "Creating volume..."
    if ! podman volume exists $VOLUME_NAME; then
        podman volume create $VOLUME_NAME
        print_success "Volume '$VOLUME_NAME' created"
    else
        print_success "Volume '$VOLUME_NAME' already exists"
    fi
}

stop_container() {
    print_step "Stopping existing container..."
    if podman ps -a --format "{{.Names}}" | grep -q $CONTAINER_NAME; then
        podman stop $CONTAINER_NAME 2>/dev/null || true
        podman rm $CONTAINER_NAME 2>/dev/null || true
        print_success "Existing container stopped and removed"
    else
        print_success "No existing container found"
    fi
}

run_container() {
    print_step "Starting container..."
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
NODE_ENV=production
DEBUG_ENABLED=true
PORT=$PORT_APP
DEBUG_PORT=$PORT_DEBUG
LOG_LEVEL=info
CORS_ORIGIN=*
MAX_FILE_SIZE=10MB
EOF
        print_success "Created .env file with default settings"
    fi
    
    # Run container
    podman run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        --hostname $CONTAINER_NAME \
        -p $PORT_APP:$PORT_APP \
        -p $PORT_DEBUG:$PORT_DEBUG \
        --volume $VOLUME_NAME:/app/data:Z \
        --volume $(pwd)/config:/app/config:ro,Z \
        --env-file .env \
        --restart unless-stopped \
        $IMAGE_NAME:latest
    
    print_success "Container started"
}

check_health() {
    print_step "Checking container health..."
    
    # Wait for container to start
    sleep 5
    
    # Check if container is running
    if podman ps --format "{{.Names}} {{.Status}}" | grep -q "$CONTAINER_NAME Up"; then
        print_success "Container is running"
    else
        print_error "Container failed to start"
        podman logs $CONTAINER_NAME
        exit 1
    fi
    
    # Try health endpoint
    local max_retries=10
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s -f http://localhost:$PORT_APP/health > /dev/null 2>&1; then
            print_success "Health check passed"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        echo "  Health check attempt $retry_count/$max_retries failed, retrying..."
        sleep 3
    done
    
    print_error "Health check failed after $max_retries attempts"
    podman logs $CONTAINER_NAME
    exit 1
}

show_info() {
    print_step "Deployment Information:"
    echo ""
    echo -e "${GREEN}✅ Deployment Successful!${NC}"
    echo ""
    echo "Container Information:"
    echo "  Name: $CONTAINER_NAME"
    echo "  Image: $IMAGE_NAME:latest"
    echo "  Network: $NETWORK_NAME"
    echo "  Volume: $VOLUME_NAME"
    echo ""
    echo "Access URLs:"
    echo "  Main Application: http://localhost:$PORT_APP"
    echo "  Debug Server: http://localhost:$PORT_DEBUG"
    echo "  Health Check: http://localhost:$PORT_APP/health"
    echo ""
    echo "Useful Commands:"
    echo "  View logs: podman logs -f $CONTAINER_NAME"
    echo "  Shell access: podman exec -it $CONTAINER_NAME /bin/sh"
    echo "  Stop container: podman stop $CONTAINER_NAME"
    echo "  Remove container: podman rm $CONTAINER_NAME"
    echo "  View stats: podman stats $CONTAINER_NAME"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure your application in the ./config directory"
    echo "  2. Check logs for any initialization issues"
    echo "  3. Access the web interface at http://localhost:$PORT_APP"
    echo ""
}

cleanup() {
    print_step "Cleaning up..."
    podman system prune -f
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header
    
    # Check prerequisites
    check_podman
    check_command curl
    
    # Build and deploy
    build_image
    create_network
    create_volume
    stop_container
    run_container
    check_health
    
    # Show deployment info
    show_info
    
    # Optional cleanup
    # cleanup
    
    echo -e "${GREEN}🎉 Everything OpenCode is now running with Podman!${NC}"
}

# Handle command line arguments
case "$1" in
    "stop")
        stop_container
        print_success "Container stopped"
        ;;
    "logs")
        podman logs -f $CONTAINER_NAME
        ;;
    "shell")
        podman exec -it $CONTAINER_NAME /bin/sh
        ;;
    "restart")
        stop_container
        run_container
        check_health
        print_success "Container restarted"
        ;;
    "status")
        podman ps -a --filter "name=$CONTAINER_NAME"
        ;;
    "clean")
        cleanup
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no command)    Deploy Everything OpenCode"
        echo "  stop            Stop the container"
        echo "  logs            View container logs"
        echo "  shell           Access container shell"
        echo "  restart         Restart the container"
        echo "  status          Show container status"
        echo "  clean           Clean up unused resources"
        echo "  help            Show this help message"
        echo ""
        exit 0
        ;;
    *)
        main
        ;;
esac