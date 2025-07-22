#!/bin/bash

# Script untuk menjalankan ALTER TABLE pada tabel mahasiswa
# Menambahkan field status_lulus_aktual dan tanggal_lulus

echo "🚀 Memulai ALTER TABLE untuk tabel mahasiswa..."

# Konfigurasi database
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"spk_db"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"password"}

# File SQL
SQL_FILE="src/backend/tools/alter_mahasiswa_table.sql"

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
    echo "💡 Pastikan:"
    echo "   - Database PostgreSQL berjalan"
    echo "   - Kredensial database benar"
    echo "   - Database $DB_NAME sudah dibuat"
    exit 1
fi

echo "✅ Koneksi database berhasil"

# Backup tabel mahasiswa (opsional)
echo "💾 Membuat backup tabel mahasiswa..."
BACKUP_FILE="backup/mahasiswa_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p backup

PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t mahasiswa > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup berhasil: $BACKUP_FILE"
else
    echo "⚠️  Backup gagal, lanjutkan tanpa backup? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Dibatalkan"
        exit 1
    fi
fi

# Cek apakah kolom sudah ada
echo "🔍 Mengecek apakah kolom sudah ada..."
EXISTING_COLUMNS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'mahasiswa' 
AND column_name IN ('status_lulus_aktual', 'tanggal_lulus')
ORDER BY column_name;
")

if [ -n "$EXISTING_COLUMNS" ]; then
    echo "⚠️  Kolom berikut sudah ada:"
    echo "$EXISTING_COLUMNS"
    echo "❓ Lanjutkan dengan menambahkan kolom yang belum ada? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Dibatalkan"
        exit 1
    fi
fi

# Jalankan ALTER TABLE
echo "🔧 Menjalankan ALTER TABLE..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ ALTER TABLE berhasil dijalankan"
    
    # Verifikasi perubahan
    echo "🔍 Memverifikasi perubahan..."
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
    
    # Cek index
    echo "🔍 Memverifikasi index..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'mahasiswa' 
AND indexname LIKE '%status_lulus%';
"
    
    echo "🎉 ALTER TABLE selesai!"
    echo "📋 Ringkasan perubahan:"
    echo "   ✅ Kolom status_lulus_aktual ditambahkan"
    echo "   ✅ Kolom tanggal_lulus ditambahkan"
    echo "   ✅ Index idx_mahasiswa_status_lulus dibuat"
    echo "   ✅ Comment dokumentasi ditambahkan"
    
else
    echo "❌ ALTER TABLE gagal"
    echo "💡 Cek log error di atas"
    exit 1
fi

echo ""
echo "📝 Langkah selanjutnya:"
echo "1. Update data mahasiswa dengan status lulus aktual"
echo "2. Test endpoint evaluasi FIS"
echo "3. Jalankan evaluasi dari frontend"

echo ""
echo "🔧 Contoh update data:"
echo "UPDATE mahasiswa SET status_lulus_aktual = 'LULUS', tanggal_lulus = '2024-01-15' WHERE nim = '19812141079';"
echo "UPDATE mahasiswa SET status_lulus_aktual = 'BELUM_LULUS' WHERE nim = '19812141082';"
echo "UPDATE mahasiswa SET status_lulus_aktual = 'DROPOUT' WHERE nim = '19812141085';" 