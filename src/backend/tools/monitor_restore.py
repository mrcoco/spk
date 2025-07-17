#!/usr/bin/env python3
"""
Script untuk monitor progress restore database secara real-time
"""

import os
import time
import subprocess
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

def check_table_records(table_name):
    """Check jumlah records di tabel tertentu"""
    config = get_database_config()
    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        cmd = [
            'psql',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['user'],
            '-d', config['database'],
            '-c', f"SELECT COUNT(*) FROM {table_name};",
            '-t'  # Tuples only
        ]
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            count = result.stdout.strip()
            return int(count) if count.isdigit() else 0
        else:
            return 0
            
    except Exception as e:
        print(f"Error checking {table_name}: {e}")
        return 0

def monitor_restore_progress():
    """Monitor progress restore database"""
    print("🔍 Database Restore Progress Monitor")
    print("=" * 50)
    
    config = get_database_config()
    tables_to_monitor = ['mahasiswa', 'nilai', 'klasifikasi_kelulusan', 'saw_results', 'saw_criteria', 'saw_final_results']
    
    print(f"Monitoring database: {config['database']}")
    print(f"Tables to monitor: {', '.join(tables_to_monitor)}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Initial check
    initial_counts = {}
    for table in tables_to_monitor:
        count = check_table_records(table)
        initial_counts[table] = count
        print(f"📊 {table}: {count:,} records")
    
    print("\n⏳ Monitoring progress... (Press Ctrl+C to stop)")
    print("-" * 50)
    
    try:
        while True:
            current_time = datetime.now().strftime('%H:%M:%S')
            print(f"\n🕐 {current_time}")
            
            total_records = 0
            for table in tables_to_monitor:
                count = check_table_records(table)
                total_records += count
                
                # Show progress indicator
                if count > initial_counts[table]:
                    print(f"✅ {table}: {count:,} records (+{count - initial_counts[table]:,})")
                elif count == initial_counts[table] and count > 0:
                    print(f"⏸️  {table}: {count:,} records (no change)")
                else:
                    print(f"⏳ {table}: {count:,} records")
                
                initial_counts[table] = count
            
            print(f"📈 Total records: {total_records:,}")
            
            # Check if restore is complete (all tables have data)
            tables_with_data = sum(1 for table in tables_to_monitor if check_table_records(table) > 0)
            if tables_with_data == len(tables_to_monitor):
                print("\n🎉 RESTORE COMPLETED! All tables have data.")
                break
            
            time.sleep(5)  # Check every 5 seconds
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Monitoring stopped by user")
    
    # Final summary
    print("\n" + "=" * 50)
    print("📋 FINAL SUMMARY")
    print("=" * 50)
    
    for table in tables_to_monitor:
        count = check_table_records(table)
        print(f"📊 {table}: {count:,} records")
    
    total_final = sum(check_table_records(table) for table in tables_to_monitor)
    print(f"📈 Total records: {total_final:,}")
    print(f"⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def estimate_restore_time(backup_file='backup-public.sql'):
    """Estimate waktu restore berdasarkan ukuran file"""
    if not os.path.exists(backup_file):
        print(f"❌ Backup file not found: {backup_file}")
        return
    
    file_size = os.path.getsize(backup_file)
    file_size_mb = file_size / 1024 / 1024
    
    print("⏱️  Restore Time Estimation")
    print("=" * 30)
    print(f"Backup file: {backup_file}")
    print(f"File size: {file_size_mb:.2f} MB")
    
    # Estimasi berdasarkan ukuran file
    estimated_minutes = max(1, file_size_mb / 2)  # 2 MB per menit
    print(f"Estimated restore time: {estimated_minutes:.1f} minutes")
    
    # Estimasi berdasarkan jumlah records (jika bisa dihitung)
    try:
        with open(backup_file, 'r') as f:
            content = f.read()
            insert_count = content.count('INSERT INTO')
            print(f"INSERT statements: {insert_count:,}")
            
            if insert_count > 0:
                records_per_minute = 10000  # Estimasi kasar
                estimated_by_records = insert_count / records_per_minute
                print(f"Estimated by records: {estimated_by_records:.1f} minutes")
                
                # Use the higher estimate
                final_estimate = max(estimated_minutes, estimated_by_records)
                print(f"Final estimate: {final_estimate:.1f} minutes")
    except Exception as e:
        print(f"Could not analyze backup file: {e}")

def main():
    """Main function"""
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'estimate':
            estimate_restore_time()
        elif sys.argv[1] == 'monitor':
            monitor_restore_progress()
        else:
            print("Usage:")
            print("  python monitor_restore.py estimate  # Estimate restore time")
            print("  python monitor_restore.py monitor   # Monitor restore progress")
    else:
        print("Database Restore Monitor")
        print("=" * 30)
        print("1. Estimate restore time")
        print("2. Monitor restore progress")
        
        choice = input("\nChoose option (1 or 2): ").strip()
        
        if choice == '1':
            estimate_restore_time()
        elif choice == '2':
            monitor_restore_progress()
        else:
            print("Invalid choice!")

if __name__ == "__main__":
    main() 