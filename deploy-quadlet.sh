#!/bin/bash
# Everything OpenCode Quadlet Deployment Script
# Deploy Everything OpenCode as systemd services using Podman Quadlet

set -e

# Configuration
QUADLET_DIR="/etc/containers/systemd"
APP_DIR="/etc/everything-opencode"
CONTAINER_IMAGE="everything-opencode:latest"

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
    echo "Everything OpenCode Quadlet Deployment"
    echo "=========================================="
    echo -e "${NC}"
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

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root"
        echo "Please run: sudo $0"
        exit 1
    fi
}

check_podman_version() {
    print_step "Checking Podman version..."
    if ! podman --version &> /dev/null; then
        print_error "Podman is not installed"
        echo "Please install Podman 4.4+ first"
        exit 1
    fi
    
    PODMAN_VERSION=$(podman --version | awk '{print $3}')
    PODMAN_MAJOR=$(echo $PODMAN_VERSION | cut -d. -f1)
    PODMAN_MINOR=$(echo $PODMAN_VERSION | cut -d. -f2)
    
    if [ "$PODMAN_MAJOR" -lt 4 ] || ([ "$PODMAN_MAJOR" -eq 4 ] && [ "$PODMAN_MINOR" -lt 4 ]); then
        print_error "Podman 4.4+ is required for Quadlet (found $PODMAN_VERSION)"
        echo "Please upgrade Podman:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt upgrade podman"
        echo "  Fedora/RHEL: sudo dnf update podman"
        exit 1
    fi
    
    print_success "Podman $PODMAN_VERSION is compatible with Quadlet"
}

check_quadlet_support() {
    print_step "Checking Quadlet support..."
    if [ ! -d "/etc/containers/systemd" ]; then
        print_success "Creating Quadlet directory..."
        mkdir -p /etc/containers/systemd
    fi
    
    # Check if systemd supports Quadlet
    if ! systemctl --version | grep -q "systemd 24[0-9]\|systemd 25[0-9]"; then
        echo "Note: Older systemd versions may have limited Quadlet support"
    fi
}

build_image() {
    print_step "Building container image..."
    if [ -f "Dockerfile" ]; then
        podman build -t $CONTAINER_IMAGE .
        print_success "Image built successfully"
    else
        print_error "Dockerfile not found in current directory"
        exit 1
    fi
}

setup_directories() {
    print_step "Setting up directories..."
    
    # Create Quadlet directory
    mkdir -p $QUADLET_DIR
    print_success "Created $QUADLET_DIR"
    
    # Create application directory
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/config
    print_success "Created $APP_DIR"
    
    # Create data directories
    mkdir -p ~/.local/share/containers/everything-opencode/data
    mkdir -p ~/.local/share/containers/postgres/data
    mkdir -p ~/.local/share/containers/redis/data
    print_success "Created data directories"
}

copy_quadlet_files() {
    print_step "Copying Quadlet configuration files..."
    
    # Check if quadlet directory exists
    if [ ! -d "quadlet" ]; then
        print_error "quadlet/ directory not found"
        echo "Please run this script from the Everything OpenCode repository root"
        exit 1
    fi
    
    # Copy Quadlet files
    cp quadlet/*.container $QUADLET_DIR/
    cp quadlet/*.network $QUADLET_DIR/
    
    # Set correct permissions
    chmod 644 $QUADLET_DIR/*.container
    chmod 644 $QUADLET_DIR/*.network
    
    print_success "Quadlet files copied to $QUADLET_DIR"
}

setup_environment() {
    print_step "Setting up environment configuration..."
    
    # Create environment file
    cat > $APP_DIR/env << EOF
# Everything OpenCode Environment Configuration
NODE_ENV=production
DEBUG_ENABLED=true
PORT=3000
DEBUG_PORT=3005
LOG_LEVEL=info
CORS_ORIGIN=*
MAX_FILE_SIZE=10MB
DATABASE_URL=postgresql://opencode:\${POSTGRES_PASSWORD}@everything-opencode-postgres:5432/opencode
REDIS_URL=redis://everything-opencode-redis:6379
EOF
    
    # Create PostgreSQL password file
    if [ ! -f "$APP_DIR/postgres-password" ]; then
        echo "opencode123" > $APP_DIR/postgres-password
        chmod 600 $APP_DIR/postgres-password
        print_success "Created PostgreSQL password file"
    else
        print_success "PostgreSQL password file already exists"
    fi
    
    # Create sample configuration
    if [ ! -f "$APP_DIR/config/app.config" ]; then
        cat > $APP_DIR/config/app.config << EOF
# Everything OpenCode Application Configuration
# Add your application-specific configuration here
EOF
        print_success "Created sample configuration"
    fi
    
    print_success "Environment configuration complete"
}

reload_systemd() {
    print_step "Reloading systemd..."
    systemctl daemon-reload
    print_success "Systemd reloaded"
}

enable_services() {
    print_step "Enabling and starting services..."
    
    # Enable network first
    if [ -f "$QUADLET_DIR/everything-opencode.network" ]; then
        systemctl enable --now everything-opencode.network
        print_success "Network service enabled"
    fi
    
    # Enable database services
    if [ -f "$QUADLET_DIR/postgres.container" ]; then
        systemctl enable --now postgres.container
        print_success "PostgreSQL service enabled"
    fi
    
    if [ -f "$QUADLET_DIR/redis.container" ]; then
        systemctl enable --now redis.container
        print_success "Redis service enabled"
    fi
    
    # Enable main application
    if [ -f "$QUADLET_DIR/everything-opencode.container" ]; then
        systemctl enable --now everything-opencode.container
        print_success "Main application service enabled"
    fi
    
    # Wait a moment for services to start
    sleep 3
}

check_service_status() {
    print_step "Checking service status..."
    
    SERVICES=("everything-opencode.network" "postgres.container" "redis.container" "everything-opencode.container")
    
    for service in "${SERVICES[@]}"; do
        if systemctl is-enabled $service >/dev/null 2>&1; then
            STATUS=$(systemctl is-active $service)
            if [ "$STATUS" = "active" ]; then
                print_success "$service: active"
            else
                print_error "$service: $STATUS"
                echo "View logs with: journalctl -u $service -xe"
            fi
        fi
    done
}

check_application_health() {
    print_step "Checking application health..."
    
    # Wait for application to start
    echo "Waiting for application to start (max 60 seconds)..."
    
    local max_retries=20
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
            print_success "Application health check passed"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        echo "  Health check attempt $retry_count/$max_retries failed, retrying..."
        sleep 3
    done
    
    print_error "Health check failed after $max_retries attempts"
    echo "View application logs with: journalctl -u everything-opencode.container -f"
    return 1
}

show_deployment_info() {
    print_step "Deployment Information:"
    echo ""
    echo -e "${GREEN}✅ Quadlet Deployment Complete!${NC}"
    echo ""
    echo "Services deployed as systemd units:"
    echo "  Network: everything-opencode.network"
    echo "  PostgreSQL: postgres.container"
    echo "  Redis: redis.container"
    echo "  Main Application: everything-opencode.container"
    echo ""
    echo "Access URLs:"
    echo "  Main Application: http://localhost:3000"
    echo "  Debug Server: http://localhost:3005"
    echo "  Health Check: http://localhost:3000/health"
    echo ""
    echo "Management Commands:"
    echo "  View all services: systemctl list-units '*.container' '*.network'"
    echo "  View logs: journalctl -u everything-opencode.container -f"
    echo "  Restart service: systemctl restart everything-opencode.container"
    echo "  Stop service: systemctl stop everything-opencode.container"
    echo "  Check status: systemctl status everything-opencode.container"
    echo ""
    echo "Configuration Files:"
    echo "  Quadlet files: $QUADLET_DIR/"
    echo "  Environment: $APP_DIR/env"
    echo "  PostgreSQL password: $APP_DIR/postgres-password"
    echo "  Application config: $APP_DIR/config/"
    echo ""
    echo "Data Directories:"
    echo "  Application data: ~/.local/share/containers/everything-opencode/data"
    echo "  PostgreSQL data: ~/.local/share/containers/postgres/data"
    echo "  Redis data: ~/.local/share/containers/redis/data"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure your application in $APP_DIR/config/"
    echo "  2. Update PostgreSQL password in $APP_DIR/postgres-password"
    echo "  3. Review and customize Quadlet files in $QUADLET_DIR/"
    echo "  4. Set up monitoring and backups"
    echo ""
}

cleanup_old_services() {
    print_step "Checking for old services..."
    
    # Stop and disable any old systemd services
    OLD_SERVICES=("everything-opencode.service" "everything-opencode-postgres.service" "everything-opencode-redis.service")
    
    for service in "${OLD_SERVICES[@]}"; do
        if systemctl is-active $service >/dev/null 2>&1; then
            print_step "Stopping old service: $service"
            systemctl stop $service
            systemctl disable $service
            print_success "Old service $service stopped and disabled"
        fi
    done
}

# Main deployment function
deploy() {
    print_header
    
    # Check prerequisites
    check_root
    check_podman_version
    check_quadlet_support
    
    # Build image
    build_image
    
    # Setup directories and files
    setup_directories
    copy_quadlet_files
    setup_environment
    
    # Clean up old services
    cleanup_old_services
    
    # Reload and enable services
    reload_systemd
    enable_services
    
    # Verify deployment
    check_service_status
    check_application_health
    
    # Show deployment information
    show_deployment_info
    
    echo -e "${GREEN}🎉 Everything OpenCode deployed successfully with Quadlet!${NC}"
}

# Management functions
manage_service() {
    local service=$1
    local action=$2
    
    case $action in
        "start")
            systemctl start $service
            ;;
        "stop")
            systemctl stop $service
            ;;
        "restart")
            systemctl restart $service
            ;;
        "status")
            systemctl status $service
            ;;
        "logs")
            journalctl -u $service -f
            ;;
        "enable")
            systemctl enable $service
            ;;
        "disable")
            systemctl disable $service
            ;;
        *)
            echo "Unknown action: $action"
            exit 1
            ;;
    esac
}

# Handle command line arguments
case "$1" in
    "deploy"|"")
        deploy
        ;;
    "service")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 service <service-name> <action>"
            echo "Actions: start, stop, restart, status, logs, enable, disable"
            echo ""
            echo "Available services:"
            echo "  everything-opencode.container"
            echo "  postgres.container"
            echo "  redis.container"
            echo "  everything-opencode.network"
            exit 1
        fi
        manage_service "$2" "$3"
        ;;
    "status")
        check_service_status
        ;;
    "health")
        check_application_health
        ;;
    "logs")
        journalctl -u everything-opencode.container -f
        ;;
    "info")
        show_deployment_info
        ;;
    "clean")
        print_step "Cleaning up deployment..."
        
        # Stop and disable services
        systemctl stop everything-opencode.container postgres.container redis.container everything-opencode.network 2>/dev/null || true
        systemctl disable everything-opencode.container postgres.container redis.container everything-opencode.network 2>/dev/null || true
        
        # Remove Quadlet files
        rm -f $QUADLET_DIR/everything-opencode.container
        rm -f $QUADLET_DIR/postgres.container
        rm -f $QUADLET_DIR/redis.container
        rm -f $QUADLET_DIR/everything-opencode.network
        
        # Reload systemd
        systemctl daemon-reload
        
        print_success "Deployment cleaned up"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: sudo $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy          Deploy Everything OpenCode with Quadlet (default)"
        echo "  service         Manage a specific service"
        echo "  status          Check service status"
        echo "  health          Check application health"
        echo "  logs            View application logs"
        echo "  info            Show deployment information"
        echo "  clean           Clean up deployment"
        echo "  help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  sudo $0 deploy                    # Deploy everything"
        echo "  sudo $0 service everything-opencode.container restart"
        echo "  sudo $0 logs                      # View application logs"
        echo "  sudo $0 status                    # Check all services"
        echo ""
        exit 0
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac