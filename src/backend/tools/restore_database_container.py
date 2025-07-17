#!/usr/bin/env python3
"""
Script untuk restore database dari dalam container menggunakan psql
"""

import os
import subprocess
import sys
import time
from datetime import datetime
from config import Config

def check_psql_available():
    """Check apakah psql tersedia"""
    try:
        result = subprocess.run(['psql', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ psql available: {result.stdout.strip()}")
            return True
        else:
            print("❌ psql not available")
            return False
    except FileNotFoundError:
        print("❌ psql command not found. Make sure PostgreSQL client is installed.")
        return False

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

def test_database_connection(database=None):
    """Test koneksi ke database tertentu (default: postgres)"""
    print("=" * 60)
    print("TESTING DATABASE CONNECTION")
    print("=" * 60)
    
    config = get_database_config()
    db_to_test = database or 'postgres'
    print(f"Database config: {config}")
    print(f"Testing connection to database: {db_to_test}")
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', db_to_test,
            '-c', 'SELECT version();'
        ]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Database connection successful!")
            return True
        else:
            print("❌ Database connection failed!")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing connection: {e}")
        return False

def create_database_if_not_exists():
    """Create database jika tidak ada"""
    print("\n" + "=" * 60)
    print("CHECKING AND CREATING DATABASE IF NOT EXISTS")
    print("=" * 60)
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Check if database exists
        check_cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', 'postgres',
            '-c', f"SELECT 1 FROM pg_database WHERE datname = '{config['database']}';"
        ]
        
        print(f"Checking if database {config['database']} exists...")
        result = subprocess.run(check_cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and result.stdout.strip():
            print(f"✅ Database {config['database']} already exists!")
            return True
        else:
            print(f"❌ Database {config['database']} does not exist. Creating...")
            
            # Create database
            create_cmd = [
                'psql',
                '-h', config['host'],
                '-p', str(config['port']),
                '-U', config['user'],
                '-d', 'postgres',
                '-c', f"CREATE DATABASE {config['database']};"
            ]
            
            print(f"Executing: {' '.join(create_cmd)}")
            result = subprocess.run(create_cmd, env=env, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print(f"✅ Database {config['database']} created successfully!")
                
                # Wait a moment for database to be ready
                print("Waiting for database to be ready...")
                time.sleep(2)
                
                return True
            else:
                print(f"❌ Failed to create database {config['database']}!")
                print(f"Error: {result.stderr}")
                return False
                
    except Exception as e:
        print(f"❌ Error checking/creating database: {e}")
        return False

def test_database_connection_with_retry(database=None, max_retries=3, delay=2):
    """Test koneksi ke database dengan retry"""
    print("=" * 60)
    print("TESTING DATABASE CONNECTION WITH RETRY")
    print("=" * 60)
    
    config = get_database_config()
    db_to_test = database or 'postgres'
    print(f"Database config: {config}")
    print(f"Testing connection to database: {db_to_test}")
    print(f"Max retries: {max_retries}, Delay: {delay} seconds")
    
    for attempt in range(max_retries):
        try:
            env = os.environ.copy()
            env['PGPASSWORD'] = config['password']
            
            cmd = [
                'psql',
                '-h', config['host'],
                '-p', str(config['port']),
                '-U', config['user'],
                '-d', db_to_test,
                '-c', 'SELECT version();'
            ]
            
            print(f"Attempt {attempt + 1}/{max_retries}...")
            result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print("✅ Database connection successful!")
                return True
            else:
                print(f"❌ Database connection failed (attempt {attempt + 1})!")
                print(f"Error: {result.stderr}")
                
                # If database doesn't exist and we're testing spk_db, try to create it
                if db_to_test == config['database'] and "does not exist" in result.stderr:
                    print(f"Database {db_to_test} does not exist. Attempting to create...")
                    if create_database_if_not_exists():
                        print("Database created. Retrying connection...")
                        time.sleep(delay)
                        continue
                
                if attempt < max_retries - 1:
                    print(f"Waiting {delay} seconds before retry...")
                    time.sleep(delay)
                
        except Exception as e:
            print(f"❌ Error testing connection (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                print(f"Waiting {delay} seconds before retry...")
                time.sleep(delay)
    
    print(f"❌ All {max_retries} attempts failed!")
    return False

def terminate_db_connections():
    """Terminate all connections to the target database except current"""
    print("\n" + "=" * 60)
    print("TERMINATING CONNECTIONS TO DATABASE")
    print("=" * 60)
    config = get_database_config()
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', 'postgres',
            '-c', f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{config['database']}' AND pid <> pg_backend_pid();"
        ]
        print(f"Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("✅ All connections terminated!")
            print(result.stdout)
            return True
        else:
            print("❌ Failed to terminate connections!")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Error terminating connections: {e}")
        return False

def drop_database_if_exists():
    """Drop database jika ada"""
    print("\n" + "=" * 60)
    print("DROPPING EXISTING DATABASE")
    print("=" * 60)
    
    config = get_database_config()
    
    try:
        # Terminate all connections first
        terminate_db_connections()
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Drop database if exists
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', 'postgres',
            '-c', f"DROP DATABASE IF EXISTS {config['database']};"
        ]
        
        print(f"Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Database dropped successfully!")
            return True
        else:
            print("❌ Failed to drop database!")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error dropping database: {e}")
        return False

def create_database():
    """Create database baru"""
    print("\n" + "=" * 60)
    print("CREATING NEW DATABASE")
    print("=" * 60)
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Create database
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', 'postgres',
            '-c', f"CREATE DATABASE {config['database']};"
        ]
        
        print(f"Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Database created successfully!")
            return True
        else:
            print("❌ Failed to create database!")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def restore_database(backup_file='backup-public.sql'):
    """Restore database dari backup file"""
    print("\n" + "=" * 60)
    print("RESTORING DATABASE FROM BACKUP")
    print("=" * 60)
    
    config = get_database_config()
    
    # Check if backup file exists
    if not os.path.exists(backup_file):
        print(f"❌ Backup file not found: {backup_file}")
        return False
    
    file_size = os.path.getsize(backup_file)
    print(f"Backup file: {backup_file}")
    print(f"File size: {file_size} bytes ({file_size/1024/1024:.2f} MB)")
    
    # Estimate restore time based on file size
    estimated_time = max(60, file_size / 1024 / 10)  # Rough estimate: 1 minute per 10KB
    print(f"Estimated restore time: {estimated_time/60:.1f} minutes")
    print(f"Timeout set to: 30 minutes")
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Restore database
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', config['database'],
            '-f', backup_file
        ]
        
        print(f"Executing: {' '.join(cmd)}")
        print("⏳ Restore in progress... (this may take several minutes)")
        start_time = time.time()
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=1800)  # 30 minutes timeout
        
        end_time = time.time()
        duration = end_time - start_time
        
        if result.returncode == 0:
            print(f"✅ Database restored successfully in {duration:.2f} seconds ({duration/60:.1f} minutes)!")
            
            # Show restore speed
            speed = file_size / duration / 1024 / 1024  # MB/s
            print(f"📊 Restore speed: {speed:.2f} MB/s")
            
            return True
        else:
            print(f"❌ Failed to restore database!")
            print(f"Error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Restore operation timed out (30 minutes)")
        print("💡 Try increasing timeout or check database performance")
        return False
    except Exception as e:
        print(f"❌ Error restoring database: {e}")
        return False

def verify_restore():
    """Verify restore berhasil"""
    print("\n" + "=" * 60)
    print("VERIFYING RESTORE")
    print("=" * 60)
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Check tables
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', config['database'],
            '-c', "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
        ]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Tables verification successful!")
            print(f"Tables:\n{result.stdout}")
            
            # Check data counts
            count_queries = [
                "SELECT COUNT(*) as mahasiswa_count FROM mahasiswa;",
                "SELECT COUNT(*) as nilai_count FROM nilai;",
                "SELECT COUNT(*) as klasifikasi_count FROM klasifikasi_kelulusan;"
            ]
            
            for query in count_queries:
                cmd = [
                    'psql',
                    '-h', config['host'],
                    '-p', str(config['port']),
                    '-U', config['user'],
                    '-d', config['database'],
                    '-c', query
                ]
                
                result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    print(f"✅ {query.strip()}: {result.stdout.strip()}")
            
            return True
        else:
            print("❌ Failed to verify restore!")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying restore: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting Database Restore from Container...")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Check psql availability
    if not check_psql_available():
        print("❌ Cannot proceed without psql")
        sys.exit(1)
    
    # Step 2: Test database server connection (to postgres, not spk_db)
    if not test_database_connection(database='postgres'):
        print("❌ Cannot connect to database server")
        sys.exit(1)
    
    # Step 3: Check and create database if not exists
    if not create_database_if_not_exists():
        print("❌ Failed to check/create database")
        sys.exit(1)
    
    # Step 4: Test connection to spk_db with retry
    if not test_database_connection_with_retry(database=get_database_config()['database']):
        print("❌ Cannot connect to database after creation")
        sys.exit(1)
    
    # Step 5: Restore database
    backup_file = sys.argv[1] if len(sys.argv) > 1 else 'backup-public.sql'
    if not restore_database(backup_file):
        print("❌ Failed to restore database")
        sys.exit(1)
    
    # Step 6: Verify restore
    if not verify_restore():
        print("❌ Restore verification failed")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 DATABASE RESTORE COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"Database: {get_database_config()['database']}")
    print(f"Host: {get_database_config()['host']}:{get_database_config()['port']}")
    print(f"User: {get_database_config()['user']}")
    print(f"Backup file: {backup_file}")
    print("=" * 60)

if __name__ == "__main__":
    main() 