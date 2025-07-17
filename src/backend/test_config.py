#!/usr/bin/env python3
"""
Script untuk test konfigurasi SPK Monitoring Masa Studi
Memvalidasi semua environment variables dan konfigurasi
"""

import sys
import os
from config import Config

def test_database_config():
    """Test konfigurasi database"""
    print("🔍 Testing Database Configuration...")
    print("-" * 50)
    
    db_config = Config.get_database_config()
    
    print(f"✅ POSTGRES_USER: {db_config['user']}")
    print(f"✅ POSTGRES_PASSWORD: {'*' * len(db_config['password'])}")
    print(f"✅ POSTGRES_HOST: {db_config['host']}")
    print(f"✅ POSTGRES_PORT: {db_config['port']}")
    print(f"✅ POSTGRES_DB: {db_config['database']}")
    print(f"✅ DATABASE_URL: {db_config['url']}")
    
    # Test SQLAlchemy config
    print(f"✅ SQLALCHEMY_DATABASE_URI: {Config.SQLALCHEMY_DATABASE_URI}")
    print(f"✅ SQLALCHEMY_TRACK_MODIFICATIONS: {Config.SQLALCHEMY_TRACK_MODIFICATIONS}")
    
    return True

def test_application_config():
    """Test konfigurasi aplikasi"""
    print("\n🔍 Testing Application Configuration...")
    print("-" * 50)
    
    print(f"✅ SECRET_KEY: {'*' * len(Config.SECRET_KEY)}")
    print(f"✅ DEBUG: {Config.DEBUG}")
    print(f"✅ ENVIRONMENT: {Config.ENVIRONMENT}")
    print(f"✅ HOST: {Config.HOST}")
    print(f"✅ PORT: {Config.PORT}")
    print(f"✅ WORKERS: {Config.WORKERS}")
    
    return True

def test_cors_config():
    """Test konfigurasi CORS"""
    print("\n🔍 Testing CORS Configuration...")
    print("-" * 50)
    
    cors_origins = Config.get_cors_origins()
    cors_headers = Config.get_cors_headers()
    cors_methods = Config.get_cors_methods()
    
    print(f"✅ CORS_ORIGINS: {cors_origins}")
    print(f"✅ CORS_HEADERS: {cors_headers}")
    print(f"✅ CORS_METHODS: {cors_methods}")
    
    return True

def test_api_config():
    """Test konfigurasi API"""
    print("\n🔍 Testing API Configuration...")
    print("-" * 50)
    
    api_config = Config.get_api_config()
    
    print(f"✅ API_PREFIX: {api_config['prefix']}")
    print(f"✅ API_VERSION: {api_config['version']}")
    print(f"✅ API_TITLE: {api_config['title']}")
    print(f"✅ API_DESCRIPTION: {api_config['description']}")
    print(f"✅ API_VERSION_STR: {api_config['version_str']}")
    
    return True

def test_security_config():
    """Test konfigurasi security"""
    print("\n🔍 Testing Security Configuration...")
    print("-" * 50)
    
    allowed_hosts = Config.get_allowed_hosts()
    
    print(f"✅ ALLOWED_HOSTS: {allowed_hosts}")
    print(f"✅ RATE_LIMIT_ENABLED: {Config.RATE_LIMIT_ENABLED}")
    print(f"✅ RATE_LIMIT_REQUESTS: {Config.RATE_LIMIT_REQUESTS}")
    print(f"✅ RATE_LIMIT_WINDOW: {Config.RATE_LIMIT_WINDOW}")
    
    return True

def test_file_upload_config():
    """Test konfigurasi file upload"""
    print("\n🔍 Testing File Upload Configuration...")
    print("-" * 50)
    
    allowed_extensions = Config.get_allowed_extensions()
    
    print(f"✅ MAX_FILE_SIZE: {Config.MAX_FILE_SIZE} bytes ({Config.MAX_FILE_SIZE / 1024 / 1024:.1f} MB)")
    print(f"✅ UPLOAD_FOLDER: {Config.UPLOAD_FOLDER}")
    print(f"✅ ALLOWED_EXTENSIONS: {allowed_extensions}")
    
    return True

def test_spk_config():
    """Test konfigurasi SPK specific"""
    print("\n🔍 Testing SPK Specific Configuration...")
    print("-" * 50)
    
    print("✅ SAW_CRITERIA_WEIGHTS:")
    for criteria, weight in Config.SAW_CRITERIA_WEIGHTS.items():
        print(f"   - {criteria}: {weight}")
    
    print("\n✅ FUZZY_SETS:")
    for criteria, sets in Config.FUZZY_SETS.items():
        print(f"   - {criteria}: {sets}")
    
    print("\n✅ CLASSIFICATION_THRESHOLDS:")
    for level, threshold in Config.CLASSIFICATION_THRESHOLDS.items():
        print(f"   - {level}: {threshold}")
    
    return True

def test_environment_detection():
    """Test deteksi environment"""
    print("\n🔍 Testing Environment Detection...")
    print("-" * 50)
    
    print(f"✅ Is Production: {Config.is_production()}")
    print(f"✅ Is Development: {Config.is_development()}")
    print(f"✅ Current Environment: {Config.ENVIRONMENT}")
    
    return True

def test_config_validation():
    """Test validasi konfigurasi"""
    print("\n🔍 Testing Configuration Validation...")
    print("-" * 50)
    
    is_valid = Config.validate_config()
    
    if is_valid:
        print("✅ Configuration validation passed")
    else:
        print("❌ Configuration validation failed")
    
    return is_valid

def test_server_config():
    """Test konfigurasi server"""
    print("\n🔍 Testing Server Configuration...")
    print("-" * 50)
    
    server_config = Config.get_server_config()
    
    print(f"✅ HOST: {server_config['host']}")
    print(f"✅ PORT: {server_config['port']}")
    print(f"✅ WORKERS: {server_config['workers']}")
    print(f"✅ DEBUG: {server_config['debug']}")
    
    return True

def main():
    """Main function untuk menjalankan semua test"""
    print("🚀 SPK Configuration Test")
    print("=" * 50)
    
    tests = [
        test_database_config,
        test_application_config,
        test_cors_config,
        test_api_config,
        test_security_config,
        test_file_upload_config,
        test_spk_config,
        test_environment_detection,
        test_server_config,
        test_config_validation
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
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Total: {passed + failed}")
    
    if failed == 0:
        print("\n🎉 All tests passed! Configuration is valid.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 