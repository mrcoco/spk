#!/usr/bin/env python3
"""
Script test untuk restore database per-tabel dengan database kosong
"""

import os
import subprocess
import sys
import time
from datetime import datetime
from config import Config

def get_database_config():
    """Get konfigurasi database"""
    db_config = Config.get_database_config()
    return {
        'host': db_config.get('host', 'localhost'),
        'port': db_config.get('port', '5432'),
        'database': db_config.get('database', 'spk_db'),
        'user': db_config.get('user', 'postgres'),
        'password': db_config.get('password', 'postgres')
    }

def drop_database():
    """Drop database untuk test restore"""
    print("=" * 60)
    print("DROPPING DATABASE FOR TEST")
    print("=" * 60)
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Terminate all connections first
        terminate_cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', 'postgres',
            '-c', f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{config['database']}' AND pid <> pg_backend_pid();"
        ]
        
        print("Terminating existing connections...")
        subprocess.run(terminate_cmd, env=env, capture_output=True, text=True, timeout=30)
        
        # Drop database
        drop_cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', 'postgres',
            '-c', f"DROP DATABASE IF EXISTS {config['database']};"
        ]
        
        print(f"Dropping database {config['database']}...")
        result = subprocess.run(drop_cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(f"✅ Database {config['database']} dropped successfully!")
            return True
        else:
            print(f"❌ Failed to drop database {config['database']}!")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error dropping database: {e}")
        return False

def test_restore_by_table():
    """Test restore per-tabel"""
    print("\n" + "=" * 60)
    print("TESTING RESTORE BY TABLE")
    print("=" * 60)
    
    backup_file = 'backup-public.sql'
    
    if not os.path.exists(backup_file):
        print(f"❌ Backup file not found: {backup_file}")
        return False
    
    print(f"Testing restore with backup file: {backup_file}")
    
    try:
        # Run restore by table script
        cmd = ['python', 'restore_database_by_table.py', backup_file]
        
        print(f"Executing: {' '.join(cmd)}")
        start_time = time.time()
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)  # 30 minutes timeout
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\nRestore completed in {duration:.2f} seconds")
        
        if result.returncode == 0:
            print("✅ Restore by table test PASSED!")
            print("\nOutput:")
            print(result.stdout)
            return True
        else:
            print("❌ Restore by table test FAILED!")
            print(f"Error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Restore by table test TIMEOUT!")
        return False
    except Exception as e:
        print(f"❌ Error during restore test: {e}")
        return False

def verify_restore():
    """Verify hasil restore"""
    print("\n" + "=" * 60)
    print("VERIFYING RESTORE RESULTS")
    print("=" * 60)
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Check tables
        tables_cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', config['database'],
            '-c', "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
            '-t'
        ]
        
        result = subprocess.run(tables_cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            tables = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
            print(f"✅ Tables found: {tables}")
            
            expected_tables = [
                'alembic_version',
                'mahasiswa',
                'nilai', 
                'klasifikasi_kelulusan',
                'saw_criteria',
                'saw_results',
                'saw_final_results'
            ]
            
            missing_tables = [t for t in expected_tables if t not in tables]
            if missing_tables:
                print(f"❌ Missing tables: {missing_tables}")
                return False
            else:
                print("✅ All expected tables found!")
        else:
            print(f"❌ Failed to check tables: {result.stderr}")
            return False
        
        # Check record counts
        tables_to_check = ['mahasiswa', 'nilai', 'klasifikasi_kelulusan']
        
        for table in tables_to_check:
            count_cmd = [
                'psql',
                '-h', config['host'],
                '-p', str(config['port']),
                '-U', config['user'],
                '-d', config['database'],
                '-c', f"SELECT COUNT(*) FROM {table};",
                '-t'
            ]
            
            result = subprocess.run(count_cmd, env=env, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                count = result.stdout.strip()
                if count.isdigit():
                    print(f"✅ {table}: {int(count):,} records")
                else:
                    print(f"❌ {table}: Invalid count")
                    return False
            else:
                print(f"❌ Failed to count {table}: {result.stderr}")
                return False
        
        print("✅ All verifications passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False

def main():
    """Main function"""
    print("🧪 Testing Database Restore by Table")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Drop database
    if not drop_database():
        print("❌ Failed to drop database")
        sys.exit(1)
    
    # Step 2: Test restore by table
    if not test_restore_by_table():
        print("❌ Restore by table test failed")
        sys.exit(1)
    
    # Step 3: Verify restore
    if not verify_restore():
        print("❌ Verification failed")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print("🎉 ALL TESTS PASSED!")
    print(f"{'='*60}")
    print("✅ Database dropped successfully")
    print("✅ Restore by table completed")
    print("✅ All tables and data verified")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 