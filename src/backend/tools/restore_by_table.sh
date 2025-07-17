#!/bin/bash

# Script untuk restore database per-tabel dari dalam container
# Menggunakan psql yang sudah diinstall di Dockerfile

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="spk-backend-1"
BACKUP_FILE="backup-public.sql"
SCRIPT_NAME="restore_database_by_table.py"

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

# Check if backup file exists in container
check_backup_file() {
    log_info "Checking if backup file exists in container..."
    
    if docker exec ${CONTAINER_NAME} test -f "/app/${BACKUP_FILE}"; then
        log_success "Backup file ${BACKUP_FILE} exists in container"
        return 0
    else
        log_error "Backup file ${BACKUP_FILE} not found in container"
        return 1
    fi
}

# Check if psql is available in container
check_psql() {
    log_info "Checking if psql is available in container..."
    
    if docker exec ${CONTAINER_NAME} which psql > /dev/null 2>&1; then
        log_success "psql is available in container"
        docker exec ${CONTAINER_NAME} psql --version
        return 0
    else
        log_error "psql is not available in container"
        return 1
    fi
}

# Run database connection test
test_connection() {
    log_info "Testing database connection from container..."
    
    if docker exec ${CONTAINER_NAME} python test_db_connection.py; then
        log_success "Database connection test passed"
        return 0
    else
        log_error "Database connection test failed"
        return 1
    fi
}

# Run restore by table from container
run_restore_by_table() {
    log_info "Running database restore by table from container..."
    
    # Check if custom backup file is provided
    local backup_file=${BACKUP_FILE}
    if [ ! -z "$1" ]; then
        backup_file="$1"
        log_info "Using custom backup file: ${backup_file}"
    fi
    
    # Check if backup file exists
    if ! docker exec ${CONTAINER_NAME} test -f "/app/${backup_file}"; then
        log_error "Backup file ${backup_file} not found in container"
        return 1
    fi
    
    # Run restore by table script
    if docker exec ${CONTAINER_NAME} python restore_database_by_table.py "${backup_file}"; then
        log_success "Database restore by table completed successfully"
        return 0
    else
        log_error "Database restore by table failed"
        return 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [BACKUP_FILE]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -t, --test     Only test connection and psql availability"
    echo "  -c, --check    Check container and file availability"
    echo ""
    echo "Arguments:"
    echo "  BACKUP_FILE    Custom backup file name (default: backup-public.sql)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Restore by table using default backup file"
    echo "  $0 my-backup.sql                      # Restore by table using custom backup file"
    echo "  $0 -t                                 # Only test connection"
    echo "  $0 -c                                 # Only check container and files"
    echo ""
    echo "Features:"
    echo "  ✅ Restore per-table to avoid timeout"
    echo "  ✅ Batch processing for large tables"
    echo "  ✅ Progress monitoring for each table"
    echo "  ✅ Automatic schema and data restoration"
    echo "  ✅ Verification after each table restore"
}

# Main function
main() {
    echo "🚀 Database Restore by Table from Container"
    echo "==========================================="
    
    # Parse arguments
    local test_only=false
    local check_only=false
    local backup_file=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -t|--test)
                test_only=true
                shift
                ;;
            -c|--check)
                check_only=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    # Step 1: Check container
    if ! check_container; then
        log_error "Please start the container first:"
        echo "  docker-compose up -d"
        exit 1
    fi
    
    # Step 2: Check psql availability
    if ! check_psql; then
        log_error "psql is not available in container. Please rebuild the image:"
        echo "  docker-compose build backend"
        exit 1
    fi
    
    # Step 3: Check backup file
    if ! check_backup_file; then
        log_error "Backup file not found in container"
        exit 1
    fi
    
    # If check only mode
    if [ "$check_only" = true ]; then
        log_success "All checks passed!"
        exit 0
    fi
    
    # Step 4: Test connection
    if ! test_connection; then
        log_error "Database connection test failed"
        exit 1
    fi
    
    # If test only mode
    if [ "$test_only" = true ]; then
        log_success "All tests passed!"
        exit 0
    fi
    
    # Step 5: Confirm restore
    echo ""
    log_warning "This will restore database by table (safer than full restore)"
    log_info "Tables will be restored in this order:"
    echo "  1. alembic_version"
    echo "  2. mahasiswa"
    echo "  3. nilai (largest table - will be processed in batches)"
    echo "  4. klasifikasi_kelulusan"
    echo "  5. saw_criteria"
    echo "  6. saw_results"
    echo "  7. saw_final_results"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    # Step 6: Run restore by table
    if run_restore_by_table "$backup_file"; then
        echo ""
        log_success "Database restore by table completed successfully!"
        echo ""
        log_info "You can now start the application:"
        echo "  docker-compose up -d"
        echo ""
        log_info "Or test the connection:"
        echo "  docker exec ${CONTAINER_NAME} python test_db_connection.py"
        echo ""
        log_info "Or monitor database:"
        echo "  python3 monitor_restore.py monitor"
    else
        log_error "Database restore by table failed"
        exit 1
    fi
}

# Run main function
main "$@" 