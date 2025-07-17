#!/usr/bin/env python3
"""
Script sederhana untuk menguji environment variables
"""

import os
import sys

def test_env_file():
    """Test membaca file .env secara manual"""
    print("=" * 50)
    print("TESTING ENVIRONMENT VARIABLES")
    print("=" * 50)
    
    # Check if .env file exists
    if os.path.exists('.env'):
        print("✓ File .env ditemukan")
        
        # Read .env file manually
        env_vars = {}
        try:
            with open('.env', 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key] = value
                        print(f"✓ {key}: {value}")
        except Exception as e:
            print(f"✗ Error membaca file .env: {e}")
            return False
    else:
        print("✗ File .env tidak ditemukan")
        return False
    
    # Test environment variables
    print("\n" + "=" * 50)
    print("TESTING OS.GETENV")
    print("=" * 50)
    
    # Set environment variables manually
    for key, value in env_vars.items():
        os.environ[key] = value
    
    # Test getting environment variables
    test_vars = ['DATABASE_URL', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST']
    
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
    
    return True

def test_config_loading():
    """Test loading config module"""
    print("\n" + "=" * 50)
    print("TESTING CONFIG MODULE")
    print("=" * 50)
    
    try:
        # Import config after setting environment variables
        from config import Config
        
        print("✓ Config module berhasil diimport")
        
        # Test database URL
        db_url = Config.DATABASE_URL
        print(f"✓ DATABASE_URL dari Config: {db_url}")
        
        # Test database config
        db_config = Config.get_database_config()
        print(f"✓ Database config: {db_config}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error loading config: {e}")
        return False

if __name__ == "__main__":
    print("Memulai test environment variables...")
    
    # Test environment file
    env_ok = test_env_file()
    
    if env_ok:
        # Test config loading
        config_ok = test_config_loading()
        
        print("\n" + "=" * 50)
        print("HASIL AKHIR")
        print("=" * 50)
        
        if config_ok:
            print("✓ Semua test berhasil! Environment variables berfungsi dengan baik.")
            sys.exit(0)
        else:
            print("✗ Config loading gagal.")
            sys.exit(1)
    else:
        print("✗ Environment file test gagal.")
        sys.exit(1) 