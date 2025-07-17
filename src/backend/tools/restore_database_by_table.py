#!/usr/bin/env python3
"""
Script untuk restore database per-tabel dari dalam container
"""

import os
import subprocess
import sys
import time
import re
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

def extract_table_sections(backup_file):
    """Extract section per-tabel dari backup file"""
    print("\n" + "=" * 60)
    print("EXTRACTING TABLE SECTIONS FROM BACKUP")
    print("=" * 60)
    
    if not os.path.exists(backup_file):
        print(f"❌ Backup file not found: {backup_file}")
        return {}
    
    print(f"Reading backup file: {backup_file}")
    
    try:
        with open(backup_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Define table order (sesuai dependency)
        table_order = [
            'alembic_version',
            'mahasiswa', 
            'nilai',
            'klasifikasi_kelulusan',
            'saw_criteria',
            'saw_results',
            'saw_final_results'
        ]
        
        table_sections = {}
        
        for table in table_order:
            print(f"Extracting section for table: {table}")
            
            # Pattern untuk extract section per tabel
            # Mencari dari CREATE TABLE sampai akhir data INSERT
            pattern = rf'--\s*Name:\s*{table}.*?(?=--\s*Name:\s*|$)'
            matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
            
            if matches:
                table_sections[table] = matches[0].strip()
                print(f"✅ Found {table} section ({len(matches[0])} characters)")
            else:
                print(f"⚠️  No section found for {table}")
        
        return table_sections
        
    except Exception as e:
        print(f"❌ Error extracting table sections: {e}")
        return {}

def restore_table_schema(table_name, table_section):
    """Restore schema tabel tertentu"""
    print(f"\n📋 Restoring schema for table: {table_name}")
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Extract CREATE TABLE statement
        create_pattern = rf'CREATE TABLE.*?{table_name}.*?;'
        create_match = re.search(create_pattern, table_section, re.DOTALL | re.IGNORECASE)
        
        if not create_match:
            print(f"❌ No CREATE TABLE found for {table_name}")
            return False
        
        create_statement = create_match.group(0)
        
        # Execute CREATE TABLE
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', config['database'],
            '-c', create_statement
        ]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print(f"✅ Schema restored for {table_name}")
            return True
        else:
            print(f"❌ Failed to restore schema for {table_name}")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error restoring schema for {table_name}: {e}")
        return False

def restore_table_data(table_name, table_section):
    """Restore data tabel tertentu"""
    print(f"\n📊 Restoring data for table: {table_name}")
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Extract INSERT statements
        insert_pattern = r'INSERT INTO.*?;'
        insert_matches = re.findall(insert_pattern, table_section, re.DOTALL | re.IGNORECASE)
        
        if not insert_matches:
            print(f"⚠️  No INSERT statements found for {table_name}")
            return True
        
        print(f"Found {len(insert_matches)} INSERT statements for {table_name}")
        
        # Process INSERT statements in batches
        batch_size = 1000
        total_inserts = len(insert_matches)
        
        for i in range(0, total_inserts, batch_size):
            batch = insert_matches[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_inserts + batch_size - 1) // batch_size
            
            print(f"Processing batch {batch_num}/{total_batches} ({len(batch)} statements)")
            
            # Combine batch statements
            batch_sql = '\n'.join(batch)
            
            # Execute batch
            cmd = [
                'psql',
                '-h', config['host'],
                '-p', str(config['port']),
                '-U', config['user'],
                '-d', config['database'],
                '-c', batch_sql
            ]
            
            start_time = time.time()
            result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=300)  # 5 minutes per batch
            end_time = time.time()
            
            if result.returncode == 0:
                duration = end_time - start_time
                print(f"✅ Batch {batch_num} completed in {duration:.2f} seconds")
            else:
                print(f"❌ Failed to process batch {batch_num}")
                print(f"Error: {result.stderr}")
                return False
        
        print(f"✅ All data restored for {table_name}")
        return True
        
    except Exception as e:
        print(f"❌ Error restoring data for {table_name}: {e}")
        return False

def verify_table_restore(table_name):
    """Verify restore tabel tertentu"""
    print(f"\n🔍 Verifying restore for table: {table_name}")
    
    config = get_database_config()
    
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        # Check if table exists and has data
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', config['database'],
            '-c', f"SELECT COUNT(*) FROM {table_name};",
            '-t'
        ]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            count = result.stdout.strip()
            if count.isdigit():
                print(f"✅ {table_name}: {int(count):,} records")
                return True
            else:
                print(f"❌ {table_name}: Invalid count result")
                return False
        else:
            print(f"❌ {table_name}: Failed to verify")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying {table_name}: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting Database Restore by Table...")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Check psql availability
    if not check_psql_available():
        print("❌ Cannot proceed without psql")
        sys.exit(1)
    
    # Step 2: Test database server connection
    if not test_database_connection(database='postgres'):
        print("❌ Cannot connect to database server")
        sys.exit(1)
    
    # Step 3: Check and create database if not exists
    if not create_database_if_not_exists():
        print("❌ Failed to check/create database")
        sys.exit(1)
    
    # Step 4: Test connection to target database
    if not test_database_connection(database=get_database_config()['database']):
        print("❌ Cannot connect to target database")
        sys.exit(1)
    
    # Step 5: Extract table sections from backup
    backup_file = sys.argv[1] if len(sys.argv) > 1 else 'backup-public.sql'
    table_sections = extract_table_sections(backup_file)
    
    if not table_sections:
        print("❌ Failed to extract table sections")
        sys.exit(1)
    
    # Step 6: Restore tables one by one
    table_order = [
        'alembic_version',
        'mahasiswa', 
        'nilai',
        'klasifikasi_kelulusan',
        'saw_criteria',
        'saw_results',
        'saw_final_results'
    ]
    
    success_count = 0
    total_tables = len(table_order)
    
    for table in table_order:
        if table not in table_sections:
            print(f"⚠️  Skipping {table} (no section found)")
            continue
        
        print(f"\n{'='*60}")
        print(f"RESTORING TABLE: {table.upper()}")
        print(f"{'='*60}")
        
        # Restore schema
        if not restore_table_schema(table, table_sections[table]):
            print(f"❌ Failed to restore schema for {table}")
            continue
        
        # Restore data
        if not restore_table_data(table, table_sections[table]):
            print(f"❌ Failed to restore data for {table}")
            continue
        
        # Verify restore
        if not verify_table_restore(table):
            print(f"❌ Failed to verify restore for {table}")
            continue
        
        success_count += 1
        print(f"✅ Table {table} restored successfully!")
    
    # Step 7: Final summary
    print(f"\n{'='*60}")
    print("RESTORE SUMMARY")
    print(f"{'='*60}")
    print(f"Tables processed: {success_count}/{total_tables}")
    print(f"Success rate: {(success_count/total_tables)*100:.1f}%")
    
    if success_count == total_tables:
        print("🎉 ALL TABLES RESTORED SUCCESSFULLY!")
    else:
        print("⚠️  Some tables failed to restore")
    
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 