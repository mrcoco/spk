#!/bin/bash

# Script master untuk setup evaluasi FIS
# Menjalankan ALTER TABLE, update data, dan verifikasi

echo "🎯 SETUP EVALUASI FIS - SPK Monitoring Masa Studi"
echo "=================================================="

# Konfigurasi database dari environment atau default
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"spk_db"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}

echo "🗄️  Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "🌐 Host: $DB_HOST:$DB_PORT"
echo ""

# Fungsi untuk cek koneksi database
check_database_connection() {
    echo "🔍 Mengecek koneksi database..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
    
    if [ $? -ne 0 ]; then
        echo "❌ Gagal terhubung ke database"
        echo "💡 Pastikan:"
        echo "   - Database PostgreSQL berjalan"
        echo "   - Kredensial database benar"
        echo "   - Database $DB_NAME sudah dibuat"
        echo ""
        echo "🔧 Contoh setup environment:"
        echo "export DB_HOST=localhost"
        echo "export DB_PORT=5432"
        echo "export DB_NAME=spk_db"
        echo "export DB_USER=postgres"
        echo "export DB_PASSWORD=password"
        exit 1
    fi
    
    echo "✅ Koneksi database berhasil"
    echo ""
}

# Fungsi untuk menjalankan ALTER TABLE
run_alter_table() {
    echo "📋 STEP 1: ALTER TABLE"
    echo "======================"
    
    # Cek apakah kolom sudah ada
    COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'mahasiswa' 
    AND column_name = 'status_lulus_aktual';
    " | xargs)
    
    if [ -n "$COLUMN_EXISTS" ]; then
        echo "✅ Kolom status_lulus_aktual sudah ada"
        echo "⏭️  Skip ALTER TABLE"
        return 0
    fi
    
    echo "🔧 Menjalankan ALTER TABLE..."
    
    # Jalankan ALTER TABLE
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "src/backend/tools/alter_mahasiswa_table.sql"
    
    if [ $? -eq 0 ]; then
        echo "✅ ALTER TABLE berhasil"
    else
        echo "❌ ALTER TABLE gagal"
        exit 1
    fi
    
    echo ""
}

# Fungsi untuk update data
run_update_data() {
    echo "📋 STEP 2: UPDATE DATA"
    echo "======================"
    
    # Cek jumlah data mahasiswa
    TOTAL_MAHASISWA=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) FROM mahasiswa;
    " | xargs)
    
    echo "📊 Total mahasiswa: $TOTAL_MAHASISWA"
    
    if [ "$TOTAL_MAHASISWA" -eq 0 ]; then
        echo "❌ Tidak ada data mahasiswa"
        echo "💡 Tambahkan data mahasiswa terlebih dahulu"
        exit 1
    fi
    
    # Cek data yang sudah ada status lulus
    EXISTING_STATUS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL;
    " | xargs)
    
    echo "📊 Data dengan status lulus: $EXISTING_STATUS"
    
    if [ "$EXISTING_STATUS" -gt 0 ]; then
        echo "⚠️  Sudah ada data dengan status lulus"
        echo "❓ Update ulang data yang ada? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "⏭️  Skip update data"
            return 0
        fi
    fi
    
    echo "🔧 Menjalankan update data..."
    
    # Jalankan update data
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "src/backend/tools/update_sample_data.sql"
    
    if [ $? -eq 0 ]; then
        echo "✅ Update data berhasil"
    else
        echo "❌ Update data gagal"
        exit 1
    fi
    
    echo ""
}

# Fungsi untuk verifikasi setup
verify_setup() {
    echo "📋 STEP 3: VERIFIKASI SETUP"
    echo "============================"
    
    # Verifikasi kolom
    echo "🔍 Verifikasi kolom..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mahasiswa' 
AND column_name IN ('status_lulus_aktual', 'tanggal_lulus')
ORDER BY column_name;
"
    
    # Verifikasi data
    echo "🔍 Verifikasi data..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    status_lulus_aktual,
    COUNT(*) as jumlah_mahasiswa,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM mahasiswa), 2) as persentase
FROM mahasiswa 
WHERE status_lulus_aktual IS NOT NULL
GROUP BY status_lulus_aktual
ORDER BY status_lulus_aktual;
"
    
    # Cek data untuk evaluasi FIS
    echo "🔍 Cek data untuk evaluasi FIS..."
    EVALUATION_DATA=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) 
FROM mahasiswa m
LEFT JOIN klasifikasi_kelulusan k ON m.nim = k.nim
WHERE m.status_lulus_aktual IS NOT NULL AND k.nim IS NOT NULL;
" | xargs)
    
    echo "📊 Data siap untuk evaluasi FIS: $EVALUATION_DATA"
    
    if [ "$EVALUATION_DATA" -ge 10 ]; then
        echo "✅ Data cukup untuk evaluasi FIS (minimal 10 data)"
    else
        echo "⚠️  Data kurang untuk evaluasi FIS (minimal 10 data)"
        echo "💡 Jalankan batch klasifikasi FIS terlebih dahulu"
    fi
    
    echo ""
}

# Fungsi untuk test endpoint
test_endpoint() {
    echo "📋 STEP 4: TEST ENDPOINT"
    echo "========================"
    
    echo "🔧 Testing endpoint evaluasi FIS..."
    
    # Cek apakah backend berjalan
    BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ 2>/dev/null)
    
    if [ "$BACKEND_RESPONSE" = "200" ]; then
        echo "✅ Backend berjalan di http://localhost:8000"
        
        # Test endpoint evaluasi FIS
        echo "🔧 Testing endpoint evaluasi FIS..."
        EVAL_RESPONSE=$(curl -s -X POST http://localhost:8000/api/fuzzy/evaluate-with-actual-status \
            -H "Content-Type: application/json" \
            -d '{"test_size": 0.3, "random_state": 42}' 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo "✅ Endpoint evaluasi FIS berhasil diakses"
            echo "📊 Response: $EVAL_RESPONSE" | head -c 100
            echo "..."
        else
            echo "❌ Endpoint evaluasi FIS gagal diakses"
            echo "💡 Pastikan backend berjalan dan endpoint tersedia"
        fi
    else
        echo "❌ Backend tidak berjalan di http://localhost:8000"
        echo "💡 Jalankan backend terlebih dahulu"
    fi
    
    echo ""
}

# Main execution
main() {
    check_database_connection
    run_alter_table
    run_update_data
    verify_setup
    test_endpoint
    
    echo "🎉 SETUP EVALUASI FIS SELESAI!"
    echo "================================"
    echo ""
    echo "📝 Langkah selanjutnya:"
    echo "1. Jalankan batch klasifikasi FIS (jika belum):"
    echo "   curl -X POST http://localhost:8000/api/batch/klasifikasi"
    echo ""
    echo "2. Buka aplikasi frontend dan test evaluasi FIS"
    echo ""
    echo "3. Atau test via curl:"
    echo "   curl -X POST http://localhost:8000/api/fuzzy/evaluate-with-actual-status"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "- Jika data kurang, jalankan batch klasifikasi FIS"
    echo "- Jika backend error, cek log backend"
    echo "- Jika database error, cek koneksi database"
}

# Jalankan main function
main 