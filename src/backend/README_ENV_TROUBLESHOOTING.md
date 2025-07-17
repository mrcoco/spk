# Troubleshooting Environment Variables

Dokumentasi ini menjelaskan cara mengatasi masalah environment variables yang tidak terbaca.

## Masalah Umum

### 1. File .env tidak terbaca

**Gejala:**
- Environment variables tidak ter-load
- Konfigurasi menggunakan nilai default
- Error saat mengakses database

**Penyebab:**
- File `.env` tidak ada
- Format file `.env` salah
- `python-dotenv` tidak terinstall
- Path file `.env` tidak benar

**Solusi:**

#### A. Periksa keberadaan file .env
```bash
# Di direktori backend
ls -la | grep .env
```

#### B. Periksa format file .env
File `.env` harus memiliki format:
```
KEY=value
KEY2=value2
```

**Contoh yang benar:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spk_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

**Contoh yang salah:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spk_db%
KEY=value
```

#### C. Install python-dotenv
```bash
# Aktifkan virtual environment
source venv/bin/activate

# Install python-dotenv
pip install python-dotenv
```

#### D. Periksa path file .env
Konfigurasi akan mencari file `.env` di urutan berikut:
1. `./.env` (direktori saat ini)
2. `./env.local` (alternatif)
3. `./env.backend` (alternatif)
4. `../.env` (parent directory)

### 2. Environment Variables tidak ter-load

**Gejala:**
- `os.getenv()` mengembalikan `None`
- Konfigurasi menggunakan nilai default

**Solusi:**

#### A. Test loading manual
```bash
# Test dengan script sederhana
python3 simple_env_test.py
```

#### B. Test dengan dotenv
```bash
# Test loading dotenv
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('DATABASE_URL:', os.getenv('DATABASE_URL'))
"
```

#### C. Set environment variables manual
```bash
# Set environment variables di terminal
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spk_db"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="postgres"
```

### 3. Virtual Environment tidak aktif

**Gejala:**
- Module `dotenv` tidak ditemukan
- Dependencies tidak terinstall

**Solusi:**

#### A. Aktifkan virtual environment
```bash
# Di direktori backend
source venv/bin/activate
```

#### B. Install dependencies
```bash
pip install -r requirements.txt
```

#### C. Periksa Python path
```bash
which python
python --version
```

## File Environment yang Tersedia

### 1. `.env` (Development)
File utama untuk development environment.

### 2. `env.local` (Local Development)
Alternatif untuk local development.

### 3. `env.backend` (Backend Specific)
Konfigurasi khusus untuk backend.

### 4. `env.production` (Production)
Konfigurasi untuk production environment.

## Script Testing

### 1. `simple_env_test.py`
Script sederhana untuk test environment variables tanpa dependencies.

```bash
python3 simple_env_test.py
```

### 2. `test_env_loading.py`
Script lengkap untuk test environment variables dengan dotenv.

```bash
# Aktifkan virtual environment dulu
source venv/bin/activate
python test_env_loading.py
```

### 3. `test_config.py`
Test konfigurasi aplikasi.

```bash
python test_config.py
```

## Debugging Steps

### Step 1: Periksa file .env
```bash
cat .env
```

### Step 2: Test loading manual
```bash
python3 simple_env_test.py
```

### Step 3: Test dengan dotenv
```bash
source venv/bin/activate
python test_env_loading.py
```

### Step 4: Test konfigurasi
```bash
python test_config.py
```

## Contoh File .env yang Benar

```bash
# ========================================
# Database Configuration
# ========================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=spk_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spk_db

# ========================================
# Application Configuration
# ========================================
SECRET_KEY=spk-backend-secret-key-2024
DEBUG=True
ENVIRONMENT=development

# Server Configuration
HOST=0.0.0.0
PORT=8000
WORKERS=1

# ========================================
# CORS Configuration
# ========================================
CORS_ORIGINS=["http://localhost:80", "http://localhost:3000", "http://frontend:80"]
CORS_HEADERS=["Content-Type", "Authorization"]
CORS_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS"]

# ========================================
# API Configuration
# ========================================
API_PREFIX=/api
API_VERSION=v1
API_TITLE=SPK Monitoring Masa Studi API
API_DESCRIPTION=API untuk sistem pendukung keputusan monitoring masa studi mahasiswa
API_VERSION_STR=1.0.0

# ========================================
# Security Configuration
# ========================================
ALLOWED_HOSTS=["localhost", "127.0.0.1", "0.0.0.0"]
RATE_LIMIT_ENABLED=False
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# ========================================
# File Upload Configuration
# ========================================
MAX_FILE_SIZE=10485760
UPLOAD_FOLDER=uploads
ALLOWED_EXTENSIONS=["csv", "xlsx", "xls"]

# ========================================
# Logging Configuration
# ========================================
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# ========================================
# Timezone Configuration
# ========================================
TIMEZONE=Asia/Jakarta

# ========================================
# Development Configuration
# ========================================
RELOAD_ON_CHANGE=True
AUTO_MIGRATE=True
SEED_DATA=True

# ========================================
# Monitoring Configuration
# ========================================
HEALTH_CHECK_ENABLED=True
METRICS_ENABLED=False

# ========================================
# Database Pool Configuration
# ========================================
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
```

## Troubleshooting Checklist

- [ ] File `.env` ada di direktori backend
- [ ] Format file `.env` benar (tidak ada karakter aneh)
- [ ] Virtual environment aktif
- [ ] `python-dotenv` terinstall
- [ ] Environment variables dapat dibaca dengan `os.getenv()`
- [ ] Config module dapat diimport
- [ ] Database URL valid
- [ ] Database dapat diakses

## Kontak Support

Jika masalah masih berlanjut, periksa:
1. Log error aplikasi
2. Output dari script testing
3. Konfigurasi sistem operasi
4. Permission file `.env` 