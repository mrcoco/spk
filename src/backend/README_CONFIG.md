# Configuration Documentation

Dokumentasi lengkap untuk konfigurasi aplikasi SPK Monitoring Masa Studi.

## Overview

File `config.py` berisi semua konfigurasi aplikasi yang terpusat dan terorganisir dengan baik. Konfigurasi ini mendukung environment variables untuk fleksibilitas deployment dan keamanan.

## Struktur Konfigurasi

### 1. Database Configuration

```python
# Database connection parameters
POSTGRES_USER = os.getenv('POSTGRES_USER', 'spk_user')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'spk_password')
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'db')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'spk_db')

# Database URL
DATABASE_URL = os.getenv('DATABASE_URL', 
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

# SQLAlchemy Configuration
SQLALCHEMY_DATABASE_URI = DATABASE_URL
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': int(os.getenv('DB_POOL_SIZE', '10')),
    'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '20')),
    'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '30')),
    'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '3600'))
}
```

### 2. Application Configuration

```python
# Core application settings
SECRET_KEY = os.getenv('SECRET_KEY', 'spk-backend-secret-key-2024')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

# Server settings
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '8000'))
WORKERS = int(os.getenv('WORKERS', '1'))
```

### 3. CORS Configuration

```python
# CORS settings with JSON parsing
@staticmethod
def get_cors_origins() -> List[str]:
    cors_origins = os.getenv('CORS_ORIGINS', '["http://localhost:80", "http://localhost:3000", "http://frontend:80"]')
    try:
        return json.loads(cors_origins)
    except json.JSONDecodeError:
        return ["http://localhost:80", "http://localhost:3000", "http://frontend:80"]

@staticmethod
def get_cors_headers() -> List[str]:
    cors_headers = os.getenv('CORS_HEADERS', '["Content-Type", "Authorization"]')
    try:
        return json.loads(cors_headers)
    except json.JSONDecodeError:
        return ["Content-Type", "Authorization"]

@staticmethod
def get_cors_methods() -> List[str]:
    cors_methods = os.getenv('CORS_METHODS', '["GET", "POST", "PUT", "DELETE", "OPTIONS"]')
    try:
        return json.loads(cors_methods)
    except json.JSONDecodeError:
        return ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
```

### 4. API Configuration

```python
# API settings
API_PREFIX = os.getenv('API_PREFIX', '/api')
API_VERSION = os.getenv('API_VERSION', 'v1')
API_TITLE = os.getenv('API_TITLE', 'SPK Monitoring Masa Studi API')
API_DESCRIPTION = os.getenv('API_DESCRIPTION', 
    'API untuk sistem pendukung keputusan monitoring masa studi mahasiswa')
API_VERSION_STR = os.getenv('API_VERSION_STR', '1.0.0')
```

### 5. Security Configuration

```python
# Security settings
@staticmethod
def get_allowed_hosts() -> List[str]:
    allowed_hosts = os.getenv('ALLOWED_HOSTS', '["localhost", "127.0.0.1", "0.0.0.0"]')
    try:
        return json.loads(allowed_hosts)
    except json.JSONDecodeError:
        return ["localhost", "127.0.0.1", "0.0.0.0"]

RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'False').lower() == 'true'
RATE_LIMIT_REQUESTS = int(os.getenv('RATE_LIMIT_REQUESTS', '100'))
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '60'))
```

### 6. File Upload Configuration

```python
# File upload settings
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '10485760'))  # 10MB default
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')

@staticmethod
def get_allowed_extensions() -> List[str]:
    allowed_extensions = os.getenv('ALLOWED_EXTENSIONS', '["csv", "xlsx", "xls"]')
    try:
        return json.loads(allowed_extensions)
    except json.JSONDecodeError:
        return ["csv", "xlsx", "xls"]
```

### 7. SPK Specific Configuration

```python
# SAW Algorithm Configuration
SAW_CRITERIA_WEIGHTS = {
    'ipk': 0.3,
    'sks': 0.25,
    'semester': 0.2,
    'usia': 0.15,
    'status': 0.1
}

# Fuzzy Logic Configuration
FUZZY_SETS = {
    'ipk': {
        'sangat_baik': (3.5, 4.0),
        'baik': (3.0, 3.5),
        'cukup': (2.5, 3.0),
        'kurang': (0.0, 2.5)
    },
    'sks': {
        'tinggi': (144, 160),
        'sedang': (120, 144),
        'rendah': (0, 120)
    },
    'semester': {
        'tinggi': (8, 14),
        'sedang': (6, 8),
        'rendah': (1, 6)
    },
    'usia': {
        'muda': (17, 22),
        'sedang': (22, 25),
        'tua': (25, 30)
    }
}

# Classification thresholds
CLASSIFICATION_THRESHOLDS = {
    'sangat_baik': 0.8,
    'baik': 0.6,
    'cukup': 0.4,
    'kurang': 0.0
}
```

## Utility Methods

### Environment Detection

```python
@classmethod
def is_production(cls) -> bool:
    """Check if running in production environment"""
    return cls.ENVIRONMENT.lower() == 'production'

@classmethod
def is_development(cls) -> bool:
    """Check if running in development environment"""
    return cls.ENVIRONMENT.lower() == 'development'
```

### Configuration Getters

```python
@classmethod
def get_database_config(cls) -> dict:
    """Get database configuration as dictionary"""
    return {
        'user': cls.POSTGRES_USER,
        'password': cls.POSTGRES_PASSWORD,
        'host': cls.POSTGRES_HOST,
        'port': cls.POSTGRES_PORT,
        'database': cls.POSTGRES_DB,
        'url': cls.DATABASE_URL
    }

@classmethod
def get_server_config(cls) -> dict:
    """Get server configuration as dictionary"""
    return {
        'host': cls.HOST,
        'port': cls.PORT,
        'workers': cls.WORKERS,
        'debug': cls.DEBUG
    }

@classmethod
def get_api_config(cls) -> dict:
    """Get API configuration as dictionary"""
    return {
        'prefix': cls.API_PREFIX,
        'version': cls.API_VERSION,
        'title': cls.API_TITLE,
        'description': cls.API_DESCRIPTION,
        'version_str': cls.API_VERSION_STR
    }
```

### Configuration Validation

```python
@classmethod
def validate_config(cls) -> bool:
    """Validate configuration"""
    required_vars = [
        'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 
        'POSTGRES_PORT', 'POSTGRES_DB', 'SECRET_KEY'
    ]
    
    for var in required_vars:
        if not getattr(cls, var, None):
            print(f"❌ Missing required configuration: {var}")
            return False
    
    print("✅ Configuration validation passed")
    return True
```

## Cara Penggunaan

### 1. Import Configuration

```python
from config import Config

# Access configuration directly
db_url = Config.DATABASE_URL
secret_key = Config.SECRET_KEY
debug_mode = Config.DEBUG

# Use utility methods
if Config.is_production():
    # Production specific code
    pass

db_config = Config.get_database_config()
server_config = Config.get_server_config()
```

### 2. Environment Variables

```bash
# Set environment variables
export POSTGRES_USER=spk_user
export POSTGRES_PASSWORD=spk_password
export POSTGRES_HOST=db
export POSTGRES_PORT=5432
export POSTGRES_DB=spk_db
export SECRET_KEY=your-secret-key
export DEBUG=True
export ENVIRONMENT=development
```

### 3. Using .env File

```bash
# Create .env file
cp src/backend/env.backend src/backend/.env

# Edit .env file
nano src/backend/.env
```

## Testing Configuration

### Run Configuration Test

```bash
cd src/backend
python test_config.py
```

### Manual Validation

```python
from config import Config

# Validate configuration
is_valid = Config.validate_config()
print(f"Configuration valid: {is_valid}")

# Check environment
print(f"Is production: {Config.is_production()}")
print(f"Is development: {Config.is_development()}")

# Get configurations
db_config = Config.get_database_config()
server_config = Config.get_server_config()
api_config = Config.get_api_config()

print(f"Database config: {db_config}")
print(f"Server config: {server_config}")
print(f"API config: {api_config}")
```

## Environment Variables Reference

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `spk_user` | Database username |
| `POSTGRES_PASSWORD` | `spk_password` | Database password |
| `POSTGRES_HOST` | `db` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_DB` | `spk_db` | Database name |
| `SECRET_KEY` | `spk-backend-secret-key-2024` | Application secret key |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `True` | Debug mode |
| `ENVIRONMENT` | `development` | Environment type |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `WORKERS` | `1` | Number of workers |
| `CORS_ORIGINS` | `["http://localhost:80", "http://localhost:3000", "http://frontend:80"]` | CORS origins |
| `API_PREFIX` | `/api` | API prefix |
| `LOG_LEVEL` | `INFO` | Log level |
| `MAX_FILE_SIZE` | `10485760` | Max file size (10MB) |

## Best Practices

### 1. Security

```python
# Use strong secret keys in production
SECRET_KEY = os.getenv('SECRET_KEY', 'your-super-secure-secret-key')

# Enable rate limiting in production
RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
```

### 2. Environment Specific Configuration

```python
# Development
DEBUG = True
ENVIRONMENT = 'development'
LOG_LEVEL = 'DEBUG'

# Production
DEBUG = False
ENVIRONMENT = 'production'
LOG_LEVEL = 'WARNING'
```

### 3. Database Configuration

```python
# Use connection pooling for production
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': int(os.getenv('DB_POOL_SIZE', '20')),
    'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '30')),
    'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', '30')),
    'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', '3600'))
}
```

## Troubleshooting

### 1. Configuration Not Loading

```python
# Check if environment variables are loaded
import os
print(f"POSTGRES_USER: {os.getenv('POSTGRES_USER')}")
print(f"SECRET_KEY: {os.getenv('SECRET_KEY')}")

# Check if .env file is loaded
from dotenv import load_dotenv
load_dotenv()
```

### 2. Database Connection Issues

```python
# Validate database configuration
db_config = Config.get_database_config()
print(f"Database URL: {db_config['url']}")

# Test connection
import psycopg2
try:
    conn = psycopg2.connect(db_config['url'])
    print("✅ Database connection successful")
    conn.close()
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

### 3. CORS Issues

```python
# Check CORS configuration
cors_origins = Config.get_cors_origins()
cors_headers = Config.get_cors_headers()
cors_methods = Config.get_cors_methods()

print(f"CORS Origins: {cors_origins}")
print(f"CORS Headers: {cors_headers}")
print(f"CORS Methods: {cors_methods}")
```

## Changelog

### v2.0.0 (2024-12-17)
- ✅ Complete configuration refactor
- ✅ Environment variables support
- ✅ SPK specific configuration
- ✅ Utility methods for configuration access
- ✅ Configuration validation
- ✅ Comprehensive documentation
- ✅ Test script for configuration validation
- ✅ Type hints and error handling
- ✅ Security best practices
- ✅ Production ready configuration 