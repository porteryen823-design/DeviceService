#!/bin/bash

# ============================================================================
# Device Service Management System - Docker Run Script
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="device-service-management"
CONTAINER_NAME="device-service-app"
API_PORT=8000
FRONTEND_PORT=3000

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to stop and remove existing container
cleanup_container() {
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "Stopping and removing existing container..."
        docker stop $CONTAINER_NAME >/dev/null 2>&1 || true
        docker rm $CONTAINER_NAME >/dev/null 2>&1 || true
    fi
}

# Function to build Docker image
build_image() {
    print_info "Building Docker image..."
    if ! docker build -t $IMAGE_NAME .; then
        print_error "Failed to build Docker image"
        exit 1
    fi
    print_success "Docker image built successfully"
}

# Function to run container
run_container() {
    print_info "Starting container..."

    # Create logs directory if it doesn't exist
    mkdir -p logs

    # Run container
    docker run -d \
        --name $CONTAINER_NAME \
        -p $API_PORT:$API_PORT \
        -p $FRONTEND_PORT:80 \
        -v "$(pwd)/logs:/app/logs" \
        -e DEVICE_SERVICE_HOST=0.0.0.0 \
        -e DEVICE_SERVICE_PORT=$API_PORT \
        -e DATABASE_URL=sqlite:///./device_service.db \
        --restart unless-stopped \
        $IMAGE_NAME

    if [ $? -eq 0 ]; then
        print_success "Container started successfully"
    else
        print_error "Failed to start container"
        exit 1
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be ready..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:$API_PORT/health >/dev/null 2>&1; then
            print_success "Backend API is ready"
            break
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_warning "Backend API did not start within expected time"
    fi
}

# Function to show service information
show_info() {
    echo
    echo "================================================================="
    echo "🎉 Device Service Management System is running!"
    echo "================================================================="
    echo
    echo "📍 Service URLs:"
    echo "   Frontend:    http://localhost:$FRONTEND_PORT"
    echo "   Backend API: http://localhost:$API_PORT"
    echo "   API Docs:    http://localhost:$API_PORT/docs"
    echo "   Health Check: http://localhost:$API_PORT/health"
    echo
    echo "🐳 Docker Commands:"
    echo "   View logs:     docker logs $CONTAINER_NAME"
    echo "   Stop service:  docker stop $CONTAINER_NAME"
    echo "   Restart:       docker restart $CONTAINER_NAME"
    echo "   Remove:        docker rm $CONTAINER_NAME"
    echo
    echo "📊 Container Info:"
    echo "   Image:         $IMAGE_NAME"
    echo "   Container:     $CONTAINER_NAME"
    echo
    echo "================================================================="
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -b, --build-only    Only build the image, don't run container"
    echo "  -c, --cleanup       Stop and remove existing container before starting"
    echo "  --api-port PORT     Set API port (default: 8000)"
    echo "  --frontend-port PORT Set frontend port (default: 3000)"
    echo
    echo "Examples:"
    echo "  $0                    # Build and run with default settings"
    echo "  $0 --build-only      # Only build the image"
    echo "  $0 --cleanup         # Clean up existing container first"
    echo "  $0 --api-port 9000   # Use custom API port"
}

# Parse command line arguments
BUILD_ONLY=false
CLEANUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -c|--cleanup)
            CLEANUP=true
            shift
            ;;
        --api-port)
            API_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_info "Starting Device Service Management System..."

    # Check if Docker is running
    check_docker

    # Check if ports are available
    if ! check_port $API_PORT; then
        print_error "Port $API_PORT is already in use. Please choose a different port or stop the conflicting service."
        exit 1
    fi

    if ! check_port $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT is already in use. This might cause issues with the frontend."
    fi

    # Clean up existing container if requested
    if [ "$CLEANUP" = true ]; then
        cleanup_container
    fi

    # Build Docker image
    build_image

    # Exit if only building
    if [ "$BUILD_ONLY" = true ]; then
        print_success "Image built successfully. Use 'docker run' to start the container."
        exit 0
    fi

    # Run container
    run_container

    # Wait for services
    wait_for_services

    # Show information
    show_info

    print_info "Press Ctrl+C to stop monitoring"
    print_info "Container will continue running in the background"

    # Keep script running to show logs
    echo
    print_info "Showing container logs (press Ctrl+C to exit)..."
    docker logs -f $CONTAINER_NAME
}

# Run main function
main "$@"