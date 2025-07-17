# Database Restore by Table

## 🎯 Overview

Metode restore per-tabel dirancang untuk mengatasi masalah timeout pada restore database besar. Dengan memecah proses restore menjadi per-tabel, kita dapat:

- ✅ **Menghindari timeout** - Setiap tabel diproses secara terpisah
- ✅ **Progress monitoring** - Melihat progress per tabel
- ✅ **Batch processing** - Tabel besar diproses dalam batch
- ✅ **Error handling** - Jika satu tabel gagal, tabel lain tetap bisa diproses
- ✅ **Resume capability** - Bisa melanjutkan dari tabel yang gagal

## 📋 Urutan Restore

Script akan restore tabel dalam urutan berikut (sesuai dependency):

1. **alembic_version** - Migration tracking
2. **mahasiswa** - Data mahasiswa (1,604 records)
3. **nilai** - Data nilai (105,597 records) - **Tabel terbesar**
4. **klasifikasi_kelulusan** - Hasil klasifikasi
5. **saw_criteria** - Kriteria SAW
6. **saw_results** - Hasil perhitungan SAW
7. **saw_final_results** - Hasil akhir SAW

## 🚀 Cara Menggunakan

### 1. Restore Per-Tabel
```bash
# Restore dengan file default
./restore_by_table.sh

# Restore dengan file custom
./restore_by_table.sh my-backup.sql

# Test koneksi saja
./restore_by_table.sh -t

# Check container dan file
./restore_by_table.sh -c
```

### 2. Monitor Progress
```bash
# Terminal 1: Jalankan restore
./restore_by_table.sh

# Terminal 2: Monitor progress real-time
python3 monitor_restore.py monitor
```

### 3. Manual dari Container
```bash
# Masuk ke container
docker exec -it spk-backend-1 bash

# Jalankan restore per-tabel
python restore_database_by_table.py backup-public.sql
```

## 🔧 Fitur Utama

### 1. **Extract Table Sections**
- Membaca backup file dan mengekstrak section per-tabel
- Menggunakan regex untuk memisahkan CREATE TABLE dan INSERT statements
- Mendeteksi dependency antar tabel

### 2. **Schema Restoration**
- Restore CREATE TABLE statement untuk setiap tabel
- Validasi schema sebelum restore data
- Error handling untuk schema yang sudah ada

### 3. **Batch Processing**
- Tabel besar (seperti `nilai`) diproses dalam batch 1,000 INSERT statements
- Timeout 5 menit per batch
- Progress monitoring per batch

### 4. **Verification**
- Verifikasi jumlah records setelah restore setiap tabel
- Validasi schema dan data integrity
- Summary report di akhir proses

## 📊 Performance Comparison

### Metode Full Restore (Lama)
```
File size: 30.04 MB
INSERT statements: 112,017
Estimated time: 15 minutes
Timeout: 30 minutes
Risk: Timeout jika ada masalah
```

### Metode Per-Tabel (Baru)
```
File size: 30.04 MB
Tables: 7 tables
Batch size: 1,000 statements
Timeout per batch: 5 minutes
Risk: Minimal, bisa resume dari tabel yang gagal
```

## 🛡️ Error Handling

### 1. **Table Not Found**
- Skip tabel yang tidak ada di backup
- Lanjutkan ke tabel berikutnya
- Report di summary

### 2. **Schema Error**
- Rollback schema jika gagal
- Skip tabel tersebut
- Lanjutkan ke tabel berikutnya

### 3. **Data Error**
- Rollback batch yang gagal
- Retry batch tersebut
- Jika masih gagal, skip tabel

### 4. **Connection Error**
- Retry koneksi 3x
- Jika masih gagal, exit dengan error

## 📈 Monitoring

### Real-Time Monitoring
```bash
python3 monitor_restore.py monitor
```

**Output:**
```
🔍 Database Restore Progress Monitor
==================================================
Monitoring database: spk_db
Tables to monitor: mahasiswa, nilai, klasifikasi_kelulusan, saw_results, saw_criteria, saw_final_results
Started at: 2024-01-15 15:30:00

📊 mahasiswa: 0 records
📊 nilai: 0 records
📊 klasifikasi_kelulusan: 0 records
...

⏳ Monitoring progress... (Press Ctrl+C to stop)
--------------------------------------------------

🕐 15:30:05
✅ mahasiswa: 1,604 records (+1,604)
⏳ nilai: 0 records
⏳ klasifikasi_kelulusan: 0 records
...
📈 Total records: 1,604
```

### Progress Indicators
- ✅ **Green**: Tabel berhasil di-restore
- ⏸️ **Yellow**: Tabel sudah ada data (no change)
- ⏳ **Blue**: Tabel sedang diproses atau belum ada data

## 🔍 Troubleshooting

### 1. **Tabel Gagal Restore**
```bash
# Check error log
docker logs spk-backend-1

# Check tabel yang sudah ada
docker exec -e PGPASSWORD=spk_password spk-backend-1 psql -h db -p 5432 -U spk_user -d spk_db -c "\dt"
```

### 2. **Timeout pada Batch**
```bash
# Increase batch timeout di script
# Edit file: restore_database_by_table.py
# Line: timeout=300  # 5 minutes per batch
# Change to: timeout=600  # 10 minutes per batch
```

### 3. **Memory Issues**
```bash
# Reduce batch size
# Edit file: restore_database_by_table.py
# Line: batch_size = 1000
# Change to: batch_size = 500
```

### 4. **Connection Issues**
```bash
# Check database connection
./restore_by_table.sh -t

# Restart database container
docker-compose restart db
```

## 📋 Script Files

### 1. **restore_database_by_table.py**
- Script utama untuk restore per-tabel
- Extract table sections dari backup
- Batch processing untuk tabel besar
- Verification per tabel

### 2. **restore_by_table.sh**
- Script shell untuk menjalankan restore
- Check container dan dependencies
- User confirmation
- Error handling

### 3. **monitor_restore.py**
- Real-time progress monitoring
- Estimasi waktu restore
- Verification hasil restore

## 🎯 Best Practices

### 1. **Sebelum Restore**
```bash
# Stop backend sementara
docker-compose stop backend

# Check disk space
df -h

# Check memory
free -h
```

### 2. **Selama Restore**
```bash
# Monitor progress di terminal terpisah
python3 monitor_restore.py monitor

# Check logs jika ada error
docker logs spk-backend-1 -f
```

### 3. **Setelah Restore**
```bash
# Verify semua tabel
./test_db_operations.sh -c

# Start backend
docker-compose start backend

# Test aplikasi
curl http://localhost:8000/health
```

## 📞 Support

Jika ada masalah dengan restore per-tabel:

1. **Check logs**: `docker logs spk-backend-1`
2. **Test koneksi**: `./restore_by_table.sh -t`
3. **Monitor progress**: `python3 monitor_restore.py monitor`
4. **Manual restore**: `docker exec -it spk-backend-1 python restore_database_by_table.py`

## 🎉 Keuntungan

### ✅ **Reliability**
- Tidak ada timeout pada restore besar
- Bisa resume dari tabel yang gagal
- Error handling yang lebih baik

### ✅ **Monitoring**
- Progress real-time per tabel
- Estimasi waktu yang akurat
- Verification otomatis

### ✅ **Flexibility**
- Bisa restore tabel tertentu saja
- Batch size yang bisa disesuaikan
- Timeout yang bisa dikonfigurasi

**Metode restore per-tabel adalah solusi terbaik untuk database besar dengan data yang kompleks!** 🚀 