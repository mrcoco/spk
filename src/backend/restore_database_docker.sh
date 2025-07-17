#!/bin/bash

# Script untuk restore database di Docker environment
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
CONTAINER_NAME="spk-backend-1"

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
    echo "🔄 Database Restore Tool (Docker)"
    echo "=================================="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --file FILE       File backup SQL (default: backup-public.sql)"
    echo "  -y, --force           Langsung restore tanpa konfirmasi"
    echo "  -d, --drop-first      Hapus database terlebih dahulu sebelum restore"
    echo "  -v, --verify          Verifikasi hasil restore"
    echo "  -c, --container NAME  Nama container backend (default: spk-backend-1)"
    echo "  -h, --help            Tampilkan help ini"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Restore dengan konfirmasi"
    echo "  $0 -f backup-public.sql -y            # Restore tanpa konfirmasi"
    echo "  $0 -d -v                              # Drop database, restore, dan verifikasi"
    echo "  $0 -c my-backend-container            # Restore ke container custom"
    echo ""
}

# Function untuk cek apakah container berjalan
check_container_running() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        print_error "Container ${CONTAINER_NAME} tidak berjalan"
        print_info "Containers yang berjalan:"
        docker ps --format "table {{.Names}}\t{{.Status}}"
        exit 1
    fi
}

# Function untuk cek apakah file backup ada
check_backup_file() {
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "File backup tidak ditemukan: $BACKUP_FILE"
        print_info "File yang tersedia:"
        ls -la *.sql 2>/dev/null || echo "Tidak ada file .sql"
        exit 1
    fi
}

# Function untuk copy file backup ke container
copy_backup_to_container() {
    print_info "Mengcopy file backup ke container..."
    docker cp "$BACKUP_FILE" "${CONTAINER_NAME}:/tmp/backup-public.sql"
    if [ $? -eq 0 ]; then
        print_success "File backup berhasil dicopy ke container"
    else
        print_error "Gagal copy file backup ke container"
        exit 1
    fi
}

# Function untuk restore database di container
restore_database_in_container() {
    print_info "Memulai proses restore di container..."
    
    if [ "$FORCE" = false ]; then
        echo ""
        read -p "⚠️  Apakah Anda yakin ingin melakukan restore? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Restore dibatalkan"
            return 1
        fi
    fi
    
    # Drop database jika diminta
    if [ "$DROP_FIRST" = true ]; then
        print_info "Menghapus database terlebih dahulu..."
        docker exec "${CONTAINER_NAME}" python -c "
from database import engine
engine.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
print('Database berhasil dihapus dan dibuat ulang')
"
    fi
    
    # Restore menggunakan psql di dalam container
    print_info "Restore database dari backup..."
    docker exec "${CONTAINER_NAME}" psql -h localhost -p 5432 -U spk_user -d spk_db -f /tmp/backup-public.sql
    
    if [ $? -eq 0 ]; then
        print_success "Restore berhasil selesai"
    else
        print_error "Restore gagal"
        return 1
    fi
}

# Function untuk verifikasi restore
verify_restore() {
    print_info "Verifikasi hasil restore:"
    echo "----------------------------------------"
    
    # Cek jumlah data di setiap tabel
    docker exec "${CONTAINER_NAME}" python -c "
from database import engine
tables = ['mahasiswa', 'nilai', 'saw_criteria', 'saw_results', 'saw_final_results']
for table in tables:
    result = engine.execute(f'SELECT COUNT(*) FROM {table}')
    count = result.fetchone()[0]
    print(f'📋 {table}: {count} records')

# Cek data mahasiswa dan nilai
result = engine.execute('SELECT COUNT(*) FROM mahasiswa')
mahasiswa_count = result.fetchone()[0]
result = engine.execute('SELECT COUNT(*) FROM nilai')
nilai_count = result.fetchone()[0]
print('----------------------------------------')
print(f'✅ Verifikasi selesai: {mahasiswa_count} mahasiswa, {nilai_count} nilai')
"
}

# Function untuk cleanup file temporary
cleanup_temp_files() {
    print_info "Membersihkan file temporary..."
    docker exec "${CONTAINER_NAME}" rm -f /tmp/backup-public.sql
    print_success "Cleanup selesai"
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
        -c|--container)
            CONTAINER_NAME="$2"
            shift 2
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
echo "🔄 Database Restore Tool (Docker)"
echo "=================================="

# Cek apakah Docker berjalan
if ! docker info >/dev/null 2>&1; then
    print_error "Docker tidak berjalan atau tidak dapat diakses"
    exit 1
fi

# Cek container
check_container_running

# Cek file backup
check_backup_file

print_info "Container: $CONTAINER_NAME"
print_info "File backup: $BACKUP_FILE"

# Copy file backup ke container
copy_backup_to_container

# Restore database
if ! restore_database_in_container; then
    print_error "Restore gagal"
    cleanup_temp_files
    exit 1
fi

# Verifikasi jika diminta
if [ "$VERIFY" = true ]; then
    verify_restore
fi

# Cleanup
cleanup_temp_files

echo ""
print_success "Restore database selesai!"
print_info "💡 Tips: Gunakan 'docker exec ${CONTAINER_NAME} python run_seeder.py' untuk menjalankan seeder jika diperlukan" 