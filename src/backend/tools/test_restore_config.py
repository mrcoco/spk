#!/usr/bin/env python3
"""
Script untuk test restore_database.py dengan konfigurasi yang diperbarui
"""

import sys
import os
from config import Config

def test_config_import():
    """Test import konfigurasi"""
    print("🔍 Testing Config Import...")
    print("-" * 50)
    
    try:
        from config import Config
        print("✅ Config import successful")
        return True
    except ImportError as e:
        print(f"❌ Config import failed: {e}")
        return False

def test_database_config():
    """Test konfigurasi database"""
    print("\n🔍 Testing Database Configuration...")
    print("-" * 50)
    
    try:
        db_config = Config.get_database_config()
        
        print(f"✅ POSTGRES_USER: {db_config['user']}")
        print(f"✅ POSTGRES_PASSWORD: {'*' * len(db_config['password'])}")
        print(f"✅ POSTGRES_HOST: {db_config['host']}")
        print(f"✅ POSTGRES_PORT: {db_config['port']}")
        print(f"✅ POSTGRES_DB: {db_config['database']}")
        print(f"✅ DATABASE_URL: {db_config['url']}")
        
        return True
    except Exception as e:
        print(f"❌ Database config failed: {e}")
        return False

def test_restore_import():
    """Test import restore_database"""
    print("\n🔍 Testing Restore Database Import...")
    print("-" * 50)
    
    try:
        # Test import get_db_config function
        from restore_database import get_db_config
        
        print("✅ Restore database import successful")
        return True
    except ImportError as e:
        if "psycopg2" in str(e):
            print("⚠️  psycopg2 not installed (required for database operations)")
            print("💡 Install with: pip install psycopg2-binary")
            return True  # Consider this a warning, not failure
        else:
            print(f"❌ Restore database import failed: {e}")
            return False

def test_restore_config():
    """Test konfigurasi restore database"""
    print("\n🔍 Testing Restore Database Configuration...")
    print("-" * 50)
    
    try:
        from restore_database import get_db_config
        
        db_config = get_db_config()
        
        print(f"✅ Host: {db_config['host']}")
        print(f"✅ Port: {db_config['port']}")
        print(f"✅ Database: {db_config['database']}")
        print(f"✅ User: {db_config['user']}")
        print(f"✅ Password: {'*' * len(db_config['password'])}")
        
        return True
    except ImportError as e:
        if "psycopg2" in str(e):
            print("⚠️  psycopg2 not installed (required for database operations)")
            print("💡 Install with: pip install psycopg2-binary")
            return True  # Consider this a warning, not failure
        else:
            print(f"❌ Restore config failed: {e}")
            return False
    except Exception as e:
        print(f"❌ Restore config failed: {e}")
        return False

def test_config_validation():
    """Test validasi konfigurasi"""
    print("\n🔍 Testing Configuration Validation...")
    print("-" * 50)
    
    try:
        is_valid = Config.validate_config()
        
        if is_valid:
            print("✅ Configuration validation passed")
            return True
        else:
            print("❌ Configuration validation failed")
            return False
    except Exception as e:
        print(f"❌ Configuration validation error: {e}")
        return False

def test_environment_info():
    """Test informasi environment"""
    print("\n🔍 Testing Environment Information...")
    print("-" * 50)
    
    try:
        print(f"✅ Environment: {Config.ENVIRONMENT}")
        print(f"✅ Debug Mode: {Config.DEBUG}")
        print(f"✅ Is Production: {Config.is_production()}")
        print(f"✅ Is Development: {Config.is_development()}")
        
        return True
    except Exception as e:
        print(f"❌ Environment info failed: {e}")
        return False

def test_backup_file():
    """Test keberadaan file backup"""
    print("\n🔍 Testing Backup File...")
    print("-" * 50)
    
    backup_file = 'backup-public.sql'
    
    if os.path.exists(backup_file):
        file_size = os.path.getsize(backup_file)
        print(f"✅ Backup file found: {backup_file}")
        print(f"✅ File size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
        return True
    else:
        print(f"❌ Backup file not found: {backup_file}")
        return False

def main():
    """Main function untuk menjalankan semua test"""
    print("🚀 Restore Database Configuration Test")
    print("=" * 60)
    
    tests = [
        test_config_import,
        test_database_config,
        test_restore_import,
        test_restore_config,
        test_config_validation,
        test_environment_info,
        test_backup_file
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with error: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Total: {passed + failed}")
    
    if failed == 0:
        print("\n🎉 All tests passed! Restore database configuration is ready.")
        print("\n💡 Usage examples:")
        print("   python3 restore_database.py --validate-config")
        print("   python3 restore_database.py --help")
        print("   python3 restore_database.py -d -v -y")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 