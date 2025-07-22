#!/bin/bash

# Script untuk menjalankan perbandingan evaluasi FIS dengan Docker
# Membandingkan evaluasi FIS yang sebelumnya dengan evaluasi menggunakan data aktual

echo "🐳 FIS Evaluation Comparison Tool (Docker)"
echo "=========================================="

# Konfigurasi
CONTAINER_NAME=${CONTAINER_NAME:-"spk-backend-1"}
BACKEND_URL=${BACKEND_URL:-"http://localhost:8000"}
OUTPUT_DIR=${OUTPUT_DIR:-"./results"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Fungsi untuk mengecek apakah container berjalan
check_container() {
    echo "🔍 Mengecek status container..."
    
    if docker ps --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
        echo "✅ Container $CONTAINER_NAME berjalan"
        return 0
    else
        echo "❌ Container $CONTAINER_NAME tidak berjalan"
        echo "   Pastikan container berjalan dengan: docker-compose up backend"
        return 1
    fi
}

# Fungsi untuk mengecek apakah backend dapat diakses
check_backend() {
    echo "🔍 Mengecek status backend..."
    
    if docker exec "$CONTAINER_NAME" curl -s "$BACKEND_URL/" > /dev/null 2>&1; then
        echo "✅ Backend berjalan di $BACKEND_URL"
        return 0
    else
        echo "❌ Backend tidak dapat diakses di $BACKEND_URL"
        return 1
    fi
}

# Fungsi untuk mengecek apakah script ada di container
check_script() {
    echo "🔍 Mengecek script perbandingan..."
    
    if docker exec "$CONTAINER_NAME" test -f "/app/tools/compare_evaluations.py"; then
        echo "✅ Script perbandingan ditemukan: compare_evaluations.py"
        return 0
    else
        echo "❌ Script perbandingan tidak ditemukan"
        return 1
    fi
}

# Fungsi untuk menjalankan perbandingan
run_comparison() {
    echo "🚀 Menjalankan perbandingan evaluasi FIS dengan Docker..."
    echo "📊 Container: $CONTAINER_NAME"
    echo "📊 Backend URL: $BACKEND_URL"
    echo ""
    
    # Jalankan script perbandingan
    docker exec -it "$CONTAINER_NAME" python /app/tools/compare_evaluations.py
    
    # Cek exit code
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Perbandingan evaluasi FIS berhasil diselesaikan!"
        return 0
    else
        echo ""
        echo "❌ Perbandingan evaluasi FIS gagal!"
        return 1
    fi
}

# Fungsi untuk copy hasil ke host machine
copy_results() {
    echo "📁 Menyalin hasil perbandingan ke host machine..."
    
    # Buat direktori output jika belum ada
    mkdir -p "$OUTPUT_DIR"
    
    # Cari file hasil perbandingan di container
    RESULT_FILE=$(docker exec "$CONTAINER_NAME" find /app -name "fis_evaluation_comparison_*.json" -type f 2>/dev/null | head -1)
    
    if [ -n "$RESULT_FILE" ]; then
        # Copy file ke host machine
        HOST_FILE="$OUTPUT_DIR/fis_evaluation_comparison_${TIMESTAMP}.json"
        docker cp "$CONTAINER_NAME:$RESULT_FILE" "$HOST_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Hasil perbandingan disalin ke: $HOST_FILE"
            
            # Tampilkan preview hasil
            echo ""
            echo "📊 Preview Hasil Perbandingan:"
            echo "================================"
            head -20 "$HOST_FILE"
            echo "..."
            echo "================================"
            
            return 0
        else
            echo "❌ Gagal menyalin hasil perbandingan"
            return 1
        fi
    else
        echo "❌ File hasil perbandingan tidak ditemukan di container"
        return 1
    fi
}

# Fungsi untuk menampilkan bantuan
show_help() {
    echo "Penggunaan: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help              Menampilkan bantuan ini"
    echo "  -c, --container NAME    Set nama container (default: spk-backend-1)"
    echo "  -u, --url URL           Set backend URL (default: http://localhost:8000)"
    echo "  -o, --output DIR        Set direktori output (default: ./results)"
    echo "  -s, --skip-checks       Skip pre-flight checks"
    echo "  -n, --no-copy           Jangan copy hasil ke host machine"
    echo ""
    echo "CONTOH:"
    echo "  $0                           # Jalankan dengan default settings"
    echo "  $0 -c my-backend            # Jalankan dengan container custom"
    echo "  $0 -o ./my-results          # Set direktori output custom"
    echo "  $0 --skip-checks            # Skip checks dan langsung jalankan"
    echo "  $0 --no-copy                # Jangan copy hasil ke host"
    echo ""
}

# Parse command line arguments
SKIP_CHECKS=false
COPY_RESULTS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--container)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -u|--url)
            BACKEND_URL="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -s|--skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        -n|--no-copy)
            COPY_RESULTS=false
            shift
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
echo "🔧 Konfigurasi:"
echo "   Container: $CONTAINER_NAME"
echo "   Backend URL: $BACKEND_URL"
echo "   Output Directory: $OUTPUT_DIR"
echo "   Skip Checks: $SKIP_CHECKS"
echo "   Copy Results: $COPY_RESULTS"
echo ""

if [ "$SKIP_CHECKS" = false ]; then
    echo "🔍 Melakukan pre-flight checks..."
    echo ""
    
    # Cek container
    if ! check_container; then
        exit 1
    fi
    
    # Cek backend
    if ! check_backend; then
        exit 1
    fi
    
    # Cek script
    if ! check_script; then
        exit 1
    fi
    
    echo ""
    echo "✅ Semua checks berhasil!"
    echo ""
fi

# Jalankan perbandingan
if run_comparison; then
    echo ""
    
    # Copy hasil jika diminta
    if [ "$COPY_RESULTS" = true ]; then
        if copy_results; then
            echo ""
            echo "📁 Hasil perbandingan tersedia di: $OUTPUT_DIR"
        else
            echo ""
            echo "⚠️ Gagal menyalin hasil, tetapi perbandingan berhasil"
        fi
    fi
    
    echo ""
    echo "🎉 Perbandingan evaluasi FIS dengan Docker berhasil diselesaikan!"
else
    echo ""
    echo "❌ Perbandingan evaluasi FIS dengan Docker gagal!"
    exit 1
fi

echo ""
echo "📚 Dokumentasi:"
echo "   - Hasil perbandingan: $OUTPUT_DIR/"
echo "   - Dokumentasi lengkap: docs/evaluation/"
echo "   - Tools: src/backend/tools/"
echo "" 