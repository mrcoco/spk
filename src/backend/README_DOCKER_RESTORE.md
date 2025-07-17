# Database Restore Tool untuk Docker

Panduan lengkap untuk restore database di environment Docker. Script ini memudahkan proses pemulihan data dari file backup `backup-public.sql` ke dalam container Docker.

## Prerequisites

1. **Docker Running**: Docker harus berjalan di sistem
2. **Container SPK**: Container `spk-backend-1` harus berjalan
3. **File Backup**: File `backup-public.sql` harus ada di direktori yang sama
4. **Docker Compose**: Aplikasi SPK harus dijalankan dengan docker-compose

## Cara Menjalankan

### 1. Menggunakan Script Docker (Direkomendasikan)

**Setup:**
```bash
cd src/backend
chmod +x restore_database_docker.sh
```

**Basic Usage:**
```bash
# Restore dengan konfirmasi
./restore_database_docker.sh

# Restore tanpa konfirmasi
./restore_database_docker.sh -y

# Restore dengan drop database terlebih dahulu
./restore_database_docker.sh -d -y

# Restore dengan verifikasi
./restore_database_docker.sh -v

# Restore lengkap (drop + verify + no confirm)
./restore_database_docker.sh -d -v -y
```

### 2. Menggunakan Docker Commands Manual

**Step 1: Copy file backup ke container**
```bash
docker cp backup-public.sql spk-backend-1:/tmp/backup-public.sql
```

**Step 2: Drop database (opsional)**
```bash
docker exec spk-backend-1 python -c "
from database import engine
engine.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
print('Database berhasil dihapus dan dibuat ulang')
"
```

**Step 3: Restore database**
```bash
docker exec spk-backend-1 psql -h localhost -p 5432 -U spk_user -d spk_db -f /tmp/backup-public.sql
```

**Step 4: Verifikasi (opsional)**
```bash
docker exec spk-backend-1 python -c "
from database import engine
result = engine.execute('SELECT COUNT(*) FROM mahasiswa')
print('Total Mahasiswa:', result.fetchone()[0])
result = engine.execute('SELECT COUNT(*) FROM nilai')
print('Total Nilai:', result.fetchone()[0])
"
```

**Step 5: Cleanup**
```bash
docker exec spk-backend-1 rm -f /tmp/backup-public.sql
```

### 3. Menggunakan Docker Compose

**Restore dengan docker-compose:**
```bash
# Pastikan aplikasi berjalan
docker-compose up -d

# Restore database
cd src/backend
./restore_database_docker.sh -d -v -y

# Restart aplikasi jika diperlukan
docker-compose restart backend
```

## Options

| Option | Long Option | Description |
|--------|-------------|-------------|
| `-f` | `--file` | File backup SQL (default: backup-public.sql) |
| `-y` | `--force` | Langsung restore tanpa konfirmasi |
| `-d` | `--drop-first` | Hapus database terlebih dahulu sebelum restore |
| `-v` | `--verify` | Verifikasi hasil restore |
| `-c` | `--container` | Nama container backend (default: spk-backend-1) |
| `-h` | `--help` | Tampilkan help |

## Examples

### Example 1: Restore Database Baru
```bash
./restore_database_docker.sh
```

Output:
```
🔄 Database Restore Tool (Docker)
==================================
ℹ️  Container: spk-backend-1
ℹ️  File backup: backup-public.sql
ℹ️  Mengcopy file backup ke container...
✅ File backup berhasil dicopy ke container
ℹ️  Memulai proses restore di container...

⚠️  Apakah Anda yakin ingin melakukan restore? (y/N): y
ℹ️  Restore database dari backup...
✅ Restore berhasil selesai
ℹ️  Membersihkan file temporary...
✅ Cleanup selesai

✅ Restore database selesai!
```

### Example 2: Restore dengan Drop Database
```bash
./restore_database_docker.sh -d -y
```

Output:
```
🔄 Database Restore Tool (Docker)
==================================
ℹ️  Container: spk-backend-1
ℹ️  File backup: backup-public.sql
ℹ️  Mengcopy file backup ke container...
✅ File backup berhasil dicopy ke container
ℹ️  Memulai proses restore di container...
ℹ️  Menghapus database terlebih dahulu...
Database berhasil dihapus dan dibuat ulang
ℹ️  Restore database dari backup...
✅ Restore berhasil selesai
ℹ️  Membersihkan file temporary...
✅ Cleanup selesai

✅ Restore database selesai!
```

### Example 3: Restore dengan Verifikasi
```bash
./restore_database_docker.sh -v
```

Output:
```
🔄 Database Restore Tool (Docker)
==================================
...
✅ Restore berhasil selesai

ℹ️  Verifikasi hasil restore:
----------------------------------------
📋 mahasiswa: 15 records
📋 nilai: 152 records
📋 saw_criteria: 3 records
📋 saw_results: 15 records
📋 saw_final_results: 15 records
----------------------------------------
✅ Verifikasi selesai: 15 mahasiswa, 152 nilai

✅ Restore database selesai!
```

## Troubleshooting

### 1. Error: "Container spk-backend-1 tidak berjalan"

**Solusi:**
```bash
# Cek container yang berjalan
docker ps

# Jalankan aplikasi jika belum
docker-compose up -d

# Cek nama container yang benar
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### 2. Error: "File backup tidak ditemukan"

**Solusi:**
```bash
# Cek file yang ada
ls -la *.sql

# Download atau copy file backup ke direktori yang benar
cp /path/to/backup-public.sql .
```

### 3. Error: "psql: command not found"

**Solusi:**
```bash
# Install PostgreSQL client di container
docker exec spk-backend-1 apt-get update
docker exec spk-backend-1 apt-get install -y postgresql-client

# Atau gunakan Python untuk restore
docker exec spk-backend-1 python -c "
import psycopg2
conn = psycopg2.connect('postgresql://spk_user:spk_password@localhost:5432/spk_db')
with open('/tmp/backup-public.sql', 'r') as f:
    conn.cursor().execute(f.read())
conn.commit()
conn.close()
print('Restore selesai')
"
```

### 4. Error: "Permission denied"

**Solusi:**
```bash
# Berikan permission execute
chmod +x restore_database_docker.sh

# Atau jalankan dengan sudo jika diperlukan
sudo ./restore_database_docker.sh
```

### 5. Error: "Connection refused"

**Solusi:**
```bash
# Cek apakah database container berjalan
docker ps | grep postgres

# Restart database container
docker-compose restart db

# Tunggu beberapa detik untuk database siap
sleep 10
```

## Integrasi dengan Workflow

### 1. Setup Awal dengan Docker
```bash
# 1. Clone repository
git clone <repository-url>
cd spk

# 2. Jalankan aplikasi
docker-compose up -d

# 3. Restore database
cd src/backend
./restore_database_docker.sh -d -v -y

# 4. Cek aplikasi
docker-compose logs backend
```

### 2. Reset Database di Production
```bash
# Backup database terlebih dahulu
docker exec spk-backend-1 pg_dump -h localhost -p 5432 -U spk_user -d spk_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
./restore_database_docker.sh -f backup_20241217_143022.sql -d -y
```

### 3. Development Environment
```bash
# Reset database untuk development
./restore_database_docker.sh -d -v -y

# Jalankan seeder jika diperlukan
docker exec spk-backend-1 python run_seeder.py

# Restart aplikasi
docker-compose restart backend
```

## Keamanan

1. **Backup Terlebih Dahulu**: Selalu backup database sebelum restore
2. **Konfirmasi**: Script meminta konfirmasi sebelum melakukan operasi penting
3. **Container Isolation**: Operasi dilakukan dalam container yang terisolasi
4. **Cleanup**: File temporary otomatis dibersihkan setelah restore

## Best Practices

1. **Test di Development**: Test restore di environment development terlebih dahulu
2. **Backup Regular**: Lakukan backup database secara berkala
3. **Verify Results**: Selalu verifikasi hasil restore
4. **Documentation**: Dokumentasikan setiap restore yang dilakukan
5. **Monitoring**: Monitor aplikasi setelah restore

## Support

Jika mengalami masalah:

1. **Check Logs**: `docker-compose logs backend`
2. **Check Container**: `docker ps`
3. **Check Database**: `docker exec spk-backend-1 python -c "from database import engine; print('Database OK')"`
4. **Check File**: Pastikan file backup ada dan valid
5. **Check Permissions**: Pastikan script memiliki permission execute

## Changelog

### v1.0.0 (2024-12-17)
- ✅ Initial release untuk Docker environment
- ✅ Support restore dari file SQL ke container
- ✅ Fitur drop database
- ✅ Verifikasi hasil restore
- ✅ Output berwarna
- ✅ Error handling
- ✅ Command line options
- ✅ Container management
- ✅ File cleanup otomatis 