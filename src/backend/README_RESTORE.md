# Database Restore Tool

Script untuk restore database dari file backup SQL. Tool ini memudahkan proses pemulihan data dari file backup `backup-public.sql`.

## Fitur

- ✅ Restore database dari file backup SQL
- ✅ Otomatis membuat database jika belum ada
- ✅ Opsi untuk menghapus database terlebih dahulu
- ✅ Verifikasi hasil restore
- ✅ Konfirmasi sebelum melakukan operasi penting
- ✅ Output berwarna dan informatif
- ✅ Penanganan error yang baik

## Prerequisites

1. **PostgreSQL Client**: Pastikan `psql` tersedia di sistem
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # macOS
   brew install postgresql
   
   # CentOS/RHEL
   sudo yum install postgresql
   ```

2. **File Backup**: File `backup-public.sql` harus ada di direktori yang sama

3. **Konfigurasi Database**: File `config.py` dengan `DATABASE_URL` yang valid

## Penggunaan

### Basic Usage

```bash
# Restore dengan konfirmasi
./restore_database.sh

# Restore tanpa konfirmasi
./restore_database.sh -y

# Restore dengan file backup custom
./restore_database.sh -f my_backup.sql
```

### Advanced Usage

```bash
# Drop database terlebih dahulu, lalu restore
./restore_database.sh -d

# Restore dan verifikasi hasil
./restore_database.sh -v

# Drop database, restore, dan verifikasi (tanpa konfirmasi)
./restore_database.sh -d -v -y

# Restore dengan file backup custom dan drop database
./restore_database.sh -f backup_2024.sql -d -y
```

## Options

| Option | Long Option | Description |
|--------|-------------|-------------|
| `-f` | `--file` | File backup SQL (default: backup-public.sql) |
| `-y` | `--force` | Langsung restore tanpa konfirmasi |
| `-d` | `--drop-first` | Hapus database terlebih dahulu sebelum restore |
| `-v` | `--verify` | Verifikasi hasil restore |
| `-h` | `--help` | Tampilkan help |

## Examples

### 1. Restore Database Baru

```bash
./restore_database.sh
```

Output:
```
🔄 Database Restore Tool
========================
ℹ️  Konfigurasi database:
  Host: localhost
  Port: 5432
  Database: spk_db
  User: spk_user
ℹ️  Database spk_db belum ada, akan dibuat
ℹ️  Membuat database spk_db...
✅ Database spk_db berhasil dibuat
ℹ️  File backup: backup-public.sql
ℹ️  Database target: spk_db
ℹ️  User: spk_user
ℹ️  Host: localhost:5432

⚠️  Apakah Anda yakin ingin melakukan restore? (y/N): y
ℹ️  Memulai proses restore...
✅ Restore berhasil selesai dalam 2.34 detik
✅ Data telah berhasil dipulihkan dari backup

✅ Restore database selesai!
💡 Tips: Gunakan './run_seeder.py' untuk menjalankan seeder jika diperlukan
```

### 2. Restore dengan Drop Database

```bash
./restore_database.sh -d -y
```

Output:
```
🔄 Database Restore Tool
========================
ℹ️  Konfigurasi database:
  Host: localhost
  Port: 5432
  Database: spk_db
  User: spk_user
ℹ️  Database spk_db sudah ada
ℹ️  Menghapus database spk_db...
✅ Database spk_db berhasil dihapus
ℹ️  Membuat database spk_db...
✅ Database spk_db berhasil dibuat
ℹ️  File backup: backup-public.sql
ℹ️  Database target: spk_db
ℹ️  User: spk_user
ℹ️  Host: localhost:5432
ℹ️  Memulai proses restore...
✅ Restore berhasil selesai dalam 1.87 detik
✅ Data telah berhasil dipulihkan dari backup

✅ Restore database selesai!
```

### 3. Restore dengan Verifikasi

```bash
./restore_database.sh -v
```

Output:
```
🔄 Database Restore Tool
========================
...
✅ Restore berhasil selesai dalam 2.12 detik
✅ Data telah berhasil dipulihkan dari backup

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

## Struktur File Backup

File backup harus berisi:

1. **Sequences**: Sequence untuk auto-increment
2. **Tables**: Struktur tabel dan data
3. **Constraints**: Primary keys, foreign keys, indexes
4. **Data**: Data mahasiswa, nilai, dan hasil perhitungan

Contoh struktur minimal:
```sql
-- Sequences
CREATE SEQUENCE mahasiswa_id_seq;
CREATE SEQUENCE nilai_id_seq;

-- Tables
CREATE TABLE mahasiswa (
    nim VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    program_studi VARCHAR(50) NOT NULL,
    ipk FLOAT NOT NULL,
    sks INTEGER NOT NULL,
    persen_dek FLOAT NOT NULL
);

CREATE TABLE nilai (
    id INTEGER PRIMARY KEY DEFAULT nextval('nilai_id_seq'),
    nim VARCHAR(20) REFERENCES mahasiswa(nim),
    tahun INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    kode_matakuliah VARCHAR(20) NOT NULL,
    nama_matakuliah VARCHAR(100) NOT NULL,
    nilai VARCHAR(2) NOT NULL
);

-- Data
INSERT INTO mahasiswa VALUES ('2021001', 'Ahmad Rizki', 'Teknik Informatika', 3.85, 120, 5.2);
INSERT INTO nilai VALUES (1, '2021001', 2024, 7, 'IF106', 'Jaringan Komputer', 'A-');
```

## Troubleshooting

### 1. Error: "psql: command not found"

**Solusi**: Install PostgreSQL client
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### 2. Error: "connection to server failed"

**Solusi**: Periksa konfigurasi database di `config.py`
```python
DATABASE_URL = "postgresql://username:password@host:port/database"
```

### 3. Error: "permission denied"

**Solusi**: Berikan permission execute pada script
```bash
chmod +x restore_database.sh
```

### 4. Error: "database already exists"

**Solusi**: Gunakan opsi `-d` untuk drop database terlebih dahulu
```bash
./restore_database.sh -d
```

### 5. Error: "file backup tidak ditemukan"

**Solusi**: Pastikan file backup ada di direktori yang sama atau gunakan opsi `-f`
```bash
./restore_database.sh -f /path/to/backup.sql
```

## Integrasi dengan Workflow

### 1. Setup Awal

```bash
# 1. Clone repository
git clone <repository-url>
cd spk/src/backend

# 2. Setup environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Restore database
./restore_database.sh -d -v -y

# 4. Jalankan aplikasi
python main.py
```

### 2. Reset Database

```bash
# Reset database ke kondisi awal
./restore_database.sh -d -v -y
```

### 3. Backup dan Restore

```bash
# Backup database
pg_dump -h localhost -p 5432 -U spk_user -d spk_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
./restore_database.sh -f backup_20241217_143022.sql -d -y
```

## Keamanan

1. **Password**: Password database tidak ditampilkan di output
2. **Konfirmasi**: Operasi penting memerlukan konfirmasi
3. **Error Handling**: Script berhenti jika terjadi error
4. **Logging**: Semua operasi dicatat dengan jelas

## Best Practices

1. **Backup Regular**: Lakukan backup database secara berkala
2. **Test Restore**: Test restore di environment development
3. **Verification**: Selalu verifikasi hasil restore
4. **Documentation**: Dokumentasikan perubahan database

## Support

Jika mengalami masalah:

1. Periksa log error yang ditampilkan
2. Pastikan semua prerequisites terpenuhi
3. Cek konfigurasi database di `config.py`
4. Gunakan opsi `-h` untuk melihat help

## Changelog

### v1.0.0 (2024-12-17)
- ✅ Initial release
- ✅ Support restore dari file SQL
- ✅ Fitur drop database
- ✅ Verifikasi hasil restore
- ✅ Output berwarna
- ✅ Error handling
- ✅ Command line options 