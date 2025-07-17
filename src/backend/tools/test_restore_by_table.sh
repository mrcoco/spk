#!/bin/bash

# Script untuk test restore database per-tabel
# Akan drop database dan restore dari awal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="spk-backend-1"

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

# Check if container is running
check_container() {
    log_info "Checking if container is running..."
    
    if docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        log_success "Container ${CONTAINER_NAME} is running"
        return 0
    else
        log_error "Container ${CONTAINER_NAME} is not running"
        return 1
    fi
}

# Stop backend container
stop_backend() {
    log_info "Stopping backend container for clean test..."
    
    if docker stop ${CONTAINER_NAME} > /dev/null 2>&1; then
        log_success "Backend container stopped"
        return 0
    else
        log_warning "Backend container was not running or already stopped"
        return 0
    fi
}

# Start backend container
start_backend() {
    log_info "Starting backend container..."
    
    if docker start ${CONTAINER_NAME} > /dev/null 2>&1; then
        log_success "Backend container started"
        
        # Wait for container to be ready
        log_info "Waiting for container to be ready..."
        sleep 5
        
        return 0
    else
        log_error "Failed to start backend container"
        return 1
    fi
}

# Run test restore by table
run_test_restore() {
    log_info "Running test restore by table from container..."
    
    if docker exec ${CONTAINER_NAME} python test_restore_by_table.py; then
        log_success "Test restore by table completed successfully"
        return 0
    else
        log_error "Test restore by table failed"
        return 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -f, --force    Force test without confirmation"
    echo ""
    echo "Description:"
    echo "  This script will:"
    echo "  1. Stop backend container"
    echo "  2. Drop the database completely"
    echo "  3. Restore database using per-table method"
    echo "  4. Verify all tables and data"
    echo "  5. Start backend container"
    echo ""
    echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
    echo ""
    echo "Examples:"
    echo "  $0              # Run test with confirmation"
    echo "  $0 -f           # Run test without confirmation"
    echo ""
    echo "Features:"
    echo "  ✅ Complete database reset"
    echo "  ✅ Per-table restore testing"
    echo "  ✅ Automatic verification"
    echo "  ✅ Clean container state"
}

# Main function
main() {
    echo "🧪 Database Restore by Table Test"
    echo "================================="
    
    # Parse arguments
    local force_test=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -f|--force)
                force_test=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                log_error "Unknown argument: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Step 1: Check container
    if ! check_container; then
        log_error "Please start the container first:"
        echo "  docker-compose up -d"
        exit 1
    fi
    
    # Step 2: Confirm test (unless forced)
    if [ "$force_test" = false ]; then
        echo ""
        log_warning "⚠️  WARNING: This test will DELETE ALL DATA in the database!"
        echo ""
        log_info "The test will:"
        echo "  1. Stop backend container"
        echo "  2. Drop database completely"
        echo "  3. Restore database using per-table method"
        echo "  4. Verify all tables and data"
        echo "  5. Start backend container"
        echo ""
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Test cancelled"
            exit 0
        fi
    fi
    
    # Step 3: Stop backend
    if ! stop_backend; then
        log_error "Failed to stop backend"
        exit 1
    fi
    
    # Step 4: Run test restore
    if ! run_test_restore; then
        log_error "Test restore failed"
        log_info "Starting backend container anyway..."
        start_backend
        exit 1
    fi
    
    # Step 5: Start backend
    if ! start_backend; then
        log_error "Failed to start backend"
        exit 1
    fi
    
    # Step 6: Final verification
    echo ""
    log_info "Performing final verification..."
    
    if docker exec ${CONTAINER_NAME} python test_db_connection.py; then
        echo ""
        log_success "🎉 ALL TESTS PASSED!"
        echo ""
        log_info "Database has been successfully:"
        echo "  ✅ Dropped and recreated"
        echo "  ✅ Restored using per-table method"
        echo "  ✅ Verified with all data intact"
        echo ""
        log_info "Backend container is running and ready"
        echo ""
        log_info "You can now access the application:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend:  http://localhost:8000"
        echo ""
        log_info "Or test the connection:"
        echo "  docker exec ${CONTAINER_NAME} python test_db_connection.py"
    else
        log_error "Final verification failed"
        exit 1
    fi
}

# Run main function
main "$@" 