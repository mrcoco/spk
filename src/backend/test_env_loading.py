#!/usr/bin/env python3
"""
Script untuk menguji loading environment variables
"""

import os
import sys
from pathlib import Path

def test_env_loading():
    """Test loading environment variables"""
    print("=" * 60)
    print("TEST LOADING ENVIRONMENT VARIABLES")
    print("=" * 60)
    
    # Check current directory
    current_dir = os.getcwd()
    print(f"Current directory: {current_dir}")
    
    # Check for .env files
    env_files = ['.env', 'env.local', 'env.backend']
    found_files = []
    
    for env_file in env_files:
        if os.path.exists(env_file):
            found_files.append(env_file)
            print(f"✓ Found: {env_file}")
        else:
            print(f"✗ Not found: {env_file}")
    
    # Check parent directory for .env
    parent_env = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(parent_env):
        found_files.append(f"../{os.path.basename(parent_env)}")
        print(f"✓ Found: ../{os.path.basename(parent_env)}")
    else:
        print(f"✗ Not found: ../{os.path.basename(parent_env)}")
    
    print(f"\nTotal .env files found: {len(found_files)}")
    
    # Test dotenv import
    try:
        from dotenv import load_dotenv
        print("✓ python-dotenv imported successfully")
        
        # Try to load environment variables
        loaded = False
        for env_file in ['.env', 'env.local', 'env.backend']:
            if os.path.exists(env_file):
                load_dotenv(env_file)
                loaded = True
                print(f"✓ Loaded environment from: {env_file}")
                break
        
        if not loaded:
            # Try parent directory
            if os.path.exists(parent_env):
                load_dotenv(parent_env)
                loaded = True
                print(f"✓ Loaded environment from: {parent_env}")
        
        if not loaded:
            print("✗ No environment file loaded")
            
    except ImportError:
        print("✗ python-dotenv not installed")
        return False
    
    # Test key environment variables
    print("\n" + "=" * 60)
    print("TESTING KEY ENVIRONMENT VARIABLES")
    print("=" * 60)
    
    key_vars = [
        'DATABASE_URL',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD',
        'POSTGRES_HOST',
        'POSTGRES_PORT',
        'POSTGRES_DB',
        'SECRET_KEY',
        'DEBUG',
        'ENVIRONMENT'
    ]
    
    for var in key_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if 'PASSWORD' in var or 'SECRET' in var:
                masked_value = value[:4] + '*' * (len(value) - 8) + value[-4:] if len(value) > 8 else '****'
                print(f"✓ {var}: {masked_value}")
            else:
                print(f"✓ {var}: {value}")
        else:
            print(f"✗ {var}: Not set")
    
    # Test database URL construction
    print("\n" + "=" * 60)
    print("TESTING DATABASE URL CONSTRUCTION")
    print("=" * 60)
    
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        print(f"✓ DATABASE_URL from env: {db_url}")
    else:
        # Construct from individual components
        user = os.getenv('POSTGRES_USER', 'spk_user')
        password = os.getenv('POSTGRES_PASSWORD', 'spk_password')
        host = os.getenv('POSTGRES_HOST', 'db')
        port = os.getenv('POSTGRES_PORT', '5432')
        db = os.getenv('POSTGRES_DB', 'spk_db')
        
        constructed_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
        print(f"✓ Constructed DATABASE_URL: {constructed_url}")
    
    print("\n" + "=" * 60)
    print("ENVIRONMENT LOADING TEST COMPLETED")
    print("=" * 60)
    
    return True

def test_config_import():
    """Test importing config module"""
    print("\n" + "=" * 60)
    print("TESTING CONFIG MODULE IMPORT")
    print("=" * 60)
    
    try:
        from config import Config
        print("✓ Config module imported successfully")
        
        # Test config validation
        is_valid = Config.validate_config()
        if is_valid:
            print("✓ Config validation passed")
        else:
            print("✗ Config validation failed")
        
        # Test database config
        db_config = Config.get_database_config()
        print(f"✓ Database config: {db_config}")
        
        # Test server config
        server_config = Config.get_server_config()
        print(f"✓ Server config: {server_config}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error importing config: {e}")
        return False

if __name__ == "__main__":
    print("Starting environment variables test...")
    
    # Test environment loading
    env_ok = test_env_loading()
    
    # Test config import
    config_ok = test_config_import()
    
    print("\n" + "=" * 60)
    print("FINAL RESULT")
    print("=" * 60)
    
    if env_ok and config_ok:
        print("✓ All tests passed! Environment variables are working correctly.")
        sys.exit(0)
    else:
        print("✗ Some tests failed. Please check the configuration.")
        sys.exit(1) 