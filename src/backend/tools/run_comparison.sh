#!/bin/bash

# Script untuk menjalankan perbandingan evaluasi FIS
# Membandingkan evaluasi FIS yang sebelumnya dengan evaluasi menggunakan data aktual

echo "🔬 FIS Evaluation Comparison Tool"
echo "=================================="

# Konfigurasi
BACKEND_URL=${BACKEND_URL:-"http://localhost:8000"}
PYTHON_SCRIPT="compare_evaluations.py"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fungsi untuk mengecek apakah backend berjalan
check_backend() {
    echo "🔍 Mengecek status backend..."
    
    if curl -s "$BACKEND_URL/" > /dev/null 2>&1; then
        echo "✅ Backend berjalan di $BACKEND_URL"
        return 0
    else
        echo "❌ Backend tidak dapat diakses di $BACKEND_URL"
        echo "   Pastikan backend berjalan dengan: docker-compose up backend"
        return 1
    fi
}

# Fungsi untuk mengecek apakah script Python ada
check_script() {
    if [ -f "$SCRIPT_DIR/$PYTHON_SCRIPT" ]; then
        echo "✅ Script perbandingan ditemukan: $PYTHON_SCRIPT"
        return 0
    else
        echo "❌ Script perbandingan tidak ditemukan: $PYTHON_SCRIPT"
        return 1
    fi
}

# Fungsi untuk mengecek dependensi Python
check_dependencies() {
    echo "🔍 Mengecek dependensi Python..."
    
    # Cek apakah requests tersedia
    if python3 -c "import requests" 2>/dev/null; then
        echo "✅ Module 'requests' tersedia"
    else
        echo "❌ Module 'requests' tidak tersedia"
        echo "   Install dengan: pip install requests"
        return 1
    fi
    
    return 0
}

# Fungsi untuk menjalankan perbandingan
run_comparison() {
    echo "🚀 Menjalankan perbandingan evaluasi FIS..."
    echo "📊 Backend URL: $BACKEND_URL"
    echo ""
    
    # Pindah ke direktori script
    cd "$SCRIPT_DIR"
    
    # Jalankan script Python
    python3 "$PYTHON_SCRIPT"
    
    # Cek exit code
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Perbandingan evaluasi FIS berhasil diselesaikan!"
        echo "📁 Hasil perbandingan disimpan di direktori: $SCRIPT_DIR"
    else
        echo ""
        echo "❌ Perbandingan evaluasi FIS gagal!"
        exit 1
    fi
}

# Fungsi untuk menampilkan bantuan
show_help() {
    echo "Penggunaan: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help          Menampilkan bantuan ini"
    echo "  -u, --url URL       Set backend URL (default: http://localhost:8000)"
    echo "  -s, --skip-checks   Skip pre-flight checks"
    echo ""
    echo "CONTOH:"
    echo "  $0                           # Jalankan dengan default settings"
    echo "  $0 -u http://localhost:8001  # Jalankan dengan backend URL custom"
    echo "  $0 --skip-checks             # Skip checks dan langsung jalankan"
    echo ""
}

# Parse command line arguments
SKIP_CHECKS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            BACKEND_URL="$2"
            shift 2
            ;;
        -s|--skip-checks)
            SKIP_CHECKS=true
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
echo "   Backend URL: $BACKEND_URL"
echo "   Skip Checks: $SKIP_CHECKS"
echo ""

if [ "$SKIP_CHECKS" = false ]; then
    echo "🔍 Melakukan pre-flight checks..."
    echo ""
    
    # Cek backend
    if ! check_backend; then
        exit 1
    fi
    
    # Cek script
    if ! check_script; then
        exit 1
    fi
    
    # Cek dependensi
    if ! check_dependencies; then
        exit 1
    fi
    
    echo ""
    echo "✅ Semua checks berhasil!"
    echo ""
fi

# Jalankan perbandingan
run_comparison

echo ""
echo "🎉 Selesai!" 