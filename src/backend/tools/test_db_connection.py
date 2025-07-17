#!/usr/bin/env python3
"""
Script untuk test koneksi database dari dalam container
"""

import os
import subprocess
import sys
from config import Config

def test_psql_connection():
    """Test koneksi PostgreSQL menggunakan psql"""
    print("=" * 60)
    print("TESTING POSTGRESQL CONNECTION WITH PSQL")
    print("=" * 60)
    
    # Get database configuration
    db_config = Config.get_database_config()
    print(f"Database config: {db_config}")
    
    # Extract connection details
    host = db_config.get('host', 'localhost')
    port = db_config.get('port', '5432')
    database = db_config.get('database', 'spk_db')
    user = db_config.get('user', 'postgres')
    password = db_config.get('password', 'postgres')
    
    print(f"\nConnection details:")
    print(f"  Host: {host}")
    print(f"  Port: {port}")
    print(f"  Database: {database}")
    print(f"  User: {user}")
    print(f"  Password: {'*' * len(password) if password else 'None'}")
    
    # Test psql command
    try:
        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        # First, test connection to postgres database
        print(f"\nTesting connection to postgres database...")
        cmd_postgres = [
            'psql',
            '-h', host,
            '-p', str(port),
            '-U', user,
            '-d', 'postgres',
            '-c', 'SELECT version();'
        ]
        
        result = subprocess.run(
            cmd_postgres,
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            print("❌ Cannot connect to PostgreSQL server!")
            print(f"Error:\n{result.stderr}")
            return False
        
        print("✅ PostgreSQL server connection successful!")
        
        # Check if target database exists
        print(f"\nChecking if database '{database}' exists...")
        cmd_check = [
            'psql',
            '-h', host,
            '-p', str(port),
            '-U', user,
            '-d', 'postgres',
            '-c', f"SELECT 1 FROM pg_database WHERE datname = '{database}';"
        ]
        
        result = subprocess.run(
            cmd_check,
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and result.stdout.strip():
            print(f"✅ Database '{database}' exists!")
            
            # Test connection to target database
            cmd = [
                'psql',
                '-h', host,
                '-p', str(port),
                '-U', user,
                '-d', database,
                '-c', 'SELECT version();'
            ]
            
            print(f"\nExecuting command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("✅ PostgreSQL connection successful!")
                print(f"Output:\n{result.stdout}")
                return True
            else:
                print("❌ PostgreSQL connection failed!")
                print(f"Error:\n{result.stderr}")
                return False
        else:
            print(f"❌ Database '{database}' does not exist!")
            print("Please create the database first or run the restore script.")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Connection timeout")
        return False
    except FileNotFoundError:
        print("❌ psql command not found. Make sure PostgreSQL client is installed.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_database_tables():
    """Test apakah tabel-tabel yang diperlukan ada"""
    print("\n" + "=" * 60)
    print("TESTING DATABASE TABLES")
    print("=" * 60)
    
    db_config = Config.get_database_config()
    host = db_config.get('host', 'localhost')
    port = db_config.get('port', '5432')
    database = db_config.get('database', 'spk_db')
    user = db_config.get('user', 'postgres')
    password = db_config.get('password', 'postgres')
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        # List tables
        cmd = [
            'psql',
            '-h', host,
            '-p', str(port),
            '-U', user,
            '-d', database,
            '-c', "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
        ]
        
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("✅ Database tables query successful!")
            print(f"Tables:\n{result.stdout}")
            
            # Check for specific tables
            output = result.stdout.lower()
            required_tables = ['mahasiswa', 'nilai', 'klasifikasi_kelulusan']
            found_tables = []
            
            for table in required_tables:
                if table in output:
                    found_tables.append(table)
            
            print(f"\nRequired tables found: {found_tables}")
            if len(found_tables) == len(required_tables):
                print("✅ All required tables exist!")
                return True
            else:
                missing = set(required_tables) - set(found_tables)
                print(f"❌ Missing tables: {missing}")
                return False
        else:
            print("❌ Failed to query tables!")
            print(f"Error:\n{result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing tables: {e}")
        return False

def test_database_data():
    """Test apakah ada data di database"""
    print("\n" + "=" * 60)
    print("TESTING DATABASE DATA")
    print("=" * 60)
    
    db_config = Config.get_database_config()
    host = db_config.get('host', 'localhost')
    port = db_config.get('port', '5432')
    database = db_config.get('database', 'spk_db')
    user = db_config.get('user', 'postgres')
    password = db_config.get('password', 'postgres')
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        # Count records in tables
        queries = [
            "SELECT COUNT(*) as mahasiswa_count FROM mahasiswa;",
            "SELECT COUNT(*) as nilai_count FROM nilai;",
            "SELECT COUNT(*) as klasifikasi_count FROM klasifikasi_kelulusan;"
        ]
        
        for query in queries:
            cmd = [
                'psql',
                '-h', host,
                '-p', str(port),
                '-U', user,
                '-d', database,
                '-c', query
            ]
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Query successful: {query.strip()}")
                print(f"Result: {result.stdout.strip()}")
            else:
                print(f"❌ Query failed: {query.strip()}")
                print(f"Error: {result.stderr}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing data: {e}")
        return False

def main():
    """Main function"""
    print("Starting database connection tests...")
    
    # Test 1: Basic connection
    connection_ok = test_psql_connection()
    
    if connection_ok:
        # Test 2: Database tables
        tables_ok = test_database_tables()
        
        # Test 3: Database data
        data_ok = test_database_data()
        
        print("\n" + "=" * 60)
        print("TEST RESULTS SUMMARY")
        print("=" * 60)
        
        print(f"✅ Connection: {'PASS' if connection_ok else 'FAIL'}")
        print(f"✅ Tables: {'PASS' if tables_ok else 'FAIL'}")
        print(f"✅ Data: {'PASS' if data_ok else 'FAIL'}")
        
        if connection_ok and tables_ok and data_ok:
            print("\n🎉 ALL TESTS PASSED! Database is working correctly.")
            sys.exit(0)
        else:
            print("\n⚠️ Some tests failed. Please check the database configuration.")
            sys.exit(1)
    else:
        print("\n❌ Connection test failed. Cannot proceed with other tests.")
        sys.exit(1)

if __name__ == "__main__":
    main() 