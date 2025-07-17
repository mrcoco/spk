#!/bin/bash

# Script untuk test Docker build dengan psql

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="spk-backend"
CONTAINER_NAME="spk-backend-test"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test container..."
    docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# Test Docker build
test_build() {
    log_info "Testing Docker build..."
    
    if docker build -t ${IMAGE_NAME}:test .; then
        log_success "Docker build successful"
        return 0
    else
        log_error "Docker build failed"
        return 1
    fi
}

# Test psql installation
test_psql() {
    log_info "Testing psql installation in container..."
    
    # Create test container
    docker run -d --name ${CONTAINER_NAME} ${IMAGE_NAME}:test tail -f /dev/null
    
    # Wait for container to start
    sleep 2
    
    # Test psql version
    if docker exec ${CONTAINER_NAME} psql --version; then
        log_success "psql is available in container"
        return 0
    else
        log_error "psql is not available in container"
        return 1
    fi
}

# Test Python dependencies
test_python() {
    log_info "Testing Python dependencies..."
    
    # Test Python version
    if docker exec ${CONTAINER_NAME} python --version; then
        log_success "Python is available"
    else
        log_error "Python is not available"
        return 1
    fi
    
    # Test pip packages
    if docker exec ${CONTAINER_NAME} pip list | grep -q "psycopg2"; then
        log_success "psycopg2 is installed"
    else
        log_error "psycopg2 is not installed"
        return 1
    fi
    
    if docker exec ${CONTAINER_NAME} pip list | grep -q "python-dotenv"; then
        log_success "python-dotenv is installed"
    else
        log_error "python-dotenv is not installed"
        return 1
    fi
    
    return 0
}

# Test file structure
test_files() {
    log_info "Testing file structure..."
    
    required_files=(
        "main.py"
        "config.py"
        "requirements.txt"
        "Dockerfile"
        "test_db_connection.py"
        "restore_database_container.py"
    )
    
    for file in "${required_files[@]}"; do
        if docker exec ${CONTAINER_NAME} test -f "/app/${file}"; then
            log_success "File ${file} exists"
        else
            log_error "File ${file} not found"
            return 1
        fi
    done
    
    return 0
}

# Test environment variables
test_env() {
    log_info "Testing environment variables..."
    
    # Test if environment variables can be loaded
    if docker exec ${CONTAINER_NAME} python -c "from config import Config; print('Config loaded successfully')"; then
        log_success "Config module loads successfully"
        return 0
    else
        log_error "Config module failed to load"
        return 1
    fi
}

# Main function
main() {
    echo "🧪 Testing Docker Build with psql"
    echo "=================================="
    
    # Step 1: Test build
    if ! test_build; then
        log_error "Build test failed"
        exit 1
    fi
    
    # Step 2: Test psql
    if ! test_psql; then
        log_error "psql test failed"
        exit 1
    fi
    
    # Step 3: Test Python
    if ! test_python; then
        log_error "Python test failed"
        exit 1
    fi
    
    # Step 4: Test files
    if ! test_files; then
        log_error "File structure test failed"
        exit 1
    fi
    
    # Step 5: Test environment
    if ! test_env; then
        log_error "Environment test failed"
        exit 1
    fi
    
    echo ""
    log_success "All tests passed! Docker image is ready."
    echo ""
    log_info "You can now use the image:"
    echo "  docker run -it ${IMAGE_NAME}:test bash"
    echo ""
    log_info "Or test psql directly:"
    echo "  docker run -it ${IMAGE_NAME}:test psql --version"
    echo ""
    log_info "Or test database connection:"
    echo "  docker run -it ${IMAGE_NAME}:test python test_db_connection.py"
}

# Run main function
main "$@" 