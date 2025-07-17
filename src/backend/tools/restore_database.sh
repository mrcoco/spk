#!/bin/bash

# Script untuk restore database dari file backup SQL
# Menggunakan file backup-public.sql untuk mengembalikan data ke database

set -e  # Exit on error

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BACKUP_FILE="backup-public.sql"
FORCE=false
DROP_FIRST=false
VERIFY=false

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
    echo "🔄 Database Restore Tool"
    echo "========================"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --file FILE       File backup SQL (default: backup-public.sql)"
    echo "  -y, --force           Langsung restore tanpa konfirmasi"
    echo "  -d, --drop-first      Hapus database terlebih dahulu sebelum restore"
    echo "  -v, --verify          Verifikasi hasil restore"
    echo "  -h, --help            Tampilkan help ini"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Restore dengan konfirmasi"
    echo "  $0 -f backup-public.sql -y            # Restore tanpa konfirmasi"
    echo "  $0 -d -v                              # Drop database, restore, dan verifikasi"
    echo ""
}

# Function untuk membaca konfigurasi database dari config.py
get_db_config() {
    if [ ! -f "config.py" ]; then
        print_error "File config.py tidak ditemukan"
        exit 1
    fi
    
    # Ekstrak DATABASE_URL dari config.py
    DATABASE_URL=$(python3 -c "
import sys
sys.path.append('.')
try:
    from config import DATABASE_URL
    print(DATABASE_URL)
except ImportError:
    print('')
except Exception:
    print('')
")
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL tidak ditemukan di config.py"
        exit 1
    fi
    
    # Parse DATABASE_URL
    # Format: postgresql://username:password@host:port/database
    DB_URL=${DATABASE_URL#postgresql://}
    AUTH=${DB_URL%@*}
    REST=${DB_URL#*@}
    
    DB_USER=${AUTH%:*}
    DB_PASS=${AUTH#*:}
    DB_HOST_PORT=${REST%/*}
    DB_NAME=${REST#*/}
    
    DB_HOST=${DB_HOST_PORT%:*}
    DB_PORT=${DB_HOST_PORT#*:}
    
    # Set default port jika tidak ada
    if [ "$DB_HOST" = "$DB_PORT" ]; then
        DB_PORT="5432"
    fi
    
    print_info "Konfigurasi database:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
}

# Function untuk cek apakah database ada
check_database_exists() {
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1
}

# Function untuk membuat database
create_database() {
    print_info "Membuat database $DB_NAME..."
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Database $DB_NAME berhasil dibuat"
    else
        print_error "Gagal membuat database $DB_NAME"
        return 1
    fi
}

# Function untuk menghapus database
drop_database() {
    print_info "Menghapus database $DB_NAME..."
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Database $DB_NAME berhasil dihapus"
    else
        print_error "Gagal menghapus database $DB_NAME"
        return 1
    fi
}

# Function untuk restore database
restore_database() {
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "File backup tidak ditemukan: $BACKUP_FILE"
        return 1
    fi
    
    print_info "File backup: $BACKUP_FILE"
    print_info "Database target: $DB_NAME"
    print_info "User: $DB_USER"
    print_info "Host: $DB_HOST:$DB_PORT"
    
    if [ "$FORCE" = false ]; then
        echo ""
        read -p "⚠️  Apakah Anda yakin ingin melakukan restore? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Restore dibatalkan"
            return 1
        fi
    fi
    
    print_info "Memulai proses restore..."
    START_TIME=$(date +%s)
    
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        print_success "Restore berhasil selesai dalam ${DURATION} detik"
        print_success "Data telah berhasil dipulihkan dari backup"
    else
        print_error "Restore gagal"
        return 1
    fi
}

# Function untuk verifikasi restore
verify_restore() {
    print_info "Verifikasi hasil restore:"
    echo "----------------------------------------"
    
    TABLES=("mahasiswa" "nilai" "saw_criteria" "saw_results" "saw_final_results")
    
    for table in "${TABLES[@]}"; do
        COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM $table" 2>/dev/null)
        echo "📋 $table: $COUNT records"
    done
    
    MAHASISWA_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM mahasiswa" 2>/dev/null)
    NILAI_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM nilai" 2>/dev/null)
    
    echo "----------------------------------------"
    print_success "Verifikasi selesai: $MAHASISWA_COUNT mahasiswa, $NILAI_COUNT nilai"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -y|--force)
            FORCE=true
            shift
            ;;
        -d|--drop-first)
            DROP_FIRST=true
            shift
            ;;
        -v|--verify)
            VERIFY=true
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

# Main execution
echo "🔄 Database Restore Tool"
echo "========================"

# Dapatkan konfigurasi database
get_db_config

# Cek apakah database ada
if check_database_exists; then
    print_info "Database $DB_NAME sudah ada"
    
    if [ "$DROP_FIRST" = true ]; then
        if [ "$FORCE" = false ]; then
            echo ""
            read -p "⚠️  Hapus database $DB_NAME terlebih dahulu? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_warning "Operasi dibatalkan"
                exit 0
            fi
        fi
        
        if ! drop_database; then
            print_error "Gagal menghapus database"
            exit 1
        fi
        
        if ! create_database; then
            print_error "Gagal membuat database baru"
            exit 1
        fi
    else
        print_info "💡 Gunakan -d untuk menghapus database terlebih dahulu"
    fi
else
    print_info "Database $DB_NAME belum ada, akan dibuat"
    if ! create_database; then
        print_error "Gagal membuat database"
        exit 1
    fi
fi

# Lakukan restore
if ! restore_database; then
    print_error "Restore gagal"
    exit 1
fi

# Verifikasi jika diminta
if [ "$VERIFY" = true ]; then
    if ! verify_restore; then
        print_error "Verifikasi gagal"
        exit 1
    fi
fi

echo ""
print_success "Restore database selesai!"
print_info "💡 Tips: Gunakan './run_seeder.py' untuk menjalankan seeder jika diperlukan" 