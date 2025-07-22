#!/bin/bash

# Script untuk validasi environment variables
# Memastikan semua environment variables yang diperlukan sudah diset

set -e

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function untuk print dengan warna
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function untuk menampilkan help
show_help() {
    echo "🔍 Environment Variables Validator"
    echo "=================================="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --file FILE     File environment variables untuk divalidasi"
    echo "  -e, --env           Validasi environment variables yang sudah diset"
    echo "  -a, --all           Validasi semua (file dan environment)"
    echo "  -h, --help          Tampilkan help ini"
    echo ""
    echo "Examples:"
    echo "  $0 -f .env                    # Validasi file .env"
    echo "  $0 -e                         # Validasi environment variables"
    echo "  $0 -a                         # Validasi semua"
    echo "  $0 -f src/backend/env.backend # Validasi file backend"
    echo ""
}

# Function untuk validasi file environment variables
validate_env_file() {
    local file_path="$1"
    
    if [ ! -f "$file_path" ]; then
        print_error "File $file_path tidak ditemukan"
        return 1
    fi
    
    print_info "Validasi file: $file_path"
    echo "----------------------------------------"
    
    # Required variables untuk aplikasi SPK
    local required_vars=(
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "POSTGRES_HOST"
        "POSTGRES_PORT"
        "POSTGRES_DB"
        "DATABASE_URL"
        "SECRET_KEY"
        "DEBUG"
        "ENVIRONMENT"
    )
    
    # Optional variables
    local optional_vars=(
        "HOST"
        "PORT"
        "WORKERS"
        "CORS_ORIGINS"
        "CORS_HEADERS"
        "CORS_METHODS"
        "API_PREFIX"
        "API_VERSION"
        "LOG_LEVEL"
        "TIMEZONE"
        "MAX_FILE_SIZE"
        "UPLOAD_FOLDER"
        "ALLOWED_EXTENSIONS"
        "ALLOWED_HOSTS"
        "RATE_LIMIT_ENABLED"
        "RATE_LIMIT_REQUESTS"
        "RATE_LIMIT_WINDOW"
        "HEALTH_CHECK_ENABLED"
        "METRICS_ENABLED"
        "RELOAD_ON_CHANGE"
        "AUTO_MIGRATE"
        "SEED_DATA"
    )
    
    local missing_required=()
    local missing_optional=()
    local found_vars=()
    
    # Check required variables
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" "$file_path"; then
            print_success "$var: ditemukan"
            found_vars+=("$var")
        else
            print_error "$var: TIDAK DITEMUKAN"
            missing_required+=("$var")
        fi
    done
    
    # Check optional variables
    for var in "${optional_vars[@]}"; do
        if grep -q "^${var}=" "$file_path"; then
            print_success "$var: ditemukan (optional)"
            found_vars+=("$var")
        else
            print_warning "$var: tidak ditemukan (optional)"
            missing_optional+=("$var")
        fi
    done
    
    # Summary
    echo ""
    echo "📊 Summary:"
    echo "----------------------------------------"
    echo "✅ Found variables: ${#found_vars[@]}"
    echo "❌ Missing required: ${#missing_required[@]}"
    echo "⚠️  Missing optional: ${#missing_optional[@]}"
    
    if [ ${#missing_required[@]} -gt 0 ]; then
        echo ""
        print_error "Missing required variables:"
        for var in "${missing_required[@]}"; do
            echo "  - $var"
        done
        return 1
    else
        print_success "Semua required variables ditemukan!"
        return 0
    fi
}

# Function untuk validasi environment variables yang sudah diset
validate_environment() {
    print_info "Validasi environment variables yang sudah diset"
    echo "----------------------------------------"
    
    # Required variables
    local required_vars=(
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "POSTGRES_HOST"
        "POSTGRES_PORT"
        "POSTGRES_DB"
        "DATABASE_URL"
        "SECRET_KEY"
        "DEBUG"
        "ENVIRONMENT"
    )
    
    local missing_required=()
    local found_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_success "$var: ${!var}"
            found_vars+=("$var")
        else
            print_error "$var: TIDAK DISET"
            missing_required+=("$var")
        fi
    done
    
    # Summary
    echo ""
    echo "📊 Summary:"
    echo "----------------------------------------"
    echo "✅ Set variables: ${#found_vars[@]}"
    echo "❌ Missing variables: ${#missing_required[@]}"
    
    if [ ${#missing_required[@]} -gt 0 ]; then
        echo ""
        print_error "Missing environment variables:"
        for var in "${missing_required[@]}"; do
            echo "  - $var"
        done
        return 1
    else
        print_success "Semua required environment variables sudah diset!"
        return 0
    fi
}

# Function untuk test database connection
test_database_connection() {
    print_info "Test koneksi database..."
    echo "----------------------------------------"
    
    # Check if required database variables are set
    local db_vars=("POSTGRES_HOST" "POSTGRES_PORT" "POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB")
    local missing_db_vars=()
    
    for var in "${db_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_db_vars+=("$var")
        fi
    done
    
    if [ ${#missing_db_vars[@]} -gt 0 ]; then
        print_error "Database variables tidak lengkap:"
        for var in "${missing_db_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    # Test connection using psql
    if command -v psql &> /dev/null; then
        if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" &> /dev/null; then
            print_success "Database connection successful"
            return 0
        else
            print_error "Database connection failed"
            return 1
        fi
    else
        print_warning "psql tidak ditemukan, skip database connection test"
        return 0
    fi
}

# Function untuk validasi format DATABASE_URL
validate_database_url() {
    if [ -n "$DATABASE_URL" ]; then
        print_info "Validasi format DATABASE_URL..."
        echo "----------------------------------------"
        
        if [[ "$DATABASE_URL" =~ ^postgresql://[^:]+:[^@]+@[^:]+:[0-9]+/[^?]+ ]]; then
            print_success "DATABASE_URL format valid"
            return 0
        else
            print_error "DATABASE_URL format tidak valid"
            print_info "Expected format: postgresql://user:password@host:port/database"
            return 1
        fi
    else
        print_warning "DATABASE_URL tidak diset"
        return 0
    fi
}

# Main function
main() {
    local validate_file=false
    local validate_env=false
    local validate_all=false
    local file_path=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--file)
                validate_file=true
                file_path="$2"
                shift 2
                ;;
            -e|--env)
                validate_env=true
                shift
                ;;
            -a|--all)
                validate_all=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Default behavior
    if [ "$validate_file" = false ] && [ "$validate_env" = false ] && [ "$validate_all" = false ]; then
        validate_all=true
    fi
    
    # Load environment variables from .env if exists
    if [ -f ".env" ]; then
        print_info "Loading environment variables from .env"
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    local exit_code=0
    
    # Validate file
    if [ "$validate_file" = true ] || [ "$validate_all" = true ]; then
        if [ -n "$file_path" ]; then
            validate_env_file "$file_path" || exit_code=1
        else
            # Try common env files
            local env_files=(".env" "src/backend/.env" "src/backend/env.backend" "docker-compose.env")
            local found_file=false
            
            for env_file in "${env_files[@]}"; do
                if [ -f "$env_file" ]; then
                    validate_env_file "$env_file" || exit_code=1
                    found_file=true
                    break
                fi
            done
            
            if [ "$found_file" = false ]; then
                print_error "Tidak ada file environment variables yang ditemukan"
                print_info "Coba buat file .env atau gunakan -f untuk specify file"
                exit_code=1
            fi
        fi
    fi
    
    # Validate environment
    if [ "$validate_env" = true ] || [ "$validate_all" = true ]; then
        validate_environment || exit_code=1
        validate_database_url || exit_code=1
        test_database_connection || exit_code=1
    fi
    
    # Final summary
    echo ""
    echo "🎯 Final Result:"
    echo "----------------------------------------"
    if [ $exit_code -eq 0 ]; then
        print_success "Environment variables validation PASSED"
    else
        print_error "Environment variables validation FAILED"
    fi
    
    exit $exit_code
}

# Run main function
main "$@" 