# Environment Variables Documentation

Dokumentasi lengkap untuk environment variables yang digunakan dalam aplikasi SPK Monitoring Masa Studi.

## File Environment Variables

### 1. `env.example` - Template Environment Variables
File template yang berisi semua environment variables yang diperlukan aplikasi.

**Penggunaan:**
```bash
# Copy template ke file .env
cp env.example .env

# Edit file .env sesuai kebutuhan
nano .env
```

### 2. `src/backend/env.backend` - Backend Environment Variables
File environment variables khusus untuk backend service.

**Penggunaan:**
```bash
# Copy ke file .env di backend
cp src/backend/env.backend src/backend/.env
```

### 3. `docker-compose.env` - Docker Compose Environment Variables
File environment variables untuk konfigurasi Docker Compose.

**Penggunaan:**
```bash
# Load environment variables untuk docker-compose
export $(cat docker-compose.env | xargs)
docker-compose up -d
```

### 4. `src/backend/env.production` - Production Environment Variables
File environment variables untuk environment production.

**Penggunaan:**
```bash
# Copy ke file .env untuk production
cp src/backend/env.production src/backend/.env
```

## Konfigurasi Environment Variables

### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `spk_user` | Username database PostgreSQL |
| `POSTGRES_PASSWORD` | `spk_password` | Password database PostgreSQL |
| `POSTGRES_HOST` | `db` | Host database (dalam Docker) |
| `POSTGRES_PORT` | `5432` | Port database PostgreSQL |
| `POSTGRES_DB` | `spk_db` | Nama database |
| `DATABASE_URL` | `postgresql://spk_user:spk_password@db:5432/spk_db` | URL koneksi database |

### Application Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `spk-backend-secret-key-2024` | Secret key untuk aplikasi |
| `DEBUG` | `True` | Mode debug (True/False) |
| `ENVIRONMENT` | `development` | Environment (development/production) |

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Host server |
| `PORT` | `8000` | Port server backend |
| `WORKERS` | `1` | Jumlah worker processes |

### CORS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `["http://localhost:80", "http://localhost:3000", "http://frontend:80"]` | Allowed origins |
| `CORS_HEADERS` | `["Content-Type", "Authorization"]` | Allowed headers |
| `CORS_METHODS` | `["GET", "POST", "PUT", "DELETE", "OPTIONS"]` | Allowed methods |

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PREFIX` | `/api` | Prefix untuk semua endpoint API |
| `API_VERSION` | `v1` | Version API |
| `API_TITLE` | `SPK Monitoring Masa Studi API` | Title API |
| `API_DESCRIPTION` | `API untuk sistem pendukung keputusan monitoring masa studi mahasiswa` | Description API |
| `API_VERSION_STR` | `1.0.0` | Version string API |

### Security Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_HOSTS` | `["localhost", "127.0.0.1", "0.0.0.0"]` | Allowed hosts |
| `RATE_LIMIT_ENABLED` | `False` | Enable rate limiting |
| `RATE_LIMIT_REQUESTS` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `60` | Rate limit window in seconds |

### File Upload Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `10485760` | Max file size (10MB) |
| `UPLOAD_FOLDER` | `uploads` | Upload folder path |
| `ALLOWED_EXTENSIONS` | `["csv", "xlsx", "xls"]` | Allowed file extensions |

### Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Log level (DEBUG, INFO, WARNING, ERROR) |
| `LOG_FORMAT` | `%(asctime)s - %(name)s - %(levelname)s - %(message)s` | Log format |

### Development Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RELOAD_ON_CHANGE` | `True` | Auto reload on file changes |
| `AUTO_MIGRATE` | `True` | Auto run database migrations |
| `SEED_DATA` | `True` | Auto seed data |

## Cara Penggunaan

### 1. Development Environment

**Setup environment variables:**
```bash
# Copy template
cp env.example .env

# Edit file .env
nano .env

# Jalankan aplikasi
docker-compose up -d
```

**Backend environment variables:**
```bash
# Copy backend environment
cp src/backend/env.backend src/backend/.env

# Jalankan backend
cd src/backend
python main.py
```

### 2. Production Environment

**Setup production environment:**
```bash
# Copy production environment
cp src/backend/env.production src/backend/.env

# Edit file .env dengan nilai production
nano src/backend/.env

# Jalankan dengan production settings
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Docker Environment

**Load environment variables untuk Docker:**
```bash
# Load environment variables
export $(cat docker-compose.env | xargs)

# Jalankan Docker Compose
docker-compose up -d
```

**Atau gunakan file .env:**
```bash
# Copy environment file
cp docker-compose.env .env

# Jalankan Docker Compose
docker-compose up -d
```

## Environment Variables per Service

### Backend Service

**Required variables:**
```bash
POSTGRES_USER=spk_user
POSTGRES_PASSWORD=spk_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=spk_db
DATABASE_URL=postgresql://spk_user:spk_password@db:5432/spk_db
SECRET_KEY=your-secret-key
DEBUG=True
```

**Optional variables:**
```bash
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:80"]
```

### Database Service

**Required variables:**
```bash
POSTGRES_USER=spk_user
POSTGRES_PASSWORD=spk_password
POSTGRES_DB=spk_db
```

**Optional variables:**
```bash
POSTGRES_PORT=5432
POSTGRES_HOST_AUTH_METHOD=md5
```

### Frontend Service

**Required variables:**
```bash
NGINX_HOST=0.0.0.0
NGINX_PORT=80
```

## Security Best Practices

### 1. Secret Management

**Development:**
```bash
# Gunakan secret key yang berbeda untuk development
SECRET_KEY=dev-secret-key-2024
```

**Production:**
```bash
# Gunakan secret key yang kuat dan unik
SECRET_KEY=your-super-secure-production-secret-key-2024
```

### 2. Database Security

**Development:**
```bash
POSTGRES_PASSWORD=spk_password
```

**Production:**
```bash
POSTGRES_PASSWORD=your-super-secure-database-password-2024
```

### 3. CORS Configuration

**Development:**
```bash
CORS_ORIGINS=["http://localhost:80", "http://localhost:3000"]
```

**Production:**
```bash
CORS_ORIGINS=["https://your-domain.com", "https://www.your-domain.com"]
```

## Troubleshooting

### 1. Environment Variables Tidak Terload

**Solusi:**
```bash
# Cek apakah file .env ada
ls -la .env

# Load environment variables manual
source .env

# Cek environment variables
env | grep POSTGRES
```

### 2. Database Connection Error

**Solusi:**
```bash
# Cek environment variables database
echo $POSTGRES_HOST
echo $POSTGRES_USER
echo $POSTGRES_PASSWORD

# Test koneksi database
docker exec spk-backend-1 python -c "
import os
print('POSTGRES_HOST:', os.getenv('POSTGRES_HOST'))
print('POSTGRES_USER:', os.getenv('POSTGRES_USER'))
print('POSTGRES_PASSWORD:', os.getenv('POSTGRES_PASSWORD'))
"
```

### 3. CORS Error

**Solusi:**
```bash
# Cek CORS configuration
echo $CORS_ORIGINS

# Update CORS origins jika diperlukan
export CORS_ORIGINS='["http://localhost:80", "http://localhost:3000"]'
```

## Validation

### 1. Validate Environment Variables

**Script validation:**
```bash
#!/bin/bash
# validate_env.sh

required_vars=(
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "POSTGRES_HOST"
    "POSTGRES_DB"
    "SECRET_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

echo "✅ All required environment variables are set"
```

### 2. Test Database Connection

**Python script:**
```python
# test_db_connection.py
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST'),
        port=os.getenv('POSTGRES_PORT'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        database=os.getenv('POSTGRES_DB')
    )
    print("✅ Database connection successful")
    conn.close()
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

## Changelog

### v1.0.0 (2024-12-17)
- ✅ Initial release environment variables
- ✅ Database configuration
- ✅ Application configuration
- ✅ Security configuration
- ✅ CORS configuration
- ✅ Logging configuration
- ✅ Development vs Production configuration
- ✅ Docker Compose integration
- ✅ Documentation dan examples
- ✅ Validation scripts
- ✅ Troubleshooting guide 