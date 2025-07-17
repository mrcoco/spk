#!/bin/bash

# Script untuk test berbagai operasi database menggunakan psql

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="spk-backend-1"
DB_HOST="db"
DB_PORT="5432"
DB_USER="spk_user"
DB_PASSWORD="spk_password"
DB_NAME="spk_db"

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

# Test database version
test_version() {
    log_info "Testing database version..."
    
    local result=$(docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT version();" -t)
    
    if [ $? -eq 0 ]; then
        log_success "Database version:"
        echo "$result"
        return 0
    else
        log_error "Failed to get database version"
        return 1
    fi
}

# Test list tables
test_list_tables() {
    log_info "Testing list tables..."
    
    local result=$(docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "\dt" -t)
    
    if [ $? -eq 0 ]; then
        log_success "Database tables:"
        echo "$result"
        return 0
    else
        log_error "Failed to list tables"
        return 1
    fi
}

# Test count records
test_count_records() {
    log_info "Testing count records..."
    
    local tables=("mahasiswa" "nilai" "klasifikasi_kelulusan" "saw_results" "saw_criteria" "saw_final_results")
    
    for table in "${tables[@]}"; do
        local result=$(docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) as ${table}_count FROM ${table};" -t)
        
        if [ $? -eq 0 ]; then
            log_success "${table}: $result"
        else
            log_error "Failed to count ${table}"
        fi
    done
}

# Test sample data
test_sample_data() {
    log_info "Testing sample data..."
    
    # Test mahasiswa sample
    local result=$(docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT nim, nama, program_studi FROM mahasiswa LIMIT 3;" -t)
    
    if [ $? -eq 0 ]; then
        log_success "Sample mahasiswa data:"
        echo "$result"
    else
        log_error "Failed to get sample mahasiswa data"
    fi
    
    # Test nilai sample
    local result=$(docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT nim, nama_matakuliah, nilai FROM nilai LIMIT 3;" -t)
    
    if [ $? -eq 0 ]; then
        log_success "Sample nilai data:"
        echo "$result"
    else
        log_error "Failed to get sample nilai data"
    fi
}

# Test table structure
test_table_structure() {
    log_info "Testing table structure..."
    
    local tables=("mahasiswa" "nilai" "klasifikasi_kelulusan")
    
    for table in "${tables[@]}"; do
        local result=$(docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "\d ${table}" -t)
        
        if [ $? -eq 0 ]; then
            log_success "Structure of ${table}:"
            echo "$result"
            echo ""
        else
            log_error "Failed to get structure of ${table}"
        fi
    done
}

# Test database performance
test_performance() {
    log_info "Testing database performance..."
    
    # Test query execution time
    local start_time=$(date +%s.%N)
    docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) FROM mahasiswa;" > /dev/null 2>&1
    local end_time=$(date +%s.%N)
    local execution_time=$(echo "$end_time - $start_time" | bc)
    
    log_success "Query execution time: ${execution_time} seconds"
    
    # Test connection pool
    local result=$(docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT count(*) FROM pg_stat_activity;" -t)
    
    if [ $? -eq 0 ]; then
        log_success "Active connections: $result"
    else
        log_error "Failed to get active connections"
    fi
}

# Test backup capability
test_backup() {
    log_info "Testing backup capability..."
    
    local backup_file="/tmp/test_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create backup
    if docker exec -e PGPASSWORD=${DB_PASSWORD} ${CONTAINER_NAME} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} ${DB_NAME} > ${backup_file}; then
        log_success "Backup created: ${backup_file}"
        log_info "Backup size: $(du -h ${backup_file} | cut -f1)"
        
        # Clean up
        rm -f ${backup_file}
        log_info "Backup file cleaned up"
        return 0
    else
        log_error "Failed to create backup"
        return 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help         Show this help message"
    echo "  -v, --version      Test database version"
    echo "  -t, --tables       Test list tables"
    echo "  -c, --count        Test count records"
    echo "  -s, --sample       Test sample data"
    echo "  -d, --structure    Test table structure"
    echo "  -p, --performance  Test database performance"
    echo "  -b, --backup       Test backup capability"
    echo "  -a, --all          Run all tests"
    echo ""
    echo "Examples:"
    echo "  $0 -a              # Run all tests"
    echo "  $0 -v -t           # Test version and tables"
    echo "  $0 -c -s           # Test count and sample data"
}

# Main function
main() {
    echo "🧪 Database Operations Test"
    echo "==========================="
    
    # Parse arguments
    local test_version_flag=false
    local test_tables_flag=false
    local test_count_flag=false
    local test_sample_flag=false
    local test_structure_flag=false
    local test_performance_flag=false
    local test_backup_flag=false
    local test_all_flag=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--version)
                test_version_flag=true
                shift
                ;;
            -t|--tables)
                test_tables_flag=true
                shift
                ;;
            -c|--count)
                test_count_flag=true
                shift
                ;;
            -s|--sample)
                test_sample_flag=true
                shift
                ;;
            -d|--structure)
                test_structure_flag=true
                shift
                ;;
            -p|--performance)
                test_performance_flag=true
                shift
                ;;
            -b|--backup)
                test_backup_flag=true
                shift
                ;;
            -a|--all)
                test_all_flag=true
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
    
    # If no options specified, run all tests
    if [ "$test_all_flag" = false ] && [ "$test_version_flag" = false ] && [ "$test_tables_flag" = false ] && [ "$test_count_flag" = false ] && [ "$test_sample_flag" = false ] && [ "$test_structure_flag" = false ] && [ "$test_performance_flag" = false ] && [ "$test_backup_flag" = false ]; then
        test_all_flag=true
    fi
    
    # Run tests
    if [ "$test_all_flag" = true ] || [ "$test_version_flag" = true ]; then
        test_version
        echo ""
    fi
    
    if [ "$test_all_flag" = true ] || [ "$test_tables_flag" = true ]; then
        test_list_tables
        echo ""
    fi
    
    if [ "$test_all_flag" = true ] || [ "$test_count_flag" = true ]; then
        test_count_records
        echo ""
    fi
    
    if [ "$test_all_flag" = true ] || [ "$test_sample_flag" = true ]; then
        test_sample_data
        echo ""
    fi
    
    if [ "$test_all_flag" = true ] || [ "$test_structure_flag" = true ]; then
        test_table_structure
        echo ""
    fi
    
    if [ "$test_all_flag" = true ] || [ "$test_performance_flag" = true ]; then
        test_performance
        echo ""
    fi
    
    if [ "$test_all_flag" = true ] || [ "$test_backup_flag" = true ]; then
        test_backup
        echo ""
    fi
    
    echo "🎉 Database operations test completed!"
}

# Run main function
main "$@" 