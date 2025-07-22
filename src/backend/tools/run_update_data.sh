#!/bin/bash

# Script untuk update data contoh dengan status lulus aktual

echo "🚀 Memulai update data contoh dengan status lulus aktual..."

# Konfigurasi database
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"spk_db"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}

# File SQL
SQL_FILE="src/backend/tools/update_sample_data.sql"

# Cek apakah file SQL ada
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ File SQL tidak ditemukan: $SQL_FILE"
    exit 1
fi

echo "📁 File SQL: $SQL_FILE"
echo "🗄️  Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "🌐 Host: $DB_HOST:$DB_PORT"

# Cek koneksi database
echo "🔍 Mengecek koneksi database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Gagal terhubung ke database"
    exit 1
fi

echo "✅ Koneksi database berhasil"

# Cek apakah kolom sudah ada
echo "🔍 Mengecek apakah kolom status_lulus_aktual sudah ada..."
COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'mahasiswa' 
AND column_name = 'status_lulus_aktual';
")

if [ -z "$COLUMN_EXISTS" ]; then
    echo "❌ Kolom status_lulus_aktual belum ada"
    echo "💡 Jalankan ALTER TABLE terlebih dahulu:"
    echo "   ./src/backend/tools/run_alter_table.sh"
    exit 1
fi

echo "✅ Kolom status_lulus_aktual sudah ada"

# Cek jumlah data mahasiswa
echo "🔍 Mengecek jumlah data mahasiswa..."
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
echo "🔍 Mengecek data yang sudah ada status lulus..."
EXISTING_STATUS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT COUNT(*) FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL;
" | xargs)

echo "📊 Data dengan status lulus: $EXISTING_STATUS"

if [ "$EXISTING_STATUS" -gt 0 ]; then
    echo "⚠️  Sudah ada $EXISTING_STATUS data dengan status lulus"
    echo "❓ Update ulang data yang ada? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Dibatalkan"
        exit 1
    fi
fi

# Jalankan update data
echo "🔧 Menjalankan update data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Update data berhasil"
    
    # Verifikasi hasil update
    echo "🔍 Memverifikasi hasil update..."
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
    echo "🔍 Mengecek data untuk evaluasi FIS..."
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
    
    echo "🎉 Update data selesai!"
    echo "📋 Ringkasan:"
    echo "   ✅ Data status lulus aktual berhasil diupdate"
    echo "   ✅ Data siap untuk evaluasi FIS"
    
else
    echo "❌ Update data gagal"
    echo "💡 Cek log error di atas"
    exit 1
fi

echo ""
echo "📝 Langkah selanjutnya:"
echo "1. Jalankan batch klasifikasi FIS (jika belum)"
echo "2. Test endpoint evaluasi FIS"
echo "3. Jalankan evaluasi dari frontend"

echo ""
echo "🔧 Test endpoint evaluasi FIS:"
echo "curl -X POST http://localhost:8000/api/fuzzy/evaluate-with-actual-status" 