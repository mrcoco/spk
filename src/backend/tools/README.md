# Backend Tools

Directory ini berisi file-file utility dan tools yang tidak terkait langsung dengan sistem SPK utama, tetapi berguna untuk development, testing, dan maintenance.

## 📁 Struktur File

### 🔧 Database Tools
- **Restore Scripts** - Script untuk restore database
- **Test Scripts** - Script untuk testing koneksi dan operasi database
- **Monitor Scripts** - Script untuk monitoring proses restore

### 🧠 FIS (Fuzzy Inference System) Tools
- **test_fis_comparison.py** - Membandingkan implementasi FIS project dengan notebook
- **fix_fis_implementation.py** - Memperbaiki implementasi FIS untuk NIM spesifik
- **batch_update_fis.py** - Batch update semua mahasiswa dengan FIS yang diperbaiki

### 🧪 Testing Tools
- **Environment Tests** - Script untuk testing environment variables
- **Configuration Tests** - Script untuk testing konfigurasi aplikasi
- **Docker Tests** - Script untuk testing Docker build dan deployment

### 🌱 Seeder Tools
- **Data Seeders** - Script untuk seeding data awal ke database

### 🐳 Docker Tools
- **Docker Scripts** - Script untuk manajemen Docker container

## 📋 Daftar File

### Database Management
- `backup-public.sql` - File backup database utama
- `restore_database.py` - Script restore database utama
- `restore_database_by_table.py` - Script restore database per-tabel
- `restore_database_container.py` - Script restore database dari container
- `restore_database.sh` - Shell script untuk restore database
- `restore_database_by_table.sh` - Shell script untuk restore per-tabel
- `restore_database_docker.sh` - Shell script untuk restore dari Docker
- `restore_from_container.sh` - Shell script untuk restore dari container
- `restore_menu.sh` - Menu interaktif untuk restore database
- `monitor_restore.py` - Script untuk monitoring progress restore

### Database Testing
- `test_db_connection.py` - Test koneksi database
- `test_db_operations.sh` - Test operasi database
- `test_restore_by_table.py` - Test restore per-tabel
- `test_restore_by_table.sh` - Shell script test restore per-tabel
- `test_restore_config.py` - Test konfigurasi restore

### Environment Testing
- `fix_env.py` - Script untuk memperbaiki environment variables
- `simple_env_test.py` - Test sederhana environment variables
- `test_env_loading.py` - Test loading environment variables
- `test_config.py` - Test konfigurasi aplikasi
- `validate_env.sh` - Validasi environment variables

### Docker Testing
- `test_docker_build.sh` - Test Docker build
- `docker.sh` - Script manajemen Docker

### Data Seeding
- `seeders.py` - Script seeder data awal
- `run_seeder.py` - Script untuk menjalankan seeder

## 🚀 Cara Penggunaan

### Database Backup & Restore
```bash
# Restore database dengan menu interaktif
./tools/restore_menu.sh

# Restore database per-tabel (recommended untuk data besar)
./tools/restore_by_table.sh

# Test restore per-tabel
./tools/test_restore_by_table.sh

# Backup database (jika diperlukan)
docker exec spk-backend-1 pg_dump -h db -U spk_user -d spk_db > tools/backup-$(date +%Y%m%d).sql
```

### Environment Testing
```bash
# Test environment variables
python tools/test_env_loading.py

# Validasi environment
./tools/validate_env.sh

# Test konfigurasi
python tools/test_config.py
```

### Docker Testing
```bash
# Test Docker build
./tools/test_docker_build.sh

# Manajemen Docker
./tools/docker.sh
```

### Data Seeding
```bash
# Jalankan seeder data
python tools/run_seeder.py
```

### FIS Implementation
```bash
# Test perbandingan dengan notebook
python tools/test_fis_comparison.py

# Fix implementasi untuk NIM spesifik
python tools/fix_fis_implementation.py

# Batch update semua mahasiswa
python tools/batch_update_fis.py
```

## 📝 Catatan Penting

1. **Backup Database**: 
   - File `backup-public.sql` adalah backup database utama
   - Selalu backup database sebelum melakukan restore
   - Backup file disimpan di directory `tools/`

2. **Environment Variables**: Pastikan environment variables sudah dikonfigurasi dengan benar
3. **Docker Container**: Pastikan container berjalan sebelum menjalankan script restore
4. **Permissions**: Pastikan script memiliki permission execute yang tepat
5. **File Size**: File backup cukup besar (~30MB), pastikan ada ruang disk yang cukup

## 🔧 Troubleshooting

### Error Koneksi Database
```bash
# Test koneksi database
python tools/test_db_connection.py

# Cek environment variables
./tools/validate_env.sh
```

### Error Restore Database
```bash
# Monitor progress restore
python tools/monitor_restore.py monitor

# Test restore dengan database kosong
./tools/test_restore_by_table.sh
```

### Error Docker
```bash
# Test Docker build
./tools/test_docker_build.sh

# Restart container
./tools/docker.sh restart
```

## 📚 Dokumentasi Terkait

- **[Database Restore Guide](../../docs/database/README_DATABASE_RESTORE.md)** - Panduan lengkap restore database
- **[Environment Configuration](../../docs/deployment/README_ENVIRONMENT.md)** - Konfigurasi environment variables
- **[FIS Implementation Fix](../../docs/backend/FIS_IMPLEMENTATION_FIX.md)** - Dokumentasi perbaikan implementasi FIS
- **[Troubleshooting Guide](../../docs/troubleshooting/README.md)** - Panduan troubleshooting

---

**Note**: Semua script di directory ini adalah utility tools dan tidak terkait langsung dengan sistem SPK utama. Script ini berguna untuk development, testing, dan maintenance aplikasi. 