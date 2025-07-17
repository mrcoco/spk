#!/usr/bin/env python3
"""
Script untuk memperbaiki file .env secara otomatis
"""

import os
import shutil
from datetime import datetime

def backup_env_file():
    """Backup file .env yang ada"""
    if os.path.exists('.env'):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f'.env.backup.{timestamp}'
        shutil.copy2('.env', backup_name)
        print(f"✓ File .env dibackup ke: {backup_name}")
        return backup_name
    return None

def create_env_file():
    """Buat file .env yang benar"""
    env_content = """# ========================================
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
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✓ File .env berhasil dibuat")
        return True
    except Exception as e:
        print(f"✗ Error membuat file .env: {e}")
        return False

def validate_env_file():
    """Validasi file .env"""
    if not os.path.exists('.env'):
        print("✗ File .env tidak ditemukan")
        return False
    
    try:
        with open('.env', 'r') as f:
            content = f.read()
        
        # Check for common issues
        issues = []
        
        if '%' in content:
            issues.append("Karakter '%' ditemukan")
        
        if 'DATABASE_URL' not in content:
            issues.append("DATABASE_URL tidak ditemukan")
        
        if 'POSTGRES_USER' not in content:
            issues.append("POSTGRES_USER tidak ditemukan")
        
        if issues:
            print("✗ Masalah ditemukan dalam file .env:")
            for issue in issues:
                print(f"  - {issue}")
            return False
        else:
            print("✓ File .env valid")
            return True
            
    except Exception as e:
        print(f"✗ Error membaca file .env: {e}")
        return False

def test_env_loading():
    """Test loading environment variables"""
    try:
        # Read .env file manually
        env_vars = {}
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
        
        # Set environment variables
        for key, value in env_vars.items():
            os.environ[key] = value
        
        # Test key variables
        test_vars = ['DATABASE_URL', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST']
        success = True
        
        for var in test_vars:
            value = os.getenv(var)
            if value:
                if 'PASSWORD' in var:
                    masked_value = value[:4] + '*' * (len(value) - 8) + value[-4:] if len(value) > 8 else '****'
                    print(f"✓ {var}: {masked_value}")
                else:
                    print(f"✓ {var}: {value}")
            else:
                print(f"✗ {var}: Tidak ditemukan")
                success = False
        
        return success
        
    except Exception as e:
        print(f"✗ Error testing environment loading: {e}")
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("FIX ENVIRONMENT VARIABLES")
    print("=" * 60)
    
    # Step 1: Backup existing .env
    backup_file = backup_env_file()
    
    # Step 2: Validate current .env
    print("\nValidating current .env file...")
    is_valid = validate_env_file()
    
    if not is_valid:
        print("\nCreating new .env file...")
        if create_env_file():
            print("\nValidating new .env file...")
            is_valid = validate_env_file()
        else:
            print("✗ Gagal membuat file .env baru")
            return False
    
    # Step 3: Test environment loading
    print("\nTesting environment loading...")
    if test_env_loading():
        print("\n✓ Environment variables berfungsi dengan baik!")
    else:
        print("\n✗ Masalah dengan environment variables")
        return False
    
    # Step 4: Test config import
    print("\nTesting config import...")
    try:
        from config import Config
        print("✓ Config module berhasil diimport")
        
        db_url = Config.DATABASE_URL
        print(f"✓ DATABASE_URL dari Config: {db_url}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error importing config: {e}")
        return False

if __name__ == "__main__":
    success = main()
    
    print("\n" + "=" * 60)
    if success:
        print("✓ SEMUA TEST BERHASIL!")
        print("Environment variables sudah diperbaiki dan berfungsi dengan baik.")
    else:
        print("✗ BEBERAPA TEST GAGAL!")
        print("Silakan periksa dokumentasi troubleshooting.")
    
    print("=" * 60) 