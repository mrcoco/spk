# Script ALTER TABLE untuk Evaluasi FIS

## **Overview**

Script ini digunakan untuk menambahkan field `status_lulus_aktual` dan `tanggal_lulus` ke tabel `mahasiswa` untuk mendukung evaluasi FIS dengan data status lulus yang sebenarnya.

## **File yang Tersedia**

### **1. Script SQL**
- `alter_mahasiswa_table.sql` - Script ALTER TABLE utama
- `update_sample_data.sql` - Script untuk update data contoh

### **2. Script Shell**
- `run_alter_table.sh` - Script untuk menjalankan ALTER TABLE
- `run_update_data.sh` - Script untuk update data contoh
- `setup_fis_evaluation.sh` - Script master untuk setup lengkap

## **Cara Penggunaan**

### **Option 1: Setup Lengkap (Recommended)**

```bash
# Beri permission execute
chmod +x src/backend/tools/setup_fis_evaluation.sh

# Jalankan setup lengkap
./src/backend/tools/setup_fis_evaluation.sh
```

Script ini akan menjalankan:
1. ✅ Cek koneksi database
2. ✅ ALTER TABLE (jika belum ada)
3. ✅ Update data contoh
4. ✅ Verifikasi setup
5. ✅ Test endpoint

### **Option 2: Manual Step by Step**

#### **Step 1: ALTER TABLE**
```bash
# Beri permission execute
chmod +x src/backend/tools/run_alter_table.sh

# Jalankan ALTER TABLE
./src/backend/tools/run_alter_table.sh
```

#### **Step 2: Update Data**
```bash
# Beri permission execute
chmod +x src/backend/tools/run_update_data.sh

# Jalankan update data
./src/backend/tools/run_update_data.sh
```

### **Option 3: Manual SQL**

#### **A. ALTER TABLE Manual**
```sql
-- Koneksi ke database PostgreSQL
psql -h localhost -p 5432 -U postgres -d spk_db

-- Jalankan script ALTER TABLE
\i src/backend/tools/alter_mahasiswa_table.sql
```

#### **B. Update Data Manual**
```sql
-- Jalankan script update data
\i src/backend/tools/update_sample_data.sql
```

## **Konfigurasi Database**

### **Environment Variables**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=spk_db
export DB_USER=postgres
export DB_PASSWORD=password
```

### **Docker Environment**
```bash
# Jika menggunakan Docker
export DB_HOST=postgres
export DB_PORT=5432
export DB_NAME=spk_db
export DB_USER=postgres
export DB_PASSWORD=password
```

## **Perubahan Database**

### **Field yang Ditambahkan**

#### **1. status_lulus_aktual**
- **Type:** VARCHAR(20)
- **Nullable:** TRUE
- **Values:** 'LULUS', 'BELUM_LULUS', 'DROPOUT'
- **Description:** Status lulus yang sebenarnya

#### **2. tanggal_lulus**
- **Type:** TIMESTAMP
- **Nullable:** TRUE
- **Description:** Tanggal lulus jika status_lulus_aktual = 'LULUS'

#### **3. Index**
- **Name:** idx_mahasiswa_status_lulus
- **Columns:** status_lulus_aktual
- **Purpose:** Optimasi query untuk evaluasi FIS

### **Contoh Data**

```sql
-- Mahasiswa yang sudah lulus
UPDATE mahasiswa 
SET status_lulus_aktual = 'LULUS', 
    tanggal_lulus = '2024-01-15 00:00:00' 
WHERE nim = '19812141079';

-- Mahasiswa yang belum lulus
UPDATE mahasiswa 
SET status_lulus_aktual = 'BELUM_LULUS' 
WHERE nim = '19812141082';

-- Mahasiswa yang dropout
UPDATE mahasiswa 
SET status_lulus_aktual = 'DROPOUT' 
WHERE nim = '19812141085';
```

## **Verifikasi Setup**

### **1. Cek Kolom**
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mahasiswa' 
AND column_name IN ('status_lulus_aktual', 'tanggal_lulus')
ORDER BY column_name;
```

### **2. Cek Data**
```sql
SELECT 
    status_lulus_aktual,
    COUNT(*) as jumlah_mahasiswa,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM mahasiswa), 2) as persentase
FROM mahasiswa 
WHERE status_lulus_aktual IS NOT NULL
GROUP BY status_lulus_aktual
ORDER BY status_lulus_aktual;
```

### **3. Cek Data untuk Evaluasi FIS**
```sql
SELECT COUNT(*) 
FROM mahasiswa m
LEFT JOIN klasifikasi_kelulusan k ON m.nim = k.nim
WHERE m.status_lulus_aktual IS NOT NULL AND k.nim IS NOT NULL;
```

## **Troubleshooting**

### **Error: "File SQL tidak ditemukan"**
```bash
# Pastikan berada di direktori root project
cd /path/to/spk
```

### **Error: "Gagal terhubung ke database"**
```bash
# Cek apakah PostgreSQL berjalan
sudo systemctl status postgresql

# Cek kredensial database
psql -h localhost -p 5432 -U postgres -d spk_db -c "SELECT version();"
```

### **Error: "Kolom sudah ada"**
```bash
# Script akan skip ALTER TABLE jika kolom sudah ada
# Ini normal dan tidak perlu dikhawatirkan
```

### **Error: "Tidak ada data mahasiswa"**
```bash
# Tambahkan data mahasiswa terlebih dahulu
# Atau restore dari backup database
```

### **Error: "Data kurang untuk evaluasi FIS"**
```bash
# Jalankan batch klasifikasi FIS
curl -X POST http://localhost:8000/api/batch/klasifikasi
```

## **Backup dan Restore**

### **Backup Tabel Mahasiswa**
```bash
# Backup sebelum ALTER TABLE
pg_dump -h localhost -p 5432 -U postgres -d spk_db -t mahasiswa > backup/mahasiswa_backup.sql
```

### **Restore Tabel Mahasiswa**
```bash
# Restore jika ada masalah
psql -h localhost -p 5432 -U postgres -d spk_db < backup/mahasiswa_backup.sql
```

## **Testing**

### **1. Test Endpoint Evaluasi FIS**
```bash
curl -X POST http://localhost:8000/api/fuzzy/evaluate-with-actual-status \
  -H "Content-Type: application/json" \
  -d '{"test_size": 0.3, "random_state": 42}'
```

### **2. Test dari Frontend**
1. Buka aplikasi frontend
2. Navigasi ke halaman FIS
3. Klik tombol "Evaluasi FIS dengan Data Aktual"
4. Lihat hasil evaluasi

### **3. Test Database Query**
```sql
-- Cek data untuk evaluasi
SELECT 
    m.nim,
    m.nama,
    m.status_lulus_aktual,
    k.kategori as prediksi_fis,
    k.nilai_fuzzy
FROM mahasiswa m
LEFT JOIN klasifikasi_kelulusan k ON m.nim = k.nim
WHERE m.status_lulus_aktual IS NOT NULL
ORDER BY m.nim
LIMIT 10;
```

## **Langkah Selanjutnya**

Setelah setup berhasil:

1. **Jalankan Batch Klasifikasi FIS** (jika belum):
   ```bash
   curl -X POST http://localhost:8000/api/batch/klasifikasi
   ```

2. **Test Evaluasi FIS**:
   ```bash
   curl -X POST http://localhost:8000/api/fuzzy/evaluate-with-actual-status \
     -H "Content-Type: application/json" \
     -d '{"test_size": 0.3, "random_state": 42}'
   ```

3. **Buka Frontend** dan test evaluasi FIS dari UI

4. **Analisis Hasil** evaluasi untuk perbaikan sistem FIS

## **Keamanan**

- ✅ Script membuat backup otomatis sebelum ALTER TABLE
- ✅ Script mengecek koneksi database sebelum eksekusi
- ✅ Script memverifikasi hasil setelah eksekusi
- ✅ Script memberikan feedback yang jelas untuk troubleshooting

## **Support**

Jika mengalami masalah:

1. Cek log error yang ditampilkan script
2. Pastikan koneksi database benar
3. Pastikan PostgreSQL berjalan
4. Pastikan berada di direktori root project
5. Cek file SQL ada dan dapat diakses 