# Database Restore Guide

## 🎯 Overview

Aplikasi SPK Monitoring Masa Studi memiliki beberapa metode untuk restore database, tergantung pada kebutuhan dan situasi:

1. **Full Restore** - Restore seluruh database sekaligus
2. **Restore by Table** - Restore per-tabel untuk menghindari timeout
3. **Test Restore** - Test restore dengan database kosong

## 📋 Metode Restore

### 1. Full Restore (Metode Lama)
**File:** `restore_database_container.py`

**Kelebihan:**
- ✅ Sederhana dan cepat untuk database kecil
- ✅ Satu command untuk restore semua

**Kekurangan:**
- ❌ Timeout untuk database besar (>30MB)
- ❌ Tidak bisa resume jika gagal
- ❌ Sulit untuk monitoring progress

**Penggunaan:**
```bash
# Restore dengan file default
./restore_database_container.sh

# Restore dengan file custom
./restore_database_container.sh my-backup.sql
```

### 2. Restore by Table (Metode Baru - RECOMMENDED)
**File:** `restore_database_by_table.py`

**Kelebihan:**
- ✅ Menghindari timeout pada database besar
- ✅ Progress monitoring per tabel
- ✅ Batch processing untuk tabel besar
- ✅ Bisa resume dari tabel yang gagal
- ✅ Error handling yang lebih baik

**Kekurangan:**
- ❌ Lebih kompleks
- ❌ Memerlukan waktu lebih lama

**Penggunaan:**
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

### 3. Test Restore (Untuk Testing)
**File:** `test_restore_by_table.py`

**Kelebihan:**
- ✅ Test lengkap dengan database kosong
- ✅ Verifikasi otomatis
- ✅ Clean state untuk testing

**Kekurangan:**
- ❌ Menghapus semua data yang ada
- ❌ Hanya untuk testing

**Penggunaan:**
```bash
# Test dengan konfirmasi
./test_restore_by_table.sh

# Test tanpa konfirmasi
./test_restore_by_table.sh -f
```

## 🚀 Quick Start

### Untuk Production (Database Besar)
```bash
# 1. Stop backend sementara
docker-compose stop backend

# 2. Restore per-tabel
./restore_by_table.sh

# 3. Monitor progress (di terminal terpisah)
python3 monitor_restore.py monitor

# 4. Start backend
docker-compose start backend
```

### Untuk Development (Database Kecil)
```bash
# 1. Restore full
./restore_database_container.sh

# 2. Test koneksi
./test_db_connection.py
```

### Untuk Testing
```bash
# 1. Test restore lengkap
./test_restore_by_table.sh

# 2. Verify hasil
./test_db_connection.py
```

## 📊 Perbandingan Metode

| Metode | File Size | Timeout | Resume | Monitoring | Use Case |
|--------|-----------|---------|--------|------------|----------|
| Full Restore | < 10MB | 30 min | ❌ | ❌ | Development |
| Restore by Table | Any size | 5 min/batch | ✅ | ✅ | Production |
| Test Restore | Any size | 5 min/batch | ✅ | ✅ | Testing |

## 🔧 Konfigurasi

### Environment Variables
```bash
# Database configuration
DB_HOST=db
DB_PORT=5432
DB_NAME=spk_db
DB_USER=spk_user
DB_PASSWORD=spk_password
```

### Timeout Settings
```python
# restore_database_by_table.py
batch_size = 1000          # INSERT statements per batch
timeout_per_batch = 300    # 5 minutes per batch
total_timeout = 1800       # 30 minutes total

# restore_database_container.py
timeout = 1800             # 30 minutes total
```

## 📈 Monitoring

### Real-Time Progress
```bash
python3 monitor_restore.py monitor
```

**Output:**
```
🔍 Database Restore Progress Monitor
==================================================
Monitoring database: spk_db
Tables: mahasiswa, nilai, klasifikasi_kelulusan, saw_results, saw_criteria, saw_final_results
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

## 🛡️ Error Handling

### 1. Connection Errors
```bash
# Check database connection
./restore_by_table.sh -t

# Restart database container
docker-compose restart db
```

### 2. Timeout Errors
```bash
# Increase timeout in script
# Edit: restore_database_by_table.py
# Change: timeout=300 to timeout=600
```

### 3. Memory Issues
```bash
# Reduce batch size
# Edit: restore_database_by_table.py
# Change: batch_size = 1000 to batch_size = 500
```

### 4. File Not Found
```bash
# Check backup file
ls -la backup-public.sql

# Copy backup file to container
docker cp backup-public.sql spk-backend-1:/app/
```

## 📋 Script Files

### Core Scripts
1. **restore_database_container.py** - Full restore script
2. **restore_database_by_table.py** - Per-table restore script
3. **test_restore_by_table.py** - Test restore script

### Shell Scripts
1. **restore_database_container.sh** - Full restore wrapper
2. **restore_by_table.sh** - Per-table restore wrapper
3. **test_restore_by_table.sh** - Test restore wrapper

### Monitoring Scripts
1. **monitor_restore.py** - Real-time progress monitoring
2. **test_db_connection.py** - Database connection test

## 🎯 Best Practices

### 1. Sebelum Restore
```bash
# Check disk space
df -h

# Check memory
free -h

# Stop backend
docker-compose stop backend

# Backup current database (optional)
docker exec -e PGPASSWORD=spk_password spk-backend-1 pg_dump -h db -p 5432 -U spk_user -d spk_db > backup-current.sql
```

### 2. Selama Restore
```bash
# Monitor progress
python3 monitor_restore.py monitor

# Check logs
docker logs spk-backend-1 -f

# Check container status
docker ps
```

### 3. Setelah Restore
```bash
# Verify restore
./test_db_connection.py

# Start backend
docker-compose start backend

# Test aplikasi
curl http://localhost:8000/health
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Database does not exist"
```bash
# Check if database exists
docker exec -e PGPASSWORD=spk_password spk-backend-1 psql -h db -p 5432 -U spk_user -d postgres -c "\l"

# Create database if not exists
docker exec -e PGPASSWORD=spk_password spk-backend-1 psql -h db -p 5432 -U spk_user -d postgres -c "CREATE DATABASE spk_db;"
```

#### 2. "Connection refused"
```bash
# Check database container
docker-compose ps

# Restart database
docker-compose restart db

# Wait for database to be ready
sleep 10
```

#### 3. "Permission denied"
```bash
# Check file permissions
ls -la *.sh

# Make scripts executable
chmod +x *.sh
```

#### 4. "Timeout expired"
```bash
# Increase timeout in script
# Edit the timeout value in the script

# Or use smaller batch size
# Edit batch_size in restore_database_by_table.py
```

## 📞 Support

### Logs
```bash
# Backend logs
docker logs spk-backend-1

# Database logs
docker logs spk-db-1

# Container status
docker-compose ps
```

### Debug Mode
```bash
# Run with verbose output
docker exec -it spk-backend-1 python restore_database_by_table.py backup-public.sql

# Check environment
docker exec -it spk-backend-1 env | grep DB
```

### Manual Commands
```bash
# Connect to database
docker exec -it spk-backend-1 psql -h db -p 5432 -U spk_user -d spk_db

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM mahasiswa;
SELECT COUNT(*) FROM nilai;
```

## 🎉 Kesimpulan

### Untuk Production
**Gunakan Restore by Table** karena:
- ✅ Menghindari timeout
- ✅ Progress monitoring
- ✅ Error handling yang baik
- ✅ Bisa resume jika gagal

### Untuk Development
**Gunakan Full Restore** karena:
- ✅ Sederhana dan cepat
- ✅ Cukup untuk database kecil
- ✅ Satu command

### Untuk Testing
**Gunakan Test Restore** karena:
- ✅ Clean state
- ✅ Verifikasi otomatis
- ✅ Test lengkap

**Metode Restore by Table adalah solusi terbaik untuk database besar!** 🚀 