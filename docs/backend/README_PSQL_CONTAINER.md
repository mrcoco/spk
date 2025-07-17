# PostgreSQL Client (psql) di Container Backend

Dokumentasi ini menjelaskan penggunaan PostgreSQL client (psql) yang telah ditambahkan ke Dockerfile backend untuk operasi database.

## Fitur yang Ditambahkan

### 1. PostgreSQL Client di Dockerfile
```dockerfile
FROM python:3.9-slim

# Install system dependencies including PostgreSQL client
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

### 2. Script Testing dan Restore
- ✅ `test_db_connection.py` - Test koneksi database menggunakan psql
- ✅ `restore_database_container.py` - Restore database dari dalam container
- ✅ `restore_from_container.sh` - Script shell untuk menjalankan restore

## Cara Menggunakan

### 1. Test Koneksi Database

#### A. Dari Host (menggunakan script)
```bash
cd src/backend
./restore_from_container.sh -t
```

#### B. Dari dalam Container
```bash
# Masuk ke container
docker exec -it spk-backend bash

# Test koneksi
python test_db_connection.py
```

#### C. Manual psql dari Container
```bash
# Masuk ke container
docker exec -it spk-backend bash

# Test koneksi dengan psql
psql -h db -p 5432 -U postgres -d spk_db -c "SELECT version();"
```

### 2. Restore Database

#### A. Menggunakan Script Otomatis
```bash
cd src/backend
./restore_from_container.sh
```

#### B. Dengan Backup File Custom
```bash
cd src/backend
./restore_from_container.sh my-backup.sql
```

#### C. Manual dari dalam Container
```bash
# Masuk ke container
docker exec -it spk-backend bash

# Restore database
python restore_database_container.py backup-public.sql
```

### 3. Operasi Database Lainnya

#### A. List Tables
```bash
docker exec spk-backend psql -h db -p 5432 -U postgres -d spk_db -c "\dt"
```

#### B. Count Records
```bash
docker exec spk-backend psql -h db -p 5432 -U postgres -d spk_db -c "SELECT COUNT(*) FROM mahasiswa;"
```

#### C. Backup Database
```bash
docker exec spk-backend pg_dump -h db -p 5432 -U postgres spk_db > backup.sql
```

## Script Testing

### 1. `test_db_connection.py`
Script untuk test koneksi database menggunakan psql.

**Fitur:**
- Test koneksi PostgreSQL
- Validasi tabel-tabel yang diperlukan
- Check data di database
- Error handling yang lengkap

**Output yang diharapkan:**
```
============================================================
TESTING POSTGRESQL CONNECTION WITH PSQL
============================================================
Database config: {'host': 'db', 'port': '5432', 'database': 'spk_db', 'user': 'postgres', 'password': 'postgres'}

Connection details:
  Host: db
  Port: 5432
  Database: spk_db
  User: postgres
  Password: ********

Executing command: psql -h db -p 5432 -U postgres -d spk_db -c SELECT version();
✅ PostgreSQL connection successful!
Output:
                                 version
-----------------------------------------------------------------------------
 PostgreSQL 13.7 (Debian 13.7-1.pgdg100+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 8.3.0-6) 8.3.0, 64-bit

============================================================
TESTING DATABASE TABLES
============================================================
✅ Database tables query successful!
Tables:
 table_name
------------
 mahasiswa
 nilai
 kategori

Required tables found: ['mahasiswa', 'nilai', 'kategori']
✅ All required tables exist!
```

### 2. `restore_database_container.py`
Script untuk restore database dari dalam container.

**Fitur:**
- Drop database existing
- Create database baru
- Restore dari backup file
- Verifikasi restore
- Error handling lengkap

**Output yang diharapkan:**
```
🚀 Starting Database Restore from Container...
Timestamp: 2024-01-15 10:30:00

============================================================
TESTING DATABASE CONNECTION
============================================================
✅ Database connection successful!

============================================================
DROPPING EXISTING DATABASE
============================================================
✅ Database dropped successfully!

============================================================
CREATING NEW DATABASE
============================================================
✅ Database created successfully!

============================================================
RESTORING DATABASE FROM BACKUP
============================================================
Backup file: backup-public.sql
File size: 62547 bytes
✅ Database restored successfully in 2.34 seconds!

============================================================
VERIFYING RESTORE
============================================================
✅ Tables verification successful!
✅ SELECT COUNT(*) as mahasiswa_count FROM mahasiswa;: 150
✅ SELECT COUNT(*) as nilai_count FROM nilai;: 450
✅ SELECT COUNT(*) as kategori_count FROM kategori;: 3

🎉 DATABASE RESTORE COMPLETED SUCCESSFULLY!
============================================================
Database: spk_db
Host: db:5432
User: postgres
Backup file: backup-public.sql
============================================================
```

## Script Shell

### 1. `restore_from_container.sh`
Script shell untuk menjalankan restore dari host.

**Opsi:**
- `-h, --help` - Tampilkan bantuan
- `-t, --test` - Hanya test koneksi
- `-c, --check` - Hanya check container dan file
- `BACKUP_FILE` - File backup custom

**Contoh penggunaan:**
```bash
# Test koneksi saja
./restore_from_container.sh -t

# Check container dan file
./restore_from_container.sh -c

# Restore dengan file default
./restore_from_container.sh

# Restore dengan file custom
./restore_from_container.sh my-backup.sql
```

## Troubleshooting

### 1. Container Tidak Berjalan
```bash
# Start container
docker-compose up -d

# Check status
docker-compose ps
```

### 2. psql Tidak Tersedia
```bash
# Rebuild image
docker-compose build backend

# Restart container
docker-compose up -d
```

### 3. Backup File Tidak Ditemukan
```bash
# Copy backup file ke container
docker cp backup-public.sql spk-backend:/app/

# Check file di container
docker exec spk-backend ls -la /app/backup-public.sql
```

### 4. Koneksi Database Gagal
```bash
# Check database container
docker-compose ps db

# Check logs
docker-compose logs db

# Test koneksi manual
docker exec spk-backend psql -h db -p 5432 -U postgres -d postgres -c "SELECT 1;"
```

## Environment Variables

Script menggunakan environment variables dari `config.py`:

```python
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=spk_db
```

## Keamanan

### 1. Password Handling
- Password disimpan di environment variable `PGPASSWORD`
- Password tidak ditampilkan di log
- Password di-mask dengan asterisk

### 2. Timeout
- Connection timeout: 30 detik
- Restore timeout: 5 menit
- Query timeout: 30 detik

### 3. Error Handling
- Validasi input
- Error messages yang informatif
- Graceful failure handling

## Contoh Penggunaan Lengkap

### 1. Setup Awal
```bash
# Build image dengan psql
docker-compose build backend

# Start containers
docker-compose up -d

# Test koneksi
./restore_from_container.sh -t
```

### 2. Restore Database
```bash
# Restore dengan konfirmasi
./restore_from_container.sh

# Atau restore tanpa konfirmasi (untuk automation)
echo "y" | ./restore_from_container.sh
```

### 3. Monitoring Database
```bash
# Check database status
docker exec spk-backend python test_db_connection.py

# Monitor queries
docker exec spk-backend psql -h db -p 5432 -U postgres -d spk_db -c "SELECT * FROM pg_stat_activity;"
```

## Kontak Support

Jika ada masalah dengan psql di container:

1. **Check container logs**: `docker-compose logs backend`
2. **Test koneksi manual**: `docker exec spk-backend psql -h db -p 5432 -U postgres -d postgres`
3. **Rebuild image**: `docker-compose build backend`
4. **Check environment**: `docker exec spk-backend env | grep POSTGRES` 