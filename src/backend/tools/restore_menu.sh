#!/bin/bash

# Menu untuk memilih metode restore database
# SPK Monitoring Masa Studi

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_title() {
    echo -e "${CYAN}$1${NC}"
}

# Check if container is running
check_container() {
    if docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        return 0
    else
        return 1
    fi
}

# Show header
show_header() {
    clear
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                SPK MONITORING MASA STUDI                    ║"
    echo "║                   DATABASE RESTORE MENU                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
}

# Show menu
show_menu() {
    echo "📋 Pilih metode restore database:"
    echo ""
    echo "1️⃣  Full Restore (Metode Lama)"
    echo "   └─ Restore seluruh database sekaligus"
    echo "   └─ Cocok untuk database kecil (< 10MB)"
    echo "   └─ Timeout 30 menit"
    echo ""
    echo "2️⃣  Restore by Table (Metode Baru - RECOMMENDED)"
    echo "   └─ Restore per-tabel untuk menghindari timeout"
    echo "   └─ Cocok untuk database besar (> 10MB)"
    echo "   └─ Progress monitoring per tabel"
    echo "   └─ Batch processing untuk tabel besar"
    echo ""
    echo "3️⃣  Test Restore (Untuk Testing)"
    echo "   └─ Test restore dengan database kosong"
    echo "   └─ Drop database dan restore dari awal"
    echo "   └─ Verifikasi otomatis"
    echo ""
    echo "4️⃣  Monitor Progress"
    echo "   └─ Monitor progress restore secara real-time"
    echo "   └─ Lihat jumlah records per tabel"
    echo ""
    echo "5️⃣  Test Connection"
    echo "   └─ Test koneksi database"
    echo "   └─ Check tabel dan data"
    echo ""
    echo "6️⃣  Check Status"
    echo "   └─ Check container dan file status"
    echo ""
    echo "0️⃣  Exit"
    echo ""
}

# Show container status
show_status() {
    echo "🔍 Container Status:"
    echo "==================="
    
    if check_container; then
        log_success "Container ${CONTAINER_NAME} is running"
        
        # Check backup file
        if docker exec ${CONTAINER_NAME} test -f "/app/backup-public.sql"; then
            log_success "Backup file backup-public.sql exists"
        else
            log_warning "Backup file backup-public.sql not found"
        fi
        
        # Check psql
        if docker exec ${CONTAINER_NAME} which psql > /dev/null 2>&1; then
            log_success "psql is available"
        else
            log_warning "psql is not available"
        fi
        
    else
        log_error "Container ${CONTAINER_NAME} is not running"
        echo ""
        log_info "To start container:"
        echo "  docker-compose up -d"
    fi
    
    echo ""
}

# Handle menu selection
handle_selection() {
    local choice=$1
    
    case $choice in
        1)
            echo ""
            log_title "🚀 Full Restore (Metode Lama)"
            echo "=================================="
            echo ""
            log_warning "⚠️  WARNING: This method may timeout for large databases!"
            echo ""
            log_info "Features:"
            echo "  • Restore entire database at once"
            echo "  • 30 minutes timeout"
            echo "  • Simple and fast for small databases"
            echo ""
            read -p "Continue with Full Restore? (y/N): " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if check_container; then
                    log_info "Running Full Restore..."
                    ./restore_database_container.sh
                else
                    log_error "Container is not running"
                fi
            else
                log_info "Full Restore cancelled"
            fi
            ;;
            
        2)
            echo ""
            log_title "🚀 Restore by Table (Metode Baru - RECOMMENDED)"
            echo "=================================================="
            echo ""
            log_success "✅ This is the recommended method for large databases!"
            echo ""
            log_info "Features:"
            echo "  • Restore per-table to avoid timeout"
            echo "  • Progress monitoring per table"
            echo "  • Batch processing for large tables"
            echo "  • Can resume from failed tables"
            echo "  • Better error handling"
            echo ""
            log_info "Table order:"
            echo "  1. alembic_version"
            echo "  2. mahasiswa (1,604 records)"
            echo "  3. nilai (105,597 records) - Largest table"
            echo "  4. klasifikasi_kelulusan"
            echo "  5. saw_criteria"
            echo "  6. saw_results"
            echo "  7. saw_final_results"
            echo ""
            read -p "Continue with Restore by Table? (y/N): " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if check_container; then
                    log_info "Running Restore by Table..."
                    ./restore_by_table.sh
                else
                    log_error "Container is not running"
                fi
            else
                log_info "Restore by Table cancelled"
            fi
            ;;
            
        3)
            echo ""
            log_title "🧪 Test Restore (Untuk Testing)"
            echo "=================================="
            echo ""
            log_warning "⚠️  WARNING: This will DELETE ALL DATA in the database!"
            echo ""
            log_info "Features:"
            echo "  • Complete database reset"
            echo "  • Drop database and restore from scratch"
            echo "  • Automatic verification"
            echo "  • Clean state for testing"
            echo ""
            read -p "Continue with Test Restore? (y/N): " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if check_container; then
                    log_info "Running Test Restore..."
                    ./test_restore_by_table.sh
                else
                    log_error "Container is not running"
                fi
            else
                log_info "Test Restore cancelled"
            fi
            ;;
            
        4)
            echo ""
            log_title "📊 Monitor Progress"
            echo "===================="
            echo ""
            log_info "Starting real-time progress monitor..."
            echo "Press Ctrl+C to stop monitoring"
            echo ""
            
            if check_container; then
                python3 monitor_restore.py monitor
            else
                log_error "Container is not running"
            fi
            ;;
            
        5)
            echo ""
            log_title "🔍 Test Connection"
            echo "==================="
            echo ""
            log_info "Testing database connection..."
            echo ""
            
            if check_container; then
                docker exec ${CONTAINER_NAME} python test_db_connection.py
            else
                log_error "Container is not running"
            fi
            ;;
            
        6)
            echo ""
            log_title "📋 Check Status"
            echo "================"
            echo ""
            show_status
            ;;
            
        0)
            echo ""
            log_info "Goodbye! 👋"
            exit 0
            ;;
            
        *)
            echo ""
            log_error "Invalid choice: $choice"
            echo "Please select a valid option (0-6)"
            ;;
    esac
}

# Main function
main() {
    while true; do
        show_header
        show_status
        show_menu
        
        read -p "Enter your choice (0-6): " choice
        echo ""
        
        handle_selection $choice
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@" 