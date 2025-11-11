#!/bin/bash

# Script untuk mengupdate status_lulus_aktual menjadi 3 kategori
# Kategori: LULUS_TINGGI, LULUS_SEDANG, LULUS_KECIL

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}Update Status Lulus Aktual ke 3 Kategori${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Cek apakah script dijalankan dari directory yang benar
if [ ! -f "update_status_3_kategori.sql" ]; then
    echo -e "${RED}❌ Error: Script harus dijalankan dari directory src/backend/tools/${NC}"
    exit 1
fi

# Load environment variables
if [ -f "../env.local" ]; then
    echo -e "${GREEN}📂 Loading environment dari env.local${NC}"
    export $(grep -v '^#' ../env.local | xargs)
elif [ -f "../env.backend" ]; then
    echo -e "${GREEN}📂 Loading environment dari env.backend${NC}"
    export $(grep -v '^#' ../env.backend | xargs)
else
    echo -e "${YELLOW}⚠️  File env tidak ditemukan, menggunakan default values${NC}"
    export POSTGRES_HOST="localhost"
    export POSTGRES_PORT="5432"
    export POSTGRES_DB="spk_db"
    export POSTGRES_USER="spk_user"
    export POSTGRES_PASSWORD="spk_password"
fi

echo ""
echo -e "${BLUE}Konfigurasi Database:${NC}"
echo -e "  Host: ${POSTGRES_HOST}"
echo -e "  Port: ${POSTGRES_PORT}"
echo -e "  Database: ${POSTGRES_DB}"
echo -e "  User: ${POSTGRES_USER}"
echo ""

# Fungsi untuk menjalankan query
run_query() {
    PGPASSWORD=$POSTGRES_PASSWORD psql \
        -h $POSTGRES_HOST \
        -p $POSTGRES_PORT \
        -U $POSTGRES_USER \
        -d $POSTGRES_DB \
        -c "$1"
}

# 1. Cek status data sebelum update
echo -e "${YELLOW}📊 Status data SEBELUM update:${NC}"
run_query "
SELECT 
    status_lulus_aktual,
    COUNT(*) as jumlah
FROM mahasiswa
WHERE status_lulus_aktual IS NOT NULL
GROUP BY status_lulus_aktual
ORDER BY status_lulus_aktual;
"

echo ""
read -p "Lanjutkan update? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}⚠️  Update dibatalkan${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🔄 Memulai update...${NC}"
echo ""

# 2. Backup data lama (optional)
echo -e "${BLUE}💾 Membuat backup data lama...${NC}"
BACKUP_FILE="backup_status_lulus_$(date +%Y%m%d_%H%M%S).sql"
run_query "
CREATE TEMP TABLE temp_backup_status AS
SELECT nim, status_lulus_aktual, ipk, sks, persen_dek
FROM mahasiswa
WHERE status_lulus_aktual IS NOT NULL;
" > /dev/null 2>&1
echo -e "${GREEN}✅ Backup selesai${NC}"
echo ""

# 3. Jalankan update SQL script
echo -e "${BLUE}🔄 Menjalankan update status...${NC}"
PGPASSWORD=$POSTGRES_PASSWORD psql \
    -h $POSTGRES_HOST \
    -p $POSTGRES_PORT \
    -U $POSTGRES_USER \
    -d $POSTGRES_DB \
    -f update_status_3_kategori.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Update berhasil!${NC}"
else
    echo ""
    echo -e "${RED}❌ Update gagal!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}Update Selesai${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# 4. Tampilkan summary hasil
echo -e "${GREEN}📊 Summary Hasil Update:${NC}"
run_query "
SELECT 
    status_lulus_aktual,
    COUNT(*) as jumlah,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM mahasiswa WHERE status_lulus_aktual IS NOT NULL), 2) as persentase,
    ROUND(AVG(ipk), 2) as avg_ipk,
    ROUND(AVG(sks), 0) as avg_sks,
    ROUND(AVG(persen_dek), 2) as avg_dek
FROM mahasiswa
WHERE status_lulus_aktual IS NOT NULL
GROUP BY status_lulus_aktual
ORDER BY 
    CASE status_lulus_aktual
        WHEN 'LULUS_TINGGI' THEN 1
        WHEN 'LULUS_SEDANG' THEN 2
        WHEN 'LULUS_KECIL' THEN 3
        ELSE 4
    END;
"

echo ""
echo -e "${GREEN}✅ Semua proses selesai!${NC}"
echo ""
echo -e "${YELLOW}💡 Catatan:${NC}"
echo -e "  - Status LULUS_TINGGI: IPK >= 3.5, SKS >= 130, D/E/K <= 10%"
echo -e "  - Status LULUS_SEDANG: IPK >= 3.0, SKS >= 110, D/E/K <= 20%"
echo -e "  - Status LULUS_KECIL: Sisanya"
echo ""

